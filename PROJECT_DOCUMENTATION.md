# PlacementPal — Complete Project Documentation

> **Skill Gap Intelligence Platform for Campus Placements**  
> Built for APSIT (A.P. Shah Institute of Technology)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Frontend — Pages & Components](#6-frontend--pages--components)
7. [Backend — Edge Functions](#7-backend--edge-functions)
8. [ML & AI Algorithms](#8-ml--ai-algorithms)
9. [End-to-End Workflows](#9-end-to-end-workflows)
10. [File Structure Reference](#10-file-structure-reference)

---

## 1. Project Overview

**PlacementPal** is an AI-powered campus placement preparation platform that:

- Assesses student skills across 4 career tracks via AI-generated adaptive tests
- Analyzes resumes using multimodal AI (PDF vision) with domain-specific skill matching
- Predicts placement readiness using a weighted ML scoring algorithm
- Generates personalized learning paths with AI-curated course recommendations
- Provides real-time TPO ↔ Student chat messaging
- Gives TPO officers batch-wide analytics dashboards

### Users & Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Register, take assessments, upload resume, get AI analysis, view dashboard, learning paths, chat with TPO |
| **TPO** (Training & Placement Officer) | View analytics, manage students, chat with students, manage placement rounds, shortlist students |

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library (SPA) |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling with custom design tokens |
| **Framer Motion** | Animations & transitions |
| **shadcn/ui** | Component library (Radix UI primitives) |
| **React Router v6** | Client-side routing with role-based protection |
| **TanStack React Query** | Server state management |
| **Recharts** | Data visualization (TPO dashboard charts) |
| **React Markdown** | Rendering AI chat responses |

### Backend (Lovable Cloud / Supabase)
| Technology | Purpose |
|-----------|---------|
| **Supabase Auth** | Email/password authentication with email verification |
| **Supabase PostgreSQL** | Relational database with Row-Level Security |
| **Supabase Edge Functions** (Deno) | Serverless AI processing endpoints |
| **Supabase Realtime** | Live message updates (chat) |

### AI / ML
| Model | Usage |
|-------|-------|
| **Gemini 2.5 Flash** | Resume analysis (multimodal PDF vision) |
| **Gemini 3 Flash Preview** | Assessment generation, answer verification, skill prediction, LinkedIn analysis, resume chat, learning path generation |
| **Gemini 2.0 Flash** (Google API) | LinkedIn profile fetching via Google Search grounding |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)              │
│                                                      │
│  Login/Register → StudentHome → TrackSelection       │
│       → Assessment → StudentDashboard                │
│       → ResumeAnalysis → LearningPath                │
│       → StudentChat / FloatingTPOChat                │
│       → TPODashboard / TPOUsersManagement / TPOChat  │
├──────────────────────┬──────────────────────────────┤
│   Supabase JS Client │   Edge Function Calls (fetch) │
├──────────────────────┴──────────────────────────────┤
│              BACKEND (Supabase / Lovable Cloud)      │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  PostgreSQL   │  │   Edge Functions (Deno)      │  │
│  │  + RLS        │  │                              │  │
│  │  + Triggers   │  │  • generate-assessment       │  │
│  │  + Functions  │  │  • verify-assessment         │  │
│  │              │  │  • skill-prediction           │  │
│  │  Tables:      │  │  • resume-analyze            │  │
│  │  students     │  │  • resume-chat               │  │
│  │  user_roles   │  │  • linkedin-analyze          │  │
│  │  assessment_  │  │  • generate-learning-path    │  │
│  │   results     │  │  • manage-users              │  │
│  │  resumes      │  │                              │  │
│  │  courses      │  └──────────┬───────────────────┘  │
│  │  learning_    │             │                      │
│  │   paths       │             ▼                      │
│  │  messages     │   ┌────────────────────┐           │
│  │  placement_   │   │  Lovable AI Gateway │           │
│  │   rounds      │   │  (Gemini Models)    │           │
│  │  domain_skills│   └────────────────────┘           │
│  └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 `students`
Stores student profile metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `username` | text | Extracted from email (e.g., `john` from `john@apsit.edu.in`) |
| `email` | text | Full email address |
| `phone` | text | Phone number |
| `department` | text | Academic department |
| `year` | integer | Year of study |
| `parent_email` | text | Parent's email for notifications |
| `is_registered` | boolean | Whether the student completed registration |
| `created_at` / `updated_at` | timestamptz | Timestamps |

### 4.2 `user_roles`
RBAC role assignment (security-critical).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `user_id` | uuid (FK → auth.users) | References Supabase Auth user |
| `role` | app_role enum (`student` \| `tpo`) | Assigned role |

**Trigger:** `handle_new_user()` automatically inserts `role = 'student'` for every new signup.

**Security Functions:**
```sql
-- Check if user has a specific role (SECURITY DEFINER — bypasses RLS)
has_role(_user_id uuid, _role app_role) → boolean

-- Get user's role as text
get_user_role(_user_id uuid) → text
```

### 4.3 `assessment_results`
Stores every assessment attempt with AI analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `student_username` | text | Student's username |
| `student_id` | uuid (FK → students) | Student reference |
| `track` | text | Career track (e.g., `Programming & DSA`) |
| `correct_answers` | integer | Number correct (default: 0) |
| `total_questions` | integer | Total questions (default: 5) |
| `level` | text | Classification: `Beginner` / `Intermediate` / `Ready` |
| `gaps` | jsonb | Array of skill gap topic names |
| `question_responses` | jsonb | Per-question breakdown (topic, difficulty, isCorrect) |
| `ai_prediction` | jsonb | Full AI prediction object (see §8.2) |
| `confidence_score` | numeric | AI confidence percentage |
| `created_at` | timestamptz | Timestamp |

### 4.4 `resumes`
Stores resume analysis results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `student_username` | text | Student's username |
| `student_id` | uuid (FK → students) | Student reference |
| `file_name` | text | Original PDF filename |
| `file_url` | text | Storage URL (if stored) |
| `extracted_text` | text | Raw text extracted from PDF |
| `overall_score` | numeric | AI-computed overall score (0–100) |
| `skills_found` | jsonb | Array of matched skills |
| `analysis_json` | jsonb | Full analysis object (see §8.3) |
| `created_at` / `updated_at` | timestamptz | Timestamps |

### 4.5 `courses`
Curated course catalogue for learning path recommendations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `title` | text | Course title |
| `platform` | text | Platform (Coursera, Udemy, NPTEL, etc.) |
| `url` | text | Course URL |
| `track` | text | Career track |
| `skill_covered` | text | Primary skill this course teaches |
| `difficulty_level` | text | `Beginner` / `Intermediate` / `Advanced` |
| `is_free` | boolean | Whether course is free |
| `rating` | numeric | Course rating |
| `duration_hours` | integer | Estimated hours |
| `instructor` | text | Instructor name |
| `description` | text | Course description |

### 4.6 `domain_skills`
Rule-based skill requirements per domain (source of truth for resume matching).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `domain` | text | Domain name (e.g., `Programming & DSA`) |
| `skill` | text | Skill name (e.g., `React`, `SQL`) |
| `skill_type` | text | `required` or `bonus` |

### 4.7 `learning_paths`
Student-specific course recommendations (persisted to avoid re-generating).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `student_username` | text | Student's username |
| `student_id` | uuid (FK → students) | Student reference |
| `course_id` | uuid (FK → courses) | Recommended course |
| `skill_gap` | text | Which skill gap this course addresses |
| `priority` | integer | Priority order (1 = highest) |
| `is_completed` | boolean | Whether student marked it complete |
| `completed_at` | timestamptz | Completion timestamp |

### 4.8 `learning_path_tips`
AI-generated study tips per student per track.

| Column | Type | Description |
|--------|------|-------------|
| `student_username` | text | Student's username |
| `track` | text | Career track |
| `tips` | jsonb | Array of tip strings |

### 4.9 `messages`
TPO ↔ Student chat messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `sender_username` | text | Sender's username |
| `sender_role` | text | `student` or `tpo` |
| `recipient_username` | text | Recipient's username |
| `content` | text | Message body |
| `is_read` | boolean | Read status |
| `created_at` | timestamptz | Timestamp |

### 4.10 `placement_rounds`
Company placement drive schedules.

| Column | Type | Description |
|--------|------|-------------|
| `company_name` | text | Company name |
| `round_date` | date | Date of the placement round |
| `round_time` | time | Time of the round |
| `status` | text | `upcoming` / `ongoing` / `completed` |
| `description` | text | Round details |
| `location` | text | Venue |
| `requirements` | text | Eligibility requirements |

### 4.11 `shortlisted_students`
Students shortlisted for placement rounds.

| Column | Type | Description |
|--------|------|-------------|
| `student_username` | text | Student's username |
| `round_id` | uuid (FK → placement_rounds) | Placement round |
| `notification_sent` | boolean | Whether notification was sent |
| `notification_status` | text | `pending` / `sent` / `failed` |

### 4.12 `batch_uploads`
Tracks bulk CSV student uploads by TPO.

| Column | Type | Description |
|--------|------|-------------|
| `file_name` | text | CSV filename |
| `uploaded_by` | text | TPO username |
| `total_records` | integer | Total rows in CSV |
| `processed_count` | integer | Successfully processed |
| `failed_count` | integer | Failed records |
| `status` | text | `processing` / `completed` / `failed` |
| `error_details` | jsonb | Per-row error details |

---

## 5. Authentication & Authorization

### 5.1 Registration Flow

```
Student → Register Page → Enter @apsit.edu.in email + password
  → Supabase Auth signUp() → Email verification link sent
  → Student clicks link → Account activated
  → DB trigger: handle_new_user() inserts role = 'student' into user_roles
```

**Code:** `src/pages/Register.tsx`
```typescript
const { error: authError } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password,
  options: { emailRedirectTo: window.location.origin },
});
```

**Domain Restriction:** Only `@apsit.edu.in` emails are allowed (validated client-side).

### 5.2 Login Flow

```
User → Login Page → Enter email + password
  → supabase.auth.signInWithPassword()
  → AuthContext.onAuthStateChange fires
  → fetchRole() calls get_user_role RPC
  → Redirect: student → /student-home, tpo → /tpo-dashboard
```

**Code:** `src/pages/Login.tsx`
```typescript
const { error: authError } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password,
});
```

### 5.3 Auth Context (`src/lib/authContext.tsx`)

Central auth state management using React Context:

```typescript
interface AuthContextType {
  isLoggedIn: boolean;     // Derived: !!user && !!session
  role: UserRole;          // 'student' | 'tpo' | null
  username: string;        // Extracted: user.email.split('@')[0]
  user: User | null;       // Supabase User object
  session: Session | null; // Supabase Session
  studentResult: EnhancedStudentResult | null;
  loading: boolean;
  login, logout, setStudentResult  // Methods
}
```

**Role Fetching:** Uses a `SECURITY DEFINER` RPC to avoid RLS recursion:
```typescript
const fetchRole = async (userId: string): Promise<UserRole> => {
  const { data } = await supabase.rpc('get_user_role', { _user_id: userId });
  return data as UserRole;  // 'student' or 'tpo'
};
```

### 5.4 Protected Routes (`src/components/ProtectedRoute.tsx`)

```typescript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/" />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'tpo' ? '/tpo-dashboard' : '/student-home'} />;
  }
  return children;
};
```

### 5.5 Route Map (`src/App.tsx`)

| Route | Component | Role | Description |
|-------|-----------|------|-------------|
| `/` | `Login` | Public | Login page (redirects if already logged in) |
| `/register` | `Register` | Public | Student registration |
| `/student-home` | `StudentHome` | Student | Dashboard with courses & progress |
| `/resume` | `ResumeAnalysis` | Student | Resume + LinkedIn analysis |
| `/tracks` | `TrackSelection` | Student | Choose assessment track |
| `/assessment` | `Assessment` | Student | Take AI-generated quiz |
| `/learning-path` | `LearningPath` | Student | AI-curated course recommendations |
| `/student-dashboard` | `StudentDashboard` | Student | Assessment results & gaps |
| `/student-chat` | `StudentChat` | Student | Chat with TPO |
| `/tpo-dashboard` | `TPODashboard` | TPO | Analytics & charts |
| `/tpo-users` | `TPOUsersManagement` | TPO | Manage students |
| `/tpo-chat` | `TPOChat` | TPO | Chat with students |

---

## 6. Frontend — Pages & Components

### 6.1 Login Page (`src/pages/Login.tsx`)
- Email/password form with `@apsit.edu.in` domain validation
- Cyberpunk-themed UI with animated background blobs
- Error handling for invalid credentials
- Auto-redirects authenticated users

### 6.2 Register Page (`src/pages/Register.tsx`)
- Email + password + confirm password form
- Client-side validation (domain, password length ≥ 8, match)
- Success state shows email verification instructions
- Auto-assigns `student` role via DB trigger

### 6.3 Student Home (`src/pages/StudentHome.tsx`)
- **Hero section** with personalized greeting (`Hey, {username}!`)
- **Quick stats:** 16+ courses, 4 tracks, AI analysis, 5-min assessments
- **Domain Progress:** Fetches latest `assessment_results` per track, shows score bars with level badges
- **Featured Courses:** 16 hardcoded courses across all 4 tracks with filters
- **Floating TPO Chat:** Bottom-right chat widget for messaging TPO

### 6.4 Track Selection (`src/pages/TrackSelection.tsx`)
- 4 career track cards in a 2×2 grid:
  - Programming & DSA
  - Data Science & ML
  - Database Management & SQL
  - Backend / Web Dev
- Each card shows topics, description, and "Start Assessment" CTA
- Navigates to `/assessment` with `track` in route state

### 6.5 Assessment (`src/pages/Assessment.tsx`)
**The most complex page.** Three phases:

#### Phase 1: Question Loading
```typescript
const { data, error } = await supabase.functions.invoke('generate-assessment', {
  body: { track, numQuestions: 5 },
});
```
- Shows animated loading spinner while AI generates questions
- Error state with retry button

#### Phase 2: Quiz Interface
- One question at a time with progress bar
- **MCQ:** 4 radio-button options
- **Coding/Short-answer:** Text input
- Answers stored locally until all 5 are completed

#### Phase 3: Submission & Results
Three sequential AI calls:
1. **`verify-assessment`** — AI verifies each answer (LLM-as-Judge)
2. **`skill-prediction`** — AI classifies readiness level
3. **Save to DB** — Inserts into `assessment_results`

Results page shows:
- Score (e.g., 3/5), percentage, level badge, AI confidence
- Per-question review with correct/wrong indicators and explanations
- AI skill gaps with priority labels
- AI recommendations
- CTAs: "View Learning Path" / "Retake" / "View Dashboard"

### 6.6 Resume Analysis (`src/pages/ResumeAnalysis.tsx`)
**Two analysis modes:**

#### Resume Analysis (PDF)
1. **Domain selection:** Overall / Programming & DSA / Data Science & ML / Database & SQL / Backend
2. **File upload:** PDF only, validated client-side
3. **AI analysis:** Calls `resume-analyze` edge function with FormData (PDF + domain)
4. **Results display:**
   - Overall score ring (animated SVG)
   - Sub-score bars (Skill Match, Projects, Experience, Structure, Action Verbs)
   - Matched vs. Missing skills with pills (green ✓ / red ✗)
   - Domain-specific required/bonus skills from `domain_skills` table
   - AI suggestions and strengths
5. **AI Chat:** Opens a streaming chatbot (`resume-chat`) for follow-up questions about the resume

#### LinkedIn Analysis
1. Enter LinkedIn URL or paste profile content
2. Calls `linkedin-analyze` edge function
3. Shows scores for: Skills, Projects, Experience, Profile Completeness, Network, Content Quality
4. Lists matched/missing skills, strengths, improvements

### 6.7 Learning Path (`src/pages/LearningPath.tsx`)
- **Multi-domain support:** Tab-based selector for all assessed domains
- **AI Generation:** Calls `generate-learning-path` with skill gaps + all courses from DB
- **Caching:** Saves recommendations to `learning_paths` table; future visits load instantly without AI call
- **Regenerate:** "Refresh" button deletes saved paths and re-generates
- **Course cards:** Title, platform, rating, duration, difficulty, skill addressed, AI reason
- **Progress tracking:** Toggle courses as complete, shows completion percentage
- **Study tips:** AI-generated tips saved in `learning_path_tips` table
- **Fallback:** If AI fails, uses keyword matching against course titles/skills

### 6.8 Student Dashboard (`src/pages/StudentDashboard.tsx`)
- **Multi-domain tabs:** Shows all assessed domains with level badges
- **Per-domain detail:**
  - Score card, level, AI confidence
  - Estimated readiness timeline (weeks)
  - Skill gaps with priority (High/Medium/Low) and gap type (Conceptual/Practical)
  - AI recommendations
  - Quick links: Retake, View Learning Path
- **All-domain summary bar** when 2+ domains assessed

### 6.9 TPO Dashboard (`src/pages/TPODashboard.tsx`)
- Overview stats: Total students, per-track counts, placement-ready percentage
- **Bar chart:** Level distribution by track (Beginner/Intermediate/Ready × 4 tracks)
- **Pie chart:** Track distribution
- **Top Skill Gaps:** Batch-wide gap analysis with percentage bars
- **Readiness Breakdown:** Aggregate Beginner/Intermediate/Ready percentages
- **Student table:** Recent assessments with track, score, level, gaps
- *Note: Currently uses mock data from `src/lib/mockData.ts`*

### 6.10 Chat System
**Two interfaces:**

**FloatingTPOChat** (`src/components/FloatingTPOChat.tsx`):
- Bottom-right floating button on student pages
- Slide-up chat panel
- Messages stored in `messages` table with `sender_role = 'student'`

**TPOChat** (`src/pages/TPOChat.tsx`):
- Full-page chat interface for TPO
- Left sidebar: Student conversation list with unread counts
- Right panel: Message thread with selected student
- Canonical username `'TPO Admin'` for all TPO messages

### 6.11 Custom UI Components

**CyberButton** (`src/components/ui/CyberButton.tsx`):
- 5 color variants: `primary`, `accent`, `secondary`, `tertiary`, `ghost`
- 3 sizes: `sm`, `md`, `lg`
- Optional `glowing` prop for animated glow effect

**CyberCard** (`src/components/ui/CyberCard.tsx`):
- Card container with 5 color variants
- Animated entrance (`framer-motion`)
- `delay` prop for staggered animations

**CursorGlow** (`src/components/CursorGlow.tsx`):
- Follows mouse cursor with a colored radial gradient glow
- Configurable `color` and `size`

---

## 7. Backend — Edge Functions

All edge functions are serverless Deno functions deployed automatically. They communicate with the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) using the `LOVABLE_API_KEY` secret.

### 7.1 `generate-assessment`
**File:** `supabase/functions/generate-assessment/index.ts`

**Purpose:** Dynamically generates 5 unique assessment questions per attempt.

**Input:**
```json
{ "track": "Programming & DSA", "numQuestions": 5 }
```

**Process:**
1. Builds a detailed system prompt with track-specific topics
2. Calls Gemini 3 Flash Preview with `temperature: unset` (default)
3. Adds random seed (`Date.now() + Math.random()`) for question uniqueness
4. Parses JSON array from AI response
5. Validates question structure (id, type, options, correctAnswer, topic, difficulty)

**Output:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-1",
      "type": "mcq",
      "question": "What is the time complexity of...",
      "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      "correctAnswer": 1,
      "topic": "Searching Algorithms",
      "explanation": "Binary search divides...",
      "difficulty": "Easy"
    }
  ]
}
```

### 7.2 `verify-assessment`
**File:** `supabase/functions/verify-assessment/index.ts`

**Purpose:** AI-powered answer verification (LLM-as-Judge pattern).

**Input:**
```json
{
  "questions": [...],
  "userAnswers": [1, "O(n^2)", 0, ...],
  "track": "Programming & DSA"
}
```

**Process:**
1. Builds verification prompt with each question, options, original correct answer, and user answer
2. Instructs AI to independently verify correctness (overrides wrong original answers)
3. Accepts semantic equivalence for short answers (`O(n^2)` = `O(N^2)`, `HashMap` = `Hash Map`)
4. Returns per-question verdict with corrected explanations

**Output:**
```json
{
  "success": true,
  "results": [
    { "index": 0, "isCorrect": true, "correctAnswer": 1, "explanation": "...", "topic": "..." }
  ],
  "correctCount": 3,
  "gaps": ["Dynamic Programming", "Heaps"]
}
```

### 7.3 `skill-prediction`
**File:** `supabase/functions/skill-prediction/index.ts`

**Purpose:** ML-style placement readiness classification.

**Input:**
```json
{
  "studentUsername": "john",
  "track": "Programming & DSA",
  "correctAnswers": 3,
  "totalQuestions": 5,
  "gaps": ["DP", "Heaps"],
  "questionResponses": [
    { "questionId": "q-1", "topic": "Sorting", "isCorrect": true, "difficulty": "Easy" }
  ],
  "resumeScore": 72,
  "skillsFound": ["Python", "React"]
}
```

**Process:**
1. **Weighted Scoring Algorithm:**
   ```
   Difficulty weights: Hard = 3, Medium = 2, Easy = 1
   weightedScore = (Σ weight_correct) / (Σ weight_total) × 100
   ```
2. Sends student data to Gemini 3 Flash Preview for classification
3. AI returns: level, confidence, categorized skill gaps, recommendations, estimated weeks to ready

**Fallback (if AI parse fails):**
```
level = weightedScore ≥ 70 → "Ready"
       weightedScore ≥ 40 → "Intermediate"
       else               → "Beginner"
```

**Output:**
```json
{
  "success": true,
  "prediction": {
    "level": "Intermediate",
    "confidence": 72,
    "skillGaps": [
      { "skill": "Dynamic Programming", "gapType": "Conceptual", "priority": "High" }
    ],
    "recommendations": ["Focus on DP problems on LeetCode", "..."],
    "estimatedReadinessWeeks": 4
  },
  "metadata": {
    "rawScore": 60.0,
    "weightedScore": 55.5,
    "track": "Programming & DSA"
  }
}
```

### 7.4 `resume-analyze`
**File:** `supabase/functions/resume-analyze/index.ts`

**Purpose:** Multimodal resume analysis using PDF vision.

**Input:** `FormData` with `resume` (PDF file) and `domain` (string).

**Process:**
1. Fetches domain-specific required/bonus skills from `domain_skills` table
2. Converts PDF to base64 using chunked buffer processing (avoids stack overflow on large files):
   ```typescript
   const chunkSize = 8192;
   for (let i = 0; i < bytes.length; i += chunkSize) { ... }
   const pdfBase64 = btoa(binary);
   ```
3. Sends to Gemini 2.5 Flash as multimodal input (`image_url` with `data:application/pdf;base64,...`)
4. Two prompt modes:
   - **Domain-specific:** Matches against DB-sourced required/bonus skills with semantic/fuzzy matching
   - **Overall:** Holistic quality assessment without domain targeting

**Scoring Formula:**
```
overallScore = skillMatch × 0.40
             + projectQuality × 0.25
             + experience × 0.15
             + resumeStructure × 0.10
             + actionVerbs × 0.10
```

**Output:**
```json
{
  "success": true,
  "analysis": {
    "extractedSkills": ["Python", "React", "SQL", ...],
    "matchedRequired": ["Python", "SQL"],
    "matchedBonus": ["Docker"],
    "missingRequired": ["Kubernetes", "CI/CD"],
    "missingBonus": ["GraphQL"],
    "overallScore": 68,
    "skillMatchScore": 72,
    "projectQualityScore": 65,
    "experienceScore": 55,
    "resumeStructureScore": 80,
    "actionVerbsScore": 70,
    "suggestions": ["Add Docker experience", ...],
    "strengths": ["Strong Python skills", ...],
    "summary": "Strong backend profile with...",
    "candidateName": "John Doe",
    "domain": "Backend / Web Dev",
    "domainRequiredSkills": ["Node.js", "REST", ...],
    "domainBonusSkills": ["GraphQL", "Docker", ...]
  }
}
```

### 7.5 `resume-chat`
**File:** `supabase/functions/resume-chat/index.ts`

**Purpose:** Streaming AI career coach chatbot with resume context.

**Input:**
```json
{
  "messages": [{ "role": "user", "content": "How can I improve my resume?" }],
  "resumeAnalysis": { ... },
  "username": "john"
}
```

**Process:**
1. Builds system prompt injected with all resume analysis data (scores, skills, recommendations)
2. Calls Gemini 3 Flash Preview with `stream: true`
3. Proxies SSE stream directly to client

**Client-side handling** (`src/hooks/useResumeChat.ts`):
- Reads `ReadableStream` chunks
- Parses SSE `data: {...}` lines
- Incrementally updates assistant message in React state

### 7.6 `linkedin-analyze`
**File:** `supabase/functions/linkedin-analyze/index.ts`

**Purpose:** LinkedIn profile analysis with optional web scraping.

**Two input modes:**
1. **URL mode:** Uses Gemini 2.0 Flash + Google Search grounding to fetch profile content
2. **Text mode:** User pastes profile content directly

**Process:**
1. If URL provided → calls Gemini API with `google_search` tool to scrape LinkedIn
2. Sends extracted content to Gemini 3 Flash Preview for scoring
3. Returns scores: Skills, Projects, Experience, Profile Completeness, Network Strength, Content Quality

### 7.7 `generate-learning-path`
**File:** `supabase/functions/generate-learning-path/index.ts`

**Purpose:** Content-based filtering recommendation engine.

**Input:**
```json
{
  "skillGaps": [{ "skill": "DP", "gapType": "Conceptual", "priority": "High" }],
  "track": "Programming & DSA",
  "courses": [{ "title": "DSA Bootcamp", "platform": "Udemy", ... }]
}
```

**Process:**
1. Formats all available courses with index numbers
2. Sends skill gaps + course catalogue to Gemini 2.5 Flash
3. AI selects up to 8 best-fit courses with:
   - Course index → mapped back to full course data
   - Which gap it addresses
   - Reason for recommendation
   - Priority order
4. Also generates 2–3 study tips

**Output:**
```json
{
  "success": true,
  "recommendations": [
    {
      "course": { "id": "...", "title": "DSA Bootcamp", ... },
      "addressesGap": "Dynamic Programming",
      "reason": "Covers DP patterns with practice problems",
      "priority": 1
    }
  ],
  "studyTips": ["Practice 2 DP problems daily", ...]
}
```

---

## 8. ML & AI Algorithms — Detailed Breakdown

### 8.1 Weighted Scoring Algorithm (Skill Prediction)

**Location:** `supabase/functions/skill-prediction/index.ts`, lines 60–76

**Algorithm:**
```
Input: questionResponses[] with { isCorrect, difficulty }
Weights: { Hard: 3, Medium: 2, Easy: 1 }

weightedCorrect = Σ (weight_i × isCorrect_i)   for each question i
totalWeight     = Σ (weight_i)                   for each question i
weightedScore   = (weightedCorrect / totalWeight) × 100

Classification Thresholds:
  weightedScore ≥ 70 → "Ready"
  weightedScore ≥ 40 → "Intermediate"
  weightedScore < 40 → "Beginner"
```

**Why weighted?** A student who answers all Easy questions correctly (score 3/3 = 100% raw) but fails Hard questions gets `weightedScore = 3/9 = 33%` → correctly classified as "Beginner" despite high raw accuracy.

### 8.2 LLM-as-Judge (Answer Verification)

**Location:** `supabase/functions/verify-assessment/index.ts`

**Pattern:** Instead of simple string matching, the AI independently evaluates correctness:
1. AI receives the question, all options, the "original" correct answer, and the user's answer
2. AI verifies the correct answer independently (catching generator errors)
3. Accepts semantic equivalence: `O(n^2)` = `O(N^2)` = `O(n²)`
4. Can override incorrect original answers

**Advantage:** Handles ambiguous coding answers, typos, and AI question-generation errors.

### 8.3 Multimodal NLP (Resume Analysis)

**Location:** `supabase/functions/resume-analyze/index.ts`

**Pipeline:**
```
PDF Upload → Base64 Encoding (chunked) → Gemini Vision API
  → Skill Extraction (NER-like)
  → Semantic Matching (fuzzy: "React.js" = "React", "ML" = "Machine Learning")
  → Weighted Score Computation
  → Section Detection (skills, experience, education, projects, summary)
  → Project & Experience Quality Assessment
```

**Scoring Model (Linear Weighted Combination):**
```
overallScore = 0.40 × skillMatchScore
             + 0.25 × projectQualityScore
             + 0.15 × experienceScore
             + 0.10 × resumeStructureScore
             + 0.10 × actionVerbsScore
```

**Domain-specific skill matching:**
- Required skills fetched from `domain_skills` table
- `skillMatchScore = (matchedRequired / totalRequired) × 70 + (matchedBonus / totalBonus) × 30`

### 8.4 Content-Based Filtering (Learning Path Recommendation)

**Location:** `supabase/functions/generate-learning-path/index.ts`

**Algorithm:**
```
Input:  Student's skill gaps (from assessment AI prediction)
        All courses from database (with metadata: skill, track, difficulty, rating)

Step 1: AI receives gap list + full course catalogue with indices
Step 2: AI selects best-fit courses based on:
        - Skill coverage match (gap → course.skill_covered)
        - Difficulty appropriateness (beginner student → beginner courses)
        - Platform diversity (spread across Coursera, Udemy, NPTEL)
        - Rating quality
Step 3: Returns ordered recommendations with rationale

Fallback (if AI fails): 
  keyword matching: course.skill_covered ∈ student.gaps
```

### 8.5 Client-Side Rule Engine (Local Resume Scoring)

**Location:** `src/lib/resumeScoring.ts`

**Algorithm:** Classical Bag-of-Words (BoW) approach:
```typescript
// Skill matching: exact substring match
matchedSkills = requiredSkills.filter(skill => content.includes(skill));
skillMatchScore = (matchedSkills.length / requiredSkills.length) × 100;

// Project quality: keyword frequency
projectKeywords = ['project', 'built', 'developed', 'created', 'implemented'];
projectScore = min(keywordCount × 10, 100);

// Experience: keyword frequency
expKeywords = ['experience', 'years', 'intern', 'engineer', 'developer'];
experienceScore = min(keywordCount × 12, 100);

// Structure: section presence
sections = ['skills', 'experience', 'education', 'projects', 'summary'];
structureScore = (presentSections / 5) × 100;

// Action verbs: frequency of impact words
actionVerbs = ['developed', 'implemented', 'led', 'optimized', ...];
actionVerbsScore = min(verbCount × 8, 100);

// Overall
overallScore = 0.30 × skill + 0.25 × project + 0.15 × experience
             + 0.10 × structure + 0.10 × actionVerbs + 0.10 × consistency
```

*Note: This is the local fallback. The primary analysis uses the `resume-analyze` edge function with Gemini Vision.*

### 8.6 Adaptive Test Generation

**Location:** `supabase/functions/generate-assessment/index.ts`

**Features:**
- Random seed per attempt ensures unique questions: `${Date.now()}-${Math.random().toString(36)}`
- Mix of MCQ and coding (short-answer) questions
- Difficulty distribution: Easy, Medium, Hard
- Topic diversity enforced: "Each question must test a DIFFERENT topic"
- Track-specific topic pools defined in the system prompt

---

## 9. End-to-End Workflows

### 9.1 Complete Student Journey

```
1. REGISTER
   Student → /register → Enter @apsit.edu.in email → Verify email → Account created
   
2. LOGIN
   Student → / → Sign in → AuthContext fetches role → Redirect to /student-home
   
3. EXPLORE HOME
   /student-home → See featured courses → See domain progress (if any assessments taken)
   
4. TAKE ASSESSMENT
   /student-home → "Take Skill Assessment" → /tracks → Select track → /assessment
   → AI generates 5 unique questions (generate-assessment)
   → Answer all 5 → Submit
   → AI verifies answers (verify-assessment)
   → AI predicts readiness (skill-prediction)
   → Results saved to assessment_results table
   → View results: score, level, skill gaps, recommendations
   
5. ANALYZE RESUME
   /student-home → Navigate to /resume → Select domain → Upload PDF
   → AI analyzes resume (resume-analyze with Gemini Vision)
   → View scores, matched/missing skills, suggestions
   → Chat with AI career coach about resume (resume-chat streaming)
   → Results saved to resumes table
   
6. FOLLOW LEARNING PATH
   /student-dashboard → "View Learning Path" → /learning-path
   → AI generates course recommendations (generate-learning-path)
   → View recommended courses sorted by priority
   → Mark courses as completed → Track progress
   → View AI study tips
   → Switch between domains
   
7. CHAT WITH TPO
   Any student page → Click floating chat icon → Send message
   → Message saved to messages table
   → TPO sees unread count on their chat page
```

### 9.2 TPO Workflow

```
1. LOGIN
   TPO → / → Sign in → Role = 'tpo' → Redirect to /tpo-dashboard
   
2. VIEW ANALYTICS
   /tpo-dashboard → See batch-wide stats, charts, skill gaps, student table
   
3. MANAGE STUDENTS
   /tpo-users → View/search student list → Batch upload CSV
   
4. CHAT WITH STUDENTS
   /tpo-chat → See student conversations → Select student → Read/reply to messages
   
5. MANAGE PLACEMENTS
   Create placement rounds → Shortlist students → Send notifications
```

### 9.3 Assessment Data Flow (Sequence Diagram)

```
Student          Frontend            generate-assessment    verify-assessment    skill-prediction    Database
  │                 │                       │                     │                    │                │
  │── Select Track ─→│                      │                     │                    │                │
  │                 │── POST {track, 5} ───→│                     │                    │                │
  │                 │                       │── Gemini AI ────→   │                    │                │
  │                 │←── 5 questions ───────│                     │                    │                │
  │                 │                       │                     │                    │                │
  │── Answer Q1-Q5 →│                       │                     │                    │                │
  │                 │── POST {questions,    │                     │                    │                │
  │                 │   userAnswers} ──────────────────────────→  │                    │                │
  │                 │                       │                     │── Gemini AI ──→    │                │
  │                 │←── verified results, ────────────────────── │                    │                │
  │                 │    correctCount, gaps  │                    │                    │                │
  │                 │                       │                     │                    │                │
  │                 │── POST {responses,    │                     │                    │                │
  │                 │   gaps, scores} ─────────────────────────────────────────────→  │                │
  │                 │                       │                     │                    │── Gemini AI ─→ │
  │                 │←── prediction {level, ─────────────────────────────────────────  │                │
  │                 │    confidence, gaps}   │                    │                    │                │
  │                 │                       │                     │                    │                │
  │                 │── INSERT assessment_results ────────────────────────────────────────────────────→│
  │                 │                       │                     │                    │                │
  │←── Show Results │                       │                     │                    │                │
```

---

## 10. File Structure Reference

```
PlacementPal/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── main.tsx                          # Entry point, renders <App />
│   ├── App.tsx                           # Routes, providers, auth wrapper
│   ├── App.css                           # Global styles
│   ├── index.css                         # Tailwind + design tokens (CSS vars)
│   ├── vite-env.d.ts                     # Vite type declarations
│   │
│   ├── components/
│   │   ├── Navbar.tsx                    # Navigation bar (role-aware)
│   │   ├── NavLink.tsx                   # Active-aware nav link
│   │   ├── ProtectedRoute.tsx            # Auth + role guard
│   │   ├── CursorGlow.tsx                # Mouse-following glow effect
│   │   ├── FloatingTPOChat.tsx           # Student → TPO floating chat
│   │   └── ui/                           # shadcn/ui components
│   │       ├── CyberButton.tsx           # Custom themed button
│   │       ├── CyberCard.tsx             # Custom themed card
│   │       ├── button.tsx, input.tsx...   # Standard shadcn components
│   │       └── ...
│   │
│   ├── pages/
│   │   ├── Index.tsx                     # Renders Login
│   │   ├── Login.tsx                     # Authentication page
│   │   ├── Register.tsx                  # Student registration
│   │   ├── StudentHome.tsx               # Student landing page
│   │   ├── TrackSelection.tsx            # Choose assessment track
│   │   ├── Assessment.tsx                # AI-generated quiz + results
│   │   ├── StudentDashboard.tsx          # Multi-domain results viewer
│   │   ├── ResumeAnalysis.tsx            # Resume + LinkedIn analysis
│   │   ├── LearningPath.tsx              # AI course recommendations
│   │   ├── StudentChat.tsx               # Student → TPO messaging
│   │   ├── TPODashboard.tsx              # TPO analytics
│   │   ├── TPOUsersManagement.tsx        # Student management
│   │   ├── TPOChat.tsx                   # TPO → Student messaging
│   │   └── NotFound.tsx                  # 404 page
│   │
│   ├── hooks/
│   │   ├── useResumeChat.ts              # Streaming AI chat hook
│   │   ├── use-toast.ts                  # Toast notification hook
│   │   └── use-mobile.tsx                # Mobile viewport detection
│   │
│   ├── lib/
│   │   ├── authContext.tsx               # Auth state management (Context)
│   │   ├── mockData.ts                   # Mock students + questions (TPO dashboard)
│   │   ├── resumeScoring.ts              # Local BoW resume scoring (fallback)
│   │   └── utils.ts                      # cn() utility for Tailwind
│   │
│   └── integrations/supabase/
│       ├── client.ts                     # Supabase client (auto-generated)
│       └── types.ts                      # Database types (auto-generated)
│
├── supabase/
│   ├── config.toml                       # Edge function config (verify_jwt settings)
│   ├── migrations/                       # SQL migration files (auto-managed)
│   └── functions/
│       ├── generate-assessment/index.ts  # AI question generation
│       ├── verify-assessment/index.ts    # AI answer verification
│       ├── skill-prediction/index.ts     # ML readiness classification
│       ├── resume-analyze/index.ts       # Multimodal PDF analysis
│       ├── resume-chat/index.ts          # Streaming AI career coach
│       ├── linkedin-analyze/index.ts     # LinkedIn profile analysis
│       ├── generate-learning-path/index.ts # AI course recommendations
│       └── manage-users/index.ts         # User management API
│
├── .env                                  # Environment variables (auto-managed)
├── tailwind.config.ts                    # Tailwind theme + custom animations
├── vite.config.ts                        # Vite build config
├── tsconfig.json                         # TypeScript config
└── components.json                       # shadcn/ui config
```

---

## Summary of AI/ML Techniques Used

| # | Technique | Where Used | Model |
|---|-----------|-----------|-------|
| 1 | **Weighted Scoring Algorithm** | Skill Prediction | Custom (rule-based) |
| 2 | **LLM-as-Judge** | Answer Verification | Gemini 3 Flash Preview |
| 3 | **Multi-class Classification** | Readiness Level Prediction | Gemini 3 Flash Preview |
| 4 | **Multimodal NLP (Vision)** | Resume PDF Analysis | Gemini 2.5 Flash |
| 5 | **Semantic/Fuzzy Matching** | Skill Matching (resume ↔ domain) | Gemini 2.5 Flash |
| 6 | **Content-Based Filtering** | Learning Path Recommendations | Gemini 2.5 Flash |
| 7 | **Bag-of-Words (BoW)** | Local Resume Scoring (fallback) | Client-side (no AI) |
| 8 | **Adaptive Test Generation** | Dynamic Question Creation | Gemini 3 Flash Preview |
| 9 | **Streaming Chat (RAG-like)** | Resume Career Coach | Gemini 3 Flash Preview |
| 10 | **Web Grounding** | LinkedIn Profile Fetching | Gemini 2.0 Flash (Google API) |

---

*Generated on: February 22, 2026*  
*Platform: PlacementPal v1.0 — APSIT Campus Placement Intelligence System*
