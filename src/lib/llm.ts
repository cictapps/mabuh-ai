import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { appDataDir } from "@tauri-apps/api/path";

// Replaces: axios.post("http://localhost:3000/load-model")
export async function loadModel(): Promise<void> {
  const dataDir = await appDataDir();
  const modelPath = `${dataDir}/model.gguf`;
  await invoke("load_model", { path: modelPath });
}

// Replaces: axios.post("http://localhost:3000/chat", { message, intent })
export async function chat(
  message: string,
  intent: string = "general",
  onToken: (token: string) => void,
  onDone: () => void
): Promise<void> {
  const unlisteners: UnlistenFn[] = [];

  unlisteners.push(
    await listen<string>("llm-token", (e) => {
      onToken(e.payload);
    })
  );

  unlisteners.push(
    await listen("llm-done", () => {
      unlisteners.forEach((u) => u());
      onDone();
    })
  );

  await invoke("chat", { message, intent });
}

// Replaces: axios.post("http://localhost:3000/reset")
export async function resetChat(): Promise<void> {
  await invoke("reset");
}