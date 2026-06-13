<div align="center">

```
███╗   ███╗ █████╗ ██████╗ ██╗   ██╗██╗  ██╗ █████╗ ██╗
████╗ ████║██╔══██╗██╔══██╗██║   ██║██║  ██║██╔══██╗██║
██╔████╔██║███████║██████╔╝██║   ██║███████║███████║██║
██║╚██╔╝██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██║██║
██║ ╚═╝ ██║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██║
╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
```

### *Your compassionate companion for emotional wellness*

---

[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%202.0-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Mistral AI](https://img.shields.io/badge/Powered%20by-Mistral%20AI-FF7000?style=for-the-badge)](https://mistral.ai)

> *"Mabuhay"* — a Filipino word meaning **"to live"** or **"long live."**  
> *MabuhAi* fuses that spirit of life with artificial intelligence —  
> a space where you are heard, never judged, always welcomed.

</div>

---

## 🌿 What is MabuhAi?

MabuhAi is a **mobile-first mental health companion app** built by a team of 40 students across 8 groups, designed to give users a warm, private, and supportive digital space. This repository contains **Group 2's contribution** — the **AI Chat Support & Safety Module**, also known as the *Digital Guardians* module.

At its core, MabuhAi is three things:

| 💬 A Listener | 🛡️ A Guardian | 🔒 A Vault |
|:---:|:---:|:---:|
| Empathetic AI-powered conversation with real emotional context | Real-time crisis detection, abuse prevention, and emergency resource routing | Privacy-first design with local storage, 24-hour deletion, and GDPR/CCPA compliance |

---

## ✨ Feature Highlights

<details>
<summary><strong>🤖 AI Chat Support</strong> — click to expand</summary>

- Empathetic conversations powered by **Mistral AI** (`mistral-small-latest`)
- Context-aware responses — maintains the last **6 messages** for coherent dialogue
- Multiple intent modes: `vent` · `affirmation` · `self-care` · `calm`
- Typewriter animation with **rich text rendering**
- Typing indicators for a natural, human-like conversation feel

</details>

<details>
<summary><strong>📝 Rich Text Formatting</strong> — click to expand</summary>

| Syntax | Result |
|--------|--------|
| `**bold**` or `__bold__` | **Bold text** |
| `*italic*` or `_italic_` | *Italic text* |
| `` `code` `` | `Inline code` |
| `- item` or `• item` | Bullet lists |
| `1. item` | Numbered lists |
| `## Heading` | Section headers |

</details>

<details>
<summary><strong>🛡️ Safety & Crisis Guardrails</strong> — click to expand</summary>

- **Crisis Detection** — 25+ keyword triggers mapped to immediate **988 Lifeline** resources
- **Abuse Prevention** — hostile input is gracefully redirected with kindness, not rejection
- **Content Filtering** — Mistral Safe Mode + post-processing validation layer
- **Rate Limiting** — 2 requests/second with clear, friendly error messaging
- **Emergency Resources** — 988, Crisis Text Line (741741), SAMHSA Helpline, Trevor Project

</details>

<details>
<summary><strong>🔐 Privacy & Compliance</strong> — click to expand</summary>

- Full **Privacy Policy** with 10 sections covering GDPR & CCPA
- Complete model transparency — users know they're talking to `mistral-small-latest`
- **90-day consent re-prompt** with version tracking
- **24-hour automatic conversation deletion**
- All user preferences stored **locally only** — nothing leaves your device unnecessarily

</details>

<details>
<summary><strong>🎨 UI/UX Features</strong> — click to expand</summary>

- **Mask-Off Mode** — anonymous mode for judgment-free expression
- **Dark / Light Mode** — adapts to system preferences automatically
- **Responsive, touch-friendly** mobile-first design
- **Floating Crisis Button** — always accessible, never hidden
- Clear legal & safety disclaimers woven throughout the experience

</details>

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      MabuhAi Stack                      │
├──────────────────┬──────────────────────────────────────┤
│  React 18        │  Frontend UI framework                │
│  TypeScript 5.0  │  Type-safe development                │
│  Tauri 2.0       │  Android mobile app runtime           │
│  Tailwind CSS v4 │  Styling & UI components              │
│  Framer Motion   │  Animations & transitions             │
│  Lucide React    │  Icons & graphics                     │
│  Express.js      │  Backend API server                   │
│  Mistral AI      │  LLM — mistral-small-latest           │
└──────────────────┴──────────────────────────────────────┘
```

---

## 📁 Project Structure

```
mabuhai-app/
│
├── 📂 src/
│   ├── 📂 components/
│   │   ├── 📂 chatbot-components/
│   │   │   ├── ChatBubble.tsx        ← Message rendering + rich text
│   │   │   └── MaskOverlay.tsx       ← Anonymous mode UI
│   │   ├── PrivacyPolicy.tsx         ← GDPR/CCPA policy screen
│   │   └── ...
│   │
│   ├── 📂 pages/
│   │   └── Chatbot.tsx               ← Main chat interface
│   └── ...
│
├── 📂 server/
│   └── server.js                     ← Express API + Mistral integration
│
├── 📂 public/
├── package.json
├── tailwind.config.js
└── README.md                         ← You are here 👋
```

---

## 🚀 Getting Started

### Prerequisites

```
Node.js     18.x or higher
Rust        Latest stable
Tauri CLI   Latest
Android SDK API Level 33+  (for mobile builds)
```

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/mabuhai-app.git
cd mabuhai-app

# 2. Install dependencies
npm install

# 3. Set up your environment
#    Create a .env file inside /server:
echo "MISTRAL_API_KEY=your_key_here" > server/.env
echo "PORT=3000" >> server/.env

# 4. Start the backend
cd server && node server.js

# 5. Launch the app
cd .. && npm run tauri dev
```

### Android Build

```bash
npm run tauri android init
npm run tauri android build
```

---

## 🔧 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/chat` | `POST` | Send a message to the AI |
| `/health` | `GET` | Server health check |
| `/crisis-resources` | `GET` | Retrieve emergency resource info |
| `/model-info` | `GET` | Get current AI model details |

**Request**
```json
{
  "message": "I'm feeling anxious today",
  "intent": "general",
  "history": [
    { "role": "User", "content": "Previous message" },
    { "role": "MabuhAi", "content": "Previous response" }
  ]
}
```

**Response**
```json
{
  "reply": "I hear you. Anxiety can feel like a wave...",
  "crisisDetected": false,
  "abuseDetected": false
}
```

---

## 🛡️ Safety System Deep Dive

### Crisis Detection Keywords *(25+ triggers)*
```
"kill myself"    "suicide"         "end my life"      "want to die"
"hurt myself"    "self harm"       "cut myself"       "overdose"
"can't go on"    "no reason to live"                  "want to end it"
"immediate help" "emergency"       "crisis now"       ...and more
```

### Abuse Prevention Patterns
```
"hate you"  "stupid"  "worthless"  "useless"  "dumb"
"shut up"   "fuck you"             ...redirected with kindness, always
```

## 📞 Crisis Resources (Philippines / Iloilo)

### National Crisis Hotlines (Philippines)
| Service | Contact | Availability |
|---------|---------|--------------|
| NCMH Crisis Hotline | **1553** (toll-free) | 24/7 |
| NCMH (Globe/TM) | 0917-899-8727 | 24/7 |
| NCMH (Smart/Sun) | 0998-972-8727 | 24/7 |
| DOH Hopeline | 804-4673 | 24/7 |
| DOH Hopeline (Globe) | 0917-558-4673 | 24/7 |

### Iloilo City Mental Health Resources
| Facility | Contact | Location |
|----------|---------|----------|
| Western Visayas Medical Center | (033) 321-2841 | Mandurriao, Iloilo City |
| Iloilo Mission Hospital | (033) 509-5711 | Jaro, Iloilo City |
| St. Paul's Hospital Iloilo | (033) 337-2741 | Gen. Luna St., Iloilo City |
| The Medical City Iloilo | (033) 327-2814 | Mandurriao, Iloilo City |
| WVSU Psychology Department | (033) 320-0870 | La Paz, Iloilo City |

### Emergency
| Service | Number |
|---------|--------|
| Philippine National Police | 117 or 911 |
| Emergency Hotline | 911 |

## 🧪 Testing

```bash
npm run test
```

| Category | Test Cases | Pass Rate |
|---|:---:|:---:|
| Crisis Detection | 45 | ✅ 100% |
| Abuse Prevention | 25 | ✅ 96% |
| API Integration | 18 | ✅ 100% |
| UI Rendering | 30 | ✅ 100% |
| Error Handling | 22 | ✅ 100% |
| Privacy Compliance | 15 | ✅ 100% |
| **TOTAL** | **155** | **🟢 99.3%** |

---

## 👥 Group 2 — Digital Guardians

> *AI Chat Support & Safety Module*

| Role | Responsibilities |
|---|---|
| 👑 Team Lead / Coordinator | Task management, deadlines, integration coordination |
| 🎨 UI/UX Designer | Chat interface design, privacy screen layout |
| ⚛️ Frontend Developer | React components, rich text formatting |
| ⚙️ Logic / Data Developer | API integration, state management |
| 🔍 QA / Documentation | Testing, bug tracking, documentation |

### Completed Deliverables

```
[✅] AI Chatbot with Mistral Integration
[✅] Crisis Detection — Frontend + Backend
[✅] Abuse Prevention System
[✅] Rich Text Formatting
[✅] Privacy Policy Screen
[✅] Mask-Off Mode
[✅] Typewriter Animation
[✅] Rate Limiting & Error Handling
```

---

## 🤖 AI Tools Used in Development

| Tool | How We Used It |
|---|---|
| ChatGPT | Planning, brainstorming, test case generation, debugging |
| GitHub Copilot | Code completion, API integration, error handling |
| Claude | Markdown parsing regex, optimization suggestions |
| Gemini | Privacy policy content generation |

---

## ⚠️ Important Disclaimer

> **MabuhAi is not a crisis service, medical device, or substitute for professional mental health care.**

```
🚨  In crisis?              → Call 988 immediately
📱  Need to text?           → Text HOME to 741741
🆘  Immediate danger?       → Call 911
```

The AI companion provides **emotional support only**. It does not offer medical advice, diagnosis, or treatment. Always seek professional help when needed.

---

## 📝 License

Developed for **educational purposes** as part of a student collaborative project. Not for commercial distribution.

---

## 🙏 Acknowledgments

- [Mistral AI](https://mistral.ai) — for accessible free-tier API access that made this possible
- [Tauri](https://tauri.app) — for the beautiful, lightweight mobile framework
- [988 Suicide & Crisis Lifeline](https://988lifeline.org) — for the life-saving resources we integrate
- **All 40 students across 8 groups** who poured their hearts into MabuhAi 💚

---

## 📬 Contact

| Purpose | Contact |
|---|---|
| 🔒 Privacy inquiries | cictapps@wvsu.edu.ph |
| 🗑️ Data deletion requests | datarequest@mabuhai.com |
| 🚨 Crisis support | **988** (24/7) |

---

<div align="center">

**🔗 Quick Links**

[Mistral AI Docs](https://docs.mistral.ai) · [Tauri Docs](https://tauri.app/v1/guides/) · [988 Lifeline](https://988lifeline.org) · [Crisis Text Line](https://www.crisistextline.org)

---

*Made with 💚 for mental health awareness and support*

**MabuhAi — Your compassionate companion for emotional wellness**

</div>