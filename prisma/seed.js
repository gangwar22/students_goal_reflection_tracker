const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing
  await prisma.dispute.deleteMany();
  await prisma.goalScore.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.learning.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.dailyGoal.deleteMany();
  await prisma.weeklyGoal.deleteMany();
  await prisma.week.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.systemSetting.deleteMany();

  // Create Settings
  await prisma.systemSetting.create({
    data: {
      minWeeklyGoals: 3,
      maxWeeklyGoals: 10,
      lockTime: "Monday 23:59",
      reminderTime: "20:00",
      scoreThresholdAchieved: 80,
      scoreThresholdPartial: 40,
      promptVersion: "v1.2",
      aiProvider: "auto",
      leaderboardEnabled: true,
    },
  });

  // Create Batches
  const batch1 = await prisma.batch.create({
    data: {
      name: "Full Stack Web Cohort 2026-A",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-12-31"),
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      name: "AI & ML Cohort 2026-B",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-01-31"),
    },
  });

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedStudentPassword = await bcrypt.hash("student123", 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Program Director Admin",
      email: "admin@tracker.com",
      passwordHash: hashedAdminPassword,
      role: "admin",
      timezone: "Asia/Kolkata",
    },
  });

  // Academic Mentor User
  const hashedMentorPassword = await bcrypt.hash("mentor123", 10);
  const mentor = await prisma.user.create({
    data: {
      name: "Sarah Jenkins (Academic Mentor)",
      email: "mentor@tracker.com",
      passwordHash: hashedMentorPassword,
      role: "mentor",
      timezone: "Asia/Kolkata",
    },
  });

  // Student 1: Alex Chen (High consistency, 84%)
  const alex = await prisma.user.create({
    data: {
      name: "Alex Chen",
      email: "alex@student.com",
      passwordHash: hashedStudentPassword,
      role: "student",
      batchId: batch1.id,
      timezone: "Asia/Kolkata",
    },
  });

  // Student 2: Maya Patel (Moderate 64%, active dispute)
  const maya = await prisma.user.create({
    data: {
      name: "Maya Patel",
      email: "maya@student.com",
      passwordHash: hashedStudentPassword,
      role: "student",
      batchId: batch1.id,
      timezone: "Asia/Kolkata",
    },
  });

  // Student 3: Rohit Sharma (At-risk, <40% score, 3 days inactive)
  const rohit = await prisma.user.create({
    data: {
      name: "Rohit Sharma",
      email: "rohit@student.com",
      passwordHash: hashedStudentPassword,
      role: "student",
      batchId: batch2.id,
      timezone: "Asia/Kolkata",
    },
  });

  // Student 4: Samantha Reed (Recent joiner)
  const sam = await prisma.user.create({
    data: {
      name: "Samantha Reed",
      email: "sam@student.com",
      passwordHash: hashedStudentPassword,
      role: "student",
      batchId: batch2.id,
      timezone: "Asia/Kolkata",
    },
  });

  // Current week: Nov 16 to Nov 22, 2026
  const weekStart = "2026-11-16";
  const weekEnd = "2026-11-22";

  // Create current Week for Alex
  const alexWeek = await prisma.week.create({
    data: {
      userId: alex.id,
      weekStart,
      weekEnd,
      status: "analysed",
      lockedAt: new Date("2026-11-16T18:29:59Z"),
    },
  });

  // Alex's Weekly Goals (4 goals, weights 1 to 3)
  const g1 = await prisma.weeklyGoal.create({
    data: {
      weekId: alexWeek.id,
      userId: alex.id,
      title: "Master PostgreSQL Indexing and Query Optimizations",
      category: "Technical",
      weight: 3,
      description: "Deep dive into EXPLAIN ANALYZE, B-tree vs GIN indexes, and slow query logging.",
    },
  });

  const g2 = await prisma.weeklyGoal.create({
    data: {
      weekId: alexWeek.id,
      userId: alex.id,
      title: "Complete System Design Case Study: Rate Limiting",
      category: "Academic",
      weight: 2,
      description: "Draft architecture doc for token bucket and sliding window rate limiters in Redis.",
    },
  });

  const g3 = await prisma.weeklyGoal.create({
    data: {
      weekId: alexWeek.id,
      userId: alex.id,
      title: "Update Tech Resume & Apply to 5 Senior Roles",
      category: "Career",
      weight: 2,
      description: "Polish bullet points with metrics and send tailored applications.",
    },
  });

  const g4 = await prisma.weeklyGoal.create({
    data: {
      weekId: alexWeek.id,
      userId: alex.id,
      title: "Daily Morning 5km Run or Gym Session",
      category: "Health",
      weight: 1,
      description: "Keep physical fitness and energy high before coding sessions.",
    },
  });

  // Daily goals for Alex
  const dg1 = await prisma.dailyGoal.create({
    data: {
      userId: alex.id,
      weeklyGoalId: g1.id,
      goalDate: "2026-11-16",
      title: "Benchmark slow query with and without B-Tree index",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: dg1.id,
      didText: "Set up 1M rows test table, ran EXPLAIN ANALYZE. Query execution dropped from 1420ms to 4.2ms after index.",
      blockedText: "Took 30 mins to generate dummy data script in TypeScript.",
      learnedText: "Composite indexes order matters significantly: column with highest selectivity must come first.",
      selfRating: 5,
    },
  });

  const dg2 = await prisma.dailyGoal.create({
    data: {
      userId: alex.id,
      weeklyGoalId: g1.id,
      goalDate: "2026-11-17",
      title: "Study GIN indexes for JSONB search operations",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: dg2.id,
      didText: "Completed official docs reading and implemented jsonb_path_ops index on user attributes table.",
      blockedText: "None. Clear documentation.",
      learnedText: "jsonb_ops supports all json operators while jsonb_path_ops is smaller and faster for @> containment queries.",
      selfRating: 5,
    },
  });

  const dg3 = await prisma.dailyGoal.create({
    data: {
      userId: alex.id,
      weeklyGoalId: g2.id,
      goalDate: "2026-11-17",
      title: "Diagram sliding window log vs sliding window counter",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: dg3.id,
      didText: "Drew architecture diagram comparing memory consumption of Redis sorted sets vs approximate counter.",
      blockedText: "Memory estimation calculations for 10M DAU required extra research.",
      learnedText: "Sliding window counter has 0.05% edge-case approximation error but saves 80% memory compared to sorted sets.",
      selfRating: 4,
    },
  });

  const dg4 = await prisma.dailyGoal.create({
    data: {
      userId: alex.id,
      weeklyGoalId: g3.id,
      goalDate: "2026-11-18",
      title: "Apply to 3 companies with tailored cover letters",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: dg4.id,
      didText: "Applied to Stripe and Vercel. Third application pending portfolio writeup review.",
      blockedText: "Portfolio site needed update for recent Redis caching project.",
      learnedText: "Recruiters respond much faster when GitHub PR links are embedded in portfolio case studies.",
      selfRating: 4,
    },
  });

  // Calculate Alex report
  const alexReportJson = {
    week_start: weekStart,
    overall_percent: 85,
    breakdown: {
      formula: "(3 × 95 + 2 × 80 + 2 × 75 + 1 × 80) ÷ 8 = 85%",
      totalWeight: 8,
      weightedScoreSum: 680,
      calculatedPercent: 85,
      steps: [
        { goalId: g1.id, title: g1.title, weight: 3, score: 95, product: 285 },
        { goalId: g2.id, title: g2.title, weight: 2, score: 80, product: 160 },
        { goalId: g3.id, title: g3.title, weight: 2, score: 75, product: 150 },
        { goalId: g4.id, title: g4.title, weight: 1, score: 80, product: 80 },
      ],
    },
    goals: [
      { goal_id: g1.id, title: g1.title, score: 95, status: "achieved", reason: "Substantial concrete evidence: benchmarked 1M rows and studied GIN indexing.", weight: 3, category: "Technical" },
      { goal_id: g2.id, title: g2.title, score: 80, status: "achieved", reason: "Architectural comparison completed and memory calculations verified.", weight: 2, category: "Academic" },
      { goal_id: g3.id, title: g3.title, score: 75, status: "partial", reason: "2 of 3 applications submitted; 1 delayed for portfolio update.", weight: 2, category: "Career" },
      { goal_id: g4.id, title: g4.title, score: 80, status: "achieved", reason: "Morning workout habits maintained consistently.", weight: 1, category: "Health" },
    ],
    achieved: [
      "Master PostgreSQL Indexing (95%) - Evidence demonstrates query speedup from 1420ms to 4.2ms.",
      "Complete System Design Case Study (80%) - Clear trade-off analysis between sliding window log and counter.",
    ],
    missed: [
      { goal_id: g3.id, why: "Third application delayed waiting on portfolio project link polishing." }
    ],
    patterns: [
      "High consistency: reflections submitted everyday before 8 PM.",
      "Technical deep work is consistently scored highest (>90%).",
    ],
    learnings: [
      { theme: "Database Performance", points: ["GIN indexes vs B-Tree for JSONB", "Index column order in composite indexes"] },
      { theme: "System Architecture", points: ["Redis sliding window counter memory savings"] },
    ],
    next_week_suggestions: [
      "Finalize remaining job applications early on Monday.",
      "Consider writing a public tech blog post sharing the PostgreSQL benchmark results.",
      "Maintain the daily morning physical exercise routine.",
    ],
    summary: "Outstanding weekly execution with 85% completion across 4 weighted goals. Technical focus was especially rigorous with tangible benchmarking evidence.",
  };

  const alexReport = await prisma.weeklyReport.create({
    data: {
      userId: alex.id,
      weekId: alexWeek.id,
      overallPercent: 85,
      reportJson: JSON.stringify(alexReportJson),
      model: "claude-3-5-sonnet",
      promptVersion: "v1.2",
      inputHash: "a1b2c3d4e5f60718",
      status: "done",
    },
  });

  // Seed goal scores for Alex
  const alexGs1 = await prisma.goalScore.create({
    data: {
      dailyGoalId: dg1.id,
      reportId: alexReport.id,
      score: 95,
      status: "achieved",
      reason: "Execution dropped from 1420ms to 4.2ms with B-tree index.",
      confidence: "high",
    },
  });

  const alexGs2 = await prisma.goalScore.create({
    data: {
      dailyGoalId: dg2.id,
      reportId: alexReport.id,
      score: 95,
      status: "achieved",
      reason: "Implemented jsonb_path_ops index with solid comprehension.",
      confidence: "high",
    },
  });

  // Seed Learnings for Alex
  await prisma.learning.create({
    data: {
      userId: alex.id,
      source: "daily",
      theme: "Databases",
      text: "Composite indexes order matters: column with highest selectivity must come first.",
      tags: "sql, postgresql, indexing, optimization",
      date: "2026-11-16",
    },
  });

  await prisma.learning.create({
    data: {
      userId: alex.id,
      source: "daily",
      theme: "Distributed Systems",
      text: "Sliding window counter has 0.05% edge-case approximation error but saves 80% memory compared to sorted sets.",
      tags: "redis, rate-limiting, system-design",
      date: "2026-11-17",
    },
  });

  // Seed Maya (Moderate + open dispute)
  const mayaWeek = await prisma.week.create({
    data: {
      userId: maya.id,
      weekStart,
      weekEnd,
      status: "analysed",
      lockedAt: new Date("2026-11-16T18:29:59Z"),
    },
  });

  const mg1 = await prisma.weeklyGoal.create({
    data: {
      weekId: mayaWeek.id,
      userId: maya.id,
      title: "Build Authentication Microservice with JWT and OAuth",
      category: "Technical",
      weight: 3,
    },
  });

  const mg2 = await prisma.weeklyGoal.create({
    data: {
      weekId: mayaWeek.id,
      userId: maya.id,
      title: "Write 10 Unit Tests for Auth Middleware",
      category: "Technical",
      weight: 2,
    },
  });

  const mdg1 = await prisma.dailyGoal.create({
    data: {
      userId: maya.id,
      weeklyGoalId: mg1.id,
      goalDate: "2026-11-16",
      title: "Implement refresh token rotation mechanism",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: mdg1.id,
      didText: "Wrote token rotation logic and redis blacklist check. Tokens are invalidated correctly.",
      blockedText: "Cookie samesite and secure flag issues on localhost took 2 hours.",
      learnedText: "Refresh token rotation must invalidate the entire token family if a reused token is detected.",
      selfRating: 4,
    },
  });

  const mdg2 = await prisma.dailyGoal.create({
    data: {
      userId: maya.id,
      weeklyGoalId: mg2.id,
      goalDate: "2026-11-17",
      title: "Unit tests with Jest for token expiry and tampering",
      isExtra: false,
    },
  });
  await prisma.reflection.create({
    data: {
      dailyGoalId: mdg2.id,
      didText: "Wrote 8 tests covering expired tokens, missing bearer token, and forged signatures.",
      blockedText: "Stuck mocking time for token expiration in Jest.",
      learnedText: "jest.useFakeTimers() is essential for testing token clock tolerances.",
      selfRating: 3,
    },
  });

  const mayaReport = await prisma.weeklyReport.create({
    data: {
      userId: maya.id,
      weekId: mayaWeek.id,
      overallPercent: 64,
      reportJson: JSON.stringify({
        week_start: weekStart,
        overall_percent: 64,
        breakdown: {
          formula: "(3 × 70 + 2 × 55) ÷ 5 = 64%",
          totalWeight: 5,
          weightedScoreSum: 320,
          calculatedPercent: 64,
          steps: [
            { goalId: mg1.id, title: mg1.title, weight: 3, score: 70, product: 210 },
            { goalId: mg2.id, title: mg2.title, weight: 2, score: 55, product: 110 },
          ],
        },
        goals: [
          { goal_id: mg1.id, title: mg1.title, score: 70, status: "partial", reason: "Token rotation built but OAuth not yet connected.", weight: 3, category: "Technical" },
          { goal_id: mg2.id, title: mg2.title, score: 55, status: "partial", reason: "Wrote 8 of 10 tests, encountered timer mock issues.", weight: 2, category: "Technical" },
        ],
        achieved: ["Auth Token Rotation partially implemented with Redis revocation."],
        missed: [{ goal_id: mg2.id, why: "8/10 unit tests completed instead of target 10." }],
        patterns: ["Time lost debugging local cookie security configurations."],
        learnings: [{ theme: "Security", points: ["Token family revocation in refresh token rotation"] }],
        next_week_suggestions: ["Carry forward OAuth integration to complete microservice."],
        summary: "Solid start on authentication, achieved 64% completion.",
      }),
      model: "claude-3-5-sonnet",
      promptVersion: "v1.2",
      inputHash: "m1a2y3a4p5a6t7e8",
      status: "done",
    },
  });

  const mayaScore2 = await prisma.goalScore.create({
    data: {
      dailyGoalId: mdg2.id,
      reportId: mayaReport.id,
      score: 55,
      status: "partial",
      reason: "8 out of 10 tests written, time mocking blocker.",
      confidence: "high",
    },
  });

  // Create an open dispute for Maya
  await prisma.dispute.create({
    data: {
      goalScoreId: mayaScore2.id,
      userId: maya.id,
      comment: "I wrote 8 comprehensive integration tests with Jest that covered 95% branch coverage! The AI scored it 55% only because I missed 2 tests. That feels overly harsh for 95% coverage.",
      status: "pending",
    },
  });

  // Seed Rohit (At-risk: score 32% this week, 35% last week)
  const rohitWeek = await prisma.week.create({
    data: {
      userId: rohit.id,
      weekStart,
      weekEnd,
      status: "analysed",
      lockedAt: new Date("2026-11-16T18:29:59Z"),
    },
  });

  const rg1 = await prisma.weeklyGoal.create({
    data: {
      weekId: rohitWeek.id,
      userId: rohit.id,
      title: "Dockerize Frontend and Backend with Docker Compose",
      category: "Technical",
      weight: 3,
    },
  });

  const rg2 = await prisma.weeklyGoal.create({
    data: {
      weekId: rohitWeek.id,
      userId: rohit.id,
      title: "Write documentation and setup guide",
      category: "Academic",
      weight: 2,
    },
  });

  // Rohit has no daily goals or reflections!
  await prisma.weeklyReport.create({
    data: {
      userId: rohit.id,
      weekId: rohitWeek.id,
      overallPercent: 0,
      reportJson: JSON.stringify({
        week_start: weekStart,
        overall_percent: 0,
        breakdown: {
          formula: "(3 × 0 + 2 × 0) ÷ 5 = 0%",
          totalWeight: 5,
          weightedScoreSum: 0,
          calculatedPercent: 0,
          steps: [
            { goalId: rg1.id, title: rg1.title, weight: 3, score: 0, product: 0 },
            { goalId: rg2.id, title: rg2.title, weight: 2, score: 0, product: 0 },
          ],
        },
        goals: [
          { goal_id: rg1.id, title: rg1.title, score: 0, status: "no_evidence", reason: "No daily goals or reflections logged.", weight: 3, category: "Technical" },
          { goal_id: rg2.id, title: rg2.title, score: 0, status: "no_evidence", reason: "No daily goals or reflections logged.", weight: 2, category: "Academic" },
        ],
        achieved: [],
        missed: [
          { goal_id: rg1.id, why: "No reflections logged for entire week." },
          { goal_id: rg2.id, why: "No reflections logged for entire week." },
        ],
        patterns: ["Zero entries logged for 5 consecutive days."],
        learnings: [],
        next_week_suggestions: ["Schedule 1-on-1 check-in with program mentor."],
        summary: "Zero progress recorded. Student has been inactive for 3+ days and requires immediate faculty outreach.",
      }),
      model: "claude-3-5-sonnet",
      promptVersion: "v1.2",
      inputHash: "r1o2h3i4t5s6h7a8",
      status: "done",
    },
  });

  // Past week reports for monthly rollup demo
  const pastWeekStart = "2026-11-09";
  const pastWeekEnd = "2026-11-15";

  const alexPastWeek = await prisma.week.create({
    data: {
      userId: alex.id,
      weekStart: pastWeekStart,
      weekEnd: pastWeekEnd,
      status: "analysed",
    },
  });

  await prisma.weeklyReport.create({
    data: {
      userId: alex.id,
      weekId: alexPastWeek.id,
      overallPercent: 78,
      reportJson: JSON.stringify({
        week_start: pastWeekStart,
        overall_percent: 78,
        breakdown: {
          formula: "78%",
          totalWeight: 6,
          weightedScoreSum: 468,
          calculatedPercent: 78,
          steps: [],
        },
        goals: [
          { goal_id: "pg1", title: "Implement Redis Caching Layer", score: 85, status: "achieved", reason: "Cache hit ratio improved to 88%.", weight: 3, category: "Technical" },
          { goal_id: "pg2", title: "Read Clean Code chapters 1-4", score: 70, status: "partial", reason: "Read 3 of 4 chapters.", weight: 2, category: "Academic" },
        ],
        achieved: ["Redis Caching Layer (85%)"],
        missed: [],
        patterns: ["Strong mid-week focus."],
        learnings: [{ theme: "Caching", points: ["Cache stampede prevention using probabilistic early expiration"] }],
        next_week_suggestions: ["Focus on database index fundamentals."],
        summary: "Strong performance with 78% completion.",
      }),
      model: "claude-3-5-sonnet",
      promptVersion: "v1.2",
      inputHash: "p1a2s3t4w5e6e7k8",
      status: "done",
      generatedAt: new Date("2026-11-15T23:30:00Z"),
    },
  });

  // Alex Monthly Report for 2026-11
  await prisma.monthlyReport.create({
    data: {
      userId: alex.id,
      month: "2026-11",
      overallPercent: 81.5,
      weekPercentsJson: JSON.stringify([
        { weekStart: "2026-11-09", weekEnd: "2026-11-15", percent: 78, goalCount: 2 },
        { weekStart: "2026-11-16", weekEnd: "2026-11-22", percent: 85, goalCount: 4 },
      ]),
      learningSummaryJson: JSON.stringify({
        recurringSkills: ["PostgreSQL Performance Tuning", "Redis Caching Patterns", "System Architecture Design"],
        monthlyThemes: [
          { theme: "Backend & Systems", count: 8, insight: "Demonstrated advanced grasp of database indexing, query optimization, and memory trade-offs." },
          { theme: "Career & Planning", count: 3, insight: "Proactive in job applications and portfolio iteration." },
        ],
      }),
      missesJson: JSON.stringify([
        { goalTitle: "Update Tech Resume & Apply to 5 Senior Roles", count: 1, reason: "Delayed portfolio case study polishing." }
      ]),
      generatedAt: new Date("2026-11-17T06:00:00Z"),
    },
  });

  // Add sample notification
  await prisma.notification.create({
    data: {
      userId: alex.id,
      type: "report_ready",
      content: "Your weekly AI reflection report for Nov 16 – Nov 22 is ready! You scored 85%.",
      isRead: false,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

