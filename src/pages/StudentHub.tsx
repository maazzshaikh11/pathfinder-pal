import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, MessageSquare, ArrowRight, Check, 
  X, Bot, Sparkles, Send, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/authContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const StudentHub = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${username}! 👋 I'm your PlacementPal AI assistant. I can help you with interview preparation, resume tips, career guidance, and answer questions about different tech tracks. How can I assist you today?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setResumeFile(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!resumeFile) return;
    
    setIsUploading(true);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUploading(false);
    setResumeUploaded(true);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const responses = [
      "That's a great question! For interview preparation, I recommend focusing on data structures and algorithms fundamentals. Practice explaining your thought process out loud.",
      "Based on your interest, I'd suggest exploring hands-on projects. Building real applications helps solidify concepts and gives you talking points for interviews.",
      "When preparing your resume, make sure to quantify your achievements. Instead of 'worked on projects', say 'developed 3 full-stack applications that improved user engagement by 40%'.",
      "For technical interviews, the STAR method works well: Situation, Task, Action, Result. Structure your responses to showcase your problem-solving skills.",
      "I'd recommend brushing up on system design basics. Many companies ask about scalability, caching, and database design at later interview stages."
    ];
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)]
    };
    
    setIsTyping(false);
    setChatMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div className="min-h-screen relative grid-pattern">
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
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">STUDENT_HUB</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-glow mb-4">
            Welcome, {username}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload your resume and chat with our AI assistant to prepare for placements.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Resume Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CyberCard variant="glow" className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Resume Upload</h2>
                  <p className="text-sm text-muted-foreground">Upload your resume for AI analysis</p>
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
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{resumeFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {resumeUploaded ? (
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                    ) : (
                      <button onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!resumeUploaded ? (
                    <CyberButton 
                      variant="primary" 
                      className="w-full"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Resume
                        </>
                      )}
                    </CyberButton>
                  ) : (
                    <div className="text-center text-success text-sm">
                      ✓ Resume uploaded successfully!
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <CyberButton 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/tracks')}
                >
                  Continue to Assessments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </CyberButton>
              </div>
            </CyberCard>
          </motion.div>

          {/* AI Chatbot Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CyberCard variant="accent" className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">AI Career Assistant</h2>
                  <p className="text-sm text-muted-foreground">Get personalized guidance</p>
                </div>
              </div>

              {!chatOpen ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get help with interview prep, resume tips, and career guidance.
                  </p>
                  <CyberButton variant="accent" onClick={() => setChatOpen(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chat
                  </CyberButton>
                </div>
              ) : (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 mb-4 pr-2">
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
                            <p className="text-sm">{msg.content}</p>
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

                  {/* Chat Input */}
                  <div className="flex gap-2 mt-auto">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask me anything..."
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentHub;
