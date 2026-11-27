package dev.ruma.tools;

import android.app.ActivityManager;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.util.Size;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.TreeSet;

@CapacitorPlugin(name="TesterDiagnostics")
public class DiagnosticsPlugin extends Plugin {
    private static String decimal(double amount) { return String.format(Locale.ROOT,"%.2f",amount); }
    private static String gib(long bytes) { return decimal(bytes/1073741824.0)+" GiB"; }

    @PluginMethod public void battery(PluginCall call) {
        Intent b = getContext().registerReceiver(null,new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (b == null) { call.reject("Battery information unavailable"); return; }
        JSObject out = new JSObject();
        int level=b.getIntExtra(BatteryManager.EXTRA_LEVEL,-1), scale=b.getIntExtra(BatteryManager.EXTRA_SCALE,0);
        if(level>=0 && scale>0) out.put("Charge",Math.round(100.0*level/scale)+"%");
        int plug=b.getIntExtra(BatteryManager.EXTRA_PLUGGED,-1);
        out.put("Power source",plug==0?"On battery":plug==1?"AC adapter":plug==2?"USB":plug==4?"Wireless":plug==8?"Dock":"Unknown");
        String[] statuses={"Unknown","Unknown","Charging","Discharging","Not charging","Full"};
        int status=b.getIntExtra(BatteryManager.EXTRA_STATUS,0);
        out.put("Status",status>=0 && status<statuses.length?statuses[status]:"Unknown");
        String[] health={"Unknown","Unknown","Good","Overheated","Dead","Overvoltage","Failure","Cold"};
        int state=b.getIntExtra(BatteryManager.EXTRA_HEALTH,0);
        out.put("Reported health",state>=0 && state<health.length?health[state]:"Unknown");
        if(b.hasExtra(BatteryManager.EXTRA_VOLTAGE))out.put("Voltage",b.getIntExtra(BatteryManager.EXTRA_VOLTAGE,0)+" mV");
        if(b.hasExtra(BatteryManager.EXTRA_TEMPERATURE))out.put("Temperature",decimal(b.getIntExtra(BatteryManager.EXTRA_TEMPERATURE,0)/10.0)+" °C");
        if(b.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY)!=null)out.put("Technology",b.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY));
        if(Build.VERSION.SDK_INT>=34 && b.hasExtra(BatteryManager.EXTRA_CYCLE_COUNT))out.put("Charge cycles",Integer.toString(b.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT,0)));
        BatteryManager bm=getContext().getSystemService(BatteryManager.class);
        if(bm!=null) {
            int[] props={BatteryManager.BATTERY_PROPERTY_CURRENT_NOW,BatteryManager.BATTERY_PROPERTY_CURRENT_AVERAGE,BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER};
            String[] labels={"Current now","Average current","Remaining charge"};
            for(int i=0;i<props.length;i++){
                int value=bm.getIntProperty(props[i]);
                if(value!=Integer.MIN_VALUE)out.put(labels[i],decimal(value/1000.0)+(i==2?" mAh":" mA"));
            }
            long energy=bm.getLongProperty(BatteryManager.BATTERY_PROPERTY_ENERGY_COUNTER);
            if(energy>0)out.put("Remaining energy",decimal(energy/1e9)+" Wh");
            if(Build.VERSION.SDK_INT>=28){
                long time=bm.computeChargeTimeRemaining();
                if(time>=0)out.put("Estimated time to full",Math.round(time/60000.0)+" min");
            }
        }
        call.resolve(out);
    }

    @PluginMethod public void storage(PluginCall call) {
        StatFs volume = new StatFs(Environment.getDataDirectory().getPath());
        JSObject result = new JSObject();
        result.put("available",volume.getAvailableBytes());
        result.put("free",volume.getFreeBytes());
        result.put("total",volume.getTotalBytes());
        call.resolve(result);
    }

    @PluginMethod public void device(PluginCall call) {
        JSObject out=new JSObject();
        out.put("Model",Build.MANUFACTURER+" "+Build.MODEL);
        out.put("Android",Build.VERSION.RELEASE+" (API "+Build.VERSION.SDK_INT+")");
        out.put("Security patch",Build.VERSION.SECURITY_PATCH);
        out.put("CPU architectures",android.text.TextUtils.join(", ",Build.SUPPORTED_ABIS));
        ActivityManager am=getContext().getSystemService(ActivityManager.class);
        if(am!=null){
            ActivityManager.MemoryInfo memory=new ActivityManager.MemoryInfo();
            am.getMemoryInfo(memory);
            out.put("RAM available / total",gib(memory.availMem)+" / "+gib(memory.totalMem));
        }
        StatFs volume=new StatFs(Environment.getDataDirectory().getPath());
        out.put("Internal data volume free / total",gib(volume.getAvailableBytes())+" / "+gib(volume.getTotalBytes()));
        SensorManager sm=getContext().getSystemService(SensorManager.class);
        if(sm!=null){
            TreeSet<String> sensors=new TreeSet<>();
            for(Sensor s:sm.getSensorList(Sensor.TYPE_ALL))sensors.add(s.getName());
            out.put("Reported sensors",android.text.TextUtils.join(", ",sensors));
        }
        CameraManager cm=getContext().getSystemService(CameraManager.class);
        try{
            if(cm!=null)for(String id:cm.getCameraIdList()){
                CameraCharacteristics c=cm.getCameraCharacteristics(id);
                Integer facing=c.get(CameraCharacteristics.LENS_FACING);
                String description=facing==null?"Unspecified":facing==0?"Front":facing==1?"Rear":"External";
                Size size=c.get(CameraCharacteristics.SENSOR_INFO_PIXEL_ARRAY_SIZE);
                if(size!=null)description+=" · "+size.getWidth()+" × "+size.getHeight()+" pixels";
                Boolean flash=c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if(flash!=null)description+=flash?" · Flash available":" · No flash";
                out.put("Camera "+id,description);
            }
        }catch(android.hardware.camera2.CameraAccessException|SecurityException e){out.put("Camera details","Unavailable on this device");}
        call.resolve(out);
    }
}
