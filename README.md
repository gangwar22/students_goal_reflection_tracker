# ReflectAI: AI Weekly Goal Tracker & Reflection Platform

A full-stack habit tracking and evidence-based AI audit platform built strictly in accordance with the **PRD: AI Weekly Goal Tracker & Reflection Platform** (Nov 17, 2026).

---

## 🚀 Key Value Proposition & Problem Solved

> **Problem:** Students set goals but never check them against what they actually did, resulting in an inaccurate progress picture and no lasting learning record.
>
> **Solution:** ReflectAI establishes a weekly planning habit on Mondays and a daily reflection habit every evening. At the end of the week, the AI evaluates raw reflection text to extract concrete evidence and quote accomplishments/blockers. **Percentages are never computed by the model**—code strictly calculates the weighted arithmetic breakdown, guaranteeing transparency, auditability, and dispute resolution.

---

## 🌟 Implemented Features Matrix (PRD Requirements)

| PRD ID | Requirement | Status | Implementation Details |
|---|---|---|---|
| **F1** | Register, Login, Logout, Forgot Password | ✅ Complete | JWT authentication, bcrypt hashing, role-based protection (`student`, `admin`, `mentor`). Admin accounts managed by administration. |
| **F2** | Weekly Goals Management | ✅ Complete | 3 to 10 goals per week, weights 1 to 3, categories (Technical, Academic, Career, Health, Personal). Automatic Monday 11:59 PM IST locking with mandatory reason & audit logging for post-lock edits. |
| **F3** | Daily Goals linked to Weekly Goal | ✅ Complete | Daily tasks linked directly to weekly goals or explicitly flagged as "Extra Task" (enforced in API and UI). |
| **F4** | Daily Written Reflection | ✅ Complete | 4 fields: What I Did, What Blocked Me, What I Learned, Self-Rating (1-5). Real-time warning if &lt;20 characters. 48-hour backfill window enforcement. |
| **F5** | AI Weekly Analysis Pipeline | ✅ Complete | Automated week-end analysis and on-demand "Analyse Now" manual audit button. |
| **F6** | Per-Goal &amp; Weekly % Arithmetic | ✅ Complete | Strict arithmetic formula: $\text{Weekly}\% = \frac{\sum w_i \cdot s_i}{\sum w_i}$. Complete step-by-step mathematical breakdown modal. |
| **F7** | Missed Goals with AI-Stated Reasons | ✅ Complete | Missed targets list quotes direct blocker evidence from student reflections. |
| **F8** | Monthly View &amp; Rollups | ✅ Complete | Month picker (YYYY-MM), all weeks cards, weighted monthly %, trend line chart, recurring misses, monthly learning summary. |
| **F9** | Unified Learning Log | ✅ Complete | Daily, weekly clustered, and monthly learning milestones in one searchable and filterable timeline. |
| **F10** | Student Dashboard | ✅ Complete | Home KPI overview, streak counter, today's pending tasks, weekly progress bars, AI reports, PDF/print export. |
| **F11** | Admin Operations Dashboard | ✅ Complete | Cohort KPIs, student search & filter, at-risk early warning alerts, deep-dive read-only dossier, batch metrics. |
| **F13** | One-Click Carry-Forward | ✅ Complete | Pull uncompleted or missed goals from prior weeks into the active week in one click. |
| **F14** | Score Dispute Resolution | ✅ Complete | Student can dispute any AI score with an appeal comment; Admin reviews and can override the score, which immediately recalculates the weekly total in code. |
| **F15** | Exporting | ✅ Complete | Printable / PDF report formatting for students and one-click cohort CSV export for administrators. |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Recharts (responsive data visualizations).
- **Backend:** Next.js Route Handlers (RESTful JSON APIs), JWT Authentication with HTTP-only cookies, Role Middleware.
- **Database:** MongoDB with Prisma ORM (`provider = "mongodb"`), utilizing native BSON ObjectIds, index optimizations, and document models.
- **AI Analysis Engine:** Dual-mode engine:
  - **Live LLM Integration:** Claude 3.5 Sonnet / Gemini API via environment variables.
  - **Intelligent Deterministic Offline Engine:** Built-in semantic parser that scores evidence, detects blockers, clusters 3–5 learning themes, and outputs the exact PRD JSON contract without requiring paid external API tokens.

---

## 👥 Demo Accounts & Pre-Seeded Data

The platform comes pre-seeded with rich demo cohorts, students, weekly goals, reflections, and disputes:

| Account Role | Name | Email | Password | Persona & Context |
|---|---|---|---|---|
| **Super Admin** | Program Director | `admin@tracker.com` | `admin123` | Full administrative console, cohort KPIs, dispute resolution, settings. |
| **Student (Top Performer)** | Alex Chen | `alex@student.com` | `student123` | 85% weekly completion, 5-day reflection streak, detailed database benchmarks. |
| **Student (Dispute Appeal)** | Maya Patel | `maya@student.com` | `student123` | 64% completion, has an active dispute filed for unit testing score (8/10 tests). |
| **Student (At-Risk)** | Rohit Sharma | `rohit@student.com` | `student123` | &lt;40% score, 3+ days inactive, triggers early intervention alert. |
| **Student (New)** | Samantha Reed | `sam@student.com` | `student123` | Recent enrollee in AI & ML Cohort 2026-B. |

*Quick 1-Click login buttons are available directly on the homepage (`/`) for immediate testing.*

---

## 🏃 Quick Start Guide

### 1. Configure MongoDB in `.env`
Set your MongoDB connection string in `.env`:
```env
# MongoDB Atlas (Cloud):
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/reflect_ai?retryWrites=true&w=majority"

# Or Local MongoDB:
DATABASE_URL="mongodb://localhost:27017/reflect_ai?directConnection=true"
```

### 2. Generate Prisma Client & Push Collections to MongoDB
```bash
pnpm exec prisma generate
pnpm exec prisma db push
node prisma/seed.js
```

### 3. Start Development Server
```bash
pnpm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📐 AI Scoring & Arithmetic Contract

The platform strictly respects the design rule defined in **Section 5 of the PRD**:

```
Weekly% = (Σ w_i · s_i) / (Σ w_i)
```

- Each daily task reflection is evaluated by the AI engine into:
  - **Achieved (80-100%):** Concrete evidence demonstrates objective completion.
  - **Partial (40-79%):** Meaningful progress made but blocked or incomplete.
  - **Missed (<40%):** Goal unmet or heavy blockers encountered.
  - **No Evidence (0%):** No written reflection logged within the 48-hour grace window.
- Weekly goals roll up the average of their linked daily tasks (capped at 100%). A weekly goal with no daily tasks scores 0%.
- Overall weekly percentage is computed strictly by arithmetic code and stored alongside input hash and model metadata for full auditability.

