package dev.ruma.tools;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.DocumentsContract.Document;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.UUID;

@CapacitorPlugin(name="TesterFolders")
public class ScopedFolderPlugin extends Plugin {
    private static final int LIMIT=500;
    private Uri tree;
    private String session;
    private final HashMap<String,Entry> entries=new HashMap<>();
    private static final class Entry {
        final String id;
        final boolean directory;
        Entry(String id,boolean directory){this.id=id;this.directory=directory;}
    }
    private ContentResolver resolver(){return getContext().getContentResolver();}
    @PluginMethod public void choose(PluginCall call){
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try{startActivityForResult(call,intent,"selected");}catch(RuntimeException e){call.reject("Folder picker unavailable");}
    }
    @ActivityCallback private synchronized void selected(PluginCall call,ActivityResult result){
        if(call==null)return;
        Intent data=result.getData();
        if(result.getResultCode()!=Activity.RESULT_OK||data==null||data.getData()==null){call.reject("Folder selection cancelled","CANCELLED");return;}
        Uri uri=data.getData();
        if(!"content".equals(uri.getScheme())||!DocumentsContract.isTreeUri(uri)){call.reject("Invalid folder");return;}
        entries.clear();
        tree=uri;
        session=UUID.randomUUID().toString();
        String rootId=DocumentsContract.getTreeDocumentId(tree);
        entries.put(session,new Entry(rootId,true));
        String name="Selected folder";
        try(Cursor c=resolver().query(document(rootId),new String[]{Document.COLUMN_DISPLAY_NAME},null,null,null)){
            if(c!=null&&c.moveToFirst()&&!c.isNull(0))name=c.getString(0);
        }catch(RuntimeException ignored){}
        JSObject out=new JSObject();out.put("name",name);out.put("key",session);call.resolve(out);
    }
    private Uri document(String id){return DocumentsContract.buildDocumentUriUsingTree(tree,id);}
    @PluginMethod public synchronized void list(PluginCall call){
        Entry entry=entries.get(call.getString("parent"));
        if(entry==null||!entry.directory){call.reject("Choose the folder again");return;}
        JSArray rows=new JSArray();
        String[] fields={Document.COLUMN_DOCUMENT_ID,Document.COLUMN_DISPLAY_NAME,Document.COLUMN_MIME_TYPE,Document.COLUMN_SIZE,Document.COLUMN_FLAGS};
        try(Cursor c=resolver().query(DocumentsContract.buildChildDocumentsUriUsingTree(tree,entry.id),fields,null,null,null)){
            if(c==null){call.reject("Folder unavailable");return;}
            boolean limited=false;
            while(c.moveToNext()){
                if(rows.length()>=LIMIT||entries.size()>=5000){limited=true;break;}
                String id=c.getString(0);
                String key=UUID.nameUUIDFromBytes((session+"\u0000"+id).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
                if(id.equals(DocumentsContract.getTreeDocumentId(tree)))continue;
                String type=c.getString(2);
                boolean dir=Document.MIME_TYPE_DIR.equals(type);
                entries.put(key,new Entry(id,dir));
                JSObject row=new JSObject();row.put("key",key);row.put("name",c.getString(1));row.put("mime",type);
                row.put("directory",dir);row.put("size",c.isNull(3)?org.json.JSONObject.NULL:c.getLong(3));
                int flags=c.getInt(4);
                row.put("deletable",!dir&&(flags&Document.FLAG_SUPPORTS_DELETE)!=0);
                row.put("renameable",(flags&Document.FLAG_SUPPORTS_RENAME)!=0);
                rows.put(row);
            }
            JSObject out=new JSObject();out.put("entries",rows);out.put("limited",limited);call.resolve(out);
        }catch(RuntimeException e){call.reject("The folder could not be read");}
    }
    @PluginMethod public synchronized void rename(PluginCall call){
        String key=call.getString("key",""),name=call.getString("name","");
        Entry e=entries.get(key);
        if(e==null||key.equals(session)||name.trim().isEmpty()||name.length()>120||name.equals(".")||name.equals("..")||name.indexOf('/')>=0||name.indexOf('\\')>=0||name.chars().anyMatch(Character::isISOControl)){call.reject("Invalid name");return;}
        try{if(DocumentsContract.renameDocument(resolver(),document(e.id),name)==null){call.reject("Rename failed");return;}entries.remove(key);call.resolve();}catch(Exception ex){call.reject("Rename unavailable");}
    }
    @PluginMethod public synchronized void remove(PluginCall call){
        String key=call.getString("key","");
        Entry e=entries.get(key);
        if(e==null||e.directory){call.reject("Select a file");return;}
        try{if(!DocumentsContract.deleteDocument(resolver(),document(e.id))){call.reject("Deletion failed");return;}entries.remove(key);call.resolve();}catch(Exception ex){call.reject("Deletion unavailable");}
    }
    @PluginMethod public synchronized void open(PluginCall call){
        Entry e=entries.get(call.getString("key",""));
        if(e==null||e.directory){call.reject("Select a file");return;}
        try{Uri uri=document(e.id);Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,resolver().getType(uri)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);getActivity().startActivity(Intent.createChooser(i,"Open document"));call.resolve();}catch(Exception ex){call.reject("Viewer unavailable");}
    }
    @PluginMethod public synchronized void close(PluginCall call){
        if(session!=null && session.equals(call.getString("key"))){entries.clear();tree=null;session=null;}
        call.resolve();
    }
}
