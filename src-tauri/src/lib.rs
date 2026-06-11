// Tauri shell. The desktop app's mood and journal data is now persisted to
// Supabase (see src/lib/db/moodRepository.ts). The Tauri process is kept
// around as the desktop runtime shell so future native features (local
// model loading, file dialogs, etc.) can be added back here.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_google_auth::init())
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
