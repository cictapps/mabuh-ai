// Tauri shell. Android stores wellness records in app-private SQLite and
// synchronizes them with Supabase when connectivity is available.

mod share_file;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_google_auth::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri::plugin::Builder::new("share-file")
                .setup(|app, api| {
                    let plugin = share_file::init(app, api)?;
                    app.manage(plugin);
                    Ok(())
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![share_file::share_file])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
