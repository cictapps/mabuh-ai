use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel},
    sampling::LlamaSampler,
};
use std::{num::NonZeroU32, path::PathBuf, sync::Mutex};
use tauri::{Manager, State};

// --- State ---
pub struct LlamaState {
    backend: Mutex<Option<LlamaBackend>>,
    model: Mutex<Option<LlamaModel>>,
    chat_history: Mutex<Vec<ChatMessage>>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ChatMessage {
    role: String,
    content: String,
}

// --- Build prompt ---
fn build_prompt(message: &str, intent: &str, history: &[ChatMessage]) -> String {
    let mut prompt = String::from(
        "<start_of_turn>user\nYou are MabuhAi, a kind and supportive AI companion. \
        Speak warmly and keep replies short (2-4 sentences). \
        Respond only as MabuhAi.\n\n"
    );

    for msg in history.iter().rev().take(6).rev() {
        if msg.role == "User" {
            prompt.push_str(&format!("<start_of_turn>user\n{}<end_of_turn>\n", msg.content));
        } else {
            prompt.push_str(&format!("<start_of_turn>model\n{}<end_of_turn>\n", msg.content));
        }
    }

    prompt.push_str(&format!(
        "Intent: {}\n{}<end_of_turn>\n<start_of_turn>model\n",
        intent, message
    ));
    prompt
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}! Welcome to MabuhAi 🌿", name)
}

#[tauri::command]
async fn chat(
    message: String,
    intent: Option<String>,
    state: State<'_, LlamaState>,
) -> Result<String, String> {
    println!("🔵 chat() called with: {}", message);
    let intent = intent.unwrap_or_else(|| "general".into());

    let prompt = {
        let history = state.chat_history.lock().unwrap();
        build_prompt(&message, &intent, &history)
    };
    println!("📝 Prompt built, length: {}", prompt.len());

    let backend_guard = state.backend.lock().unwrap();
    let backend = backend_guard
        .as_ref()
        .ok_or("Model not loaded. Call load_model first.")?;
    let model_guard = state.model.lock().unwrap();
    let model = model_guard.as_ref().unwrap();
    println!("✅ Model acquired");

    let ctx_params = LlamaContextParams::default()
        .with_n_ctx(Some(NonZeroU32::new(4096).unwrap()))
        .with_n_threads(4);

    let mut ctx = model
        .new_context(backend, ctx_params)
        .map_err(|e| { println!("❌ Context failed: {}", e); e.to_string() })?;
    println!("✅ Context created");

    let tokens = model
        .str_to_token(&prompt, AddBos::Always)
        .map_err(|e| { println!("❌ Tokenization failed: {}", e); e.to_string() })?;
    println!("✅ Tokens: {}", tokens.len());

    let batch_size = (tokens.len() + 1).max(512);
    let mut batch = LlamaBatch::new(batch_size, 1);

    for (i, &tok) in tokens.iter().enumerate() {
        let is_last = i == tokens.len() - 1;
        batch.add(tok, i as i32, &[0], is_last)
            .map_err(|e| { println!("❌ Batch add failed at {}: {}", i, e); e.to_string() })?;
    }

    ctx.decode(&mut batch)
        .map_err(|e| { println!("❌ Initial decode failed: {}", e); e.to_string() })?;
    println!("✅ Initial decode done, n_cur starts at: {}", batch.n_tokens());

    let mut n_cur = batch.n_tokens();
    let n_max = n_cur + 256;
    let mut full_reply = String::new();

    let seed = rand::random::<u32>();
    let mut sampler = LlamaSampler::chain_simple([
        LlamaSampler::top_k(40),
        LlamaSampler::top_p(0.9, 1),
        LlamaSampler::temp(0.8),
        LlamaSampler::penalties(64, 1.3, 0.0, 0.0),
        LlamaSampler::dist(seed),
    ]);

    let mut decoder = encoding_rs::UTF_8.new_decoder();
    let mut gen_batch = LlamaBatch::new(1, 1);

    while n_cur < n_max {
        let new_tok = sampler.sample(&ctx, -1);

        if new_tok == model.token_eos() {
            println!("🏁 EOS at token {}", n_cur);
            break;
        }

        let piece = match model.token_to_piece(new_tok, &mut decoder, true, None) {
            Ok(p) => p,
            Err(_) => {
                println!("🏁 Control token reached, stopping generation");
                break;
            }
        };

        full_reply.push_str(&piece);

        if full_reply.contains("<end_of_turn>") || full_reply.contains("<start_of_turn>") {
            println!("🛑 Stop token detected at {}", n_cur);
            if let Some(pos) = full_reply.find("<end_of_turn>") {
                full_reply.truncate(pos);
            }
            if let Some(pos) = full_reply.find("<start_of_turn>") {
                full_reply.truncate(pos);
            }
            break;
        }

        gen_batch.clear();
        gen_batch
            .add(new_tok, n_cur, &[0], true)
            .map_err(|e| { println!("❌ gen_batch add failed at {}: {}", n_cur, e); e.to_string() })?;
        ctx.decode(&mut gen_batch)
            .map_err(|e| { println!("❌ gen decode failed at {}: {}", n_cur, e); e.to_string() })?;

        n_cur += 1;
    }

    println!("✅ Generation done. Reply: {:?}", full_reply);

    let reply = full_reply.trim().to_string();

    {
        let mut history = state.chat_history.lock().unwrap();
        history.push(ChatMessage { role: "User".into(), content: message });
        history.push(ChatMessage { role: "MabuhAi".into(), content: reply.clone() });
    }

    Ok(reply)
}

#[tauri::command]
fn reset(state: State<'_, LlamaState>) -> Result<String, String> {
    state.chat_history.lock().unwrap().clear();
    Ok("Chat history cleared".into())
}

#[tauri::command]
async fn load_model(path: String, state: State<'_, LlamaState>) -> Result<String, String> {
    if state.model.lock().unwrap().is_some() {
        return Ok("Model already loaded".into());
    }

    let backend = LlamaBackend::init().map_err(|e| e.to_string())?;
    let params = LlamaModelParams::default();
    let model = LlamaModel::load_from_file(&backend, PathBuf::from(&path), &params)
        .map_err(|e| e.to_string())?;

    *state.backend.lock().unwrap() = Some(backend);
    *state.model.lock().unwrap() = Some(model);
    Ok("Model ready".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(LlamaState {
            backend: Mutex::new(None),
            model: Mutex::new(None),
            chat_history: Mutex::new(Vec::new()),
        })
        .setup(|app| {
            let state = app.state::<LlamaState>();
            let data_dir = app.path().app_data_dir()
                .expect("Could not get app data dir");
            let model_path = data_dir.join("model.gguf");

            if model_path.exists() {
                println!("📦 Auto-loading model from: {:?}", model_path);
                match LlamaBackend::init() {
                    Ok(backend) => {
                        let params = LlamaModelParams::default();
                        match LlamaModel::load_from_file(&backend, model_path, &params) {
                            Ok(model) => {
                                *state.backend.lock().unwrap() = Some(backend);
                                *state.model.lock().unwrap() = Some(model);
                                println!("✅ Model auto-loaded successfully");
                            }
                            Err(e) => println!("❌ Failed to load model: {}", e),
                        }
                    }
                    Err(e) => println!("❌ Backend init failed: {}", e),
                }
            } else {
                println!("⚠️ No model.gguf found at {:?}", model_path);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_model, chat, reset, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}