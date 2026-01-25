import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle, XCircle, Brain, Shield, 
  Terminal, Code, AlertTriangle, Send, Loader2
} from 'lucide-react';
import { aiMlQuestions, cybersecurityQuestions, Question, StudentResult } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';

interface Answer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
}

const Assessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, setStudentResult } = useAuth();
  
  const track = (location.state?.track as 'AI/ML' | 'Cybersecurity') || 'AI/ML';
  const questions = track === 'AI/ML' ? aiMlQuestions : cybersecurityQuestions;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codingAnswer, setCodingAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  useEffect(() => {
    // Reset state when track changes
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setCodingAnswer('');
    setShowResults(false);
  }, [track]);

  const handleAnswer = () => {
    const answer = question.type === 'mcq' ? selectedOption : codingAnswer.trim().toUpperCase();
    const correctAnswer = typeof question.correctAnswer === 'number' 
      ? question.correctAnswer 
      : question.correctAnswer.toUpperCase();
    
    const isCorrect = answer === correctAnswer;
    
    const newAnswer: Answer = {
      questionId: question.id,
      answer: answer as string | number,
      isCorrect
    };
    
    setAnswers([...answers, newAnswer]);
    
    if (isLastQuestion) {
      handleSubmit([...answers, newAnswer]);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setCodingAnswer('');
    }
  };

  const handleSubmit = (finalAnswers: Answer[]) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      const correctCount = finalAnswers.filter(a => a.isCorrect).length;
      const gaps: string[] = [];
      
      finalAnswers.forEach((answer, index) => {
        if (!answer.isCorrect) {
          gaps.push(questions[index].topic);
        }
      });
      
      let level: 'Beginner' | 'Intermediate' | 'Ready';
      if (correctCount <= 1) level = 'Beginner';
      else if (correctCount === 2) level = 'Intermediate';
      else level = 'Ready';
      
      const result: StudentResult = {
        id: `result-${Date.now()}`,
        user: username,
        email: `${username.toLowerCase().replace(' ', '.')}@college.edu`,
        track,
        correct: correctCount,
        total: questions.length,
        gaps: [...new Set(gaps)],
        level,
        completedAt: new Date().toISOString()
      };
      
      setStudentResult(result);
      setShowResults(true);
      setIsSubmitting(false);
    }, 1500);
  };

  const viewDashboard = () => {
    navigate('/student-dashboard');
  };

  if (showResults) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const level = correctCount <= 1 ? 'Beginner' : correctCount === 2 ? 'Intermediate' : 'Ready';
    
    return (
      <div className="min-h-screen relative grid-pattern">
        <Navbar />
        
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <CyberCard variant="glow" className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  level === 'Ready' ? 'bg-success/20 border-success' : 
                  level === 'Intermediate' ? 'bg-accent/20 border-accent' : 
                  'bg-primary/20 border-primary'
                } border-2`}
              >
                <CheckCircle className={`w-12 h-12 ${
                  level === 'Ready' ? 'text-success' : 
                  level === 'Intermediate' ? 'text-accent' : 
                  'text-primary'
                }`} />
              </motion.div>
              
              <h1 className="font-display text-3xl font-bold mb-2">Assessment Complete</h1>
              <p className="text-muted-foreground mb-8">Your results have been analyzed</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-3xl font-display font-bold text-primary">{correctCount}/{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className={`text-xl font-display font-bold ${
                    level === 'Ready' ? 'text-success' : 
                    level === 'Intermediate' ? 'text-accent' : 
                    'text-primary'
                  }`}>{level}</p>
                  <p className="text-sm text-muted-foreground">Level</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xl font-display font-bold text-foreground">{track}</p>
                  <p className="text-sm text-muted-foreground">Track</p>
                </div>
              </div>
              
              {/* Question breakdown */}
              <div className="space-y-3 mb-8 text-left">
                {answers.map((answer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{questions[index].topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {questions[index].explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <CyberButton variant="primary" size="lg" onClick={viewDashboard} className="w-full">
                View Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </CyberButton>
            </CyberCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative grid-pattern">
      <Navbar />
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className={`absolute top-40 right-20 w-72 h-72 rounded-full ${track === 'AI/ML' ? 'bg-primary/5' : 'bg-accent/5'} blur-3xl`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {track === 'AI/ML' ? (
                <Brain className="w-6 h-6 text-primary" />
              ) : (
                <Shield className="w-6 h-6 text-accent" />
              )}
              <span className="font-display font-bold text-xl">{track} Assessment</span>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${track === 'AI/ML' ? 'bg-primary' : 'bg-accent'} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <CyberCard variant={track === 'AI/ML' ? 'glow' : 'accent'}>
              {/* Question type badge */}
              <div className="flex items-center gap-2 mb-6">
                {question.type === 'mcq' ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-primary">MULTIPLE_CHOICE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30">
                    <Code className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs text-accent">CODING_CHALLENGE</span>
                  </div>
                )}
                <span className="px-3 py-1 rounded-full bg-muted border border-border font-mono text-xs text-muted-foreground">
                  {question.topic}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-xl font-medium mb-8 leading-relaxed">
                {question.question}
              </h2>

              {/* Answer options */}
              {question.type === 'mcq' && question.options && (
                <div className="space-y-3 mb-8">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedOption === index
                          ? track === 'AI/ML' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-accent bg-accent/10'
                          : 'border-border bg-muted/30 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold ${
                          selectedOption === index
                            ? track === 'AI/ML'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-accent bg-accent text-accent-foreground'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className={selectedOption === index ? 'text-foreground' : 'text-muted-foreground'}>
                          {option}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Coding answer input */}
              {question.type === 'coding' && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Enter your answer below</span>
                  </div>
                  <Input
                    type="text"
                    value={codingAnswer}
                    onChange={(e) => setCodingAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="bg-muted border-border focus:border-accent font-mono text-lg py-6"
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <CyberButton 
                  variant="ghost" 
                  onClick={() => navigate('/tracks')}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tracks
                </CyberButton>

                <CyberButton
                  variant={track === 'AI/ML' ? 'primary' : 'accent'}
                  onClick={handleAnswer}
                  disabled={(question.type === 'mcq' && selectedOption === null) || 
                            (question.type === 'coding' && !codingAnswer.trim()) ||
                            isSubmitting}
                  glowing={(question.type === 'mcq' && selectedOption !== null) || 
                           (question.type === 'coding' && !!codingAnswer.trim())}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : isLastQuestion ? (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Assessment
                    </>
                  ) : (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </CyberButton>
              </div>
            </CyberCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Assessment;
