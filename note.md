# Merge Notes

## Temporary local storage
- Current backend writes mood entries to a local JSON file in the app data directory.
- This is a placeholder for database work. It can be removed or replaced later.

## When merging with other teams
- If another team adds a real database layer, remove the JSON read/write helpers in src-tauri/src/lib.rs and replace the command bodies with DB calls.
- Keep the command names (save_mood_entry, list_mood_entries) stable to avoid breaking the frontend.

## Database TODO (teacher guide)
- Choose a storage option (e.g., SQLite or a cloud DB).
- Implement CRUD in the Tauri Rust backend.
- Update the command handlers to call the DB layer.
- Confirm the JSON fallback is removed after DB is live.
