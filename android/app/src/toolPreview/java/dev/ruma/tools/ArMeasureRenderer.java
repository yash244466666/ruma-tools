package dev.ruma.tools;

import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.os.SystemClock;

import com.google.ar.core.*;
import com.google.ar.core.exceptions.CameraNotAvailableException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

final class ArMeasureRenderer implements GLSurfaceView.Renderer {
    private final ArMeasureActivity owner;
    private final boolean outline;
    private final ArCameraBackground background = new ArCameraBackground();
    private final List<float[]> points = new ArrayList<>();
    private final float[] view = new float[16],
            projection = new float[16],
            vp = new float[16],
            inverse = new float[16];
    private Anchor anchor;
    private volatile Session session;
    private boolean closed, heightMode, pendingMark, failed;
    private Float measuredHeight;
    private float tapX, tapY;
    private int width, height, rotation = -1;
    private long lastUI, messageUntil;
    private String message = "";

    ArMeasureRenderer(ArMeasureActivity owner, boolean outline) {
        this.owner = owner;
        this.outline = outline;
    }

    // Session changes on the UI thread only while the GL surface is paused.
    void session(Session next) {
        session = next;
        rotation = -1;
    }

    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        try {
            background.create();
            rotation = -1;
        } catch (RuntimeException e) {
            fail();
        }
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int w, int h) {
        width = w;
        height = h;
        rotation = -1;
        GLES20.glViewport(0, 0, w, h);
    }

    private void fail() {
        if (!failed) {
            failed = true;
            owner.runOnUiThread(owner::unavailable);
        }
    }

    void mark(float x, float y) {
        if (!pendingMark) {
            tapX = x;
            tapY = y;
            pendingMark = true;
        }
    }

    void markCenter() {
        mark(width / 2f, height / 2f);
    }

    void closeOutline() {
        if (outline && MeasurePlane.area(points) > 0.000025) closed = true;
        else warn("Mark at least three corners without crossing the outline.");
    }

    void heightMode() {
        if (closed) {
            heightMode = true;
            measuredHeight = null;
        }
    }

    void undo() {
        pendingMark = false;
        messageUntil = 0;
        if (heightMode || measuredHeight != null) {
            heightMode = false;
            measuredHeight = null;
            return;
        }
        if (closed) {
            closed = false;
            if (outline) return;
        }
        if (!points.isEmpty()) points.remove(points.size() - 1);
        if (points.isEmpty() && anchor != null) {
            anchor.detach();
            anchor = null;
        }
    }

    private void warn(String text) {
        message = text;
        messageUntil = SystemClock.uptimeMillis() + 1800;
    }

    private List<float[]> boundary() {
        if (!outline && points.size() == 3)
            return MeasurePlane.rectangle(points.get(0), points.get(1), points.get(2));
        return points;
    }

    void finishMeasure() {
        if (!closed) return;
        List<float[]> base = boundary();
        double area = MeasurePlane.area(base) * 10000;
        double length = outline ? 0 : MeasurePlane.distance(base.get(0), base.get(1)) * 100;
        double widthCm = outline ? 0 : MeasurePlane.distance(base.get(1), base.get(2)) * 100;
        double heightCm = measuredHeight == null ? 0 : Math.abs(measuredHeight) * 100;
        owner.runOnUiThread(() -> owner.measured(area, length, widthCm, heightCm));
    }

    private HitResult surfaceHit(Frame frame, float x, float y) {
        for (HitResult hit : frame.hitTest(x, y)) {
            if (hit.getTrackable() instanceof Plane) {
                Plane p = (Plane) hit.getTrackable();
                if (p.getTrackingState() == TrackingState.TRACKING
                        && p.isPoseInPolygon(hit.getHitPose())) return hit;
            }
        }
        return null;
    }

    private float[] unproject(float x, float y, float z) {
        float[] result = new float[4];
        Matrix.multiplyMV(
                result,
                0,
                inverse,
                0,
                new float[] {2 * x / width - 1, 1 - 2 * y / height, z, 1},
                0);
        return new float[] {result[0] / result[3], result[1] / result[3], result[2] / result[3]};
    }

    private float[] aim(float x, float y, Pose localFromWorld) {
        float[] origin = localFromWorld.transformPoint(unproject(x, y, -1));
        float[] far = localFromWorld.transformPoint(unproject(x, y, 1));
        float dx = far[0] - origin[0], dy = far[1] - origin[1], dz = far[2] - origin[2];
        float norm = (float) Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (!(norm > 0)) return null;
        float[] ray = {dx / norm, dy / norm, dz / norm};
        return heightMode ? MeasurePlane.height(origin, ray) : MeasurePlane.footprint(origin, ray);
    }

    private void add(Frame frame, float x, float y) {
        if (anchor == null) {
            HitResult hit = surfaceHit(frame, x, y);
            if (hit == null) {
                warn("Move slowly until the camera finds a flat surface.");
                return;
            }
            Plane plane = (Plane) hit.getTrackable();
            Pose base =
                    new Pose(
                            hit.getHitPose().getTranslation(),
                            plane.getCenterPose().getRotationQuaternion());
            anchor = plane.createAnchor(base);
            points.add(new float[3]);
            messageUntil = 0;
            return;
        }
        if (closed && !heightMode) return;
        float[] point = aim(x, y, anchor.getPose().inverse());
        if (point == null) {
            warn(
                    heightMode
                            ? "Aim at the top above corner 1 from the side."
                            : "Aim back at the base surface.");
            return;
        }
        if (heightMode) {
            measuredHeight = point[1];
            heightMode = false;
            messageUntil = 0;
            return;
        }
        if (!MeasurePlane.canAdd(points, point)) {
            warn("Choose a distinct corner without crossing lines (up to 32).");
            return;
        }
        if (!outline && points.size() == 2) {
            if (MeasurePlane.area(MeasurePlane.rectangle(points.get(0), points.get(1), point))
                    < 0.000025) {
                warn("Move along the adjacent width.");
                return;
            }
            closed = true;
        }
        points.add(point);
        messageUntil = 0;
    }

    private float[] screen(Pose pose, float[] local) {
        float[] w = pose.transformPoint(local), clip = new float[4];
        Matrix.multiplyMV(clip, 0, vp, 0, new float[] {w[0], w[1], w[2], 1}, 0);
        if (clip[3] < 0.02f) return null;
        return new float[] {
            width * (1 + clip[0] / clip[3]) / 2, height * (1 - clip[1] / clip[3]) / 2
        };
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        if (session == null || width == 0 || height == 0 || failed) return;
        try {
            int currentRotation = owner.rotation();
            if (rotation != currentRotation) {
                session.setDisplayGeometry(currentRotation, width, height);
                session.setCameraTextureName(background.texture());
                rotation = currentRotation;
            }
            Frame frame = session.update();
            background.draw(frame);
            Camera camera = frame.getCamera();
            boolean tracking =
                    camera.getTrackingState() == TrackingState.TRACKING
                            && (anchor == null
                                    || anchor.getTrackingState() == TrackingState.TRACKING);
            if (tracking) {
                camera.getViewMatrix(view, 0);
                camera.getProjectionMatrix(projection, 0, 0.02f, 50f);
                Matrix.multiplyMM(vp, 0, projection, 0, view, 0);
                tracking = Matrix.invertM(inverse, 0, vp, 0);
            }
            if (pendingMark) {
                pendingMark = false;
                if (tracking) add(frame, tapX, tapY);
            }
            long now = SystemClock.uptimeMillis();
            if (now - lastUI < 80) return;
            lastUI = now;
            display(frame, tracking, now);
        } catch (CameraNotAvailableException | RuntimeException e) {
            fail();
        }
    }

    private static String cm(double metres) {
        return String.format(Locale.getDefault(), "%.1f cm", metres * 100);
    }

    private void display(Frame frame, boolean tracking, long now) {
        List<float[]> screenPoints = new ArrayList<>();
        String prompt;
        boolean validAim = false;
        if (!tracking) prompt = "Tracking paused. Move slowly over a well-lit, textured surface.";
        else if (anchor == null) {
            validAim = surfaceHit(frame, width / 2f, height / 2f) != null;
            prompt =
                    validAim
                            ? "Mark the first corner."
                            : "Move the camera sideways to find a flat surface.";
        } else {
            Pose pose = anchor.getPose();
            List<float[]> base = boundary();
            for (float[] p : base) screenPoints.add(screen(pose, p));
            float[] target = aim(width / 2f, height / 2f, pose.inverse());
            validAim = target != null;
            if (heightMode) {
                prompt = "Aim at the top directly above corner 1. Move to the side.";
                if (target != null) prompt += "  " + cm(Math.abs(target[1]));
            } else if (closed) {
                prompt =
                        String.format(
                                Locale.getDefault(),
                                "Base area %.1f cm²",
                                MeasurePlane.area(base) * 10000);
                if (!outline)
                    prompt +=
                            " · "
                                    + cm(MeasurePlane.distance(base.get(0), base.get(1)))
                                    + " × "
                                    + cm(MeasurePlane.distance(base.get(1), base.get(2)));
                if (measuredHeight != null) prompt += " · Height " + cm(Math.abs(measuredHeight));
            } else {
                prompt =
                        points.size() == 1
                                ? "Mark the end of the first edge."
                                : outline
                                        ? "Mark another corner or close the outline."
                                        : "Mark the next corner along the width.";
                if (target != null) {
                    double live = MeasurePlane.distance(points.get(points.size() - 1), target);
                    if (!outline && points.size() == 2) {
                        List<float[]> preview =
                                MeasurePlane.rectangle(points.get(0), points.get(1), target);
                        live = MeasurePlane.distance(preview.get(1), preview.get(2));
                        target = preview.get(2);
                    }
                    screenPoints.add(screen(pose, target));
                    prompt += "  " + cm(live);
                }
            }
            if (closed) {
                screenPoints.add(screenPoints.get(0));
                if (heightMode && target != null) screenPoints.add(screen(pose, target));
                else if (measuredHeight != null)
                    screenPoints.add(screen(pose, new float[] {0, measuredHeight, 0}));
            }
        }
        String text = now < messageUntil ? message : prompt;
        boolean place = tracking && validAim && (!closed || heightMode);
        owner.display(
                text,
                screenPoints,
                place,
                !points.isEmpty(),
                outline && !closed && points.size() >= 3,
                closed,
                heightMode);
    }
}
