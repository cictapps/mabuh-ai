export type CrisisLevel = "none" | "concern" | "imminent";

export interface CrisisSignal {
  level: Exclude<CrisisLevel, "none">;
  matched: string[];
  resourceKey: "ph-immediate" | "ph-hopeline" | "int-immediate";
}

export interface CrisisResource {
  key: "ph-immediate" | "ph-hopeline" | "int-immediate";
  title: string;
  lines: Array<{ label: string; number: string; tel?: string }>;
  note: string;
}

const IMMINENT_PATTERNS: RegExp[] = [
  /\b(kill\s*myself|end\s*my\s*life|take\s*my\s*life|end\s*it\s*all|don't\s*want\s*to\s*live|don't\s*want\s*to\s*be\s*alive|wanna\s*die|want\s*to\s*die|better\s*off\s*dead|commit\s*suicide|suicide\s*tonight|suicide\s*today|hang\s*myself|jump\s*off|cut\s*myself|overdose\s*on)\b/i,
  /\b(no\s*reason\s*to\s*live|nothing\s*to\s*live\s*for|can't\s*go\s*on\s*anymore)\b/i,
];

const CONCERN_PATTERNS: RegExp[] = [
  /\b(suicidal|self[-\s]*harm|self\s*hurt|cutting|burning\s*myself|harm\s*myself|wish\s*i\s*was\s*dead|hate\s*myself|hopeless|worthless|no\s*way\s*out)\b/i,
  /\b(suicide|crisis|breakdown|panic\s*attack\s*every\s*day|can't\s*cope|out\s*of\s*control)\b/i,
];

const TEST_MESSAGES = new Set([
  "test",
  "testing",
  "test message",
  "hello test",
  "[dev ping]",
  "ping",
]);

function looksLikeTestMessage(text: string): boolean {
  const normalised = text.trim().toLowerCase();
  if (TEST_MESSAGES.has(normalised)) return true;
  if (/^(test|ping|hello|hi|hey)[\s.!]*$/i.test(normalised)) return true;
  return false;
}

function findMatches(text: string, patterns: RegExp[]): string[] {
  const matched: string[] = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[0]) matched.push(m[0].trim());
  }
  return matched;
}

export function detectCrisis(message: string): CrisisSignal | null {
  if (!message || typeof message !== "string") return null;
  const trimmed = message.trim();
  if (!trimmed) return null;
  if (looksLikeTestMessage(trimmed)) return null;

  const imminent = findMatches(trimmed, IMMINENT_PATTERNS);
  if (imminent.length > 0) {
    return {
      level: "imminent",
      matched: imminent,
      resourceKey: "ph-immediate",
    };
  }

  const concern = findMatches(trimmed, CONCERN_PATTERNS);
  if (concern.length > 0) {
    return {
      level: "concern",
      matched: concern,
      resourceKey: "ph-hopeline",
    };
  }

  return null;
}

export const CRISIS_RESOURCES: Record<CrisisResource["key"], CrisisResource> = {
  "ph-immediate": {
    key: "ph-immediate",
    title: "If you're in immediate danger",
    lines: [
      { label: "National Emergency (Philippines)", number: "911", tel: "tel:911" },
      { label: "NCMH Crisis Hotline (toll-free, 24/7)", number: "1553", tel: "tel:1553" },
      {
        label: "DOH Hopeline (Globe, 24/7)",
        number: "0917-558-4673",
        tel: "tel:09175584673",
      },
    ],
    note:
      "Please reach out to a trusted person nearby or call one of the lines above. " +
      "You don't have to face this alone.",
  },
  "ph-hopeline": {
    key: "ph-hopeline",
    title: "Support is one call away",
    lines: [
      { label: "NCMH Crisis Hotline (toll-free, 24/7)", number: "1553", tel: "tel:1553" },
      {
        label: "DOH Hopeline (Globe, 24/7)",
        number: "0917-558-4673",
        tel: "tel:09175584673",
      },
      { label: "Hopeline Landline", number: "(02) 804-4673", tel: "tel:0280446730" },
    ],
    note: "It can help to talk to someone. These lines are free, confidential, and available around the clock.",
  },
  "int-immediate": {
    key: "int-immediate",
    title: "International crisis resources",
    lines: [
      { label: "Find a helpline (international directory)", number: "findahelpline.com" },
      { label: "US 988 Suicide & Crisis Lifeline", number: "988" },
      { label: "US Crisis Text Line", number: "Text HOME to 741741" },
    ],
    note: "If you're outside the Philippines, please contact local emergency services or a helpline in your country.",
  },
};

export function resourceForKey(key: CrisisResource["key"]): CrisisResource {
  return CRISIS_RESOURCES[key];
}
