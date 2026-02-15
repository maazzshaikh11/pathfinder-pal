import { useState, useRef } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, MessageSquare, Check, X, Bot, Send, Loader2,
  Target, TrendingUp, Award, AlertCircle, Code, Brain, Database, Server,
  Linkedin, Globe, User, Briefcase, Users, Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import FloatingTPOChat from '@/components/FloatingTPOChat';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { analyzeResume, simulateResumeContent, ResumeAnalysis as ResumeAnalysisType } from '@/lib/resumeScoring';
import { Progress } from '@/components/ui/progress';
import { useResumeChat } from '@/hooks/useResumeChat';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TrackId = 'Programming & DSA' | 'Data Science & ML' | 'Database Management & SQL' | 'Backend / Web Dev';
type AnalysisMode = 'resume' | 'linkedin';

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

const trackOptions = [
  { id: 'Programming & DSA' as TrackId, title: 'Programming & DSA', icon: Code, color: 'primary' },
  { id: 'Data Science & ML' as TrackId, title: 'Data Science & ML', icon: Brain, color: 'accent' },
  { id: 'Database Management & SQL' as TrackId, title: 'Database & SQL', icon: Database, color: 'secondary' },
  { id: 'Backend / Web Dev' as TrackId, title: 'Backend / Web Dev', icon: Server, color: 'tertiary' },
];

const ResumeAnalysisPage = () => {
  const { username } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('resume');

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTrackForResume, setSelectedTrackForResume] = useState<TrackId | null>(null);

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinAnalysis, setLinkedinAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [isAnalyzingLinkedin, setIsAnalyzingLinkedin] = useState(false);

  // AI Chat
  const { messages: chatMessages, isLoading: isTyping, sendMessage, initializeChat, clearChat } = useResumeChat({ resumeAnalysis, username });
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setResumeFile(file);
        setResumeAnalysis(null);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeFile) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const content = simulateResumeContent(resumeFile.name);
    const analysis = analyzeResume(content, selectedTrackForResume);
    analysis.fileName = resumeFile.name;
    setResumeAnalysis(analysis);
    setIsAnalyzing(false);
    initializeChat(analysis, resumeFile.name);
    setChatOpen(true);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeAnalysis(null);
    clearChat();
    setChatOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeLinkedin = async () => {
    if (!linkedinUrl.trim()) return;
    
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
    if (!linkedinRegex.test(linkedinUrl.trim())) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingLinkedin(true);
    setLinkedinAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('linkedin-analyze', {
        body: { linkedinUrl: linkedinUrl.trim(), track: selectedTrackForResume },
      });

      if (error) throw error;

      if (data?.success && data?.analysis) {
        setLinkedinAnalysis(data.analysis);
        toast({ title: "Analysis Complete", description: `Profile analyzed for ${data.analysis.name || 'user'}` });
      } else {
        toast({
          title: "Analysis Failed",
          description: data?.error || "Could not analyze the LinkedIn profile.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('LinkedIn analysis error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to analyze LinkedIn profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  const handleResetLinkedin = () => {
    setLinkedinUrl('');
    setLinkedinAnalysis(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={`font-mono font-bold ${score >= 70 ? 'text-success' : score >= 40 ? 'text-accent' : 'text-destructive'}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );

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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-muted-foreground">PROFILE_ANALYSIS</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-glow mb-4">
            Resume & LinkedIn Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Upload your resume or paste your LinkedIn URL to get a detailed analysis and AI-powered career guidance.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Left Card - Upload / LinkedIn */}
          <CyberCard variant="glow">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAnalysisMode('resume')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-display font-semibold text-sm transition-all ${
                  analysisMode === 'resume'
                    ? 'bg-primary/20 border border-primary/50 text-primary'
                    : 'bg-muted border border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <FileText className="w-4 h-4" />
                Resume Upload
              </button>
              <button
                onClick={() => setAnalysisMode('linkedin')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-display font-semibold text-sm transition-all ${
                  analysisMode === 'linkedin'
                    ? 'bg-[hsl(199,89%,48%)]/20 border border-[hsl(199,89%,48%)]/50 text-[hsl(199,89%,48%)]'
                    : 'bg-muted border border-border text-muted-foreground hover:border-[hsl(199,89%,48%)]/30'
                }`}
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
              </button>
            </div>

            {/* Track Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Select target track (optional):</label>
              <div className="flex flex-wrap gap-2">
                {trackOptions.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackForResume(selectedTrackForResume === track.id ? null : track.id)}
                    className={`px-3 py-1 text-xs font-mono rounded-full border transition-all ${
                      selectedTrackForResume === track.id
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {track.title}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {analysisMode === 'resume' ? (
                <motion.div key="resume" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                  {!resumeFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium mb-2">Drop your resume here</p>
                      <p className="text-sm text-muted-foreground">or click to browse (PDF only)</p>
                    </div>
                  ) : !resumeAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive"><X className="w-5 h-5" /></button>
                      </div>
                      <CyberButton variant="primary" className="w-full" onClick={handleAnalyzeResume} disabled={isAnalyzing} glowing>
                        {isAnalyzing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Resume...</>) : (<><Target className="w-4 h-4 mr-2" />Analyze Resume</>)}
                      </CyberButton>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                        <p className="text-sm text-muted-foreground mb-1">Overall Resume Score</p>
                        <p className={`text-4xl font-display font-bold ${resumeAnalysis.overallScore >= 70 ? 'text-success' : resumeAnalysis.overallScore >= 40 ? 'text-accent' : 'text-destructive'}`}>
                          {resumeAnalysis.overallScore}%
                        </p>
                      </div>
                      <div className="space-y-3">
                        <ScoreBar label="Skill Match (30%)" score={resumeAnalysis.skillMatchScore} icon={Target} />
                        <ScoreBar label="Project Quality (25%)" score={resumeAnalysis.projectQualityScore} icon={Code} />
                        <ScoreBar label="Experience (15%)" score={resumeAnalysis.experienceScore} icon={TrendingUp} />
                        <ScoreBar label="Resume Structure (10%)" score={resumeAnalysis.resumeStructureScore} icon={FileText} />
                        <ScoreBar label="Action Verbs (10%)" score={resumeAnalysis.actionVerbsScore} icon={Award} />
                        <ScoreBar label="Consistency (10%)" score={resumeAnalysis.consistencyScore} icon={Check} />
                      </div>
                      {resumeAnalysis.matchedSkills.length > 0 && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                          <p className="text-xs text-success font-medium mb-1">✓ Skills Matched</p>
                          <p className="text-xs text-muted-foreground">{resumeAnalysis.matchedSkills.slice(0, 4).join(', ')}{resumeAnalysis.matchedSkills.length > 4 && ` +${resumeAnalysis.matchedSkills.length - 4} more`}</p>
                        </div>
                      )}
                      {resumeAnalysis.missingSkills.length > 0 && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <p className="text-xs text-destructive font-medium mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Skills to Add</p>
                          <p className="text-xs text-muted-foreground">{resumeAnalysis.missingSkills.slice(0, 3).join(', ')}</p>
                        </div>
                      )}
                      <CyberButton variant="ghost" size="sm" className="w-full" onClick={handleRemoveFile}><X className="w-4 h-4 mr-2" />Upload Different Resume</CyberButton>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="linkedin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {!linkedinAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(199,89%,48%)]/20 border border-[hsl(199,89%,48%)]/50 flex items-center justify-center">
                          <Linkedin className="w-5 h-5 text-[hsl(199,89%,48%)]" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold">LinkedIn Profile Analysis</h3>
                          <p className="text-xs text-muted-foreground">Paste your profile URL for AI-powered analysis</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="https://linkedin.com/in/your-profile"
                            className="pl-10 bg-muted border-border"
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeLinkedin()}
                          />
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">How it works:</span> We scrape your public LinkedIn profile, then use AI to analyze your skills, experience, and profile completeness against industry standards.
                          </p>
                        </div>

                        <CyberButton
                          variant="primary"
                          className="w-full"
                          onClick={handleAnalyzeLinkedin}
                          disabled={isAnalyzingLinkedin || !linkedinUrl.trim()}
                          glowing
                        >
                          {isAnalyzingLinkedin ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping & Analyzing...</>
                          ) : (
                            <><Linkedin className="w-4 h-4 mr-2" />Analyze LinkedIn Profile</>
                          )}
                        </CyberButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Profile header */}
                      {(linkedinAnalysis.name || linkedinAnalysis.headline) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(199,89%,48%)]/10 border border-[hsl(199,89%,48%)]/30">
                          <div className="w-10 h-10 rounded-full bg-[hsl(199,89%,48%)]/20 border border-[hsl(199,89%,48%)]/50 flex items-center justify-center">
                            <User className="w-5 h-5 text-[hsl(199,89%,48%)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {linkedinAnalysis.name && <p className="font-display font-bold text-foreground truncate">{linkedinAnalysis.name}</p>}
                            {linkedinAnalysis.headline && <p className="text-xs text-muted-foreground truncate">{linkedinAnalysis.headline}</p>}
                          </div>
                        </div>
                      )}

                      {/* Overall Score */}
                      <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                        <p className="text-sm text-muted-foreground mb-1">Overall Profile Score</p>
                        <p className={`text-4xl font-display font-bold ${linkedinAnalysis.overallScore >= 70 ? 'text-success' : linkedinAnalysis.overallScore >= 40 ? 'text-accent' : 'text-destructive'}`}>
                          {linkedinAnalysis.overallScore}%
                        </p>
                      </div>

                      {/* Score Breakdown */}
                      <div className="space-y-3">
                        <ScoreBar label="Skill Match" score={linkedinAnalysis.skillMatchScore} icon={Target} />
                        <ScoreBar label="Project Quality" score={linkedinAnalysis.projectQualityScore} icon={Code} />
                        <ScoreBar label="Experience" score={linkedinAnalysis.experienceScore} icon={Briefcase} />
                        <ScoreBar label="Profile Completeness" score={linkedinAnalysis.profileCompletenessScore} icon={User} />
                        <ScoreBar label="Network Strength" score={linkedinAnalysis.networkStrengthScore} icon={Users} />
                        <ScoreBar label="Content Quality" score={linkedinAnalysis.contentQualityScore} icon={Star} />
                      </div>

                      {/* Summary */}
                      {linkedinAnalysis.summary && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-xs font-medium text-foreground mb-1">AI Summary</p>
                          <p className="text-xs text-muted-foreground">{linkedinAnalysis.summary}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {linkedinAnalysis.matchedSkills.length > 0 && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                          <p className="text-xs text-success font-medium mb-1">✓ Strong Skills</p>
                          <p className="text-xs text-muted-foreground">{linkedinAnalysis.matchedSkills.slice(0, 5).join(', ')}{linkedinAnalysis.matchedSkills.length > 5 && ` +${linkedinAnalysis.matchedSkills.length - 5} more`}</p>
                        </div>
                      )}
                      {linkedinAnalysis.missingSkills.length > 0 && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <p className="text-xs text-destructive font-medium mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Skills to Develop</p>
                          <p className="text-xs text-muted-foreground">{linkedinAnalysis.missingSkills.slice(0, 4).join(', ')}</p>
                        </div>
                      )}

                      {/* Strengths & Improvements */}
                      {linkedinAnalysis.strengths?.length > 0 && (
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                          <p className="text-xs text-accent font-medium mb-1">★ Key Strengths</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {linkedinAnalysis.strengths.slice(0, 3).map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      )}
                      {linkedinAnalysis.improvements?.length > 0 && (
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                          <p className="text-xs text-accent font-medium mb-1">↑ Improvements</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {linkedinAnalysis.improvements.slice(0, 3).map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      )}

                      <CyberButton variant="ghost" size="sm" className="w-full" onClick={handleResetLinkedin}>
                        <X className="w-4 h-4 mr-2" />Analyze Different Profile
                      </CyberButton>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CyberCard>

          {/* AI Chatbot Card */}
          <CyberCard variant="accent" className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">AI Career Assistant</h3>
                <p className="text-sm text-muted-foreground">Ask about your resume or profile</p>
              </div>
            </div>

            {!chatOpen || !resumeAnalysis ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-accent" />
                </div>
                <h4 className="font-display text-lg font-bold mb-2">Career Chat</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {resumeAnalysis ? "Your resume has been analyzed! Start chatting to get insights." : "Upload and analyze your resume first to unlock the AI career assistant."}
                </p>
                {resumeAnalysis && (
                  <CyberButton variant="accent" onClick={() => setChatOpen(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />Start Chat
                  </CyberButton>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 mb-4 pr-2">
                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border'}`}>
                          <div className="prose prose-sm prose-invert max-w-none text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isTyping && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs">AI is thinking...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Score breakdown', 'Skill gaps', 'How to improve?'].map(q => (
                    <button key={q} onClick={() => sendMessage(q)} disabled={isTyping} className="px-2 py-1 text-xs bg-muted border border-border rounded-full hover:border-accent transition-colors disabled:opacity-50">{q}</button>
                  ))}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Ask about your profile..." className="flex-1 bg-muted border-border" onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                  <CyberButton variant="accent" size="sm" onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}><Send className="w-4 h-4" /></CyberButton>
                </div>
              </>
            )}
          </CyberCard>
        </div>
      </div>

      <FloatingTPOChat />
    </div>
  );
};

export default ResumeAnalysisPage;
