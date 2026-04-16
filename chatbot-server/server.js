import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434/api/generate";


// Simple in-memory chat history (per session later pwede mo i-upgrade)
let chatHistory = [];

// 🔧 Build prompt (optimized for 1B)
function buildPrompt(userMessage, intent = "general") {
  // keep last 4 messages only (important for small model)
  const recentHistory = chatHistory.slice(-4)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

  return `
You are MabuhAi, a kind and supportive AI companion.
Speak warmly and keep replies short (2–4 sentences).

Intent: ${intent}

Conversation:
${recentHistory}

User: ${userMessage}
MabuhAi:
`;
}

// 📩 CHAT ENDPOINT
app.post("/chat", async (req, res) => {
  const { message, intent } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const prompt = buildPrompt(message, intent);

    const response = await axios.post(OLLAMA_URL, {
      model: "gemma3:1b",
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 150
      }
    });

    const aiReply = response.data.response.trim();

    // save history
    chatHistory.push({ role: "User", content: message });
    chatHistory.push({ role: "MabuhAi", content: aiReply });

    res.json({
      reply: aiReply
    });

  } catch (error) {
    console.error("Ollama error:", error.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

// 🧹 RESET CHAT (optional)
app.post("/reset", (req, res) => {
  chatHistory = [];
  res.json({ message: "Chat history cleared" });
});

// START SERVER
app.listen(3000, "0.0.0.0", () => {
  console.log("MabuhAi server running on port 3000");
});