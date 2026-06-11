import { Link } from "react-router-dom";
import { LegalShell } from "@/components/shared/LegalShell";

const LAST_UPDATED = "June 2026";
const VERSION = "1.0.0";

interface Section {
  id: string;
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: [
      "Mabuh-ai is a free, student-built wellbeing companion for learners in the Philippines. It was created by BS Information Systems students of the College of Information and Communications Technology at West Visayas State University as a project for their Mobile App Development class.",
      "We are not a clinic, hospital, or licensed mental-health provider. Mabuh-ai is a supportive tool — not a substitute for professional care, diagnosis, or treatment.",
    ],
  },
  {
    id: "ai-mistral-free",
    title: "AI companion: free Mistral AI",
    body: [
      "The chat companion inside Mabuh-ai is powered by the free tier of Mistral AI (the mistral-small model). Because the chat runs on a free-tier API, the messages you send to the companion may be used by Mistral to train and improve their models. This is a condition of using the free tier and not a choice we can opt out of.",
      "Please keep that in mind when you talk to the companion. Avoid sharing your full name, home or school address, phone number, account numbers, or any information you would not be comfortable being seen by a third-party AI provider. The companion is optional — you can use every other part of Mabuh-ai without ever talking to it.",
    ],
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: [
      "An account email address and a display name, used to sign you in and personalize the app.",
      "Your mood check-ins, journal entries, and self-care journey — these are tied to your account so you can review them across devices.",
      "Anonymous usage data and device information (operating system, app version) to help us improve the app.",
    ],
  },
  {
    id: "what-we-do-not",
    title: "What we do not collect",
    body: [
      "We do not sell your data. We do not share it with advertisers. We do not use it to build a profile of you outside Mabuh-ai.",
      "We do not require a phone number, government ID, or address to use the app.",
    ],
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    body: [
      "To show your check-ins, journal entries, and journey back to you in the Review and Journey tabs.",
      "To power safety features: short, anonymized detection of crisis keywords so we can surface local hotlines and urgent help.",
      "To keep Mabuh-ai working — authentication, sync across devices, and basic stability analytics.",
    ],
  },
  {
    id: "storage-and-deletion",
    title: "Storage and deletion",
    body: [
      "Your account data is stored in Supabase (Postgres) in the EU/US region, encrypted in transit (TLS 1.3) and at rest.",
      "Mistral AI may retain copies of the prompts and replies you sent to the companion on their own infrastructure, governed by their free-tier terms.",
      "You can delete your account at any time from Settings → Account → Delete my account. Deletion is permanent and removes your data from our database within 30 days.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: [
      "Access: ask for a copy of the data we hold about you.",
      "Correct: update your display name and account email at any time.",
      "Delete: remove your account and all associated data.",
      "Export: download your check-ins and journal as a JSON file from Settings → Privacy → Export my data.",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    body: [
      "Mabuh-ai is intended for students aged 13 and above. If you are under 13, please ask a parent or guardian before creating an account. We do not knowingly collect data from children under 13 without verifiable parental consent.",
    ],
  },
  {
    id: "crisis",
    title: "Crisis and urgent help",
    body: [
      "If you are in immediate danger, please contact local emergency services first. Mabuh-ai will surface national and Panay-region crisis hotlines in the Support tab, but it is not connected to emergency dispatch.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We may update this policy as the app evolves. Material changes will be announced in-app and on the login screen. The version number and last-updated date above will always reflect the current document.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      "Questions, data requests, or concerns: please reach out to the Mabuh-ai student team through the support channels listed in the app. We are a small team and read every message.",
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      version={VERSION}
    >
      <nav
        aria-label="Sections"
        className="rounded-2xl p-4"
        style={{
          background: "rgba(188,194,255,0.04)",
          border: "0.5px solid rgba(188,194,255,0.10)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(216,212,235,0.55)",
            margin: 0,
            marginBottom: 8,
          }}
        >
          On this page
        </p>
        <ul
          className="flex flex-col gap-1.5"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                style={{
                  fontSize: 13,
                  color: "rgba(188,194,255,0.85)",
                  textDecoration: "none",
                }}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="flex flex-col gap-2 scroll-mt-24"
        >
          <h2
            className="font-serif"
            style={{
              fontSize: 19,
              fontWeight: 500,
              color: "#eef1f6",
              letterSpacing: "-0.015em",
            }}
          >
            {section.title}
          </h2>
          {section.body.map((paragraph, i) => (
            <p
              key={i}
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(216,212,235,0.78)",
                margin: 0,
              }}
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section
        className="flex flex-col gap-2 rounded-2xl p-4"
        style={{
          background: "rgba(255,185,84,0.06)",
          border: "0.5px solid rgba(255,185,84,0.18)",
        }}
      >
        <h2
          className="font-serif"
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: "#ffd99a",
            letterSpacing: "-0.01em",
          }}
        >
          Built by students
        </h2>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            color: "rgba(216,212,235,0.78)",
            margin: 0,
          }}
        >
          Mabuh-ai was designed and coded by BS Information Systems students
          of the College of Information and Communications Technology at
          West Visayas State University, as a class project for Mobile App
          Development. It is provided free of charge and is not a commercial
          product. If something feels off, please tell us — your feedback
          shapes the next iteration.
        </p>
        <p style={{ fontSize: 13, margin: 0, marginTop: 6 }}>
          <Link
            to="/terms"
            className="font-medium text-foreground underline decoration-[rgba(255,185,84,0.45)] underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Read the Terms & Conditions →
          </Link>
        </p>
      </section>
    </LegalShell>
  );
}

export default PrivacyPolicyPage;
