import { useState, useRef } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, MessageSquare, Check, X, Bot, Send, Loader2,
  Target, TrendingUp, Award, AlertCircle, Code, Brain, Database, Server,
  Linkedin, Globe, User, Briefcase, Users, Star, ChevronRight,
  Sparkles, CheckCircle2, XCircle, Zap, BookOpen, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import FloatingTPOChat from '@/components/FloatingTPOChat';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { Progress } from '@/components/ui/progress';
import { useResumeChat } from '@/hooks/useResumeChat';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────
type Domain = 'Programming & DSA' | 'Data Science & ML' | 'Database Management & SQL' | 'Backend / Web Dev';
type AnalysisMode = 'resume' | 'linkedin';

interface DomainResumeAnalysis {
  domain: string;
  candidateName: string | null;
  overallScore: number;
  skillMatchScore: number;
  projectQualityScore: number;
  experienceScore: number;
  resumeStructureScore: number;
  actionVerbsScore: number;
  consistencyScore: number; // required by ResumeAnalysis type (same as resumeStructureScore)
  extractedSkills: string[];
  matchedRequired: string[];
  matchedBonus: string[];
  missingRequired: string[];
  missingBonus: string[];
  domainRequiredSkills: string[];
  domainBonusSkills: string[];
  suggestions: string[];
  strengths: string[];
  summary: string;
  hasSections: {
    skills: boolean;
    experience: boolean;
    education: boolean;
    projects: boolean;
    summary: boolean;
  };
  projectCount: number;
  yearsExperience: number;
  // legacy compat for chat hook
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  fileName: string;
}

interface LinkedInAnalysis {
  overallScore: number;
  headline?: string;
  name?: string;
  skillMatchScore: number;
  projectQualityScore: number;
  experienceScore: number;
  profileCompletenessScore: number;
  networkStrengthScore: number;
  contentQualityScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

// ── Domain config ─────────────────────────────────────────────────────────────
type DomainOption = Domain | 'Overall';

const DOMAINS: { id: DomainOption; label: string; icon: React.ElementType; color: string; description: string }[] = [
  {
    id: 'Overall',
    label: 'Overall Check',
    icon: Sparkles,
    color: 'primary',
    description: 'General resume quality — no specific domain required',
  },
  {
    id: 'Programming & DSA',
    label: 'Programming & DSA',
    icon: Code,
    color: 'primary',
    description: 'Data structures, algorithms, competitive programming',
  },
  {
    id: 'Data Science & ML',
    label: 'Data Science & ML',
    icon: Brain,
    color: 'accent',
    description: 'Python, ML/DL frameworks, data analysis, statistics',
  },
  {
    id: 'Database Management & SQL',
    label: 'Database & SQL',
    icon: Database,
    color: 'secondary',
    description: 'SQL, NoSQL, database design, query optimization',
  },
  {
    id: 'Backend / Web Dev',
    label: 'Backend / Web Dev',
    icon: Server,
    color: 'tertiary',
    description: 'Node.js, REST APIs, auth, Docker, cloud',
  },
];

// ── Helper components ─────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 100 }: { score: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'hsl(145,80%,45%)' : score >= 40 ? 'hsl(35,100%,55%)' : 'hsl(0,84%,60%)';

  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(220,20%,18%)" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="font-display font-bold text-xl" style={{ color }}>{score}%</span>
    </div>
  );
};

const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className={`font-mono font-bold text-xs ${score >= 70 ? 'text-success' : score >= 40 ? 'text-accent' : 'text-destructive'}`}>{score}%</span>
    </div>
    <Progress value={score} className="h-1.5" />
  </div>
);

const SkillPill = ({ skill, matched }: { skill: string; matched: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${
    matched
      ? 'bg-success/10 text-success border-success/30'
      : 'bg-destructive/10 text-destructive border-destructive/30'
  }`}>
    {matched ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
    {skill}
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────
const ResumeAnalysisPage = () => {
  const { username } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('resume');

  // Step 1: domain selection
  const [selectedDomain, setSelectedDomain] = useState<DomainOption | null>(null);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<DomainResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinProfileText, setLinkedinProfileText] = useState('');
  const [linkedinAnalysis, setLinkedinAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [isAnalyzingLinkedin, setIsAnalyzingLinkedin] = useState(false);

  // AI Chat
  const { messages: chatMessages, isLoading: isTyping, sendMessage, initializeChat, clearChat } = useResumeChat({ resumeAnalysis: resumeAnalysis as any, username });
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setResumeFile(file);
        setResumeAnalysis(null);
      } else {
        toast({ title: 'PDF Only', description: 'Please upload a PDF file.', variant: 'destructive' });
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeFile || !selectedDomain) return;
    setIsAnalyzing(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();

      const form = new FormData();
      form.append('resume', resumeFile);
      form.append('domain', selectedDomain ?? 'Overall');

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/resume-analyze`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const a = data.analysis;
      // Normalise to the shape the chat hook expects
      const normalized: DomainResumeAnalysis = {
        ...a,
        fileName: resumeFile.name,
        matchedSkills: [...(a.matchedRequired || []), ...(a.matchedBonus || [])],
        missingSkills: a.missingRequired || [],
        recommendations: a.suggestions || [],
        consistencyScore: a.resumeStructureScore,
      };

      setResumeAnalysis(normalized);
      initializeChat(normalized as any, resumeFile.name);
      setChatOpen(true);

      // Persist to DB
      await supabase.from('resumes').upsert({
        student_username: username,
        file_name: resumeFile.name,
        overall_score: normalized.overallScore,
        skills_found: normalized.matchedSkills,
        analysis_json: normalized as any,
      }, { onConflict: 'student_username' });

    } catch (err: any) {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeAnalysis(null);
    clearChat();
    setChatOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeLinkedin = async () => {
    if (!linkedinUrl.trim() && !linkedinProfileText.trim()) {
      toast({ title: 'Input Required', description: 'Provide a URL or paste profile content.', variant: 'destructive' });
      return;
    }
    setIsAnalyzingLinkedin(true);
    setLinkedinAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-analyze', {
        body: { linkedinUrl: linkedinUrl.trim() || undefined, profileText: linkedinProfileText.trim() || undefined, track: selectedDomain },
      });
      if (error) throw error;
      if (data?.success && data?.analysis) {
        setLinkedinAnalysis(data.analysis);
      } else {
        throw new Error(data?.error || 'Could not analyze profile');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendMessage(msg);
  };

  // ── Domain gate (step 1) ───────────────────────────────────────────────────
  const DomainSelector = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <CyberCard variant="glow" className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Select Your Target Domain</h2>
            <p className="text-sm text-muted-foreground">Skills will be evaluated against this domain's requirements</p>
          </div>
        </div>
        <div className="space-y-3">
          {/* Overall Check — full width row */}
          {(() => {
            const overall = DOMAINS.find(d => d.id === 'Overall')!;
            const Icon = overall.icon;
            const active = selectedDomain === overall.id;
            return (
              <motion.button
                key={overall.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedDomain(overall.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                  active ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-primary/20 border border-primary/50' : 'bg-muted border border-border'
                  }`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`font-display font-bold text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{overall.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{overall.description}</p>
                  </div>
                  {active && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                </div>
              </motion.button>
            );
          })()}

          {/* 4 domain options — 2x2 grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {DOMAINS.filter(d => d.id !== 'Overall').map((d) => {
              const Icon = d.icon;
              const active = selectedDomain === d.id;
              return (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDomain(d.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                    active
                      ? `border-${d.color} bg-${d.color}/10`
                      : 'border-border bg-muted/30 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? `bg-${d.color}/20 border border-${d.color}/50` : 'bg-muted border border-border'
                    }`}>
                      <Icon className={`w-5 h-5 ${active ? `text-${d.color}` : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`font-display font-bold text-sm ${active ? `text-${d.color}` : 'text-foreground'}`}>{d.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    </div>
                    {active && <CheckCircle2 className={`w-4 h-4 text-${d.color} ml-auto shrink-0 mt-0.5`} />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </CyberCard>
    </motion.div>
  );

  // ── Resume Results ─────────────────────────────────────────────────────────
  const ResumeResults = () => {
    if (!resumeAnalysis) return null;
    const ra = resumeAnalysis;
    const totalRequired = ra.domainRequiredSkills?.length || 1;
    const matchedReqCount = ra.matchedRequired?.length || 0;
    const matchPct = Math.round((matchedReqCount / totalRequired) * 100);

    return (
      <div className="space-y-5">
        {/* Overall + candidate */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30">
          <div>
            {ra.candidateName && <p className="font-display font-bold text-lg">{ra.candidateName}</p>}
            <p className="text-sm text-muted-foreground">Target: <span className="text-primary font-mono">{ra.domain}</span></p>
            <p className="text-xs text-muted-foreground mt-1">{ra.projectCount} projects · {ra.yearsExperience}+ yrs exp</p>
          </div>
          <ScoreRing score={ra.overallScore} size={88} />
        </div>

        {/* Score breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Score Breakdown</p>
          <ScoreBar label="Skill Match (40%)" score={ra.skillMatchScore} icon={Target} />
          <ScoreBar label="Project Quality (25%)" score={ra.projectQualityScore} icon={Code} />
          <ScoreBar label="Experience (15%)" score={ra.experienceScore} icon={TrendingUp} />
          <ScoreBar label="Resume Structure (10%)" score={ra.resumeStructureScore} icon={FileText} />
          <ScoreBar label="Action Verbs (10%)" score={ra.actionVerbsScore} icon={Award} />
        </div>

        {/* Domain skill match — hidden for Overall mode */}
        {ra.domain !== 'Overall' && ra.domainRequiredSkills?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Domain Skill Match</p>
              <span className={`text-xs font-mono font-bold ${matchPct >= 70 ? 'text-success' : matchPct >= 40 ? 'text-accent' : 'text-destructive'}`}>
                {matchedReqCount}/{totalRequired} required
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ra.domainRequiredSkills?.map(skill => (
                <SkillPill
                  key={skill}
                  skill={skill}
                  matched={ra.matchedRequired?.includes(skill) || false}
                />
              ))}
            </div>
            {ra.matchedBonus?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-accent font-medium mb-1">⭐ Bonus skills found</p>
                <p className="text-xs text-muted-foreground">{ra.matchedBonus.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Extracted skills for Overall mode */}
        {ra.domain === 'Overall' && ra.extractedSkills?.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-primary font-medium mb-1.5">🔍 Skills Detected in Resume</p>
            <div className="flex flex-wrap gap-1.5">
              {ra.extractedSkills.map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30 font-mono">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Missing required skills — only for domain mode */}
        {ra.domain !== 'Overall' && ra.missingRequired?.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive font-medium flex items-center gap-1 mb-2">
              <AlertCircle className="w-3 h-3" /> Missing Required Skills ({ra.missingRequired.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ra.missingRequired.map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded-full text-xs bg-destructive/20 text-destructive border border-destructive/30 font-mono">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {ra.strengths?.length > 0 && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-xs text-success font-medium mb-1.5">✓ Strengths</p>
            <ul className="space-y-1">
              {ra.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-success" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {ra.suggestions?.length > 0 && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
            <p className="text-xs text-accent font-medium mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Suggested Improvements
            </p>
            <ol className="space-y-1.5">
              {ra.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Summary */}
        {ra.summary && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium mb-1">AI Summary</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{ra.summary}</p>
          </div>
        )}

        <CyberButton variant="ghost" size="sm" className="w-full" onClick={handleRemoveFile}>
          <X className="w-4 h-4 mr-2" />Upload Different Resume
        </CyberButton>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-muted-foreground">RESUME_ANALYSIS</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-glow mb-3">
            Domain-Based Resume Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Select your target domain → upload your resume → get a precise skill match score with actionable feedback.
          </p>
        </motion.div>

        {/* Step 1: Domain selection always visible */}
        <DomainSelector />

        {/* Step 2: Upload + analysis (only after domain chosen) */}
        <AnimatePresence>
          {selectedDomain && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mt-6"
            >
              {/* Left: Upload / LinkedIn / Results */}
              <CyberCard variant="glow">
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-5">
                  {(['resume', 'linkedin'] as AnalysisMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setAnalysisMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-all ${
                        analysisMode === m
                          ? 'bg-primary/20 border border-primary/50 text-primary'
                          : 'bg-muted border border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {m === 'resume' ? <><FileText className="w-4 h-4" />Resume Upload</> : <><Linkedin className="w-4 h-4" />LinkedIn</>}
                    </button>
                  ))}
                </div>

                {/* Selected domain badge */}
                <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-muted border border-border">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Analyzing for:</span>
                  <span className="text-xs font-mono font-bold text-primary">{selectedDomain}</span>
                  <button onClick={() => { setSelectedDomain(null); handleRemoveFile(); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
                    change
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {analysisMode === 'resume' ? (
                    <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                      {!resumeFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 group"
                        >
                          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <Upload className="w-7 h-7 text-primary" />
                          </div>
                          <p className="font-display text-base font-bold mb-1">Drop your resume here</p>
                          <p className="text-sm text-muted-foreground mb-3">or click to browse</p>
                          <span className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono text-muted-foreground">PDF only</span>
                        </div>
                      ) : !resumeAnalysis ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{resumeFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                            </div>
                            <button onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {isAnalyzing && (
                            <div className="space-y-2">
                              {['Extracting resume content...', 'Parsing skills & experience...', 'Matching against domain skills...', 'Generating feedback...'].map((step, i) => (
                                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                  {step}
                                </motion.div>
                              ))}
                            </div>
                          )}

                          <CyberButton variant="primary" className="w-full" onClick={handleAnalyzeResume} disabled={isAnalyzing} glowing>
                            {isAnalyzing
                              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing with AI...</>
                              : <><Sparkles className="w-4 h-4 mr-2" />{selectedDomain === 'Overall' ? 'Analyze Resume (Overall)' : `Analyze Resume for ${selectedDomain}`}</>}
                          </CyberButton>
                        </div>
                      ) : (
                        <div className="overflow-y-auto max-h-[600px] pr-1">
                          <ResumeResults />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* LinkedIn panel */
                    <motion.div key="linkedin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {!linkedinAnalysis ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" className="pl-10 bg-muted border-border" />
                          </div>
                          <details className="group">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Or paste profile text manually</summary>
                            <textarea value={linkedinProfileText} onChange={e => setLinkedinProfileText(e.target.value)} placeholder="Paste About, Experience, Skills..." className="w-full min-h-[100px] mt-2 p-3 rounded-lg bg-muted border border-border text-sm resize-y focus:outline-none focus:border-primary/50" />
                          </details>
                          <CyberButton variant="primary" className="w-full" onClick={handleAnalyzeLinkedin} disabled={isAnalyzingLinkedin || (!linkedinUrl.trim() && !linkedinProfileText.trim())} glowing>
                            {isAnalyzingLinkedin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Linkedin className="w-4 h-4 mr-2" />Analyze Profile</>}
                          </CyberButton>
                        </div>
                      ) : (
                        <div className="space-y-4 overflow-y-auto max-h-[550px]">
                          {(linkedinAnalysis.name || linkedinAnalysis.headline) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                              <User className="w-8 h-8 text-primary" />
                              <div>
                                {linkedinAnalysis.name && <p className="font-bold">{linkedinAnalysis.name}</p>}
                                {linkedinAnalysis.headline && <p className="text-xs text-muted-foreground">{linkedinAnalysis.headline}</p>}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
                            <ScoreRing score={linkedinAnalysis.overallScore} size={80} />
                            <div className="space-y-2 flex-1">
                              <ScoreBar label="Skill Match" score={linkedinAnalysis.skillMatchScore} icon={Target} />
                              <ScoreBar label="Projects" score={linkedinAnalysis.projectQualityScore} icon={Code} />
                              <ScoreBar label="Experience" score={linkedinAnalysis.experienceScore} icon={Briefcase} />
                              <ScoreBar label="Completeness" score={linkedinAnalysis.profileCompletenessScore} icon={User} />
                              <ScoreBar label="Content Quality" score={linkedinAnalysis.contentQualityScore} icon={Star} />
                            </div>
                          </div>
                          {linkedinAnalysis.matchedSkills?.length > 0 && (
                            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                              <p className="text-xs text-success font-medium mb-1.5">✓ Strong Skills</p>
                              <div className="flex flex-wrap gap-1.5">{linkedinAnalysis.matchedSkills.slice(0, 8).map(s => <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success border border-success/30">{s}</span>)}</div>
                            </div>
                          )}
                          {linkedinAnalysis.missingSkills?.length > 0 && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                              <p className="text-xs text-destructive font-medium mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Missing Skills</p>
                              <div className="flex flex-wrap gap-1.5">{linkedinAnalysis.missingSkills.slice(0, 6).map(s => <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/30">{s}</span>)}</div>
                            </div>
                          )}
                          {linkedinAnalysis.improvements?.length > 0 && (
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                              <p className="text-xs text-accent font-medium mb-1.5">↑ Improvements</p>
                              <ul className="space-y-1">{linkedinAnalysis.improvements.slice(0, 4).map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-accent" />{s}</li>)}</ul>
                            </div>
                          )}
                          {linkedinAnalysis.summary && <div className="p-3 rounded-lg bg-muted/50 border border-border"><p className="text-xs font-medium mb-1">AI Summary</p><p className="text-xs text-muted-foreground">{linkedinAnalysis.summary}</p></div>}
                          <CyberButton variant="ghost" size="sm" className="w-full" onClick={() => { setLinkedinUrl(''); setLinkedinProfileText(''); setLinkedinAnalysis(null); }}>
                            <X className="w-4 h-4 mr-2" />Analyze Different Profile
                          </CyberButton>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CyberCard>

              {/* Right: AI Chat */}
              <CyberCard variant="accent" className="flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">AI Career Assistant</h3>
                    <p className="text-sm text-muted-foreground">Ask about your resume or career path</p>
                  </div>
                </div>

                {!chatOpen || !resumeAnalysis ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-5">
                      <MessageSquare className="w-10 h-10 text-accent" />
                    </div>
                    <h4 className="font-display text-lg font-bold mb-2">Career Chat</h4>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                      {resumeAnalysis
                        ? 'Your resume has been analyzed! Chat to get personalized insights.'
                        : 'Upload and analyze your resume to unlock the AI career assistant.'}
                    </p>
                    {resumeAnalysis && (
                      <CyberButton variant="accent" onClick={() => setChatOpen(true)} glowing>
                        <MessageSquare className="w-4 h-4 mr-2" />Start Chat
                      </CyberButton>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 mb-3 pr-1">
                      <AnimatePresence>
                        {chatMessages.map((msg) => (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[88%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border'}`}>
                              <div className="prose prose-sm prose-invert max-w-none text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isTyping && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex gap-1">{[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                          <span className="text-xs">AI thinking...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {['Score breakdown', 'Missing skills', 'How to improve?', 'What to learn next?'].map(q => (
                        <button key={q} onClick={() => sendMessage(q)} disabled={isTyping} className="px-2.5 py-1 text-xs bg-muted border border-border rounded-full hover:border-accent transition-colors disabled:opacity-50">{q}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Ask about your profile..." className="flex-1 bg-muted border-border" onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                      <CyberButton variant="accent" size="sm" onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}><Send className="w-4 h-4" /></CyberButton>
                    </div>
                  </>
                )}
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingTPOChat />
    </div>
  );
};

export default ResumeAnalysisPage;
