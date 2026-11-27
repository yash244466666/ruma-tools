package dev.ruma.tools;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "ArMeasure",
        permissions = {
            @Permission(
                    alias = "camera",
                    strings = {Manifest.permission.CAMERA})
        })
public class ArMeasurePlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        String shape = call.getString("shape", "");
        if (!shape.equals("rectangle") && !shape.equals("outline")) {
            call.reject("Choose a measurement shape");
            return;
        }
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "openCamera");
        } else {
            openCamera(call);
        }
    }

    @PermissionCallback
    private void openCamera(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            resolveStatus(call, "denied");
            return;
        }
        Intent intent = new Intent(getActivity(), ArMeasureActivity.class);
        intent.putExtra("outline", "outline".equals(call.getString("shape")));
        getActivity().runOnUiThread(() -> startActivityForResult(call, intent, "finished"));
    }

    @ActivityCallback
    private void finished(PluginCall call, ActivityResult activityResult) {
        if (call == null) return;
        Intent data = activityResult.getData();
        if (data == null || activityResult.getResultCode() != Activity.RESULT_OK) {
            resolveStatus(call, "cancelled");
            return;
        }
        if (!data.hasExtra("area")) {
            resolveStatus(call, "unavailable");
            return;
        }
        JSObject result = new JSObject();
        for (String field : new String[] {"area", "length", "width", "height"}) {
            if (data.hasExtra(field)) result.put(field, data.getDoubleExtra(field, 0));
        }
        JSObject output = new JSObject();
        output.put("status", "measured");
        output.put("result", result);
        call.resolve(output);
    }

    private void resolveStatus(PluginCall call, String status) {
        JSObject output = new JSObject();
        output.put("status", status);
        call.resolve(output);
    }
}
