import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Shield, Cpu, Lock, ArrowRight, Sparkles, Code, Wifi, Link2,
  Upload, FileText, MessageSquare, Check, X, Bot, Send, Loader2, 
  Target, TrendingUp, Award, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { analyzeResume, simulateResumeContent, ResumeAnalysis } from '@/lib/resumeScoring';
import { Progress } from '@/components/ui/progress';

type TrackId = 'AI/ML' | 'Cybersecurity' | 'Systems & IoT' | 'Blockchain';

interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  secondaryIcon: React.ElementType;
  description: string;
  topics: string[];
  color: 'primary' | 'accent' | 'secondary' | 'tertiary';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const tracks: Track[] = [
  {
    id: 'AI/ML',
    title: 'AI / ML',
    subtitle: 'Artificial Intelligence & Machine Learning',
    icon: Brain,
    secondaryIcon: Sparkles,
    description: 'Evaluate your understanding of machine learning algorithms, neural networks, and model evaluation techniques.',
    topics: ['Neural Networks', 'Model Evaluation', 'Feature Engineering', 'Activation Functions'],
    color: 'primary'
  },
  {
    id: 'Cybersecurity',
    title: 'Cybersecurity',
    subtitle: 'Security & Cryptography',
    icon: Shield,
    secondaryIcon: Lock,
    description: 'Test your knowledge of web security, network protocols, cryptography, and threat detection.',
    topics: ['Web Security', 'Cryptography', 'Network Security', 'Authentication'],
    color: 'accent'
  },
  {
    id: 'Systems & IoT',
    title: 'Systems & IoT',
    subtitle: 'Embedded systems, IoT protocols, and real-time processing',
    icon: Cpu,
    secondaryIcon: Wifi,
    description: 'Assess your expertise in embedded systems, sensor networks, communication protocols, and real-time data processing.',
    topics: ['Embedded Systems', 'IoT Protocols', 'Real-time Processing', 'Sensor Networks'],
    color: 'secondary'
  },
  {
    id: 'Blockchain',
    title: 'Blockchain',
    subtitle: 'Smart contracts, consensus mechanisms, and DeFi',
    icon: Link2,
    secondaryIcon: Lock,
    description: 'Evaluate your understanding of blockchain technology, smart contract development, and decentralized finance concepts.',
    topics: ['Smart Contracts', 'Consensus Mechanisms', 'DeFi', 'Cryptographic Hashing'],
    color: 'tertiary'
  }
];

const TrackSelection = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTrackForResume, setSelectedTrackForResume] = useState<TrackId | null>(null);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSelectTrack = (trackId: TrackId) => {
    navigate('/assessment', { state: { track: trackId } });
  };

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
    
    // Simulate PDF processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate resume content extraction and analysis
    const content = simulateResumeContent(resumeFile.name);
    const analysis = analyzeResume(content, selectedTrackForResume);
    analysis.fileName = resumeFile.name;
    
    setResumeAnalysis(analysis);
    setIsAnalyzing(false);
    
    // Initialize chat with resume context
    setChatMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello ${username}! 👋 I've analyzed your resume "${resumeFile.name}". 

📊 **Your Resume Score: ${analysis.overallScore}%**

Here's a quick breakdown:
• Skill Match: ${analysis.skillMatchScore}%
• Project Quality: ${analysis.projectQualityScore}%
• Experience: ${analysis.experienceScore}%

${analysis.recommendations.length > 0 ? `\n💡 **Top Recommendation:** ${analysis.recommendations[0]}` : ''}

Feel free to ask me anything about your resume, skill gaps, or how to improve your profile for ${selectedTrackForResume || 'tech'} roles!`
    }]);
    setChatOpen(true);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeAnalysis(null);
    setChatMessages([]);
    setChatOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateChatResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (!resumeAnalysis) {
      return "Please upload your resume first so I can provide personalized guidance!";
    }
    
    if (msg.includes('score') || msg.includes('overall')) {
      return `Your overall resume score is **${resumeAnalysis.overallScore}%**. This is calculated using:
      
• 30% Skill Match (${resumeAnalysis.skillMatchScore}%)
• 25% Project Quality (${resumeAnalysis.projectQualityScore}%)
• 15% Experience (${resumeAnalysis.experienceScore}%)
• 10% Resume Structure (${resumeAnalysis.resumeStructureScore}%)
• 10% Action Verbs (${resumeAnalysis.actionVerbsScore}%)
• 10% Consistency (${resumeAnalysis.consistencyScore}%)

${resumeAnalysis.overallScore >= 70 ? "Great job! Your resume is well-structured." : "There's room for improvement. Focus on the areas with lower scores."}`;
    }
    
    if (msg.includes('skill') || msg.includes('match')) {
      const matched = resumeAnalysis.matchedSkills.slice(0, 5).join(', ');
      const missing = resumeAnalysis.missingSkills.slice(0, 3).join(', ');
      return `**Skill Match Score: ${resumeAnalysis.skillMatchScore}%**

✅ **Skills Found:** ${matched || 'None detected'}

❌ **Missing Skills:** ${missing || 'None - great coverage!'}

The Skill Match Score is calculated as:
(Skills Found / Required Skills) × 100

To improve, consider adding relevant skills you have but haven't mentioned, or learning the missing ones through projects and courses.`;
    }
    
    if (msg.includes('project')) {
      return `**Project Quality Score: ${resumeAnalysis.projectQualityScore}%**

To improve your project score:
1. Include 2-4 significant projects
2. Use action verbs (developed, built, implemented)
3. Quantify your impact (e.g., "improved performance by 40%")
4. Mention technologies used
5. Link to GitHub or live demos if possible`;
    }
    
    if (msg.includes('improve') || msg.includes('recommendation') || msg.includes('suggest')) {
      return `**Recommendations to improve your resume:**

${resumeAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Focus on quantifying your achievements and using strong action verbs. Each bullet point should show impact, not just responsibilities.`;
    }
    
    if (msg.includes('experience')) {
      return `**Experience Score: ${resumeAnalysis.experienceScore}%**

Tips to boost your experience section:
• Start each bullet with an action verb
• Quantify achievements (numbers, percentages)
• Focus on impact, not just duties
• Include relevant internships and part-time work
• Highlight leadership and collaboration`;
    }
    
    if (msg.includes('weak') || msg.includes('gap') || msg.includes('missing')) {
      const weakAreas = [];
      if (resumeAnalysis.skillMatchScore < 50) weakAreas.push('Skill alignment with target role');
      if (resumeAnalysis.projectQualityScore < 50) weakAreas.push('Project descriptions and impact');
      if (resumeAnalysis.actionVerbsScore < 50) weakAreas.push('Use of action verbs');
      if (resumeAnalysis.experienceScore < 50) weakAreas.push('Experience documentation');
      
      return `**Areas that need improvement:**

${weakAreas.length > 0 ? weakAreas.map(a => `• ${a}`).join('\n') : '• Your resume looks solid across all areas!'}

${resumeAnalysis.missingSkills.length > 0 ? `\n**Skills to learn:** ${resumeAnalysis.missingSkills.join(', ')}` : ''}`;
    }
    
    return `Based on your resume analysis (Score: ${resumeAnalysis.overallScore}%), I can help you with:

• Understanding your resume score breakdown
• Identifying skill gaps and how to fill them
• Improving specific sections (projects, experience)
• Getting personalized recommendations

What would you like to know more about?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    const response = generateChatResponse(inputMessage);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response
    };
    
    setIsTyping(false);
    setChatMessages(prev => [...prev, assistantMessage]);
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={`font-mono font-bold ${
          score >= 70 ? 'text-success' : score >= 40 ? 'text-accent' : 'text-destructive'
        }`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />
      
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-40 left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-6">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">SELECT_ASSESSMENT_TRACK</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-glow mb-4">
            Choose Your Track
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Select a specialization to begin your skill assessment. Each track contains 5 challenges testing conceptual and practical knowledge.
          </p>
        </motion.div>

        {/* Track Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <CyberCard 
                variant={track.color === 'primary' ? 'glow' : track.color === 'accent' ? 'accent' : track.color === 'secondary' ? 'secondary' : 'tertiary'} 
                className="h-full group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                animated={false}
                onClick={() => handleSelectTrack(track.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-xl border flex items-center justify-center ${
                    track.color === 'primary' ? 'bg-primary/20 border-primary/50 glow-primary' : 
                    track.color === 'accent' ? 'bg-accent/20 border-accent/50 glow-accent' : 
                    track.color === 'secondary' ? 'bg-secondary/20 border-secondary/50' : 
                    'bg-tertiary/20 border-tertiary/50'
                  }`}>
                    <track.icon className={`w-8 h-8 ${
                      track.color === 'primary' ? 'text-primary' : 
                      track.color === 'accent' ? 'text-accent' : 
                      track.color === 'secondary' ? 'text-secondary' : 
                      'text-tertiary'
                    }`} />
                  </div>
                  <track.secondaryIcon className={`w-6 h-6 ${
                    track.color === 'primary' ? 'text-primary/50' : 
                    track.color === 'accent' ? 'text-accent/50' : 
                    track.color === 'secondary' ? 'text-secondary/50' : 
                    'text-tertiary/50'
                  }`} />
                </div>

                {/* Title */}
                <h2 className={`font-display text-2xl font-bold mb-1 ${
                  track.color === 'primary' ? 'text-primary' : 
                  track.color === 'accent' ? 'text-accent' : 
                  track.color === 'secondary' ? 'text-secondary' : 
                  'text-tertiary'
                }`}>
                  {track.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{track.subtitle}</p>

                {/* Description */}
                <p className="text-foreground/80 mb-6 text-sm">{track.description}</p>

                {/* Topics */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {track.topics.map((topic) => (
                    <span 
                      key={topic} 
                      className={`px-2 py-1 text-xs font-mono rounded-full border ${
                        track.color === 'primary' ? 'bg-primary/10 text-primary border-primary/30' : 
                        track.color === 'accent' ? 'bg-accent/10 text-accent border-accent/30' : 
                        track.color === 'secondary' ? 'bg-secondary/10 text-secondary border-secondary/30' : 
                        'bg-tertiary/10 text-tertiary border-tertiary/30'
                      }`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <CyberButton 
                  variant={track.color === 'primary' ? 'primary' : track.color === 'accent' ? 'accent' : track.color === 'secondary' ? 'secondary' : 'tertiary'}
                  className="w-full"
                >
                  Start Assessment
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </CyberButton>
              </CyberCard>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">5 challenges per track</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">MCQ + Coding questions</span>
            </div>
          </div>
        </motion.div>

        {/* Resume Upload & Chatbot Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-6xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-muted-foreground">RESUME_ANALYSIS</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-glow mb-2">
              Resume Analysis & Career Chat
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Upload your resume to get a detailed score breakdown and chat with our AI for personalized career guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Resume Upload & Score Card */}
            <CyberCard variant="glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Resume Upload</h3>
                  <p className="text-sm text-muted-foreground">Get your resume scored</p>
                </div>
              </div>

              {/* Track Selection for Resume */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select target track (optional):
                </label>
                <div className="flex flex-wrap gap-2">
                  {tracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrackForResume(
                        selectedTrackForResume === track.id ? null : track.id
                      )}
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

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
                      <p className="text-sm text-muted-foreground">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <CyberButton 
                    variant="primary" 
                    className="w-full"
                    onClick={handleAnalyzeResume}
                    disabled={isAnalyzing}
                    glowing
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </CyberButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground mb-1">Overall Resume Score</p>
                    <p className={`text-4xl font-display font-bold ${
                      resumeAnalysis.overallScore >= 70 ? 'text-success' : 
                      resumeAnalysis.overallScore >= 40 ? 'text-accent' : 'text-destructive'
                    }`}>
                      {resumeAnalysis.overallScore}%
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    <ScoreBar label="Skill Match (30%)" score={resumeAnalysis.skillMatchScore} icon={Target} />
                    <ScoreBar label="Project Quality (25%)" score={resumeAnalysis.projectQualityScore} icon={Code} />
                    <ScoreBar label="Experience (15%)" score={resumeAnalysis.experienceScore} icon={TrendingUp} />
                    <ScoreBar label="Resume Structure (10%)" score={resumeAnalysis.resumeStructureScore} icon={FileText} />
                    <ScoreBar label="Action Verbs (10%)" score={resumeAnalysis.actionVerbsScore} icon={Award} />
                    <ScoreBar label="Consistency (10%)" score={resumeAnalysis.consistencyScore} icon={Check} />
                  </div>

                  {/* Quick Stats */}
                  {resumeAnalysis.matchedSkills.length > 0 && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-success font-medium mb-1">✓ Skills Matched</p>
                      <p className="text-xs text-muted-foreground">
                        {resumeAnalysis.matchedSkills.slice(0, 4).join(', ')}
                        {resumeAnalysis.matchedSkills.length > 4 && ` +${resumeAnalysis.matchedSkills.length - 4} more`}
                      </p>
                    </div>
                  )}

                  {resumeAnalysis.missingSkills.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-xs text-destructive font-medium mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Skills to Add
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resumeAnalysis.missingSkills.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  )}

                  <CyberButton 
                    variant="ghost" 
                    size="sm"
                    className="w-full"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Upload Different Resume
                  </CyberButton>
                </div>
              )}
            </CyberCard>

            {/* AI Chatbot Card */}
            <CyberCard variant="accent" className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">AI Career Assistant</h3>
                  <p className="text-sm text-muted-foreground">Ask about your resume</p>
                </div>
              </div>

              {!chatOpen || !resumeAnalysis ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-accent" />
                  </div>
                  <h4 className="font-display text-lg font-bold mb-2">Resume Chat</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resumeAnalysis 
                      ? "Your resume has been analyzed! Start chatting to get insights."
                      : "Upload and analyze your resume first to unlock the AI assistant."}
                  </p>
                  {resumeAnalysis && (
                    <CyberButton variant="accent" onClick={() => setChatOpen(true)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Chat
                    </CyberButton>
                  )}
                </div>
              ) : (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 mb-4 pr-2">
                    <AnimatePresence>
                      {chatMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] p-3 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-primary/20 border border-primary/30' 
                              : 'bg-muted border border-border'
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
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
                        <span className="text-xs">AI is typing...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Score breakdown', 'Skill gaps', 'How to improve?'].map(q => (
                      <button
                        key={q}
                        onClick={() => {
                          setInputMessage(q);
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="px-2 py-1 text-xs bg-muted border border-border rounded-full hover:border-accent transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2 mt-auto">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask about your resume..."
                      className="flex-1 bg-muted border-border"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <CyberButton 
                      variant="accent" 
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                    >
                      <Send className="w-4 h-4" />
                    </CyberButton>
                  </div>
                </>
              )}
            </CyberCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackSelection;
