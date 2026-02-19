import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AIPrediction } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion } from 'framer-motion';
import {
  Brain, Trophy, Target, AlertCircle,
  ArrowRight, BookOpen, RefreshCw,
  CheckCircle, XCircle, TrendingUp, Sparkles, Clock, Zap,
  Code, Database, Server, Plus, GraduationCap, Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DomainResult {
  id: string;
  track: string;
  correct_answers: number;
  total_questions: number;
  level: string;
  gaps: string[];
  ai_prediction: AIPrediction | null;
  confidence_score: number | null;
  created_at: string;
}

const TRACK_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  'Programming & DSA':      { icon: Code,     color: 'text-primary',   border: 'border-primary/40',   bg: 'bg-primary/10'   },
  'Data Science & ML':      { icon: Brain,    color: 'text-accent',    border: 'border-accent/40',    bg: 'bg-accent/10'    },
  'Database Management & SQL': { icon: Database, color: 'text-secondary', border: 'border-secondary/40', bg: 'bg-secondary/10' },
  'Backend / Web Dev':      { icon: Server,   color: 'text-tertiary',  border: 'border-tertiary/40',  bg: 'bg-tertiary/10'  },
};

const getLevelColor = (level: string) => {
  if (level === 'Ready') return 'text-success';
  if (level === 'Intermediate') return 'text-accent';
  return 'text-primary';
};

const getLevelBg = (level: string) => {
  if (level === 'Ready') return 'bg-success/20 border-success/50';
  if (level === 'Intermediate') return 'bg-accent/20 border-accent/50';
  return 'bg-primary/20 border-primary/50';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'Medium': return 'text-accent bg-accent/10 border-accent/30';
    case 'Low': return 'text-success bg-success/10 border-success/30';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { toast } = useToast();

  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<DomainResult | null>(null);

  useEffect(() => {
    loadAllResults();
  }, [username]);

  const loadAllResults = async () => {
    setIsLoading(true);
    try {
      // Fetch the LATEST result per track
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('student_username', username)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: keep latest per track
      const seen = new Set<string>();
      const deduped: DomainResult[] = [];
      for (const row of (data || [])) {
        if (!seen.has(row.track)) {
          seen.add(row.track);
          deduped.push({
            ...row,
            gaps: Array.isArray(row.gaps) ? (row.gaps as unknown as string[]) : [],
            ai_prediction: row.ai_prediction as unknown as AIPrediction | null,
          });
        }
      }

      setDomainResults(deduped);
      if (deduped.length > 0) setSelected(deduped[0]);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load results', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-sm">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-14 h-14 mx-auto mb-4">
              <Brain className="w-14 h-14 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-sm">Loading your results...</p>
          </CyberCard>
        </div>
      </div>
    );
  }

  if (domainResults.length === 0) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">No Assessments Yet</h2>
            <p className="text-muted-foreground mb-6">Take an assessment to see your personalised dashboard</p>
            <CyberButton variant="primary" onClick={() => navigate('/tracks')}>
              <Zap className="w-4 h-4 mr-2" />Take First Assessment
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    );
  }

  const s = selected!;
  const cfg = TRACK_CONFIG[s.track] ?? TRACK_CONFIG['Programming & DSA'];
  const TrackIcon = cfg.icon;
  const aiP = s.ai_prediction;
  const scorePercent = Math.round((s.correct_answers / s.total_questions) * 100);

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
                Welcome back, <span className="text-glow">{username}</span>
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {domainResults.length} domain{domainResults.length > 1 ? 's' : ''} assessed
              </p>
            </div>
            <div className="flex gap-2">
              <CyberButton variant="ghost" size="sm" onClick={() => navigate('/tracks')}>
                <Plus className="w-4 h-4 mr-1.5" />New Domain Test
              </CyberButton>
              <CyberButton variant="primary" size="sm" onClick={() => navigate('/learning-path')}>
                <GraduationCap className="w-4 h-4 mr-1.5" />Learning Paths
              </CyberButton>
            </div>
          </div>
        </motion.div>

        {/* Domain selector tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2 mb-6">
          {domainResults.map((r) => {
            const c = TRACK_CONFIG[r.track] ?? TRACK_CONFIG['Programming & DSA'];
            const Icon = c.icon;
            const active = selected?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  active ? `${c.bg} ${c.border} ${c.color}` : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{r.track}</span>
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full border ${getLevelBg(r.level)} ${getLevelColor(r.level)}`}>
                  {r.level}
                </span>
              </button>
            );
          })}

          {domainResults.length < 4 && (
            <button
              onClick={() => navigate('/tracks')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add domain</span>
            </button>
          )}
        </motion.div>

        {/* Selected domain detail */}
        <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <CyberCard delay={0.05} className="text-center p-4">
              <div className={`w-11 h-11 rounded-lg mx-auto mb-2 flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                <TrackIcon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <p className={`font-display font-bold text-base leading-tight ${cfg.color}`}>{s.track}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Domain</p>
            </CyberCard>

            <CyberCard delay={0.1} className="text-center p-4">
              <div className={`w-11 h-11 rounded-lg mx-auto mb-2 flex items-center justify-center ${getLevelBg(s.level)} border`}>
                <Trophy className={`w-5 h-5 ${getLevelColor(s.level)}`} />
              </div>
              <p className={`font-display font-bold text-xl ${getLevelColor(s.level)}`}>{s.level}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{aiP ? 'AI Level' : 'Level'}</p>
            </CyberCard>

            <CyberCard delay={0.15} className="text-center p-4">
              <div className="w-11 h-11 rounded-lg mx-auto mb-2 flex items-center justify-center bg-primary/10 border border-primary/30">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <p className="font-display font-bold text-xl">{s.correct_answers}/{s.total_questions}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Score ({scorePercent}%)</p>
            </CyberCard>

            <CyberCard delay={0.2} className="text-center p-4">
              {aiP ? (
                <>
                  <div className="w-11 h-11 rounded-lg mx-auto mb-2 flex items-center justify-center bg-success/10 border border-success/30">
                    <Sparkles className="w-5 h-5 text-success" />
                  </div>
                  <p className="font-display font-bold text-xl">{aiP.confidence.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">AI Confidence</p>
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-lg mx-auto mb-2 flex items-center justify-center bg-destructive/10 border border-destructive/30">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="font-display font-bold text-xl">{s.gaps.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Skill Gaps</p>
                </>
              )}
            </CyberCard>
          </div>

          {/* Readiness estimate */}
          {aiP && aiP.estimatedReadinessWeeks > 0 && (
            <div className="mb-6">
              <CyberCard className="bg-gradient-to-r from-accent/10 via-card to-primary/10 border-accent/30 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/20 border border-accent/50">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. time to placement ready</p>
                    <p className="font-display text-2xl font-bold text-accent">{aiP.estimatedReadinessWeeks} weeks</p>
                  </div>
                </div>
              </CyberCard>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skill gaps */}
            <CyberCard variant="glow" delay={0.25}>
              <div className="flex items-center gap-3 mb-5">
                <AlertCircle className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Identified Skill Gaps</h2>
              </div>

              {aiP && aiP.skillGaps.length > 0 ? (
                <div className="space-y-2">
                  {aiP.skillGaps.map((gap, i) => (
                    <motion.div key={gap.skill} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{gap.skill}</p>
                        <p className="text-xs text-muted-foreground">{gap.gapType} gap</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(gap.priority)}`}>{gap.priority}</span>
                    </motion.div>
                  ))}
                </div>
              ) : s.gaps.length > 0 ? (
                <div className="space-y-2">
                  {s.gaps.map((gap, i) => (
                    <motion.div key={gap} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <p className="font-medium text-sm">{gap}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="font-medium text-sm">No skill gaps — excellent proficiency!</p>
                </div>
              )}

              <div className="mt-5">
                <CyberButton variant="ghost" size="sm" onClick={() => navigate('/tracks')} className="w-full">
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />Retake {s.track}
                </CyberButton>
              </div>
            </CyberCard>

            {/* AI Recommendations */}
            <CyberCard delay={0.3}>
              <div className="flex items-center gap-3 mb-5">
                {aiP ? <Sparkles className="w-5 h-5 text-primary" /> : <TrendingUp className="w-5 h-5 text-success" />}
                <h2 className="font-display text-lg font-bold">{aiP ? 'AI Recommendations' : 'Next Steps'}</h2>
              </div>

              <div className="space-y-3">
                {aiP ? (
                  aiP.recommendations.slice(0, 4).map((rec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/40 transition-colors">
                      <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                    Complete this assessment with AI analysis enabled to get personalised recommendations.
                  </div>
                )}
              </div>

              <div className="mt-5">
                <CyberButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/learning-path', { state: { domain: s.track } })}
                >
                  <BookOpen className="w-3.5 h-3.5 mr-2" />View Learning Path for {s.track}
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </CyberButton>
              </div>
            </CyberCard>
          </div>

          {/* All Domains Summary */}
          {domainResults.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
              <CyberCard className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border-primary/30">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />All Domain Tests ({domainResults.length}/4)
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {domainResults.map((r) => {
                    const c = TRACK_CONFIG[r.track] ?? TRACK_CONFIG['Programming & DSA'];
                    const Icon = c.icon;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { setSelected(r); navigate('/learning-path', { state: { domain: r.track } }); }}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${c.bg} ${c.border}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${c.color}`} />
                          <span className={`text-xs font-bold ${c.color} truncate`}>{r.track}</span>
                        </div>
                        <p className={`text-lg font-display font-bold ${getLevelColor(r.level)}`}>{r.level}</p>
                        <p className="text-xs text-muted-foreground">{r.correct_answers}/{r.total_questions} correct</p>
                        <p className={`text-xs mt-1 ${c.color}`}>View Path →</p>
                      </button>
                    );
                  })}
                </div>
              </CyberCard>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
