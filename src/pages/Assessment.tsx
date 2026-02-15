import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AIPrediction, EnhancedStudentResult } from '@/lib/authContext';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle, XCircle, Brain, Shield, 
  Terminal, Code, AlertTriangle, Send, Loader2, Cpu, Link2, Zap,
  Sparkles, Database, Server, RefreshCw
} from 'lucide-react';
import { Question, TrackType, DifficultyLevel } from '@/lib/mockData';
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
  const trackConfig = getTrackConfig(track);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codingAnswer, setCodingAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = questions.length > 0 && currentQuestion === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Fetch AI-generated questions
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    setLoadError(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setCodingAnswer('');
    setShowResults(false);
    setAiPrediction(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-assessment', {
        body: { track, numQuestions: 5 },
      });

      if (error) throw error;

      if (data?.success && data?.questions) {
        setQuestions(data.questions);
        console.log('Loaded', data.questions.length, 'AI-generated questions');
      } else {
        throw new Error(data?.error || 'Failed to generate questions');
      }
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      setLoadError(err.message || 'Failed to generate questions. Please try again.');
      toast({
        title: "Error Loading Questions",
        description: err.message || "Could not generate questions. Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [track]);

  const handleAnswer = () => {
    if (!question) return;
    const answer = question.type === 'mcq' ? selectedOption : codingAnswer.trim();
    
    // Store user's raw answer — verification happens server-side after all questions
    const newAnswer: Answer = {
      questionId: question.id,
      answer: answer as string | number,
      isCorrect: false, // Will be updated after AI verification
      topic: question.topic,
      difficulty: question.difficulty
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    
    if (isLastQuestion) {
      handleSubmit(updatedAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setCodingAnswer('');
    }
  };

  const handleSubmit = async (finalAnswers: Answer[]) => {
    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      // Step 1: AI-verify all answers
      const userAnswerValues = finalAnswers.map(a => a.answer);
      
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-assessment', {
        body: {
          questions,
          userAnswers: userAnswerValues,
          track,
        },
      });

      if (verifyError) throw verifyError;

      let correctCount: number;
      let gaps: string[];
      let verifiedAnswers = finalAnswers;

      if (verifyData?.success && verifyData?.results) {
        // Use AI-verified results
        const verifiedResults = verifyData.results;
        correctCount = verifyData.correctCount;
        gaps = verifyData.gaps;

        // Update answers with AI verification
        verifiedAnswers = finalAnswers.map((a, i) => ({
          ...a,
          isCorrect: verifiedResults[i]?.isCorrect ?? false,
          topic: verifiedResults[i]?.topic ?? a.topic,
        }));
        setAnswers(verifiedAnswers);

        // Update question explanations with AI-verified ones
        const updatedQuestions = questions.map((q, i) => ({
          ...q,
          explanation: verifiedResults[i]?.explanation ?? q.explanation,
          correctAnswer: verifiedResults[i]?.correctAnswer ?? q.correctAnswer,
        }));
        setQuestions(updatedQuestions);

        console.log(`AI Verified: ${correctCount}/${questions.length} correct`);
      } else {
        // Fallback to local comparison if verification fails
        console.warn('AI verification failed, using local comparison');
        verifiedAnswers = finalAnswers.map(a => {
          const q = questions.find(q => q.id === a.questionId);
          if (!q) return a;
          const correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : String(q.correctAnswer).toUpperCase();
          const userAnswer = typeof a.answer === 'number' ? a.answer : String(a.answer).toUpperCase();
          return { ...a, isCorrect: userAnswer === correctAnswer };
        });
        setAnswers(verifiedAnswers);
        correctCount = verifiedAnswers.filter(a => a.isCorrect).length;
        gaps = verifiedAnswers.filter(a => !a.isCorrect).map(a => a.topic);
      }

      const questionResponses = verifiedAnswers.map(a => ({
        questionId: a.questionId,
        topic: a.topic,
        isCorrect: a.isCorrect,
        difficulty: a.difficulty
      }));

      let level: 'Beginner' | 'Intermediate' | 'Ready';
      if (correctCount <= 1) level = 'Beginner';
      else if (correctCount <= 3) level = 'Intermediate';
      else level = 'Ready';

      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('username', username)
        .single();

      let studentId: string;

      if (!existingStudent) {
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
            level = prediction.level;
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
      }

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

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Brain className="w-16 h-16 text-primary" />
            </motion.div>
            <h3 className="font-display text-xl font-bold mb-2">Generating Fresh Questions</h3>
            <p className="text-muted-foreground text-sm mb-4">
              AI is creating unique {track} questions for this attempt...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-primary">Powered by AI</span>
            </div>
          </CyberCard>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || questions.length === 0) {
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <CyberCard variant="glow" className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Failed to Load Questions</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {loadError || 'No questions were generated. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <CyberButton variant="primary" onClick={fetchQuestions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </CyberButton>
              <CyberButton variant="ghost" onClick={() => navigate('/tracks')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tracks
              </CyberButton>
            </div>
          </CyberCard>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const level = aiPrediction?.level || (correctCount <= 1 ? 'Beginner' : correctCount <= 3 ? 'Intermediate' : 'Ready');
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    
    return (
      <div className="min-h-screen relative grid-pattern">
        <CursorGlow color="primary" size={250} />
        <Navbar />
        
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 max-w-5xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
                level === 'Ready' ? 'bg-success/20 border-success' : 
                level === 'Intermediate' ? 'bg-accent/20 border-accent' : 
                'bg-primary/20 border-primary'
              } border-2`}
            >
              <CheckCircle className={`w-10 h-10 ${
                level === 'Ready' ? 'text-success' : 
                level === 'Intermediate' ? 'text-accent' : 
                'text-primary'
              }`} />
            </motion.div>
            
            <h1 className="font-display text-4xl font-bold mb-2">Assessment Complete</h1>
            <p className="text-muted-foreground text-lg">Your {track} results have been analyzed</p>
            
            {aiPrediction && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mt-4"
              >
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  AI Analysis: {aiPrediction.confidence.toFixed(0)}% Confidence
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <CyberCard variant="glow" className="text-center p-5">
              <p className="text-4xl font-display font-bold text-primary">{correctCount}/{questions.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Correct Answers</p>
            </CyberCard>
            <CyberCard variant="glow" className="text-center p-5">
              <p className="text-4xl font-display font-bold text-foreground">{scorePercent}%</p>
              <p className="text-sm text-muted-foreground mt-1">Score</p>
            </CyberCard>
            <CyberCard variant="glow" className="text-center p-5">
              <p className={`text-2xl font-display font-bold ${
                level === 'Ready' ? 'text-success' : 
                level === 'Intermediate' ? 'text-accent' : 
                'text-primary'
              }`}>{level}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {aiPrediction ? 'AI Predicted Level' : 'Proficiency Level'}
              </p>
            </CyberCard>
            <CyberCard variant="glow" className="text-center p-5">
              {aiPrediction && aiPrediction.estimatedReadinessWeeks > 0 ? (
                <>
                  <p className="text-4xl font-display font-bold text-accent">{aiPrediction.estimatedReadinessWeeks}</p>
                  <p className="text-sm text-muted-foreground mt-1">Weeks to Ready</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-display font-bold text-foreground">{track.split(' ')[0]}</p>
                  <p className="text-sm text-muted-foreground mt-1">Track</p>
                </>
              )}
            </CyberCard>
          </motion.div>

          {/* Question Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-10"
          >
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              Question Breakdown
            </h2>
            
            <div className="space-y-4">
              {answers.map((answer, index) => {
                const q = questions[index];
                if (!q) return null;

                let correctAnswerText = '';
                if (q.type === 'mcq' && q.options) {
                  const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(String(q.correctAnswer));
                  correctAnswerText = q.options[correctIdx] || String(q.correctAnswer);
                } else {
                  correctAnswerText = String(q.correctAnswer);
                }

                let userAnswerText = '';
                if (q.type === 'mcq' && q.options && typeof answer.answer === 'number') {
                  userAnswerText = q.options[answer.answer] || String(answer.answer);
                } else {
                  userAnswerText = String(answer.answer);
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    <CyberCard variant={answer.isCorrect ? 'secondary' : 'accent'} className={`p-5 border-l-4 ${
                      answer.isCorrect ? 'border-l-success' : 'border-l-destructive'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          answer.isCorrect ? 'bg-success/20' : 'bg-destructive/20'
                        }`}>
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">Q{index + 1}</span>
                              <span className="font-medium text-foreground">{q.topic}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyConfig(q.difficulty).bgClass}`}>
                                {q.difficulty}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                                answer.isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                              }`}>
                                {answer.isCorrect ? 'CORRECT' : 'INCORRECT'}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">{q.question}</p>

                          {!answer.isCorrect && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-destructive mb-1">Your Answer</p>
                                  <p className="text-sm text-foreground">{userAnswerText}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                                <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-success mb-1">Correct Answer</p>
                                  <p className="text-sm text-foreground">{correctAnswerText}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {q.explanation && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-1">💡 Explanation</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}

                          {aiPrediction && !answer.isCorrect && (
                            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                              Gap: {aiPrediction.skillGaps.find(g => g.skill === answer.topic)?.gapType || 'Skill Gap'}
                            </span>
                          )}
                        </div>
                      </div>
                    </CyberCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
          
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
          >
            <CyberButton variant="ghost" size="lg" onClick={fetchQuestions} className="flex-1">
              <RefreshCw className="w-5 h-5 mr-2" />
              Retake with New Questions
            </CyberButton>
            <CyberButton variant="primary" size="lg" onClick={viewDashboard} className="flex-1">
              View Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </CyberButton>
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
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
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
                <span className="text-sm text-primary">Processing with AI</span>
              </div>
            </CyberCard>
          </motion.div>
        )}

        {/* Question Card */}
        {question && (
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
                      <span className="font-mono text-xs text-accent">SHORT_ANSWER</span>
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
        )}
      </div>
    </div>
  );
};

export default Assessment;
