import { InsightCard, MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";

const MIN_ENTRIES_FOR_INSIGHTS = 5;
const WEEKEND_INSIGHT_MIN = 3;
const JOURNAL_INSIGHT_MIN = 4;

function isoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildEmptyInsight(): InsightCard {
  return {
    id: "insight-empty",
    title: "We'd love a few more check-ins first",
    body: "Once you've shared a handful of moods, gentle little patterns will start to show themselves here.",
    color: "#bcc2ff",
  };
}

export function deriveInsights(history: MoodEntry[]): InsightCard[] {
  if (history.length < MIN_ENTRIES_FOR_INSIGHTS) {
    return [buildEmptyInsight()];
  }

  const insights: InsightCard[] = [];

  // 1. Weekend vs weekday pattern
  const weekendScores: number[] = [];
  const weekdayScores: number[] = [];
  const scoreMap: Record<MoodType, number> = {
    stressed: 1,
    sad: 1,
    worried: 2,
    tired: 2,
    okay: 3,
    calm: 4,
    happy: 5,
  };
  history.forEach((entry) => {
    const day = new Date(entry.date + "T12:00:00").getDay();
    const score = scoreMap[entry.mood];
    if (day === 0 || day === 6) weekendScores.push(score);
    else weekdayScores.push(score);
  });
  if (weekendScores.length >= WEEKEND_INSIGHT_MIN && weekdayScores.length >= 1) {
    const avgWeekend = weekendScores.reduce((s, v) => s + v, 0) / weekendScores.length;
    const avgWeekday = weekdayScores.reduce((s, v) => s + v, 0) / weekdayScores.length;
    if (avgWeekend - avgWeekday >= 0.5) {
      insights.push({
        id: "insight-weekend",
        title: "Your weekends seem to soften you",
        body: "Your weekend check-ins sit a little higher than your weekdays. That little pause seems to be good for your heart.",
        color: "#6dba84",
      });
    } else if (avgWeekday - avgWeekend >= 0.5) {
      insights.push({
        id: "insight-weekday",
        title: "Your weekdays feel steadier",
        body: "Your weekday check-ins seem to sit a little higher than your weekends. There's something comforting in your routine.",
        color: "#8c9bff",
      });
    }
  }

  // 2. Journaling correlation
  const withJournal = history.filter((e) => Boolean(e.journal?.trim()));
  const withoutJournal = history.filter((e) => !e.journal?.trim());
  if (
    withJournal.length >= JOURNAL_INSIGHT_MIN &&
    withoutJournal.length >= JOURNAL_INSIGHT_MIN
  ) {
    const avgWith =
      withJournal.reduce((s, e) => s + scoreMap[e.mood], 0) / withJournal.length;
    const avgWithout =
      withoutJournal.reduce((s, e) => s + scoreMap[e.mood], 0) / withoutJournal.length;
    if (avgWith - avgWithout >= 0.4) {
      insights.push({
        id: "insight-journal",
        title: "Writing seems to lift your days",
        body: "On days when you write a little, your moods tend to be a touch calmer and brighter. The words may be doing some quiet work for you.",
        color: "#ffb954",
      });
    }
  }

  // 3. Most common mood
  const counts: Partial<Record<MoodType, number>> = {};
  history.forEach((e) => {
    counts[e.mood] = (counts[e.mood] ?? 0) + 1;
  });
  const ranked = (Object.entries(counts) as [MoodType, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [topMood, topCount] = ranked[0] ?? [];
  if (topMood) {
    const meta = getMoodMeta(topMood);
    const pct = Math.round((topCount / history.length) * 100);
    insights.push({
      id: "insight-dominant",
      title: `${meta.label.toLowerCase()} has been your most-visited color`,
      body: `About ${pct}% of your check-ins have rested in ${meta.label.toLowerCase()}. ${meta.definition} Whatever it means for you, it's been a real and valid place.`,
      color: meta.color,
    });
  }

  // 4. School-load correlation
  const withLoad = history.filter((e) => typeof e.schoolLoad === "number");
  if (withLoad.length >= JOURNAL_INSIGHT_MIN) {
    const highLoad = withLoad.filter((e) => (e.schoolLoad ?? 0) >= 4);
    const lowLoad = withLoad.filter((e) => (e.schoolLoad ?? 0) <= 2);
    if (highLoad.length >= 2 && lowLoad.length >= 2) {
      const avgHigh =
        highLoad.reduce((s, e) => s + scoreMap[e.mood], 0) / highLoad.length;
      const avgLow = lowLoad.reduce((s, e) => s + scoreMap[e.mood], 0) / lowLoad.length;
      if (avgLow - avgHigh >= 0.4) {
        insights.push({
          id: "insight-load",
          title: "Lighter school days feel a little brighter",
          body: "On lower-load days, your check-ins tend to sit a touch higher. Tiny pauses between heavy days seem to be kind to you.",
          color: "#e05c6e",
        });
      }
    }
  }

  // 5. Streak insight (last entry vs 14 days ago)
  if (history.length >= 7) {
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(-7);
    const older = sorted.slice(-14, -7);
    if (older.length >= 3) {
      const avgRecent = recent.reduce((s, e) => s + scoreMap[e.mood], 0) / recent.length;
      const avgOlder = older.reduce((s, e) => s + scoreMap[e.mood], 0) / older.length;
      if (avgRecent - avgOlder >= 0.6) {
        insights.push({
          id: "insight-trend-up",
          title: "Your days are softening this week",
          body: "Compared to the week before, your recent check-ins sit a little higher. Something gentle is working for you right now.",
          color: "#6dba84",
        });
      } else if (avgOlder - avgRecent >= 0.6) {
        insights.push({
          id: "insight-trend-down",
          title: "This week feels a little heavier",
          body: "Your recent check-ins have been sitting lower than the week before. A small ritual — a glass of water, a short walk, a single journal line — might be kind to try.",
          color: "#e0853c",
        });
      }
    }
  }

  if (insights.length === 0) {
    return [buildEmptyInsight()];
  }

  return insights;
}

export function deriveHistoryCoverDate(history: MoodEntry[]): string | null {
  if (history.length === 0) return null;
  return isoDate(new Date());
}
