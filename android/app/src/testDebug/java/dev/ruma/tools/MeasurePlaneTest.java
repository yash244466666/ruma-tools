package dev.ruma.tools;

import static org.junit.Assert.*;

import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class MeasurePlaneTest {
    private static float[] p(float x, float z) {
        return new float[] {x, 0, z};
    }

    @Test
    public void rectangleUsesPerpendicularWidthAndVolume() {
        List<float[]> base = MeasurePlane.rectangle(p(0, 0), p(.3f, 0), p(.32f, .2f));
        assertEquals(600, MeasurePlane.area(base) * 10000, .001);
        assertEquals(6, MeasurePlane.area(base) * .1 * 1000, .001);
    }

    @Test
    public void outlineRejectsCrossingsAndMeasuresConcaveBase() {
        List<float[]> concave = Arrays.asList(p(0, 0), p(4, 0), p(4, 2), p(2, 2), p(2, 4), p(0, 4));
        assertEquals(12, MeasurePlane.area(concave), .0001);
        assertFalse(MeasurePlane.canAdd(Arrays.asList(p(0, 0), p(1, 1), p(0, 1)), p(1, 0)));
    }

    @Test
    public void localRaysRecoverBaseAndHeightFromAnObliqueCamera() {
        assertArrayEquals(
                p(.3f, .2f),
                MeasurePlane.footprint(new float[] {.3f, 1, .2f}, new float[] {0, -1, 0}),
                .0001f);
        assertArrayEquals(
                new float[] {0, .1f, 0},
                MeasurePlane.height(new float[] {1, .1f, 0}, new float[] {-1, 0, 0}),
                .0001f);
        assertNull(MeasurePlane.height(new float[] {0, 1, 0}, new float[] {0, -1, 0}));
        assertNull(MeasurePlane.height(new float[] {1, .1f, .5f}, new float[] {-1, 0, 0}));
    }
}
