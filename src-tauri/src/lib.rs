use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct MoodEntry {
    id: String,
    mood: String,
    tags: Vec<String>,
    journal: String,
    school_load: Option<i32>,
    activity_minutes: Option<i32>,
    day_note: Option<String>,
    #[serde(default)]
    social_interactions: Vec<SocialInteraction>,
    #[serde(default)]
    activities: HashMap<String, Vec<String>>,
    timestamp_ms: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct SaveMoodInput {
    mood: String,
    tags: Vec<String>,
    journal: String,
    school_load: Option<i32>,
    activity_minutes: Option<i32>,
    day_note: Option<String>,
    #[serde(default)]
    social_interactions: Vec<SocialInteraction>,
    #[serde(default)]
    activities: HashMap<String, Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SocialInteraction {
    id: String,
    name: String,
    relationship: String,
    interaction_type: String,
    duration_minutes: Option<i32>,
    #[serde(default)]
    feelings: Vec<String>,
    notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Insight {
    id: String,
    title: String,
    body: String,
    color: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Suggestion {
    id: String,
    icon: String,
    title: String,
    description: String,
    mood: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GuidancePayload {
    dominant_mood: Option<String>,
    insights: Vec<Insight>,
    suggestions: Vec<Suggestion>,
}

fn data_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|err| err.to_string())?;
    Ok(data_dir.join("mood_entries.json"))
}

fn read_entries(app: &AppHandle) -> Result<Vec<MoodEntry>, String> {
    let path = data_file_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(path).map_err(|err| err.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&raw).map_err(|err| err.to_string())
}

fn write_entries(app: &AppHandle, entries: &[MoodEntry]) -> Result<(), String> {
    let path = data_file_path(app)?;
    let payload = serde_json::to_string_pretty(entries).map_err(|err| err.to_string())?;
    fs::write(path, payload).map_err(|err| err.to_string())
}

fn mood_meta(mood: &str) -> Option<(&'static str, &'static str, &'static str)> {
    match mood {
        "stressed" => Some(("Stressed", "#e05c6e", "Pressure, overload, and emotional strain.")),
        "worried" => Some(("Worried", "#e0853c", "Uncertainty, anxiety, and uneasiness.")),
        "okay" => Some(("Okay", "#d4b84e", "A neutral, steady emotional state.")),
        "calm" => Some(("Calm", "#6dba84", "Balance and relaxation.")),
        "happy" => Some(("Happy", "#5bb89e", "Positive mood and motivation.")),
        _ => None,
    }
}

fn base_insights() -> Vec<Insight> {
    vec![
        Insight {
            id: "1".to_string(),
            title: "You feel calmer on weekends".to_string(),
            body: "Saturday and Sunday check-ins consistently show Calm — a reset that carries into Monday.".to_string(),
            color: "#6dba84".to_string(),
        },
        Insight {
            id: "2".to_string(),
            title: "Stress rises during busy periods".to_string(),
            body: "On high-workload days, emotional pressure tends to peak. Short breaks may shift this pattern.".to_string(),
            color: "#e05c6e".to_string(),
        },
        Insight {
            id: "3".to_string(),
            title: "Journaling lifts your mood".to_string(),
            body: "Check-ins with journal entries correlate with higher Calm and Happy moods the next morning.".to_string(),
            color: "#ffb954".to_string(),
        },
    ]
}

fn suggestions_for_mood(mood: &str) -> Vec<Suggestion> {
    match mood {
        "stressed" => vec![
            Suggestion { id: "s1".to_string(), icon: "💨".to_string(), title: "Breathing exercise".to_string(), description: "4-7-8 breathing to release tension and calm your nervous system.".to_string(), mood: "stressed".to_string() },
            Suggestion { id: "s2".to_string(), icon: "⏸".to_string(), title: "Take a short break".to_string(), description: "Step away for 10 quiet minutes — rest is productive.".to_string(), mood: "stressed".to_string() },
            Suggestion { id: "s3".to_string(), icon: "🤸".to_string(), title: "Stretching reminder".to_string(), description: "Gentle neck and shoulder rolls to release physical tension.".to_string(), mood: "stressed".to_string() },
        ],
        "worried" => vec![
            Suggestion { id: "w1".to_string(), icon: "📓".to_string(), title: "Journaling prompt".to_string(), description: "Write about one thing you know for certain right now.".to_string(), mood: "worried".to_string() },
            Suggestion { id: "w2".to_string(), icon: "🌿".to_string(), title: "Grounding exercise".to_string(), description: "Name 5 things you see, 4 you can touch, 3 you can hear.".to_string(), mood: "worried".to_string() },
            Suggestion { id: "w3".to_string(), icon: "🚶".to_string(), title: "Short walk".to_string(), description: "A brief walk outside helps reset mental clarity.".to_string(), mood: "worried".to_string() },
        ],
        "okay" => vec![
            Suggestion { id: "o1".to_string(), icon: "🪞".to_string(), title: "Light reflection".to_string(), description: "Take a moment to notice what is going well right now.".to_string(), mood: "okay".to_string() },
            Suggestion { id: "o2".to_string(), icon: "✅".to_string(), title: "Small task".to_string(), description: "Finish one small, satisfying thing on your list.".to_string(), mood: "okay".to_string() },
        ],
        "happy" => vec![
            Suggestion { id: "h1".to_string(), icon: "📔".to_string(), title: "Gratitude journaling".to_string(), description: "Capture what brought this brightness and carry it forward.".to_string(), mood: "happy".to_string() },
            Suggestion { id: "h2".to_string(), icon: "🎯".to_string(), title: "Set a meaningful goal".to_string(), description: "Channel your clarity into something you've been putting off.".to_string(), mood: "happy".to_string() },
        ],
        _ => vec![
            Suggestion { id: "c1".to_string(), icon: "📋".to_string(), title: "Maintain your routine".to_string(), description: "Consistency amplifies calm — keep the rhythm going.".to_string(), mood: "calm".to_string() },
            Suggestion { id: "c2".to_string(), icon: "🌻".to_string(), title: "Gratitude reflection".to_string(), description: "Name three things that contributed to this peace.".to_string(), mood: "calm".to_string() },
        ],
    }
}

fn dominant_mood_from_entries(entries: &[MoodEntry]) -> Option<String> {
    if entries.is_empty() {
        return None;
    }
    let mut counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    let recent = entries.iter().rev().take(7);
    for entry in recent {
        *counts.entry(entry.mood.clone()).or_insert(0) += 1;
    }
    counts.into_iter().max_by_key(|(_, count)| *count).map(|(m, _)| m)
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn save_mood_entry(app: AppHandle, input: SaveMoodInput) -> Result<MoodEntry, String> {
    let mut entries = read_entries(&app)?;
    let timestamp_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|err| err.to_string())?
        .as_millis() as i64;
    let entry = MoodEntry {
        id: format!("{}-{}", timestamp_ms, entries.len() + 1),
        mood: input.mood,
        tags: input.tags,
        journal: input.journal,
        school_load: input.school_load,
        activity_minutes: input.activity_minutes,
        day_note: input.day_note,
        social_interactions: input.social_interactions,
        activities: input.activities,
        timestamp_ms,
    };
    entries.push(entry.clone());
    write_entries(&app, &entries)?;
    Ok(entry)
}

#[tauri::command]
fn list_mood_entries(app: AppHandle) -> Result<Vec<MoodEntry>, String> {
    read_entries(&app)
}

#[tauri::command]
fn get_guidance(app: AppHandle) -> Result<GuidancePayload, String> {
    let entries = read_entries(&app)?;
    let dominant = dominant_mood_from_entries(&entries);
    let mut insights = base_insights();

    if let Some(ref mood) = dominant {
        if let Some((label, color, definition)) = mood_meta(mood) {
            insights.insert(
                0,
                Insight {
                    id: "0".to_string(),
                    title: format!("Your recent mood leans {label}"),
                    body: definition.to_string(),
                    color: color.to_string(),
                },
            );
        }
    }

    let suggestions = suggestions_for_mood(dominant.as_deref().unwrap_or("calm"));

    Ok(GuidancePayload {
        dominant_mood: dominant,
        insights,
        suggestions,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_mood_entry,
            list_mood_entries,
            get_guidance
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}