import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Database,
  Cpu,
  Lock,
  Trash2,
  ShieldCheck,
  Heart,
  UserCheck,
  FileText,
  X,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  required?: boolean;
}

const CURRENT_VERSION = "2.2.0";

const SUMMARY_ITEMS = [
  "Chats authenticated with your Supabase session",
  "AI context is opt-in (defaults to off)",
  "AI runs on Mistral free tier",
  "Not a replacement for therapy",
];

const SECTIONS = [
  {
    icon: Database,
    title: "Information we collect",
    content: [
      "A Supabase-issued access token is sent with each chat request so the server can authorize the call. Tokens are never logged by the client.",
      "By default, the message you type is the only context forwarded to the AI server. Other context (display name, recent moods, recent journals, social stats, journey stats, analytics) is opt-in and disabled until you turn it on in Settings → AI companion context.",
      "Mask Mode hides the structured context above, but the request is still authorized with your Supabase session token. There is no anonymous tier that does not authenticate the user.",
      "Crisis-related keywords are detected on the device before any network call. Detected phrases surface local crisis resources immediately; the matching text is not stored on the device.",
    ],
  },
  {
    icon: Cpu,
    title: "AI model: Mistral Small (free tier)",
    content: [
      "Model: mistral-small-latest (Mistral AI).",
      "Mabuh-ai uses the free tier of Mistral AI. As part of their free-tier terms, the prompts and messages you send may be used by Mistral to improve and train their models.",
      "Please do not share anything you would not be comfortable being seen by an AI provider. Avoid personal names, school names, addresses, phone numbers, or anything sensitive.",
      "Encryption: TLS 1.3 in transit.",
      "Servers: Mistral infrastructure (EU region, GDPR compliant).",
    ],
  },
  {
    icon: Lock,
    title: "How we use your data",
    content: [
      "To provide emotional support and maintain session context.",
      "Client-side crisis detection to surface local help resources.",
      "No model-performance telemetry is sent from the device.",
    ],
  },
  {
    icon: Trash2,
    title: "Data storage & deletion",
    content: [
      "Mabuh-ai is an emotional-support companion, not a clinical record. The app does not store chat history on the device or the server beyond the live request.",
      "Your profile, check-ins, and journals live in your Supabase project and follow the RLS policies in supabase/schema.sql. Account deletion removes them via the public.delete_user() function.",
      "You can clear all local data from Settings → Your data.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety measures & guardrails",
    content: [
      "Client-side crisis keyword detection (see lib/crisis.ts) — runs before the AI request and shows local resources when triggered.",
      "Rate limiting: 2 requests per second on the chat server.",
      "No medical advice — companion only, not a therapist.",
    ],
  },
  {
    icon: Heart,
    title: "Crisis intervention",
    content: [
      "Suicide or self-harm keywords trigger an immediate in-app resources panel pointing at NCMH (1553), DOH Hopeline, and the national emergency line (911).",
      "The current implementation does not contact emergency services automatically. Please call the numbers above or your local equivalent if you are in immediate danger.",
    ],
  },
  {
    icon: UserCheck,
    title: "Your rights",
    content: [
      "Access: view the data we hold for you in Settings → Your data → Export my data.",
      "Deletion: Settings → Sign out → Delete account removes your profile, check-ins, and journals from Supabase.",
      "Opt-out: you can use the rest of the app without ever opening the AI companion. You can also reset all AI context toggles in Settings.",
      "Export: download your check-ins, journals, and preferences as JSON.",
    ],
  },
  {
    icon: FileText,
    title: "Legal compliance",
    content: [
      "GDPR compliant for EU users.",
      "CCPA compliant for California residents.",
      "No data sold to third parties.",
      "Children under 13 require parental consent.",
    ],
  },
];

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  isOpen,
  onClose,
  onAccept,
  required = false,
}) => {
  const [checked, setChecked] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!required) return;
    const stored = localStorage.getItem("privacy_policy_accepted");
    const storedVersion = localStorage.getItem("privacy_policy_version");
    const storedDate = localStorage.getItem("privacy_policy_date");

    if (stored === "true" && storedVersion === CURRENT_VERSION && storedDate) {
      const days = Math.floor((Date.now() - new Date(storedDate).getTime()) / 86_400_000);
      if (days < 90) {
        onAccept?.();
        onClose();
      }
    }
  }, [isOpen, required]);

  useEffect(() => {
    if (isOpen) {
      setChecked(false);
      setAiConsent(false);
      setScrolledToBottom(false);
      setExpandedSection(null);
      setAccepted(false);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!scrolledToBottom && el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("privacy_policy_accepted", "true");
    localStorage.setItem("privacy_policy_version", CURRENT_VERSION);
    localStorage.setItem("privacy_policy_date", new Date().toISOString());
    setAccepted(true);
    onAccept?.();
    setTimeout(onClose, 600);
  };

  const canAccept = checked && aiConsent && scrolledToBottom;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !required && scrolledToBottom && onClose()}
    >
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[88vh] bg-neutral-900 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="shrink-0 px-7 pt-6 pb-5"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-neutral-400 mt-0.5" />
              <span className="text-base font-medium text-neutral-100">
                Privacy &amp; safety policy
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className={`p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors ${required ? "invisible pointer-events-none" : ""}`}
            >
              <X size={16} />
            </button>
          </div>

          <p className="mt-1.5 ml-7 text-xs text-neutral-500">
            Last updated January 2025 · Version {CURRENT_VERSION}
          </p>

          <div className="flex gap-2 mt-3 ml-7 flex-wrap">
            {[
              { label: "GDPR compliant", color: "bg-emerald-950/40 text-emerald-400" },
              { label: "EU servers", color: "bg-blue-950/40 text-blue-400" },
              { label: "Mistral AI · Free tier", color: "bg-white/5 text-neutral-300" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${color}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-7 py-5 space-y-5"
        >
          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            {SUMMARY_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs text-neutral-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          {/* AI free-tier disclosure callout */}
          <div className="rounded-xl p-4 bg-amber-950/20 border border-amber-500/20">
            <h4 className="text-sm font-semibold text-amber-300 mb-1.5">
              About the AI behind Mabuh-ai
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Mabuh-ai runs on the free tier of Mistral AI. Because of how the free tier
              works, the messages you send here may be used by Mistral to train and
              improve their models. Please keep this in mind — share only what feels safe
              to share, and avoid personal details like your full name, school, address,
              or contact info.
            </p>
            <p className="text-[11px] text-amber-200/80 mt-2 leading-relaxed">
              This feature is optional. If you prefer not to use the AI companion, you can
              close this dialog and continue using the rest of Mabuh-ai — check-ins,
              journal, and support resources will still be available to you.
            </p>
          </div>

          {/* Accordion sections */}
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
            {SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              const isOpen = expandedSection === idx;
              return (
                <div
                  key={idx}
                  style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
                >
                  <button
                    onClick={() => setExpandedSection(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={15} className="text-neutral-400 shrink-0" />
                      <span className="text-sm font-medium text-neutral-200">
                        {section.title}
                      </span>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-neutral-500 shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-4 pl-6 space-y-1.5">
                      {section.content.map((line, i) => (
                        <p key={i} className="text-sm text-neutral-400 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-neutral-100 mb-2">
              🇵🇭 Questions or Concerns?
            </h3>
            <p className="text-sm text-neutral-400 mb-2">
              For privacy inquiries, data deletion requests, or safety concerns in the
              Philippines:
            </p>
            <div className="text-sm space-y-1 text-neutral-300">
              <p>📧 Email: privacy@mabuhai.com</p>
              <p>🔒 Data Requests: datarequest@mabuhai.com</p>
              <p className="mt-2 font-semibold text-neutral-200">
                🚨 Crisis Support (Philippines):
              </p>
              <p>
                📞 NCMH Crisis Hotline: <strong>1553</strong> (toll-free, 24/7)
              </p>
              <p>
                📞 DOH Hopeline: <strong>804-4673</strong> /{" "}
                <strong>0917-558-4673</strong>
              </p>
              <p className="mt-1 font-semibold text-neutral-200">
                🏥 Iloilo City Resources:
              </p>
              <p>
                📞 Western Visayas Medical Center: <strong>(033) 321-2841</strong>
              </p>
              <p>
                📞 Iloilo Mission Hospital: <strong>(033) 509-5711</strong>
              </p>
              <p>
                📞 The Medical City Iloilo: <strong>(033) 327-2814</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-7 py-4 bg-neutral-900 flex flex-col gap-3"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex flex-col gap-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                className="mt-0.5 rounded border-neutral-600 bg-transparent accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-neutral-300 leading-relaxed">
                I understand the AI companion runs on Mistral AI's free tier, and that my
                messages may be used to train their models. I will avoid sharing personal
                or sensitive details.
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="rounded border-neutral-600 bg-transparent accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-neutral-300">
                I have read and agree to the rest of this policy
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-500">
              The AI companion is optional — you can skip it.
            </span>
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className={`
                shrink-0 px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${
                  accepted
                    ? "bg-emerald-600 text-white cursor-default"
                    : canAccept
                      ? "bg-white text-neutral-900 hover:opacity-90 cursor-pointer"
                      : "bg-white/5 text-neutral-500 cursor-not-allowed"
                }
              `}
            >
              {accepted ? "✓ Accepted" : "I understand & continue"}
            </button>
          </div>
        </div>

        {!scrolledToBottom && (
          <p className="text-center text-xs text-neutral-500 pb-2">
            Scroll to the bottom to enable acceptance
          </p>
        )}
      </div>
    </div>
  );
};
