import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, CheckCircle, Clock, ExternalLink, Filter,
  GraduationCap, Lightbulb, Loader2, RefreshCw, Sparkles,
  Star, Target, TrendingUp, AlertTriangle, Zap, Code, Database, Server,
  ChevronRight, Layers, Plus
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

interface SkillGap { skill: string; gapType: string; priority: string; }

interface AssessmentData {
  id: string;
  track: string;
  level: string;
  gaps: string[];
  ai_prediction: any;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}

const TRACK_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  'Programming & DSA':         { icon: Code,     color: 'text-primary',   border: 'border-primary/40',   bg: 'bg-primary/10'   },
  'Data Science & ML':         { icon: Brain,    color: 'text-accent',    border: 'border-accent/40',    bg: 'bg-accent/10'    },
  'Database Management & SQL': { icon: Database, color: 'text-secondary', border: 'border-secondary/40', bg: 'bg-secondary/10' },
  'Backend / Web Dev':         { icon: Server,   color: 'text-tertiary',  border: 'border-tertiary/40',  bg: 'bg-tertiary/10'  },
};

const getPriorityColor = (p: string) => {
  switch (p) {
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

// ─────────────────────────────────────────────────────────────────────────────

const LearningPath = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, isLoggedIn } = useAuth();
  const { toast } = useToast();

  // All attempted domains
  const [allAssessments, setAllAssessments] = useState<AssessmentData[]>([]);
  // Currently viewed domain
  const [activeDomain, setActiveDomain] = useState<string | null>(location.state?.domain ?? null);

  // Per-domain learning state
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [studyTips, setStudyTips] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const skillGaps: SkillGap[] =
    assessmentData?.ai_prediction?.skillGaps ||
    (assessmentData?.gaps || []).map((g: string) => ({ skill: g, gapType: 'Conceptual', priority: 'High' }));

  // ── 1. Load all distinct attempted domains ────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { navigate('/'); return; }
    loadAllDomains();
  }, [username, isLoggedIn]);

  const loadAllDomains = async () => {
    setIsLoadingDomains(true);
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('student_username', username)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: latest per track
      const seen = new Set<string>();
      const deduped: AssessmentData[] = [];
      for (const row of (data || [])) {
        if (!seen.has(row.track)) {
          seen.add(row.track);
          deduped.push({ ...row, gaps: Array.isArray(row.gaps) ? (row.gaps as unknown as string[]) : [] });
        }
      }
      setAllAssessments(deduped);

      // Select domain: from nav state → first available
      const target = location.state?.domain || (deduped[0]?.track ?? null);
      setActiveDomain(target);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load assessments', variant: 'destructive' });
    } finally {
      setIsLoadingDomains(false);
    }
  };

  // ── 2. Load learning path for active domain whenever it changes ───────────
  useEffect(() => {
    if (!activeDomain || allAssessments.length === 0) return;
    const assessment = allAssessments.find(a => a.track === activeDomain);
    if (!assessment) return;

    setAssessmentData(assessment);
    setRecommendations([]);
    setStudyTips([]);
    setFilterPriority(null);
    loadLearningPath(assessment);
  }, [activeDomain, allAssessments]);

  const loadLearningPath = async (assessment: AssessmentData) => {
    setIsGenerating(true);
    try {
      // Fetch completed courses for this student
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('course_id, is_completed')
        .eq('student_username', username)
        .eq('is_completed', true);

      if (paths) {
        setCompletedCourses(new Set(paths.map(p => p.course_id).filter(Boolean) as string[]));
      }

      // Fetch all courses for this track
      const { data: courses, error: coursesErr } = await supabase
        .from('courses')
        .select('*')
        .eq('track', assessment.track);

      if (coursesErr) throw coursesErr;

      // Also fetch all courses for broader matching if track-specific is thin
      const { data: allCourses } = await supabase.from('courses').select('*');

      await generateRecommendations(assessment, allCourses || courses || []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load learning path', variant: 'destructive' });
      setIsGenerating(false);
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
        throw new Error(data?.error || 'Failed');
      }
    } catch (err: any) {
      // Fallback
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
      toast({ title: 'Note', description: 'Using keyword recommendations — AI unavailable.', variant: 'default' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCourseComplete = async (courseId: string, gap: string) => {
    const isCompleted = completedCourses.has(courseId);
    const updated = new Set(completedCourses);
    if (isCompleted) {
      updated.delete(courseId);
      await supabase.from('learning_paths').delete().eq('student_username', username).eq('course_id', courseId);
    } else {
      updated.add(courseId);
      await supabase.from('learning_paths').insert({
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoadingDomains) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 mx-auto mb-4">
              <Brain className="w-16 h-16 text-primary" />
            </motion.div>
            <h3 className="font-display text-xl font-bold mb-2">Loading Your Learning Paths</h3>
            <p className="text-muted-foreground text-sm">Fetching your assessment results...</p>
          </CyberCard>
        </div>
      </div>
    );
  }

  // ── No assessments ─────────────────────────────────────────────────────────
  if (allAssessments.length === 0) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <Target className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No Assessments Found</h3>
            <p className="text-muted-foreground text-sm mb-6">Take at least one domain assessment to generate a learning path.</p>
            <CyberButton variant="primary" onClick={() => navigate('/tracks')}>
              <Zap className="w-4 h-4 mr-2" />Take Assessment
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    );
  }

  const cfg = TRACK_CONFIG[activeDomain ?? ''] ?? TRACK_CONFIG['Programming & DSA'];

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 max-w-6xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="w-7 h-7 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Learning Paths</h1>
          </div>
          <p className="text-muted-foreground">
            {allAssessments.length} domain{allAssessments.length > 1 ? 's' : ''} assessed — select one to view its personalised path
          </p>
        </motion.div>

        {/* ── Domain selector ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="flex flex-wrap gap-2">
            {allAssessments.map((a) => {
              const c = TRACK_CONFIG[a.track] ?? TRACK_CONFIG['Programming & DSA'];
              const Icon = c.icon;
              const active = activeDomain === a.track;
              const scorePercent = Math.round((a.correct_answers / a.total_questions) * 100);
              return (
                <motion.button
                  key={a.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveDomain(a.track)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                    active ? `${c.bg} ${c.border} shadow-sm` : 'bg-muted/40 border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? c.color : 'text-muted-foreground'}`} />
                  <span className={`font-medium text-sm ${active ? c.color : 'text-muted-foreground'}`}>{a.track}</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${active ? 'bg-foreground/10' : 'bg-muted'} ${active ? c.color : 'text-muted-foreground'}`}>
                    {scorePercent}%
                  </span>
                </motion.button>
              );
            })}

            {allAssessments.length < 4 && (
              <button
                onClick={() => navigate('/tracks')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Take another test</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Active domain content ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {assessmentData && (
            <motion.div
              key={assessmentData.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <CyberCard variant="glow" className="p-4 text-center">
                  <p className={`text-3xl font-display font-bold ${cfg.color}`}>{skillGaps.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skill Gaps</p>
                </CyberCard>
                <CyberCard variant="glow" className="p-4 text-center">
                  <p className="text-3xl font-display font-bold text-accent">{recommendations.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Courses</p>
                </CyberCard>
                <CyberCard variant="glow" className="p-4 text-center">
                  <p className={`text-2xl font-display font-bold ${
                    assessmentData.level === 'Ready' ? 'text-success' :
                    assessmentData.level === 'Intermediate' ? 'text-accent' : 'text-primary'
                  }`}>{assessmentData.level}</p>
                  <p className="text-xs text-muted-foreground mt-1">Level</p>
                </CyberCard>
                <CyberCard variant="glow" className="p-4 text-center">
                  <p className="text-3xl font-display font-bold text-success">{progressPercent}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </CyberCard>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <CyberCard variant="default" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Progress — {assessmentData.track}
                    </span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {recommendations.filter(r => completedCourses.has(r.course.id)).length}/{recommendations.length}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2.5" />
                </CyberCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-5">
                  {/* Skill Gaps */}
                  <CyberCard variant="accent" className="p-5">
                    <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-accent" />Identified Gaps
                    </h3>
                    <div className="space-y-1.5">
                      {skillGaps.map((gap, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                          <span className="text-xs font-medium">{gap.skill}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(gap.priority)}`}>{gap.priority}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CyberCard>

                  {/* Study Tips */}
                  {studyTips.length > 0 && (
                    <CyberCard variant="secondary" className="p-5">
                      <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-secondary" />Study Tips
                      </h3>
                      <div className="space-y-2">
                        {studyTips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Sparkles className="w-3 h-3 text-secondary mt-0.5 shrink-0" />
                            <p>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CyberCard>
                  )}

                  {/* Filter */}
                  <CyberCard variant="default" className="p-4">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />Filter by Priority
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['High', 'Medium', 'Low'].map(p => (
                        <button key={p} onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${filterPriority === p ? getPriorityColor(p) : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                          {p}
                        </button>
                      ))}
                      {filterPriority && (
                        <button onClick={() => setFilterPriority(null)} className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground">
                          Clear
                        </button>
                      )}
                    </div>
                  </CyberCard>

                  <CyberButton variant="ghost" size="sm" onClick={() => loadLearningPath(assessmentData)} className="w-full" disabled={isGenerating}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />Regenerate Path
                  </CyberButton>
                </motion.div>

                {/* Course recommendations */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />Recommended Courses
                    </h2>
                    {isGenerating && (
                      <span className="flex items-center gap-1.5 text-xs text-primary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…
                      </span>
                    )}
                  </div>

                  {filteredRecs.length === 0 && !isGenerating ? (
                    <CyberCard variant="default" className="text-center py-12">
                      <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No courses found for this filter.</p>
                    </CyberCard>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredRecs.map((rec, index) => {
                          const isCompleted = completedCourses.has(rec.course.id);
                          return (
                            <motion.div key={rec.course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -16 }} transition={{ delay: index * 0.05 }}>
                              <CyberCard variant={isCompleted ? 'secondary' : 'default'} animated={false}
                                className={`p-4 transition-all ${isCompleted ? 'opacity-70' : ''}`}>
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    isCompleted ? 'bg-success/20 border border-success/50' : 'bg-primary/20 border border-primary/50'
                                  }`}>
                                    {isCompleted ? <CheckCircle className="w-5 h-5 text-success" /> : <BookOpen className="w-5 h-5 text-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <h4 className="font-display font-bold text-sm line-clamp-2">{rec.course.title}</h4>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {rec.course.is_free && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success border border-success/30">Free</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                                      <span className="font-medium text-primary">{rec.course.platform}</span>
                                      <span className={getDifficultyColor(rec.course.difficulty_level)}>{rec.course.difficulty_level}</span>
                                      {rec.course.duration_hours && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{rec.course.duration_hours}h</span>}
                                      {rec.course.rating && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-yellow-400" />{rec.course.rating}</span>}
                                      <span className={`px-1.5 py-0.5 rounded border text-xs ${getPriorityColor(skillGaps.find(g => g.skill === rec.addressesGap)?.priority || 'Medium')}`}>
                                        Covers: {rec.addressesGap}
                                      </span>
                                    </div>

                                    {rec.reason && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{rec.reason}</p>
                                    )}

                                    <div className="flex gap-2">
                                      <a href={rec.course.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <ExternalLink className="w-3 h-3" />Start Course
                                      </a>
                                      <button onClick={() => toggleCourseComplete(rec.course.id, rec.addressesGap)}
                                        className={`flex items-center gap-1 text-xs transition-colors ${isCompleted ? 'text-success hover:text-muted-foreground' : 'text-muted-foreground hover:text-success'}`}>
                                        <CheckCircle className="w-3 h-3" />
                                        {isCompleted ? 'Completed' : 'Mark done'}
                                      </button>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LearningPath;
