package dev.ruma.tools;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.*;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Config;
import com.google.ar.core.Session;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.UnavailableException;

import java.util.Collections;
import java.util.List;

public final class ArMeasureActivity extends Activity {
    private GLSurfaceView surface;
    private Overlay overlay;
    private ArMeasureRenderer renderer;
    private Button mark, undo, closeOutline, height, result;
    private TextView status;
    private Session session;
    private boolean installRequested, running, resumed;

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        FrameLayout stage = new FrameLayout(this);
        surface = new GLSurfaceView(this);
        surface.setEGLContextClientVersion(2);
        surface.setPreserveEGLContextOnPause(true);
        renderer = new ArMeasureRenderer(this, getIntent().getBooleanExtra("outline", false));
        surface.setRenderer(renderer);
        stage.addView(surface);
        overlay = new Overlay(this);
        stage.addView(overlay);
        // Keep camera geometry and tap coordinates in the same view, including in landscape.
        overlay.setOnTouchListener(
                (v, event) -> {
                    if (event.getAction() == MotionEvent.ACTION_UP) {
                        float x = event.getX(), y = event.getY();
                        v.performClick();
                        surface.queueEvent(() -> renderer.mark(x, y));
                    }
                    return true;
                });
        overlay.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        root.addView(layout);
        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        Button back = button("Back", this::finish);
        top.addView(back);
        status = new TextView(this);
        status.setTextColor(Color.WHITE);
        status.setTextSize(16);
        status.setText("Starting AR camera…");
        status.setPadding(dp(6), 0, dp(6), 0);
        top.addView(status, new LinearLayout.LayoutParams(0, -2, 1));
        layout.addView(top);
        layout.addView(stage, new LinearLayout.LayoutParams(-1, 0, 1));
        HorizontalScrollView scroller = new HorizontalScrollView(this);
        LinearLayout controls = new LinearLayout(this);
        scroller.addView(controls);
        layout.addView(scroller);
        mark = action(controls, "Mark point", renderer::markCenter);
        undo = action(controls, "Undo", renderer::undo);
        closeOutline = action(controls, "Close outline", renderer::closeOutline);
        height = action(controls, "Measure height", renderer::heightMode);
        result = action(controls, "Use result", renderer::finishMeasure);
        for (Button b : new Button[] {undo, closeOutline, height, result})
            b.setVisibility(View.GONE);
        mark.setEnabled(false);
        root.setOnApplyWindowInsetsListener(
                (v, insets) -> {
                    v.setPadding(
                            insets.getSystemWindowInsetLeft(),
                            insets.getSystemWindowInsetTop(),
                            insets.getSystemWindowInsetRight(),
                            insets.getSystemWindowInsetBottom());
                    return insets;
                });
        setContentView(root);
    }

    private Button button(String label, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setMinHeight(dp(48));
        button.setOnClickListener(v -> action.run());
        return button;
    }

    private Button action(LinearLayout parent, String label, Runnable callback) {
        Button b = button(label, () -> surface.queueEvent(callback));
        parent.addView(b);
        return b;
    }

    @SuppressWarnings("deprecation")
    int rotation() {
        return getWindowManager().getDefaultDisplay().getRotation();
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        if (session != null) {
            startSession();
            return;
        }
        ArCoreApk.getInstance()
                .checkAvailabilityAsync(
                        this,
                        availability ->
                                runOnUiThread(
                                        () -> {
                                            if (!resumed || isFinishing() || session != null)
                                                return;
                                            if (availability.isUnsupported()) {
                                                unavailable();
                                                return;
                                            }
                                            try {
                                                if (ArCoreApk.getInstance()
                                                                .requestInstall(
                                                                        this, !installRequested)
                                                        == ArCoreApk.InstallStatus
                                                                .INSTALL_REQUESTED) {
                                                    installRequested = true;
                                                    return;
                                                }
                                                session = new Session(this);
                                                Config config = session.getConfig();
                                                config.setPlaneFindingMode(
                                                        Config.PlaneFindingMode
                                                                .HORIZONTAL_AND_VERTICAL);
                                                config.setFocusMode(Config.FocusMode.AUTO);
                                                session.configure(config);
                                                startSession();
                                            } catch (UnavailableException | RuntimeException e) {
                                                unavailable();
                                            }
                                        }));
    }

    private void startSession() {
        try {
            session.resume();
            renderer.session(session);
            running = true;
            surface.onResume();
        } catch (CameraNotAvailableException | RuntimeException e) {
            unavailable();
        }
    }

    @Override
    protected void onPause() {
        resumed = false;
        surface.onPause();
        if (running) {
            session.pause();
            running = false;
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (session != null) session.close();
        super.onDestroy();
    }

    void unavailable() {
        if (isFinishing()) return;
        setResult(RESULT_OK, new Intent());
        finish();
    }

    void measured(double area, double length, double width, double heightCm) {
        if (isFinishing()) return;
        Intent answer = new Intent().putExtra("area", area);
        if (length > 0) answer.putExtra("length", length);
        if (width > 0) answer.putExtra("width", width);
        if (heightCm > 0) answer.putExtra("height", heightCm);
        setResult(RESULT_OK, answer);
        finish();
    }

    void display(
            String text,
            List<float[]> points,
            boolean valid,
            boolean hasPoints,
            boolean polygon,
            boolean done,
            boolean measuringHeight) {
        runOnUiThread(
                () -> {
                    if (!resumed || isFinishing()) return;
                    if (!text.contentEquals(status.getText())) status.setText(text);
                    overlay.points = points;
                    overlay.valid = valid;
                    overlay.invalidate();
                    mark.setVisibility(!done || measuringHeight ? View.VISIBLE : View.GONE);
                    mark.setEnabled(valid);
                    undo.setVisibility(hasPoints ? View.VISIBLE : View.GONE);
                    closeOutline.setVisibility(polygon ? View.VISIBLE : View.GONE);
                    height.setVisibility(done && !measuringHeight ? View.VISIBLE : View.GONE);
                    result.setVisibility(done && !measuringHeight ? View.VISIBLE : View.GONE);
                });
    }

    private final class Overlay extends View {
        List<float[]> points = Collections.emptyList();
        private final Paint pen = new Paint(Paint.ANTI_ALIAS_FLAG);
        boolean valid;

        Overlay(Context context) {
            super(context);
        }

        @Override
        public boolean performClick() {
            super.performClick();
            return true;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            float x = getWidth() / 2f, y = getHeight() / 2f;
            pen.setStrokeWidth(dp(3));
            pen.setColor(Color.BLACK);
            canvas.drawCircle(x, y, dp(8), pen);
            pen.setColor(valid ? 0xff76fff3 : Color.WHITE);
            canvas.drawCircle(x, y, dp(5), pen);
            float[] previous = null;
            for (float[] point : points) {
                if (point != null) {
                    if (previous != null) {
                        pen.setColor(Color.BLACK);
                        pen.setStrokeWidth(dp(5));
                        canvas.drawLine(previous[0], previous[1], point[0], point[1], pen);
                        pen.setColor(0xff76fff3);
                        pen.setStrokeWidth(dp(3));
                        canvas.drawLine(previous[0], previous[1], point[0], point[1], pen);
                    }
                    pen.setColor(Color.WHITE);
                    canvas.drawCircle(point[0], point[1], dp(4), pen);
                }
                previous = point;
            }
        }
    }
}
