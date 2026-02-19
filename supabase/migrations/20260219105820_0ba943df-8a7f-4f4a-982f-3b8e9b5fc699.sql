CREATE TABLE public.learning_path_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_username TEXT NOT NULL,
  track TEXT NOT NULL,
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_username, track)
);

ALTER TABLE public.learning_path_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on learning_path_tips"
ON public.learning_path_tips
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_learning_path_tips_updated_at
BEFORE UPDATE ON public.learning_path_tips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();