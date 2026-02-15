import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { motion } from 'framer-motion';
import {
  Brain, ArrowRight, Sparkles, Code,
  Target, TrendingUp,
  Database, Server, Binary, BookOpen, Clock, Star, Zap,
  GraduationCap, Trophy, BarChart3
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import FloatingTPOChat from '@/components/FloatingTPOChat';
import { useAuth } from '@/lib/authContext';

type TrackId = 'Programming & DSA' | 'Data Science & ML' | 'Database Management & SQL' | 'Backend / Web Dev';

interface Course {
  title: string;
  platform: string;
  track: TrackId;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  url: string;
  rating: number;
}

const featuredCourses: Course[] = [
  // Programming & DSA
  { title: 'Data Structures & Algorithms Specialization', platform: 'Coursera', track: 'Programming & DSA', difficulty: 'Intermediate', duration: '6 months', url: 'https://www.coursera.org/specializations/data-structures-algorithms', rating: 4.7 },
  { title: 'Competitive Programming Essentials', platform: 'Udemy', track: 'Programming & DSA', difficulty: 'Advanced', duration: '40 hours', url: 'https://www.udemy.com/course/competitive-programming/', rating: 4.5 },
  { title: 'Problem Solving Through Programming in C', platform: 'NPTEL', track: 'Programming & DSA', difficulty: 'Beginner', duration: '12 weeks', url: 'https://nptel.ac.in/courses/106105171', rating: 4.3 },
  { title: 'Master the Coding Interview: DSA + Big-O', platform: 'Udemy', track: 'Programming & DSA', difficulty: 'Intermediate', duration: '20 hours', url: 'https://www.udemy.com/course/master-the-coding-interview-data-structures-algorithms/', rating: 4.6 },
  // Data Science & ML
  { title: 'Machine Learning Specialization', platform: 'Coursera', track: 'Data Science & ML', difficulty: 'Intermediate', duration: '3 months', url: 'https://www.coursera.org/specializations/machine-learning-introduction', rating: 4.9 },
  { title: 'Deep Learning with PyTorch', platform: 'Udemy', track: 'Data Science & ML', difficulty: 'Advanced', duration: '25 hours', url: 'https://www.udemy.com/course/pytorch-for-deep-learning/', rating: 4.6 },
  { title: 'Python for Data Science', platform: 'NPTEL', track: 'Data Science & ML', difficulty: 'Beginner', duration: '8 weeks', url: 'https://nptel.ac.in/courses/106106212', rating: 4.4 },
  { title: 'Applied Data Science with Python', platform: 'Coursera', track: 'Data Science & ML', difficulty: 'Intermediate', duration: '5 months', url: 'https://www.coursera.org/specializations/data-science-python', rating: 4.5 },
  // Database & SQL
  { title: 'The Complete SQL Bootcamp', platform: 'Udemy', track: 'Database Management & SQL', difficulty: 'Beginner', duration: '9 hours', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', rating: 4.7 },
  { title: 'Database Management Systems', platform: 'NPTEL', track: 'Database Management & SQL', difficulty: 'Intermediate', duration: '12 weeks', url: 'https://nptel.ac.in/courses/106105175', rating: 4.5 },
  { title: 'Advanced SQL for Data Scientists', platform: 'Coursera', track: 'Database Management & SQL', difficulty: 'Advanced', duration: '4 weeks', url: 'https://www.coursera.org/learn/advanced-sql', rating: 4.3 },
  { title: 'MongoDB - The Complete Developer Guide', platform: 'Udemy', track: 'Database Management & SQL', difficulty: 'Intermediate', duration: '17 hours', url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/', rating: 4.6 },
  // Backend / Web Dev
  { title: 'Node.js, Express & MongoDB Bootcamp', platform: 'Udemy', track: 'Backend / Web Dev', difficulty: 'Intermediate', duration: '42 hours', url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/', rating: 4.8 },
  { title: 'REST API Design & Development', platform: 'Coursera', track: 'Backend / Web Dev', difficulty: 'Intermediate', duration: '4 weeks', url: 'https://www.coursera.org/learn/api-design', rating: 4.4 },
  { title: 'System Design for Beginners', platform: 'Udemy', track: 'Backend / Web Dev', difficulty: 'Advanced', duration: '15 hours', url: 'https://www.udemy.com/course/system-design/', rating: 4.5 },
  { title: 'Web Development with Node.js', platform: 'NPTEL', track: 'Backend / Web Dev', difficulty: 'Beginner', duration: '8 weeks', url: 'https://nptel.ac.in/courses/106105191', rating: 4.2 },
];

const trackOverview = [
  { id: 'Programming & DSA' as TrackId, title: 'Programming & DSA', icon: Code, secondaryIcon: Binary, color: 'primary' as const, description: 'Master sorting, graphs, dynamic programming, and problem-solving techniques.' },
  { id: 'Data Science & ML' as TrackId, title: 'Data Science & ML', icon: Brain, secondaryIcon: Sparkles, color: 'accent' as const, description: 'Explore neural networks, model evaluation, deep learning, and data analytics.' },
  { id: 'Database Management & SQL' as TrackId, title: 'Database & SQL', icon: Database, secondaryIcon: Server, color: 'secondary' as const, description: 'Learn normalization, SQL joins, ACID transactions, and database optimization.' },
  { id: 'Backend / Web Dev' as TrackId, title: 'Backend / Web Dev', icon: Server, secondaryIcon: Code, color: 'tertiary' as const, description: 'Build with Node.js, REST APIs, JWT authentication, and HTTP protocols.' },
];

const StudentHome = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const coursesRef = useRef<HTMLDivElement>(null);
  const [activeTrackFilter, setActiveTrackFilter] = useState<TrackId | 'all'>('all');

  const filteredCourses = activeTrackFilter === 'all'
    ? featuredCourses
    : featuredCourses.filter(c => c.track === activeTrackFilter);

  const difficultyColor = (d: string) =>
    d === 'Beginner' ? 'text-success border-success/30 bg-success/10' :
    d === 'Intermediate' ? 'text-accent border-accent/30 bg-accent/10' :
    'text-destructive border-destructive/30 bg-destructive/10';

  const trackColor = (track: TrackId) =>
    track === 'Programming & DSA' ? 'primary' :
    track === 'Data Science & ML' ? 'accent' :
    track === 'Database Management & SQL' ? 'secondary' : 'tertiary';

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="primary" size={250} />
      <Navbar />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* === HERO SECTION === */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-6">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">WELCOME_BACK</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-glow mb-4">
            Hey, {username}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-medium">
            Build Your Skills. Land Your Dream Job.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <CyberButton
              variant="primary"
              size="lg"
              glowing
              onClick={() => coursesRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Explore Courses
            </CyberButton>
            <CyberButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/tracks')}
            >
              <Target className="w-5 h-5 mr-2" />
              Take Skill Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </CyberButton>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { icon: BookOpen, value: '16+', label: 'Curated Courses' },
              { icon: Trophy, value: '4', label: 'Career Tracks' },
              { icon: BarChart3, value: 'AI', label: 'Skill Analysis' },
              { icon: Zap, value: '5 min', label: 'Per Assessment' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border border-border text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-display font-bold text-xl text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* === FEATURED COURSES === */}
        <section ref={coursesRef} className="mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-muted-foreground">FEATURED_COURSES</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-glow mb-2">Skill-Building Courses</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Curated from Coursera, Udemy & NPTEL to match your career track.</p>
          </motion.div>

          {/* Track Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {(['all', ...trackOverview.map(t => t.id)] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveTrackFilter(filter)}
                className={`px-4 py-2 text-sm font-mono rounded-full border transition-all ${
                  activeTrackFilter === filter
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {filter === 'all' ? 'All Tracks' : filter}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredCourses.map((course, i) => {
              const color = trackColor(course.track);
              return (
                <motion.a
                  key={i}
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group block"
                >
                  <div className={`h-full p-5 rounded-lg bg-card border border-border hover:border-${color}/50 transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${difficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        {course.rating}
                      </div>
                    </div>
                    <h3 className="font-display text-sm font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span className="font-medium">{course.platform}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-mono rounded-full bg-${color}/10 text-${color} border border-${color}/30`}>
                      {course.track}
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </section>

        {/* === TRACK OVERVIEW === */}
        <section className="mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-muted-foreground">CAREER_TRACKS</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-glow mb-2">Explore Career Tracks</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Four specialized paths to accelerate your placement readiness.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {trackOverview.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <CyberCard
                  variant={track.color === 'primary' ? 'glow' : track.color === 'accent' ? 'accent' : track.color === 'secondary' ? 'secondary' : 'tertiary'}
                  animated={false}
                  className="h-full"
                >
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center mb-4 ${
                    track.color === 'primary' ? 'bg-primary/20 border-primary/50' :
                    track.color === 'accent' ? 'bg-accent/20 border-accent/50' :
                    track.color === 'secondary' ? 'bg-secondary/20 border-secondary/50' :
                    'bg-tertiary/20 border-tertiary/50'
                  }`}>
                    <track.icon className={`w-6 h-6 ${
                      track.color === 'primary' ? 'text-primary' :
                      track.color === 'accent' ? 'text-accent' :
                      track.color === 'secondary' ? 'text-secondary' :
                      'text-tertiary'
                    }`} />
                  </div>
                  <h3 className={`font-display text-lg font-bold mb-2 ${
                    track.color === 'primary' ? 'text-primary' :
                    track.color === 'accent' ? 'text-accent' :
                    track.color === 'secondary' ? 'text-secondary' :
                    'text-tertiary'
                  }`}>{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{track.description}</p>
                </CyberCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* === SKILL GAP CTA === */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <CyberCard variant="glow" className="max-w-4xl mx-auto text-center py-12 px-8">
            <div className="w-20 h-20 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center mx-auto mb-6 glow-primary">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-glow mb-4">
              Know Where You Stand
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Take a quick 5-question assessment to identify your skill gaps and get personalized learning recommendations powered by AI.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-muted-foreground">
              {[
                { icon: Zap, text: '5 questions per track' },
                { icon: Brain, text: 'AI-powered analysis' },
                { icon: TrendingUp, text: 'Personalized recommendations' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <CyberButton variant="primary" size="xl" glowing onClick={() => navigate('/tracks')}>
              <Target className="w-5 h-5 mr-2" />
              Start Skill Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </CyberButton>
          </CyberCard>
        </motion.section>

      </div>

      <FloatingTPOChat />
    </div>
  );
};

export default StudentHome;
