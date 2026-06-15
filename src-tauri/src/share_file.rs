// Tauri 2 mobile plugin that wraps an Android `Intent.ACTION_SEND` so the
// achievement card can reach the system share sheet on Android. The WebView's
// `navigator.share` is not implemented in Tauri's Android WebView, so we
// bridge to a small Kotlin plugin that fires the proper share intent.

use serde::Deserialize;
use tauri::{plugin::PluginApi, AppHandle, State};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "app.tauri.share_file";

#[derive(Debug, Deserialize)]
pub struct ShareFileArgs {
    pub path: String,
    #[serde(default)]
    pub mime_type: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub text: Option<String>,
}

pub struct ShareFilePlugin {
    #[allow(dead_code)]
    app: AppHandle<tauri::Wry>,
    #[cfg(target_os = "android")]
    handle: tauri::plugin::PluginHandle<tauri::Wry>,
}

impl ShareFilePlugin {
    pub fn share(&self, args: ShareFileArgs) -> Result<(), String> {
        #[cfg(target_os = "android")]
        {
            self.handle
                .run_mobile_plugin(
                    "share",
                    serde_json::json!({
                        "path": args.path,
                        "mimeType": args.mime_type.unwrap_or_else(|| "image/png".to_string()),
                        "title": args.title,
                        "text": args.text,
                    }),
                )
                .map_err(|e| format!("Could not start the share intent: {e}"))
        }
        #[cfg(not(target_os = "android"))]
        {
            use tauri_plugin_opener::OpenerExt;
            let _ = (args.mime_type, args.title, args.text);
            self.app
                .opener()
                .open_path(args.path, None::<&str>)
                .map_err(|e| format!("Could not open the file: {e}"))
        }
    }
}

#[cfg(target_os = "android")]
pub fn init(
    app: &AppHandle<tauri::Wry>,
    api: PluginApi<tauri::Wry, ()>,
) -> tauri::Result<ShareFilePlugin> {
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "ShareFilePlugin")?;
    Ok(ShareFilePlugin {
        app: app.clone(),
        handle,
    })
}

#[cfg(not(target_os = "android"))]
pub fn init(
    app: &AppHandle<tauri::Wry>,
    _api: PluginApi<tauri::Wry, ()>,
) -> tauri::Result<ShareFilePlugin> {
    Ok(ShareFilePlugin {
        app: app.clone(),
    })
}

#[tauri::command]
pub async fn share_file(
    plugin: State<'_, ShareFilePlugin>,
    path: String,
    #[allow(non_snake_case)]
    mimeType: Option<String>,
    title: Option<String>,
    text: Option<String>,
) -> Result<(), String> {
    let args = ShareFileArgs {
        path,
        mime_type: mimeType,
        title,
        text,
    };
    plugin.share(args)
}
