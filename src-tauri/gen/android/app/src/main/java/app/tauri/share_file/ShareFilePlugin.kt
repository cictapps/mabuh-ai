// Tauri Android plugin that bridges JS -> Android Intent.ACTION_SEND so the
// achievement card can reach the system share sheet. The WebView's
// navigator.share is not implemented in Tauri's Android WebView.

package app.tauri.share_file

import android.app.Activity
import android.content.Intent
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.io.File

@InvokeArg
class ShareFileArgs {
    lateinit var path: String
    var mimeType: String? = null
    var title: String? = null
    var text: String? = null
}

@TauriPlugin
class ShareFilePlugin(private val activity: Activity) : Plugin(activity) {

    @Command
    fun share(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ShareFileArgs::class.java)
            val file = File(args.path)
            if (!file.exists()) {
                invoke.reject("File does not exist: ${args.path}")
                return
            }

            val mime = args.mimeType?.takeIf { it.isNotBlank() } ?: "image/*"
            val authority = activity.packageName + ".fileprovider"
            val uri = FileProvider.getUriForFile(activity, authority, file)

            val send = Intent(Intent.ACTION_SEND).apply {
                type = mime
                putExtra(Intent.EXTRA_STREAM, uri)
                if (!args.text.isNullOrBlank()) {
                    putExtra(Intent.EXTRA_TEXT, args.text)
                }
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(
                send,
                args.title?.takeIf { it.isNotBlank() } ?: "Share achievement card",
            )
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            activity.startActivity(chooser)

            invoke.resolve()
        } catch (ex: Exception) {
            invoke.reject(ex.message ?: "Could not start the share intent")
        }
    }
}
