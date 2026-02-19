
-- Create domain_skills table
CREATE TABLE IF NOT EXISTS public.domain_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL,
  skill text NOT NULL,
  skill_type text NOT NULL CHECK (skill_type IN ('required', 'bonus')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_skills ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth needed to read skill sets)
CREATE POLICY "Anyone can read domain skills"
  ON public.domain_skills FOR SELECT USING (true);

-- Index for fast domain lookups
CREATE INDEX idx_domain_skills_domain ON public.domain_skills(domain);

-- Seed: Programming & DSA - required
INSERT INTO public.domain_skills (domain, skill, skill_type) VALUES
  ('Programming & DSA', 'Data Structures', 'required'),
  ('Programming & DSA', 'Algorithms', 'required'),
  ('Programming & DSA', 'Dynamic Programming', 'required'),
  ('Programming & DSA', 'Graphs', 'required'),
  ('Programming & DSA', 'Trees', 'required'),
  ('Programming & DSA', 'Arrays', 'required'),
  ('Programming & DSA', 'Linked Lists', 'required'),
  ('Programming & DSA', 'Stacks & Queues', 'required'),
  ('Programming & DSA', 'Recursion', 'required'),
  ('Programming & DSA', 'Sorting & Searching', 'required'),
  ('Programming & DSA', 'Hash Maps', 'required'),
  ('Programming & DSA', 'Binary Search', 'required'),
  ('Programming & DSA', 'Time Complexity', 'required'),
  ('Programming & DSA', 'Space Complexity', 'required'),
  ('Programming & DSA', 'Bit Manipulation', 'required'),
-- Programming & DSA - bonus
  ('Programming & DSA', 'C++', 'bonus'),
  ('Programming & DSA', 'Java', 'bonus'),
  ('Programming & DSA', 'Python', 'bonus'),
  ('Programming & DSA', 'Competitive Programming', 'bonus'),
  ('Programming & DSA', 'LeetCode', 'bonus'),
  ('Programming & DSA', 'CodeForces', 'bonus'),
  ('Programming & DSA', 'Backtracking', 'bonus'),
  ('Programming & DSA', 'Greedy Algorithms', 'bonus'),
  ('Programming & DSA', 'Segment Trees', 'bonus'),
  ('Programming & DSA', 'Trie', 'bonus'),
-- Data Science & ML - required
  ('Data Science & ML', 'Python', 'required'),
  ('Data Science & ML', 'Machine Learning', 'required'),
  ('Data Science & ML', 'Deep Learning', 'required'),
  ('Data Science & ML', 'Data Analysis', 'required'),
  ('Data Science & ML', 'Statistics', 'required'),
  ('Data Science & ML', 'Pandas', 'required'),
  ('Data Science & ML', 'NumPy', 'required'),
  ('Data Science & ML', 'Scikit-learn', 'required'),
  ('Data Science & ML', 'Data Visualization', 'required'),
  ('Data Science & ML', 'Feature Engineering', 'required'),
  ('Data Science & ML', 'Model Evaluation', 'required'),
  ('Data Science & ML', 'Regression', 'required'),
  ('Data Science & ML', 'Classification', 'required'),
  ('Data Science & ML', 'Neural Networks', 'required'),
-- Data Science & ML - bonus
  ('Data Science & ML', 'TensorFlow', 'bonus'),
  ('Data Science & ML', 'PyTorch', 'bonus'),
  ('Data Science & ML', 'Keras', 'bonus'),
  ('Data Science & ML', 'NLP', 'bonus'),
  ('Data Science & ML', 'Computer Vision', 'bonus'),
  ('Data Science & ML', 'Jupyter Notebook', 'bonus'),
  ('Data Science & ML', 'Matplotlib', 'bonus'),
  ('Data Science & ML', 'Seaborn', 'bonus'),
  ('Data Science & ML', 'XGBoost', 'bonus'),
  ('Data Science & ML', 'Transformers', 'bonus'),
  ('Data Science & ML', 'HuggingFace', 'bonus'),
-- Database Management & SQL - required
  ('Database Management & SQL', 'SQL', 'required'),
  ('Database Management & SQL', 'Database Design', 'required'),
  ('Database Management & SQL', 'Normalization', 'required'),
  ('Database Management & SQL', 'Indexing', 'required'),
  ('Database Management & SQL', 'Joins', 'required'),
  ('Database Management & SQL', 'Stored Procedures', 'required'),
  ('Database Management & SQL', 'ACID Properties', 'required'),
  ('Database Management & SQL', 'Transactions', 'required'),
  ('Database Management & SQL', 'Query Optimization', 'required'),
  ('Database Management & SQL', 'ER Diagrams', 'required'),
  ('Database Management & SQL', 'Relational Databases', 'required'),
-- Database Management & SQL - bonus
  ('Database Management & SQL', 'MySQL', 'bonus'),
  ('Database Management & SQL', 'PostgreSQL', 'bonus'),
  ('Database Management & SQL', 'MongoDB', 'bonus'),
  ('Database Management & SQL', 'Redis', 'bonus'),
  ('Database Management & SQL', 'NoSQL', 'bonus'),
  ('Database Management & SQL', 'Data Modeling', 'bonus'),
  ('Database Management & SQL', 'Views & Triggers', 'bonus'),
  ('Database Management & SQL', 'Oracle', 'bonus'),
  ('Database Management & SQL', 'Firebase', 'bonus'),
  ('Database Management & SQL', 'Cassandra', 'bonus'),
-- Backend / Web Dev - required
  ('Backend / Web Dev', 'REST API', 'required'),
  ('Backend / Web Dev', 'Node.js', 'required'),
  ('Backend / Web Dev', 'Express.js', 'required'),
  ('Backend / Web Dev', 'Authentication', 'required'),
  ('Backend / Web Dev', 'HTTP', 'required'),
  ('Backend / Web Dev', 'Git', 'required'),
  ('Backend / Web Dev', 'JavaScript', 'required'),
  ('Backend / Web Dev', 'TypeScript', 'required'),
  ('Backend / Web Dev', 'JSON', 'required'),
  ('Backend / Web Dev', 'MVC Architecture', 'required'),
  ('Backend / Web Dev', 'Database Integration', 'required'),
  ('Backend / Web Dev', 'Error Handling', 'required'),
  ('Backend / Web Dev', 'Middleware', 'required'),
-- Backend / Web Dev - bonus
  ('Backend / Web Dev', 'Docker', 'bonus'),
  ('Backend / Web Dev', 'JWT', 'bonus'),
  ('Backend / Web Dev', 'OAuth', 'bonus'),
  ('Backend / Web Dev', 'Microservices', 'bonus'),
  ('Backend / Web Dev', 'GraphQL', 'bonus'),
  ('Backend / Web Dev', 'WebSockets', 'bonus'),
  ('Backend / Web Dev', 'CI/CD', 'bonus'),
  ('Backend / Web Dev', 'AWS', 'bonus'),
  ('Backend / Web Dev', 'Nginx', 'bonus'),
  ('Backend / Web Dev', 'Redis', 'bonus'),
  ('Backend / Web Dev', 'Kubernetes', 'bonus');
