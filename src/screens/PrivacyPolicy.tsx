import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Database, Cpu, Lock, Trash2,
  ShieldCheck, Heart, UserCheck, FileText,
  X, ChevronRight, CheckCircle2
} from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const CURRENT_VERSION = '2.0.0';

const SUMMARY_ITEMS = [
  'No personal information collected',
  'Chats deleted after 24 hours',
  'No AI training on your data',
  'Not a replacement for therapy',
];

const SECTIONS = [
  {
    icon: Database,
    title: 'Information we collect',
    content: [
      'Chat conversations temporarily stored for session context only.',
      'Anonymous device info and basic usage data.',
      'No personal identifiers — no name, email, or phone number.',
      'Crisis keyword detection logs (anonymized).',
    ],
  },
  {
    icon: Cpu,
    title: 'AI model: Mistral Small',
    content: [
      'Model: mistral-small-latest (7B parameters, 2025).',
      'No training on user data — each session starts fresh.',
      'Encryption: TLS 1.3 end-to-end.',
      'Servers: EU region, GDPR compliant.',
    ],
  },
  {
    icon: Lock,
    title: 'How we use your data',
    content: [
      'To provide emotional support and maintain session context.',
      'Anonymous analytics to improve safety features.',
      'Crisis detection and emergency resource routing.',
      'Model performance monitoring.',
    ],
  },
  {
    icon: Trash2,
    title: 'Data storage & deletion',
    content: [
      'Chat logs deleted after 24 hours.',
      'Crisis flags stored anonymously for 90 days.',
      'Automatic deletion after 7 days of inactivity.',
      'Request immediate deletion by closing the app.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Safety measures & guardrails',
    content: [
      'Content filtering via Mistral Safe Mode.',
      'Crisis keyword detection with 988 hotline integration.',
      'Rate limiting: 2 requests per second.',
      'No medical advice — companion only, not a therapist.',
    ],
  },
  {
    icon: Heart,
    title: 'Crisis intervention',
    content: [
      'Suicide or self-harm keywords trigger immediate resources.',
      'Anonymous review of flagged conversations.',
      'Emergency contacts: 988 · Text 741741 · Call 911.',
    ],
  },
  {
    icon: UserCheck,
    title: 'Your rights',
    content: [
      'Access: request your conversation data anytime.',
      'Deletion: immediate upon request.',
      'Opt-out: close the app to stop all data processing.',
      'Export: download your conversation history.',
    ],
  },
  {
    icon: FileText,
    title: 'Legal compliance',
    content: [
      'GDPR compliant for EU users.',
      'CCPA compliant for California residents.',
      'No data sold to third parties.',
      'Children under 13 require parental consent.',
    ],
  },
];

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose, onAccept }) => {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('privacy_policy_accepted');
    const storedVersion = localStorage.getItem('privacy_policy_version');
    const storedDate = localStorage.getItem('privacy_policy_date');

    if (stored === 'true' && storedVersion === CURRENT_VERSION && storedDate) {
      const days = Math.floor((Date.now() - new Date(storedDate).getTime()) / 86_400_000);
      if (days < 90) {
        onAccept?.();
        onClose();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setChecked(false);
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
    localStorage.setItem('privacy_policy_accepted', 'true');
    localStorage.setItem('privacy_policy_version', CURRENT_VERSION);
    localStorage.setItem('privacy_policy_date', new Date().toISOString());
    setAccepted(true);
    onAccept?.();
    setTimeout(onClose, 600);
  };

  const canAccept = checked && scrolledToBottom;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => scrolledToBottom && onClose()}
    >
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[88vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-7 pt-6 pb-5" style={{ borderBottom: '0.5px solid rgba(128,128,128,0.15)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-neutral-400 dark:text-neutral-500 mt-0.5" />
              <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                Privacy &amp; safety policy
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mt-1.5 ml-7 text-xs text-neutral-400 dark:text-neutral-500">
            Last updated January 2025 · Version {CURRENT_VERSION}
          </p>

          <div className="flex gap-2 mt-3 ml-7 flex-wrap">
            {[
              { label: 'GDPR compliant', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
              { label: 'EU servers', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
              { label: 'Mistral AI · Free tier', color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400' },
            ].map(({ label, color }) => (
              <span key={label} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${color}`}>
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
          <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            {SUMMARY_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          {/* Accordion sections */}
          <div style={{ borderTop: '0.5px solid rgba(128,128,128,0.15)' }}>
            {SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              const isOpen = expandedSection === idx;
              return (
                <div key={idx} style={{ borderBottom: '0.5px solid rgba(128,128,128,0.15)' }}>
                  <button
                    onClick={() => setExpandedSection(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={15}
                        className="text-neutral-400 dark:text-neutral-500 shrink-0"
                      />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {section.title}
                      </span>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-neutral-300 dark:text-neutral-600 shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-4 pl-6 space-y-1.5">
                      {section.content.map((line, i) => (
                        <p key={i} className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🇵🇭 Questions or Concerns?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              For privacy inquiries, data deletion requests, or safety concerns in the Philippines:
            </p>
            <div className="text-sm space-y-1">
              <p>📧 Email: privacy@mabuhai.com</p>
              <p>🔒 Data Requests: datarequest@mabuhai.com</p>
              <p className="mt-2 font-semibold">🚨 Crisis Support (Philippines):</p>
              <p>📞 NCMH Crisis Hotline: <strong>1553</strong> (toll-free, 24/7)</p>
              <p>📞 DOH Hopeline: <strong>804-4673</strong> / <strong>0917-558-4673</strong></p>
              <p className="mt-1 font-semibold">🏥 Iloilo City Resources:</p>
              <p>📞 Western Visayas Medical Center: <strong>(033) 321-2841</strong></p>
              <p>📞 Iloilo Mission Hospital: <strong>(033) 509-5711</strong></p>
              <p>📞 The Medical City Iloilo: <strong>(033) 327-2814</strong></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-7 py-4 bg-white dark:bg-neutral-900 flex items-center justify-between gap-4"
          style={{ borderTop: '0.5px solid rgba(128,128,128,0.15)' }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="rounded border-neutral-300 dark:border-neutral-600 accent-neutral-900 dark:accent-white cursor-pointer"
            />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              I have read and agree to this policy
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!canAccept}
            className={`
              shrink-0 px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200
              ${accepted
                ? 'bg-emerald-600 text-white cursor-default'
                : canAccept
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 cursor-pointer'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              }
            `}
          >
            {accepted ? '✓ Accepted' : 'Accept & continue'}
          </button>
        </div>

        {!scrolledToBottom && (
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 pb-2">
            Scroll to the bottom to enable acceptance
          </p>
        )}
      </div>
    </div>
  );
};