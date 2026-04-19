#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Relax WebView2 security for IPTV streaming (CORS / mixed-content / private-network
    // blocks are common with public IPTV servers). This must be set BEFORE the Tauri
    // runtime initializes WebView2. The flags below are scoped to this app only.
    #[cfg(target_os = "windows")]
    {
        let existing = std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
        let extra = "--disable-web-security --disable-features=BlockInsecurePrivateNetworkRequests,IsolateOrigins,site-per-process --autoplay-policy=no-user-gesture-required --allow-running-insecure-content";
        let merged = if existing.is_empty() {
            extra.to_string()
        } else {
            format!("{} {}", existing, extra)
        };
        std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", merged);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
