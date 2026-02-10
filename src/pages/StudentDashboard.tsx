import { useNavigate } from 'react-router-dom';
import { useAuth, AIPrediction } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion } from 'framer-motion';
import { 
  Brain, Shield, Trophy, Target, AlertCircle, 
  ArrowRight, BookOpen, Video, FileText, RefreshCw,
  CheckCircle, XCircle, TrendingUp, Sparkles, Clock, Cpu, Link2,
  Code, Database, Server
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { username, studentResult } = useAuth();

  if (!studentResult) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
          <CyberCard variant="glow" className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">No Assessment Data</h2>
            <p className="text-muted-foreground mb-6">Complete an assessment to view your dashboard</p>
            <CyberButton variant="primary" onClick={() => navigate('/tracks')}>
              Take Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    );
  }

  const { track, correct, total, gaps, level, aiPrediction } = studentResult;
  
  const getTrackIcon = () => {
    switch (track) {
      case 'Programming & DSA': return Code;
      case 'Data Science & ML': return Brain;
      case 'Database Management & SQL': return Database;
      case 'Backend / Web Dev': return Server;
      default: return Code;
    }
  };
  
  const TrackIcon = getTrackIcon();
  const isPrimary = track === 'Programming & DSA';

  const nextSteps = {
    'Beginner': [
      { icon: BookOpen, title: 'Fundamentals Course', desc: `Master ${track} basics with structured lessons`, type: 'Course' },
      { icon: Video, title: 'Video Tutorials', desc: 'Visual learning for core concepts', type: 'Video' },
      { icon: FileText, title: 'Practice Problems', desc: 'Start with beginner-level challenges', type: 'Practice' },
    ],
    'Intermediate': [
      { icon: BookOpen, title: 'Advanced Topics', desc: 'Dive deeper into specialized areas', type: 'Course' },
      { icon: Target, title: 'Mock Interviews', desc: 'Practice with real interview questions', type: 'Interview' },
      { icon: FileText, title: 'Project Work', desc: 'Build hands-on projects to apply learning', type: 'Project' },
    ],
    'Ready': [
      { icon: Trophy, title: 'Company Prep', desc: 'Target specific company requirements', type: 'Prep' },
      { icon: Target, title: 'Live Assessments', desc: 'Take real placement tests', type: 'Assessment' },
      { icon: TrendingUp, title: 'Stay Updated', desc: 'Keep up with latest industry trends', type: 'News' },
    ],
  };

  const getLevelColor = () => {
    if (level === 'Ready') return 'text-success';
    if (level === 'Intermediate') return 'text-accent';
    return 'text-primary';
  };

  const getLevelBg = () => {
    if (level === 'Ready') return 'bg-success/20 border-success/50';
    if (level === 'Intermediate') return 'bg-accent/20 border-accent/50';
    return 'bg-primary/20 border-primary/50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-destructive bg-destructive/20 border-destructive/30';
      case 'Medium': return 'text-accent bg-accent/20 border-accent/30';
      case 'Low': return 'text-success bg-success/20 border-success/30';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className={`absolute top-40 left-20 w-72 h-72 rounded-full ${isPrimary ? 'bg-primary/5' : 'bg-accent/5'} blur-3xl`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-success/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Welcome back, <span className="text-glow">{username}</span>
              </h1>
              <p className="text-muted-foreground">Your personalized skill assessment dashboard</p>
            </div>
            
            {/* AI Analysis Badge */}
            {aiPrediction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
              >
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  AI Powered Analysis
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Track */}
          <CyberCard delay={0.1} className="text-center">
            <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${isPrimary ? 'bg-primary/20 border-primary/50' : 'bg-accent/20 border-accent/50'} border`}>
              <TrackIcon className={`w-6 h-6 ${isPrimary ? 'text-primary' : 'text-accent'}`} />
            </div>
            <p className="font-display font-bold text-xl">{track}</p>
            <p className="text-sm text-muted-foreground">Selected Track</p>
          </CyberCard>

          {/* Level */}
          <CyberCard delay={0.15} className="text-center">
            <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${getLevelBg()} border`}>
              <Trophy className={`w-6 h-6 ${getLevelColor()}`} />
            </div>
            <p className={`font-display font-bold text-xl ${getLevelColor()}`}>{level}</p>
            <p className="text-sm text-muted-foreground">
              {aiPrediction ? 'AI Predicted Level' : 'Current Level'}
            </p>
          </CyberCard>

          {/* Score */}
          <CyberCard delay={0.2} className="text-center">
            <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center bg-primary/20 border-primary/50 border">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <p className="font-display font-bold text-xl">{correct}/{total}</p>
            <p className="text-sm text-muted-foreground">Questions Correct</p>
          </CyberCard>

          {/* Confidence or Gaps */}
          <CyberCard delay={0.25} className="text-center">
            {aiPrediction ? (
              <>
                <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center bg-success/20 border-success/50 border">
                  <Sparkles className="w-6 h-6 text-success" />
                </div>
                <p className="font-display font-bold text-xl">{aiPrediction.confidence.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center bg-destructive/20 border-destructive/50 border">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="font-display font-bold text-xl">{gaps.length}</p>
                <p className="text-sm text-muted-foreground">Skill Gaps Found</p>
              </>
            )}
          </CyberCard>
        </div>

        {/* Estimated Readiness Time */}
        {aiPrediction && aiPrediction.estimatedReadinessWeeks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <CyberCard className="bg-gradient-to-r from-accent/10 via-card to-primary/10 border-accent/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent/20 border border-accent/50">
                  <Clock className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time to Placement Ready</p>
                  <p className="font-display text-2xl font-bold text-accent">
                    {aiPrediction.estimatedReadinessWeeks} weeks
                  </p>
                </div>
              </div>
            </CyberCard>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skill Gaps */}
          <CyberCard variant={isPrimary ? 'glow' : 'accent'} delay={0.3}>
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className={`w-5 h-5 ${isPrimary ? 'text-primary' : 'text-accent'}`} />
              <h2 className="font-display text-xl font-bold">Identified Skill Gaps</h2>
            </div>

            {/* AI-enhanced skill gaps with priorities */}
            {aiPrediction && aiPrediction.skillGaps.length > 0 ? (
              <div className="space-y-3">
                {aiPrediction.skillGaps.map((gap, index) => (
                  <motion.div
                    key={gap.skill}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30"
                  >
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{gap.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        {gap.gapType} Gap
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : gaps.length > 0 ? (
              <div className="space-y-3">
                {gaps.map((gap, index) => (
                  <motion.div
                    key={gap}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30"
                  >
                    <XCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium">{gap}</p>
                      <p className="text-xs text-muted-foreground">
                        {gap.includes('Evaluation') || gap.includes('Security') ? 'Conceptual Gap' : 'Practical Gap'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium">No skill gaps identified!</p>
                  <p className="text-xs text-muted-foreground">You've demonstrated strong proficiency</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <CyberButton variant="ghost" onClick={() => navigate('/tracks')} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Assessment
              </CyberButton>
            </div>
          </CyberCard>

          {/* AI Recommendations or Next Steps */}
          <CyberCard delay={0.35}>
            <div className="flex items-center gap-3 mb-6">
              {aiPrediction ? (
                <>
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">AI Recommendations</h2>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h2 className="font-display text-xl font-bold">Recommended Next Steps</h2>
                </>
              )}
            </div>

            <div className="space-y-4">
              {aiPrediction ? (
                // Show AI-generated recommendations
                aiPrediction.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="group p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Show default next steps based on level
                nextSteps[level].map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="group p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center group-hover:glow-primary transition-all">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{step.title}</p>
                          <span className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">
                            {step.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CyberCard>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <CyberCard className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border-primary/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getLevelBg()} border`}>
                  {level === 'Ready' ? (
                    <Trophy className="w-8 h-8 text-success" />
                  ) : (
                    <TrendingUp className={`w-8 h-8 ${getLevelColor()}`} />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    {level === 'Ready' ? "You're Placement Ready!" : 
                     level === 'Intermediate' ? "Good Progress!" : 
                     "Keep Learning!"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {level === 'Ready' ? "Focus on company-specific preparation and mock interviews." :
                     level === 'Intermediate' ? "A few more areas to strengthen before you're fully ready." :
                     "Build strong foundations by focusing on the identified gaps."}
                  </p>
                </div>
              </div>
              <CyberButton variant={level === 'Ready' ? 'success' : 'primary'}>
                View Learning Path
                <ArrowRight className="w-4 h-4 ml-2" />
              </CyberButton>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
