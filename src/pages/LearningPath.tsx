import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, CheckCircle, Clock, ExternalLink, Filter,
  GraduationCap, Lightbulb, Loader2, MapPin, RefreshCw, Sparkles,
  Star, Target, TrendingUp, AlertTriangle, ArrowRight, Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface CourseRecommendation {
  course: {
    id: string;
    title: string;
    platform: string;
    skill_covered: string;
    track: string;
    difficulty_level: string;
    is_free: boolean;
    rating: number | null;
    duration_hours: number | null;
    url: string;
    instructor: string | null;
    description: string | null;
  };
  addressesGap: string;
  reason: string;
  priority: number;
}

interface SkillGap {
  skill: string;
  gapType: string;
  priority: string;
}

interface AssessmentData {
  track: string;
  level: string;
  gaps: string[];
  ai_prediction: any;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-destructive/20 border-destructive/30 text-destructive';
    case 'Medium': return 'bg-accent/20 border-accent/30 text-accent';
    case 'Low': return 'bg-success/20 border-success/30 text-success';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'Beginner': return 'text-success';
    case 'Intermediate': return 'text-accent';
    case 'Advanced': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

const LearningPath = () => {
  const navigate = useNavigate();
  const { username, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [studyTips, setStudyTips] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [noAssessment, setNoAssessment] = useState(false);

  const skillGaps: SkillGap[] = assessmentData?.ai_prediction?.skillGaps || 
    (assessmentData?.gaps || []).map((g: string) => ({ skill: g, gapType: 'Conceptual', priority: 'High' }));

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    loadData();
  }, [username, isLoggedIn]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch latest assessment
      const { data: assessments, error: assessErr } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('student_username', username)
        .order('created_at', { ascending: false })
        .limit(1);

      if (assessErr) throw assessErr;

      if (!assessments || assessments.length === 0) {
        setNoAssessment(true);
        setIsLoading(false);
        return;
      }

      const latest = assessments[0];
      setAssessmentData(latest as unknown as AssessmentData);

      // Fetch completed learning paths
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('course_id, is_completed')
        .eq('student_username', username)
        .eq('is_completed', true);

      if (paths) {
        setCompletedCourses(new Set(paths.map(p => p.course_id).filter(Boolean) as string[]));
      }

      // Fetch all courses
      const { data: courses, error: coursesErr } = await supabase
        .from('courses')
        .select('*');

      if (coursesErr) throw coursesErr;

      // Generate AI recommendations
      await generateRecommendations(latest as unknown as AssessmentData, courses || []);
    } catch (err: any) {
      console.error('Failed to load learning path data:', err);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = async (assessment: AssessmentData, courses: any[]) => {
    setIsGenerating(true);
    try {
      const gaps = assessment.ai_prediction?.skillGaps || 
        (assessment.gaps || []).map((g: string) => ({ skill: g, gapType: 'Conceptual', priority: 'High' }));

      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: { skillGaps: gaps, track: assessment.track, courses },
      });

      if (error) throw error;

      if (data?.success) {
        setRecommendations(data.recommendations || []);
        setStudyTips(data.studyTips || []);
      } else {
        throw new Error(data?.error || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      console.error('AI recommendation error:', err);
      // Fallback: show courses matching gap keywords
      const gaps = assessment.gaps || [];
      const fallback = courses
        .filter(c => gaps.some((g: string) => 
          c.skill_covered?.toLowerCase().includes(g.toLowerCase()) || 
          c.title?.toLowerCase().includes(g.toLowerCase())
        ))
        .slice(0, 8)
        .map((c, i) => ({
          course: c,
          addressesGap: gaps[0] || 'General',
          reason: `Covers ${c.skill_covered} which matches your identified gaps.`,
          priority: i + 1,
        }));
      setRecommendations(fallback);
      toast({ title: 'Note', description: 'Using keyword-based recommendations. AI service unavailable.', variant: 'default' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCourseComplete = async (courseId: string, gap: string) => {
    const isCompleted = completedCourses.has(courseId);
    const updated = new Set(completedCourses);

    if (isCompleted) {
      updated.delete(courseId);
      await supabase
        .from('learning_paths')
        .delete()
        .eq('student_username', username)
        .eq('course_id', courseId);
    } else {
      updated.add(courseId);
      await supabase
        .from('learning_paths')
        .insert({
          student_username: username,
          course_id: courseId,
          skill_gap: gap,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
    }
    setCompletedCourses(updated);
  };

  const filteredRecs = filterPriority
    ? recommendations.filter(r => {
        const gap = skillGaps.find(g => g.skill === r.addressesGap);
        return gap?.priority === filterPriority;
      })
    : recommendations;

  const progressPercent = recommendations.length > 0
    ? Math.round((recommendations.filter(r => completedCourses.has(r.course.id)).length / recommendations.length) * 100)
    : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
              <Brain className="w-16 h-16 text-primary" />
            </motion.div>
            <h3 className="font-display text-xl font-bold mb-2">Loading Your Learning Path</h3>
            <p className="text-muted-foreground text-sm">Analyzing your assessment results...</p>
          </CyberCard>
        </div>
      </div>
    );
  }

  // No assessment state
  if (noAssessment) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <Target className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No Assessment Found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Complete an assessment first so we can identify your skill gaps and recommend courses.
            </p>
            <CyberButton variant="primary" onClick={() => navigate('/tracks')}>
              <Zap className="w-4 h-4 mr-2" />
              Take Assessment
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Your Learning Path</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Personalized course recommendations based on your <span className="text-primary font-medium">{assessmentData?.track}</span> assessment
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CyberCard variant="glow" className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-primary">{skillGaps.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Skill Gaps</p>
          </CyberCard>
          <CyberCard variant="glow" className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-accent">{recommendations.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Courses Recommended</p>
          </CyberCard>
          <CyberCard variant="glow" className="p-4 text-center">
            <p className={`text-2xl font-display font-bold ${
              assessmentData?.level === 'Ready' ? 'text-success' :
              assessmentData?.level === 'Intermediate' ? 'text-accent' : 'text-primary'
            }`}>{assessmentData?.level}</p>
            <p className="text-xs text-muted-foreground mt-1">Current Level</p>
          </CyberCard>
          <CyberCard variant="glow" className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-success">{progressPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CyberCard>
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
          <CyberCard variant="default" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Learning Progress
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                {recommendations.filter(r => completedCourses.has(r.course.id)).length}/{recommendations.length} courses
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CyberCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Skill Gaps & Tips */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Skill Gaps */}
            <CyberCard variant="accent" className="p-5">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Identified Gaps
              </h3>
              <div className="space-y-2">
                {skillGaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border"
                  >
                    <span className="text-sm font-medium text-foreground">{gap.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CyberCard>

            {/* Study Tips */}
            {studyTips.length > 0 && (
              <CyberCard variant="secondary" className="p-5">
                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-secondary" />
                  Study Tips
                </h3>
                <div className="space-y-3">
                  {studyTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </CyberCard>
            )}

            {/* Filter */}
            <CyberCard variant="default" className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                Filter by Priority
              </h4>
              <div className="flex flex-wrap gap-2">
                {['High', 'Medium', 'Low'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      filterPriority === p
                        ? getPriorityColor(p)
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {filterPriority && (
                  <button
                    onClick={() => setFilterPriority(null)}
                    className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </CyberCard>

            <CyberButton variant="ghost" size="md" onClick={loadData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Path
            </CyberButton>
          </motion.div>

          {/* Right Column - Course Recommendations */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Recommended Courses
              </h2>
              {isGenerating && (
                <span className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </span>
              )}
            </div>

            {filteredRecs.length === 0 && !isGenerating ? (
              <CyberCard variant="default" className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No matching courses found for this filter.</p>
              </CyberCard>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredRecs.map((rec, index) => {
                    const isCompleted = completedCourses.has(rec.course.id);
                    return (
                      <motion.div
                        key={rec.course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.06 }}
                      >
                        <CyberCard
                          variant={isCompleted ? 'secondary' : 'default'}
                          animated={false}
                          className={`p-5 transition-all ${isCompleted ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Priority Number */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-display font-bold text-lg ${
                              isCompleted ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
                            }`}>
                              {isCompleted ? <CheckCircle className="w-5 h-5" /> : rec.priority}
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Title Row */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className={`font-medium text-lg ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {rec.course.title}
                                  </h3>
                                  {rec.course.instructor && (
                                    <p className="text-sm text-muted-foreground">by {rec.course.instructor}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {rec.course.is_free && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 border border-success/30 text-success font-medium">
                                      FREE
                                    </span>
                                  )}
                                  <span className={`text-xs font-mono ${getDifficultyColor(rec.course.difficulty_level)}`}>
                                    {rec.course.difficulty_level}
                                  </span>
                                </div>
                              </div>

                              {/* Meta Row */}
                              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {rec.course.platform}
                                </span>
                                {rec.course.duration_hours && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {rec.course.duration_hours}h
                                  </span>
                                )}
                                {rec.course.rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-accent" /> {rec.course.rating}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-muted border border-border">
                                  {rec.course.skill_covered}
                                </span>
                              </div>

                              {/* AI Reason */}
                              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Addresses: </span>
                                    <span className="text-primary">{rec.addressesGap}</span>
                                    {' — '}{rec.reason}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCourseComplete(rec.course.id, rec.addressesGap)}
                                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all ${
                                    isCompleted
                                      ? 'bg-success/20 border-success/30 text-success'
                                      : 'border-border text-muted-foreground hover:border-success/50 hover:text-success'
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {isCompleted ? 'Completed' : 'Mark Complete'}
                                </button>
                                <a
                                  href={rec.course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Open Course
                                </a>
                              </div>
                            </div>
                          </div>
                        </CyberCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
