package dev.ruma.tools;
import com.getcapacitor.BridgeActivity;
final class PreviewPlugins {
    static void register(BridgeActivity activity) {
        activity.registerPlugin(DiagnosticsPlugin.class);
        activity.registerPlugin(ForegroundGpsPlugin.class);
        activity.registerPlugin(ScopedFolderPlugin.class);
    }
}
