package dev.ruma.tools;

import java.util.Arrays;
import java.util.List;

/** Geometry in metres in one tracked anchor's coordinate system, with Y normal to the base. */
final class MeasurePlane {
    private MeasurePlane() {}

    static double distance(float[] a, float[] b) {
        return Math.hypot(b[0] - a[0], b[2] - a[2]);
    }

    private static double turn(float[] a, float[] b, float[] c) {
        return (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    }

    private static boolean onSegment(float[] a, float[] b, float[] p) {
        return (p[0] - a[0]) * (p[0] - b[0]) <= 0 && (p[2] - a[2]) * (p[2] - b[2]) <= 0;
    }

    static boolean crosses(float[] a, float[] b, float[] c, float[] d) {
        double abC = turn(a, b, c), abD = turn(a, b, d), cdA = turn(c, d, a), cdB = turn(c, d, b);
        return abC * abD < 0 && cdA * cdB < 0
                || abC == 0 && onSegment(a, b, c)
                || abD == 0 && onSegment(a, b, d)
                || cdA == 0 && onSegment(c, d, a)
                || cdB == 0 && onSegment(c, d, b);
    }

    static boolean canAdd(List<float[]> points, float[] next) {
        int n = points.size();
        if (n == 0) return true;
        float[] last = points.get(n - 1);
        if (distance(last, next) < 0.005 || n >= 32) return false;
        for (int i = 0; i < n - 2; i++)
            if (crosses(points.get(i), points.get(i + 1), last, next)) return false;
        return true;
    }

    static double area(List<float[]> points) {
        int n = points.size();
        if (n < 3 || distance(points.get(0), points.get(n - 1)) < 0.005) return 0;
        for (int i = 1; i < n - 2; i++)
            if (crosses(points.get(0), points.get(n - 1), points.get(i), points.get(i + 1)))
                return 0;
        double sum = 0;
        for (int i = 0; i < n; i++) {
            float[] a = points.get(i), b = points.get((i + 1) % n);
            sum += (double) a[0] * b[2] - (double) b[0] * a[2];
        }
        return Math.abs(sum) / 2;
    }

    /** Project the third corner onto a perpendicular through B to form the rectangle. */
    static List<float[]> rectangle(float[] a, float[] b, float[] c) {
        double length = distance(a, b);
        if (length < 0.005) return java.util.Collections.emptyList();
        double nx = -(b[2] - a[2]) / length, nz = (b[0] - a[0]) / length;
        double width = (c[0] - b[0]) * nx + (c[2] - b[2]) * nz;
        float dx = (float) (nx * width), dz = (float) (nz * width);
        return Arrays.asList(
                a, b, new float[] {b[0] + dx, 0, b[2] + dz}, new float[] {a[0] + dx, 0, a[2] + dz});
    }

    static float[] footprint(float[] origin, float[] ray) {
        if (Math.abs(ray[1]) < 0.05) return null;
        float t = -origin[1] / ray[1];
        if (t < 0.05 || t > 8) return null;
        return new float[] {origin[0] + t * ray[0], 0, origin[2] + t * ray[2]};
    }

    /**
     * Closest point between the view ray and the base corner's normal. Reject ill-conditioned
     * views.
     */
    static float[] height(float[] origin, float[] ray) {
        double horizontal = ray[0] * ray[0] + ray[2] * ray[2];
        if (horizontal < 0.03) return null;
        double t = -(origin[0] * ray[0] + origin[2] * ray[2]) / horizontal;
        double gap = Math.hypot(origin[0] + t * ray[0], origin[2] + t * ray[2]);
        double y = origin[1] + t * ray[1];
        if (t < 0.05
                || t > 8
                || Math.abs(y) < 0.005
                || Math.abs(y) > 8
                || gap > Math.max(0.015, t * 0.025)) return null;
        return new float[] {0, (float) y, 0};
    }
}
