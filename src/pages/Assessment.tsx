import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AIPrediction, EnhancedStudentResult } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle, XCircle, Brain, Shield, 
  Terminal, Code, AlertTriangle, Send, Loader2, Cpu, Link2, Zap,
  Sparkles, Database, Server
} from 'lucide-react';
import { programmingDsaQuestions, dataScienceMlQuestions, databaseSqlQuestions, backendWebDevQuestions, Question, TrackType, DifficultyLevel } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Answer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  topic: string;
  difficulty: DifficultyLevel;
}

const getQuestionsForTrack = (track: TrackType): Question[] => {
  switch (track) {
    case 'Programming & DSA': return programmingDsaQuestions;
    case 'Data Science & ML': return dataScienceMlQuestions;
    case 'Database Management & SQL': return databaseSqlQuestions;
    case 'Backend / Web Dev': return backendWebDevQuestions;
    default: return programmingDsaQuestions;
  }
};

const getTrackConfig = (track: TrackType) => {
  switch (track) {
    case 'Programming & DSA': 
      return { icon: Code, color: 'primary', variant: 'glow' as const, buttonVariant: 'primary' as const };
    case 'Data Science & ML': 
      return { icon: Brain, color: 'accent', variant: 'accent' as const, buttonVariant: 'accent' as const };
    case 'Database Management & SQL': 
      return { icon: Database, color: 'secondary', variant: 'secondary' as const, buttonVariant: 'secondary' as const };
    case 'Backend / Web Dev': 
      return { icon: Server, color: 'tertiary', variant: 'tertiary' as const, buttonVariant: 'tertiary' as const };
    default: 
      return { icon: Code, color: 'primary', variant: 'glow' as const, buttonVariant: 'primary' as const };
  }
};

const getDifficultyConfig = (difficulty: DifficultyLevel) => {
  switch (difficulty) {
    case 'Easy': 
      return { color: 'success', bgClass: 'bg-success/20 border-success/30 text-success' };
    case 'Medium': 
      return { color: 'accent', bgClass: 'bg-accent/20 border-accent/30 text-accent' };
    case 'Hard': 
      return { color: 'destructive', bgClass: 'bg-destructive/20 border-destructive/30 text-destructive' };
  }
};

const Assessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, setStudentResult } = useAuth();
  const { toast } = useToast();
  
  const track = (location.state?.track as TrackType) || 'Programming & DSA';
  const questions = getQuestionsForTrack(track);
  const trackConfig = getTrackConfig(track);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codingAnswer, setCodingAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    setAiPrediction(null);
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
      isCorrect,
      topic: question.topic,
      difficulty: question.difficulty
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

  const handleSubmit = async (finalAnswers: Answer[]) => {
    setIsSubmitting(true);
    setIsAnalyzing(true);
    
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const gaps: string[] = [];
    
    finalAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        gaps.push(answer.topic);
      }
    });

    const questionResponses = finalAnswers.map(a => ({
      questionId: a.questionId,
      topic: a.topic,
      isCorrect: a.isCorrect,
      difficulty: a.difficulty
    }));

    // Default level based on score
    let level: 'Beginner' | 'Intermediate' | 'Ready';
    if (correctCount <= 1) level = 'Beginner';
    else if (correctCount <= 3) level = 'Intermediate';
    else level = 'Ready';

    try {
      // First, ensure student exists in database
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('username', username)
        .single();

      let studentId: string;

      if (!existingStudent) {
        // Create student record
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert({
            username,
            email: `${username.toLowerCase().replace(' ', '.')}@college.edu`,
            is_registered: true
          })
          .select('id')
          .single();

        if (studentError) {
          console.error('Error creating student:', studentError);
          throw studentError;
        }
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }

      // Call AI prediction edge function
      let prediction: AIPrediction | null = null;
      
      try {
        const predictionResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skill-prediction`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              studentUsername: username,
              track,
              correctAnswers: correctCount,
              totalQuestions: questions.length,
              gaps: [...new Set(gaps)],
              questionResponses
            })
          }
        );

        if (predictionResponse.ok) {
          const predictionData = await predictionResponse.json();
          if (predictionData.success && predictionData.prediction) {
            prediction = predictionData.prediction;
            level = prediction.level; // Use AI-predicted level
            setAiPrediction(prediction);
          }
        } else if (predictionResponse.status === 429) {
          toast({
            title: "AI Analysis Rate Limited",
            description: "Using standard scoring. AI analysis will be available shortly.",
            variant: "default"
          });
        }
      } catch (aiError) {
        console.error('AI prediction error:', aiError);
        // Continue with standard scoring
      }

      // Save assessment result to database
      const { error: resultError } = await supabase
        .from('assessment_results')
        .insert({
          student_username: username,
          track,
          correct_answers: correctCount,
          total_questions: questions.length,
          level,
          gaps: [...new Set(gaps)] as unknown as string,
          question_responses: questionResponses as unknown as string,
          ai_prediction: prediction as unknown as string,
          confidence_score: prediction?.confidence || null
        });
      if (resultError) {
        console.error('Error saving assessment:', resultError);
        toast({
          title: "Warning",
          description: "Assessment completed but couldn't save to database.",
          variant: "destructive"
        });
      }

      // Set result in context
      const result: EnhancedStudentResult = {
        id: `result-${Date.now()}`,
        user: username,
        email: `${username.toLowerCase().replace(' ', '.')}@college.edu`,
        track,
        correct: correctCount,
        total: questions.length,
        gaps: [...new Set(gaps)],
        level,
        completedAt: new Date().toISOString(),
        aiPrediction: prediction || undefined,
        questionResponses
      };
      
      setStudentResult(result);
      setShowResults(true);
      
    } catch (error) {
      console.error('Assessment submission error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  const viewDashboard = () => {
    navigate('/student-dashboard');
  };

  if (showResults) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const level = aiPrediction?.level || (correctCount <= 1 ? 'Beginner' : correctCount <= 3 ? 'Intermediate' : 'Ready');
    
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
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
              <p className="text-muted-foreground mb-4">Your results have been analyzed</p>
              
              {/* AI Analysis Badge */}
              {aiPrediction && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">
                    AI Analysis: {aiPrediction.confidence.toFixed(0)}% Confidence
                  </span>
                </motion.div>
              )}
              
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
                  <p className="text-sm text-muted-foreground">
                    {aiPrediction ? 'AI Level' : 'Level'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xl font-display font-bold text-foreground">{track}</p>
                  <p className="text-sm text-muted-foreground">Track</p>
                </div>
              </div>

              {/* Estimated Readiness */}
              {aiPrediction && aiPrediction.estimatedReadinessWeeks > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-6"
                >
                  <p className="text-sm text-muted-foreground">Estimated time to Placement Ready</p>
                  <p className="text-2xl font-display font-bold text-accent">
                    {aiPrediction.estimatedReadinessWeeks} weeks
                  </p>
                </motion.div>
              )}
              
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
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{questions[index].topic}</p>
                          {aiPrediction && !answer.isCorrect && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {aiPrediction.skillGaps.find(g => g.skill === answer.topic)?.gapType || 'Gap'}
                            </span>
                          )}
                        </div>
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
      <CursorGlow color="primary" size={250} />
      <Navbar />
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className={`absolute top-40 right-20 w-72 h-72 rounded-full bg-${trackConfig.color}/5 blur-3xl`}
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
              <trackConfig.icon className={`w-6 h-6 text-${trackConfig.color}`} />
              <span className="font-display font-bold text-xl">{track} Assessment</span>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-${trackConfig.color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <CyberCard variant="glow" className="text-center max-w-md">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Brain className="w-16 h-16 text-primary" />
              </motion.div>
              <h3 className="font-display text-xl font-bold mb-2">AI Analyzing Your Performance</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Using machine learning to predict your placement readiness...
              </p>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-primary">Processing with Gemini AI</span>
              </div>
            </CyberCard>
          </motion.div>
        )}

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
            <CyberCard variant={trackConfig.variant}>
              {/* Question type and difficulty badges */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
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
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getDifficultyConfig(question.difficulty).bgClass}`}>
                  <Zap className="w-4 h-4" />
                  <span className="font-mono text-xs">{question.difficulty.toUpperCase()}</span>
                </div>
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
                          ? `border-${trackConfig.color} bg-${trackConfig.color}/10`
                          : 'border-border bg-muted/30 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold ${
                          selectedOption === index
                            ? `border-${trackConfig.color} bg-${trackConfig.color} text-${trackConfig.color}-foreground`
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
                  variant={trackConfig.buttonVariant}
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
