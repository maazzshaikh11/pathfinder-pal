import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion } from 'framer-motion';
import { 
  Brain, ArrowRight, Sparkles, Code, Cpu,
  Database, Server, Binary, Lock, Wifi
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import FloatingTPOChat from '@/components/FloatingTPOChat';
import { useAuth } from '@/lib/authContext';

type TrackId = 'Programming & DSA' | 'Data Science & ML' | 'Database Management & SQL' | 'Backend / Web Dev';

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


const tracks: Track[] = [
  {
    id: 'Programming & DSA',
    title: 'Programming & DSA',
    subtitle: 'Data Structures, Algorithms & Problem Solving',
    icon: Code,
    secondaryIcon: Binary,
    description: 'Test your skills in arrays, trees, graphs, sorting, dynamic programming, and competitive coding concepts.',
    topics: ['Sorting Algorithms', 'Graph Algorithms', 'Dynamic Programming', 'Heaps & Priority Queues'],
    color: 'primary'
  },
  {
    id: 'Data Science & ML',
    title: 'Data Science & ML',
    subtitle: 'Machine Learning, Deep Learning & Analytics',
    icon: Brain,
    secondaryIcon: Sparkles,
    description: 'Evaluate your understanding of ML algorithms, neural networks, model evaluation, and data analysis techniques.',
    topics: ['Neural Networks', 'Model Evaluation', 'Deep Learning', 'Activation Functions'],
    color: 'accent'
  },
  {
    id: 'Database Management & SQL',
    title: 'Database & SQL',
    subtitle: 'SQL, Normalization, Indexing & Transactions',
    icon: Database,
    secondaryIcon: Lock,
    description: 'Assess your knowledge of relational databases, SQL queries, normalization, indexing, and ACID properties.',
    topics: ['Normalization', 'SQL Joins', 'Transactions & ACID', 'Indexing & Optimization'],
    color: 'secondary'
  },
  {
    id: 'Backend / Web Dev',
    title: 'Backend / Web Dev',
    subtitle: 'Node.js, REST APIs, Authentication & HTTP',
    icon: Server,
    secondaryIcon: Wifi,
    description: 'Test your expertise in building backend systems with Node.js, Express, REST APIs, JWT authentication, and HTTP protocols.',
    topics: ['REST APIs', 'Node.js & Express', 'Authentication & JWT', 'HTTP Status Codes'],
    color: 'tertiary'
  }
];

const TrackSelection = () => {
  const navigate = useNavigate();
  const { username } = useAuth();

  const handleSelectTrack = (trackId: TrackId) => {
    navigate('/assessment', { state: { track: trackId } });
  };

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
      </div>
      
      {/* Floating TPO Chat */}
      <FloatingTPOChat />
    </div>
  );
};

export default TrackSelection;
