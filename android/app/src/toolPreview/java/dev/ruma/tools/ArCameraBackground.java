package dev.ruma.tools;

import android.opengl.GLES11Ext;
import android.opengl.GLES20;

import com.google.ar.core.Coordinates2d;
import com.google.ar.core.Frame;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

/** ARCore writes the camera to an external texture; transform its crop for the current display. */
final class ArCameraBackground {
    private static final float[] QUAD = {-1, -1, 1, -1, -1, 1, 1, 1};
    private final FloatBuffer vertices = buffer(8), uv = buffer(8);
    private int program, position, texCoord, texture;

    private static FloatBuffer buffer(int size) {
        return ByteBuffer.allocateDirect(size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
    }

    private int shader(int type, String source) {
        int shader = GLES20.glCreateShader(type);
        GLES20.glShaderSource(shader, source);
        GLES20.glCompileShader(shader);
        int[] status = new int[1];
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0);
        if (status[0] == 0) throw new IllegalStateException("Camera shader unavailable");
        return shader;
    }

    void create() {
        vertices.put(QUAD).position(0);
        int[] names = new int[1];
        GLES20.glGenTextures(1, names, 0);
        texture = names[0];
        int target = GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
        GLES20.glBindTexture(target, texture);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        int vertex =
                shader(
                        GLES20.GL_VERTEX_SHADER,
                        "attribute vec2 a; attribute vec2 t; varying vec2 v; void main(){v=t;"
                            + " gl_Position=vec4(a,0.,1.);}");
        int fragment =
                shader(
                        GLES20.GL_FRAGMENT_SHADER,
                        "#extension GL_OES_EGL_image_external : require\n"
                            + "precision mediump float; uniform samplerExternalOES camera; varying"
                            + " vec2 v; void main(){gl_FragColor=texture2D(camera,v);}");
        program = GLES20.glCreateProgram();
        GLES20.glAttachShader(program, vertex);
        GLES20.glAttachShader(program, fragment);
        GLES20.glLinkProgram(program);
        int[] status = new int[1];
        GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0);
        GLES20.glDeleteShader(vertex);
        GLES20.glDeleteShader(fragment);
        if (status[0] == 0) throw new IllegalStateException("Camera rendering unavailable");
        position = GLES20.glGetAttribLocation(program, "a");
        texCoord = GLES20.glGetAttribLocation(program, "t");
    }

    int texture() {
        return texture;
    }

    void draw(Frame frame) {
        if (frame.getTimestamp() == 0) return;
        vertices.position(0);
        uv.position(0);
        frame.transformCoordinates2d(
                Coordinates2d.OPENGL_NORMALIZED_DEVICE_COORDINATES,
                vertices,
                Coordinates2d.TEXTURE_NORMALIZED,
                uv);
        uv.position(0);
        vertices.position(0);
        GLES20.glUseProgram(program);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(program, "camera"), 0);
        GLES20.glVertexAttribPointer(position, 2, GLES20.GL_FLOAT, false, 0, vertices);
        GLES20.glVertexAttribPointer(texCoord, 2, GLES20.GL_FLOAT, false, 0, uv);
        GLES20.glEnableVertexAttribArray(position);
        GLES20.glEnableVertexAttribArray(texCoord);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        GLES20.glDisableVertexAttribArray(position);
        GLES20.glDisableVertexAttribArray(texCoord);
    }
}
