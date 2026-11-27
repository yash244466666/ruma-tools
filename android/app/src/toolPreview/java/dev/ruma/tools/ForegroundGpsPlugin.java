package dev.ruma.tools;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.*;
import android.os.Bundle;
import android.os.Looper;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;

@CapacitorPlugin(name="TesterGps",permissions={@Permission(alias="position",strings={Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION})})
public class ForegroundGpsPlugin extends Plugin implements LocationListener {
    private String session;
    private Location latest;
    private LocationManager manager(){return getContext().getSystemService(LocationManager.class);}
    @PluginMethod public void access(PluginCall call){
        if(getPermissionState("position")==PermissionState.GRANTED)permissionResult(call);
        else requestPermissionForAlias("position",call,"permissionResult");
    }
    @PermissionCallback private void permissionResult(PluginCall call){
        JSObject result=new JSObject();
        result.put("precise",getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED);
        call.resolve(result);
    }
    @PluginMethod public synchronized void start(PluginCall call){
        if(getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){call.reject("Precise location required");return;}
        if(!getActivity().getLifecycle().getCurrentState().isAtLeast(androidx.lifecycle.Lifecycle.State.STARTED)){call.reject("Open the tool to start GPS");return;}
        try{
            LocationManager lm=manager();
            if(lm==null||!lm.isProviderEnabled(LocationManager.GPS_PROVIDER)){call.reject("GPS disabled");return;}
            reset();
            session=java.util.UUID.randomUUID().toString();
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER,1000L,0f,this,Looper.getMainLooper());
            JSObject result=new JSObject();result.put("key",session);call.resolve(result);
        }catch(RuntimeException e){reset();call.reject("GPS unavailable");}
    }
    @Override public synchronized void onLocationChanged(Location location){if(session!=null)latest=location;}
    @Override public void onProviderEnabled(String name){}
    @Override public synchronized void onProviderDisabled(String name){reset();}
    @Override public void onStatusChanged(String name,int status,Bundle info){}
    @PluginMethod public synchronized void read(PluginCall call){
        if(session==null||!session.equals(call.getString("key"))){call.reject("GPS stopped");return;}
        JSObject o=new JSObject();
        if(latest!=null){
            o.put("latitude",latest.getLatitude());o.put("longitude",latest.getLongitude());o.put("at",latest.getTime());
            if(latest.hasAccuracy())o.put("accuracy",latest.getAccuracy());
            if(latest.hasSpeed())o.put("speed",latest.getSpeed());
        }
        call.resolve(o);
    }
    @PluginMethod public synchronized void stop(PluginCall call){if(session!=null&&session.equals(call.getString("key")))reset();call.resolve();}
    private synchronized void reset(){
        if(session!=null){try{manager().removeUpdates(this);}catch(RuntimeException ignored){}}
        session=null;latest=null;
    }
    @Override protected void handleOnPause(){reset();super.handleOnPause();}
    @Override protected void handleOnDestroy(){reset();super.handleOnDestroy();}
}
