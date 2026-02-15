
# Student Home Page - Proper Landing Experience

## Overview
After a student logs in, instead of going directly to the track selection/assessment page, they'll land on a new **Student Home** page. This page will feel like a learning hub -- showcasing courses, skill-building resources, and a prominent "Identify Your Skill Gaps" section that leads to the assessment tracks.

## New Page: `/student-home`

The page will have these sections:

### 1. Hero Section
- Welcome message with the student's name
- Tagline like "Build Your Skills. Land Your Dream Job."
- Two CTAs: "Explore Courses" (scrolls down) and "Take Skill Assessment" (goes to /tracks)

### 2. Featured Courses Section
- Grid of course cards across the 4 tracks (Programming & DSA, Data Science & ML, Database & SQL, Backend/Web Dev)
- Each card shows: course title, platform (Coursera/Udemy/NPTEL), difficulty level, duration
- Hardcoded curated courses from verified platforms
- Styled with the cyberpunk aesthetic using CyberCard components

### 3. Skill Tracks Overview
- Horizontal cards showing the 4 tracks with brief descriptions
- Visual indicators (icons, colors matching existing track colors)
- Not clickable for assessment -- just informational

### 4. "Identify Your Skill Gaps" CTA Section
- Eye-catching section with a glowing card
- Headline: "Know Where You Stand"
- Description: "Take a quick 5-question assessment to identify your skill gaps and get personalized learning recommendations"
- Large CTA button: "Start Skill Assessment" --> navigates to `/tracks`
- Small stats like "5 questions per track", "AI-powered analysis", "Personalized recommendations"

### 5. Resume Analysis Teaser
- The resume upload and AI chat section (currently on TrackSelection) will be moved here
- Brief intro to the resume analysis feature

## Changes Required

### New Files
- `src/pages/StudentHome.tsx` -- The new home page with all sections described above

### Modified Files

1. **`src/pages/Login.tsx`**
   - Change student redirect from `/tracks` to `/student-home`

2. **`src/App.tsx`**
   - Add route: `/student-home` pointing to `StudentHome` component

3. **`src/components/Navbar.tsx`**
   - Update student nav items: add "Home" linking to `/student-home`
   - Change first nav item from `/tracks` (Tracks) to `/student-home` (Home)
   - Keep "Assessment" linking to `/tracks` (renamed to "Assessment")

4. **`src/pages/TrackSelection.tsx`**
   - Remove the resume upload and AI chat section (moved to StudentHome)
   - Keep it focused purely on track selection and assessment start

## Course Data
A curated list of 12-16 courses will be hardcoded, covering:
- **Programming & DSA**: DSA courses from Coursera, LeetCode guides, competitive programming
- **Data Science & ML**: ML specializations, Python for Data Science, Deep Learning courses
- **Database & SQL**: SQL Bootcamps, Database Design courses, MongoDB basics
- **Backend / Web Dev**: Node.js courses, REST API design, system design fundamentals

Each course will have: title, platform, track, difficulty, duration, and a URL.

## User Flow (Updated)

```text
Login (Student)
  |
  v
Student Home (/student-home)
  |-- Browse courses
  |-- Read about tracks
  |-- Click "Start Skill Assessment"
        |
        v
      Track Selection (/tracks)
        |
        v
      Assessment (/assessment)
        |
        v
      Student Dashboard (/student-dashboard)
```

## Technical Details

- The `StudentHome.tsx` component will use existing UI primitives: `CyberCard`, `CyberButton`, `Navbar`, `CursorGlow`, and Framer Motion animations
- Course data will be defined as a typed array within the component (or in `mockData.ts`)
- Smooth scroll behavior for the "Explore Courses" button using `useRef` and `scrollIntoView`
- Fully responsive layout using Tailwind's grid system
- Maintains the cyberpunk/terminal aesthetic with glow effects and scanlines
