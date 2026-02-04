
-- =============================================
-- PlacementPal Database Schema - Phase 1
-- =============================================

-- 1. Students table - Core student profiles
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  parent_email TEXT,
  department TEXT,
  year INTEGER,
  is_registered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Assessment Results table - Store all assessment attempts
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_username TEXT NOT NULL,
  track TEXT NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 5,
  level TEXT NOT NULL DEFAULT 'Beginner',
  gaps JSONB DEFAULT '[]'::jsonb,
  question_responses JSONB DEFAULT '[]'::jsonb,
  ai_prediction JSONB,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Resumes table - Store uploaded resumes and extracted data
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_username TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  extracted_text TEXT,
  skills_found JSONB DEFAULT '[]'::jsonb,
  analysis_json JSONB,
  overall_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Courses table - Verified course database
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  track TEXT NOT NULL,
  skill_covered TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'Beginner',
  duration_hours INTEGER,
  is_free BOOLEAN NOT NULL DEFAULT false,
  rating DECIMAL(3,2),
  description TEXT,
  instructor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Learning Paths table - Student course recommendations
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_username TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_gap TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Placement Rounds table - Company placement events
CREATE TABLE public.placement_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  round_date DATE NOT NULL,
  round_time TIME,
  location TEXT,
  requirements TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Shortlisted Students table - Students selected for rounds
CREATE TABLE public.shortlisted_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_username TEXT NOT NULL,
  round_id UUID REFERENCES public.placement_rounds(id) ON DELETE CASCADE,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  notification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Batch Uploads table - Track Excel uploads
CREATE TABLE public.batch_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Enable Row Level Security on all tables
-- =============================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlisted_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_uploads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies - Allow all operations for demo mode
-- (Will be tightened when auth is implemented)
-- =============================================

-- Students policies
CREATE POLICY "Allow all operations on students" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

-- Assessment results policies
CREATE POLICY "Allow all operations on assessment_results" ON public.assessment_results
  FOR ALL USING (true) WITH CHECK (true);

-- Resumes policies
CREATE POLICY "Allow all operations on resumes" ON public.resumes
  FOR ALL USING (true) WITH CHECK (true);

-- Courses policies (read-only for students, full access for TPO)
CREATE POLICY "Allow all operations on courses" ON public.courses
  FOR ALL USING (true) WITH CHECK (true);

-- Learning paths policies
CREATE POLICY "Allow all operations on learning_paths" ON public.learning_paths
  FOR ALL USING (true) WITH CHECK (true);

-- Placement rounds policies
CREATE POLICY "Allow all operations on placement_rounds" ON public.placement_rounds
  FOR ALL USING (true) WITH CHECK (true);

-- Shortlisted students policies
CREATE POLICY "Allow all operations on shortlisted_students" ON public.shortlisted_students
  FOR ALL USING (true) WITH CHECK (true);

-- Batch uploads policies
CREATE POLICY "Allow all operations on batch_uploads" ON public.batch_uploads
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Create updated_at trigger function
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_placement_rounds_updated_at
  BEFORE UPDATE ON public.placement_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Create indexes for better query performance
-- =============================================

CREATE INDEX idx_students_username ON public.students(username);
CREATE INDEX idx_students_department ON public.students(department);
CREATE INDEX idx_assessment_results_student ON public.assessment_results(student_username);
CREATE INDEX idx_assessment_results_track ON public.assessment_results(track);
CREATE INDEX idx_resumes_student ON public.resumes(student_username);
CREATE INDEX idx_courses_track ON public.courses(track);
CREATE INDEX idx_courses_skill ON public.courses(skill_covered);
CREATE INDEX idx_learning_paths_student ON public.learning_paths(student_username);
CREATE INDEX idx_shortlisted_round ON public.shortlisted_students(round_id);

-- =============================================
-- Enable realtime for key tables
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shortlisted_students;
