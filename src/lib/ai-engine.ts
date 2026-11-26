import crypto from "crypto";

export interface GoalForScoring {
  dailyGoalId: string;
  title: string;
  isExtra: boolean;
  weeklyGoalId?: string | null;
  weeklyGoalTitle?: string;
  reflection?: {
    didText: string;
    blockedText: string;
    learnedText: string;
    selfRating?: number | null;
  } | null;
}

export interface WeeklyGoalData {
  id: string;
  title: string;
  category: string;
  weight: number;
}

export interface DailyScoredResult {
  dailyGoalId: string;
  score: number; // 0 - 100
  status: "achieved" | "partial" | "missed" | "no_evidence";
  reason: string;
  confidence: "high" | "low";
}

export interface WeeklyGoalRollup {
  goalId: string;
  title: string;
  category: string;
  weight: number;
  rolledUpScore: number;
  status: "achieved" | "partial" | "missed" | "no_evidence";
  reason: string;
  dailyGoalCount: number;
  dailyScores: DailyScoredResult[];
}

export interface WeeklyCalculationBreakdown {
  formula: string;
  totalWeight: number;
  weightedScoreSum: number;
  calculatedPercent: number;
  steps: {
    goalId: string;
    title: string;
    weight: number;
    score: number;
    product: number;
  }[];
}

export interface AIAnalysisNarrative {
  summary: string;
  achieved: string[];
  missed: { goal_id: string; why: string }[];
  patterns: string[];
  learnings: { theme: string; points: string[] }[];
  next_week_suggestions: string[];
}

/**
 * Truncate student reflection text to 2,000 characters per field to adhere to PRD edge case
 */
export function sanitizeReflectionField(text?: string | null): string {
  if (!text) return "";
  return text.trim().slice(0, 2000);
}

/**
 * Hash input for audit trail (PRD requirement)
 */
export function generateInputHash(data: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

/**
 * Evaluate single daily goal against reflection evidence
 */
export function scoreDailyGoalEvidence(goal: GoalForScoring): DailyScoredResult {
  const ref = goal.reflection;

  if (!ref || (!ref.didText && !ref.blockedText && !ref.learnedText)) {
    return {
      dailyGoalId: goal.dailyGoalId,
      score: 0,
      status: "no_evidence",
      reason: "No reflection was logged for this daily goal.",
      confidence: "high",
    };
  }

  const did = sanitizeReflectionField(ref.didText);
  const blocked = sanitizeReflectionField(ref.blockedText);
  const learned = sanitizeReflectionField(ref.learnedText);
  const totalLength = did.length + blocked.length + learned.length;

  const isLowConfidence = totalLength < 20;

  // Evidence heuristics based on keywords and self rating
  let baseScore = 50;

  if (ref.selfRating) {
    baseScore = ref.selfRating * 20; // 1 -> 20, 3 -> 60, 5 -> 100
  }

  const didLower = did.toLowerCase();
  const blockedLower = blocked.toLowerCase();

  // Positive completion indicators
  const completeIndicators = [
    "completed", "finished", "done", "solved", "implemented", "shipped", "built", "passed", "succeeded", "deployed"
  ];
  const partialIndicators = [
    "partially", "half", "started", "in progress", "stuck", "almost", "some", "attempted", "trying"
  ];
  const blockedIndicators = [
    "blocked", "failed", "couldn't", "could not", "no time", "sick", "missed", "delayed", "issue", "bug"
  ];

  let positiveHits = 0;
  for (const word of completeIndicators) {
    if (didLower.includes(word)) positiveHits++;
  }

  let partialHits = 0;
  for (const word of partialIndicators) {
    if (didLower.includes(word) || blockedLower.includes(word)) partialHits++;
  }

  let blockerHits = 0;
  for (const word of blockedIndicators) {
    if (blockedLower.includes(word) && !blockedLower.includes("none") && !blockedLower.includes("nothing")) {
      blockerHits++;
    }
  }

  if (positiveHits > 0) baseScore += Math.min(25, positiveHits * 10);
  if (partialHits > 0) baseScore -= 10;
  if (blockerHits > 0) baseScore -= Math.min(30, blockerHits * 12);

  // If did text explicitly states "nothing" or empty
  if (didLower === "nothing" || didLower === "didn't do" || didLower === "none") {
    baseScore = 15;
  }

  // Bound score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  let status: "achieved" | "partial" | "missed" | "no_evidence" = "missed";
  if (finalScore >= 80) {
    status = "achieved";
  } else if (finalScore >= 40) {
    status = "partial";
  } else {
    status = "missed";
  }

  // Quote evidence in reason
  let snippet = did.slice(0, 80);
  if (snippet.length < did.length) snippet += "...";
  
  let reason = "";
  if (status === "achieved") {
    reason = `Evidence demonstrates objective completion: "${snippet || 'Tasks finished successfully'}".`;
  } else if (status === "partial") {
    const blockSnippet = blocked && !blockedLower.includes("none") ? ` Blocker noted: "${blocked.slice(0, 50)}"` : "";
    reason = `Partial progress logged ("${snippet}").${blockSnippet}`;
  } else {
    reason = `Goal unmet based on reflection: "${blocked.slice(0, 60) || snippet || 'Insufficient progress logged'}".`;
  }

  return {
    dailyGoalId: goal.dailyGoalId,
    score: finalScore,
    status,
    reason,
    confidence: isLowConfidence ? "low" : "high",
  };
}

/**
 * Roll up daily goals into weekly goals and compute weekly percentage strictly in code
 */
export function rollUpWeeklyGoals(
  weeklyGoals: WeeklyGoalData[],
  dailyGoals: GoalForScoring[],
  dailyScores: Map<string, DailyScoredResult>
): {
  rollups: WeeklyGoalRollup[];
  breakdown: WeeklyCalculationBreakdown;
  overallPercent: number;
} {
  // If no weekly goals set (PRD edge case: student sets no weekly goals)
  if (weeklyGoals.length === 0) {
    return {
      rollups: [],
      breakdown: {
        formula: "No weekly goals were set for this week",
        totalWeight: 0,
        weightedScoreSum: 0,
        calculatedPercent: 0,
        steps: [],
      },
      overallPercent: 0,
    };
  }

  const rollups: WeeklyGoalRollup[] = [];
  const steps: WeeklyCalculationBreakdown["steps"] = [];

  let weightedScoreSum = 0;
  let totalWeight = 0;

  for (const wg of weeklyGoals) {
    const linkedDailies = dailyGoals.filter((d) => d.weeklyGoalId === wg.id);
    const count = linkedDailies.length;

    let rolledUpScore = 0;
    let reason = "";
    let status: "achieved" | "partial" | "missed" | "no_evidence" = "missed";
    const dailyScoreList: DailyScoredResult[] = [];

    if (count === 0) {
      // PRD Section 5: "A weekly goal with no daily goals scores 0."
      rolledUpScore = 0;
      status = "no_evidence";
      reason = "No daily actions were linked or planned for this weekly goal.";
    } else {
      let sum = 0;
      for (const d of linkedDailies) {
        const scoreObj = dailyScores.get(d.dailyGoalId) || {
          dailyGoalId: d.dailyGoalId,
          score: 0,
          status: "no_evidence" as const,
          reason: "Unreflected goal counts as no evidence.",
          confidence: "high" as const,
        };
        dailyScoreList.push(scoreObj);
        sum += scoreObj.score;
      }
      rolledUpScore = Math.min(100, Math.round(sum / count));

      if (rolledUpScore >= 80) status = "achieved";
      else if (rolledUpScore >= 40) status = "partial";
      else status = "missed";

      const dailyQuotes = dailyScoreList
        .map((s) => s.reason)
        .slice(0, 2)
        .join(" | ");
      reason = `Average of ${count} daily reflection(s): ${dailyQuotes}`;
    }

    const weight = Math.max(1, Math.min(3, wg.weight || 1));
    const product = weight * rolledUpScore;

    weightedScoreSum += product;
    totalWeight += weight;

    rollups.push({
      goalId: wg.id,
      title: wg.title,
      category: wg.category,
      weight,
      rolledUpScore,
      status,
      reason,
      dailyGoalCount: count,
      dailyScores: dailyScoreList,
    });

    steps.push({
      goalId: wg.id,
      title: wg.title,
      weight,
      score: rolledUpScore,
      product,
    });
  }

  const calculatedPercent = totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 10) / 10 : 0;

  const formula = totalWeight > 0
    ? `(${steps.map((s) => `${s.weight} × ${s.score}`).join(" + ")}) ÷ ${totalWeight} = ${calculatedPercent}%`
    : "No goals with weight to calculate";

  return {
    rollups,
    breakdown: {
      formula,
      totalWeight,
      weightedScoreSum,
      calculatedPercent,
      steps,
    },
    overallPercent: calculatedPercent,
  };
}

/**
 * Generates the weekly narrative using structured clustering
 */
export async function generateWeeklyNarrative(params: {
  weekStart: string;
  overallPercent: number;
  rollups: WeeklyGoalRollup[];
  allDailyGoals: GoalForScoring[];
}): Promise<AIAnalysisNarrative> {
  const { weekStart, overallPercent, rollups, allDailyGoals } = params;

  // Check if Anthropic API key is available
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith("sk-")) {
    try {
      const response = await callClaudeForNarrative(params);
      if (response) return response;
    } catch (err) {
      console.warn("Claude API call failed, falling back to deterministic engine:", err);
    }
  }

  // Deterministic high-quality narrative synthesis
  const achievedGoals = rollups.filter((r) => r.status === "achieved");
  const missedGoals = rollups.filter((r) => r.status === "missed" || r.status === "no_evidence");
  const partialGoals = rollups.filter((r) => r.status === "partial");

  const achievedTitles = achievedGoals.map((g) => `${g.title} (${g.category}) - ${g.reason}`);
  const missedList = missedGoals.map((g) => ({
    goal_id: g.goalId,
    why: g.dailyGoalCount === 0
      ? "No daily goals linked during the week"
      : g.reason,
  }));

  // Identify patterns
  const patterns: string[] = [];
  const categoryMisses: Record<string, number> = {};
  for (const m of missedGoals) {
    categoryMisses[m.category] = (categoryMisses[m.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(categoryMisses)) {
    if (count > 0) {
      patterns.push(`Encountered resistance or blockers primarily in ${cat} goals (${count} missed/unaddressed).`);
    }
  }

  const noEvidenceDailies = allDailyGoals.filter((d) => !d.reflection || !d.reflection.didText);
  if (noEvidenceDailies.length > 0) {
    patterns.push(`${noEvidenceDailies.length} daily task(s) had unwritten reflections, dropping weekly rollup evidence.`);
  } else {
    patterns.push("Consistent daily reflections recorded across all logged days.");
  }

  // Extract learnings and cluster into 3 to 5 themes
  const extractedLearnings: { theme: string; points: string[] }[] = [];
  const techPoints: string[] = [];
  const workflowPoints: string[] = [];
  const mindsetPoints: string[] = [];

  for (const d of allDailyGoals) {
    const l = d.reflection?.learnedText?.trim();
    if (l && l.length > 5) {
      const lower = l.toLowerCase();
      if (lower.includes("code") || lower.includes("bug") || lower.includes("api") || lower.includes("db") || lower.includes("query") || lower.includes("test")) {
        techPoints.push(l);
      } else if (lower.includes("time") || lower.includes("plan") || lower.includes("focus") || lower.includes("schedule") || lower.includes("break")) {
        workflowPoints.push(l);
      } else {
        mindsetPoints.push(l);
      }
    }
  }

  if (techPoints.length > 0) {
    extractedLearnings.push({ theme: "Technical & Problem Solving", points: techPoints.slice(0, 3) });
  }
  if (workflowPoints.length > 0) {
    extractedLearnings.push({ theme: "Pacing & Execution Discipline", points: workflowPoints.slice(0, 3) });
  }
  if (mindsetPoints.length > 0 || extractedLearnings.length === 0) {
    extractedLearnings.push({
      theme: "Self-Regulation & Habits",
      points: mindsetPoints.length > 0 ? mindsetPoints.slice(0, 3) : ["Consistent reflection is critical for discovering bottleneck patterns early."],
    });
  }

  // 3 Actionable suggestions for next week
  const next_week_suggestions: string[] = [];
  if (missedGoals.length > 0) {
    next_week_suggestions.push(`Consider using 'Carry-forward' on '${missedGoals[0].title}' to allocate early Monday focus.`);
  } else {
    next_week_suggestions.push("Maintain current velocity and explore slightly higher-weight challenges in your strongest category.");
  }

  if (noEvidenceDailies.length > 0) {
    next_week_suggestions.push("Set a daily 8:00 PM reminder to log daily reflection within the 48-hour backfill grace window.");
  } else {
    next_week_suggestions.push("Break large weekly goals into concrete 45-minute daily micro-deliverables for higher clarity.");
  }

  next_week_suggestions.push("Protect uninterrupted deep work blocks specifically for priority weight-3 objectives.");

  const summary = `Student achieved an overall ${overallPercent}% completion across ${rollups.length} weekly goals for the week of ${weekStart}. Completed ${achievedGoals.length} goal(s), with ${partialGoals.length} partial and ${missedGoals.length} missed.`;

  return {
    summary,
    achieved: achievedTitles.length > 0 ? achievedTitles : ["Foundational progress logged across scheduled days."],
    missed: missedList,
    patterns,
    learnings: extractedLearnings,
    next_week_suggestions,
  };
}

/**
 * Anthropic API Integration wrapper
 */
async function callClaudeForNarrative(params: {
  weekStart: string;
  overallPercent: number;
  rollups: WeeklyGoalRollup[];
  allDailyGoals: GoalForScoring[];
}): Promise<AIAnalysisNarrative | null> {
  const prompt = `You are the AI Reflection Analyst. You judge evidence and produce auditable feedback.
Design rule: The user's percentage is ALREADY computed by code (${params.overallPercent}%). Do not recalculate or alter it.
Evaluate this student's week starting ${params.weekStart}.

Goals and scores:
${JSON.stringify(params.rollups, null, 2)}

Daily entries and reflections:
${JSON.stringify(params.allDailyGoals, null, 2)}

Respond with STRICT JSON only matching this schema:
{
  "summary": "2-3 sentences overview",
  "achieved": ["quote reflection evidence and title"],
  "missed": [{"goal_id": "...", "why": "exact quote from blocker or missing reflection"}],
  "patterns": ["2-3 observed trends like days missed or blocker patterns"],
  "learnings": [{"theme": "Theme title", "points": ["learned item 1", "learned item 2"]}],
  "next_week_suggestions": ["3 concrete actionable tips"]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API returned status ${res.status}`);
  }

  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) return null;

  // Extract JSON
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]) as AIAnalysisNarrative;
  }
  return null;
}

