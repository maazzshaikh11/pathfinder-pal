// Mock data for PlacementPal demo

export interface StudentResult {
  id: string;
  user: string;
  email: string;
  track: 'AI/ML' | 'Cybersecurity';
  correct: number;
  total: number;
  gaps: string[];
  level: 'Beginner' | 'Intermediate' | 'Ready';
  completedAt: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  topic: string;
  explanation: string;
}

export const aiMlQuestions: Question[] = [
  {
    id: 'aiml-1',
    type: 'mcq',
    question: 'Which metric is most appropriate for evaluating a model on an imbalanced classification dataset?',
    options: ['Accuracy', 'F1-Score', 'Mean Squared Error', 'R-squared'],
    correctAnswer: 1,
    topic: 'Model Evaluation',
    explanation: 'F1-Score balances precision and recall, making it ideal for imbalanced datasets where accuracy can be misleading.'
  },
  {
    id: 'aiml-2',
    type: 'mcq',
    question: 'What is the purpose of dropout in neural networks?',
    options: ['Speed up training', 'Reduce overfitting', 'Increase model capacity', 'Normalize inputs'],
    correctAnswer: 1,
    topic: 'Neural Networks',
    explanation: 'Dropout randomly deactivates neurons during training, preventing co-adaptation and reducing overfitting.'
  },
  {
    id: 'aiml-3',
    type: 'coding',
    question: 'Write a Python function that calculates the sigmoid activation function. The function should take a number x and return 1 / (1 + e^(-x)). What would be the output for x = 0?',
    correctAnswer: '0.5',
    topic: 'Activation Functions',
    explanation: 'sigmoid(0) = 1/(1+e^0) = 1/2 = 0.5. The sigmoid function maps any input to a value between 0 and 1.'
  }
];

export const cybersecurityQuestions: Question[] = [
  {
    id: 'cyber-1',
    type: 'mcq',
    question: 'Which attack exploits the trust a website has in a user\'s browser?',
    options: ['SQL Injection', 'XSS (Cross-Site Scripting)', 'CSRF (Cross-Site Request Forgery)', 'DDoS'],
    correctAnswer: 2,
    topic: 'Web Security',
    explanation: 'CSRF exploits the trust that a site has in the user\'s browser by making unauthorized requests on behalf of an authenticated user.'
  },
  {
    id: 'cyber-2',
    type: 'mcq',
    question: 'What does the "S" in HTTPS stand for?',
    options: ['Simple', 'Secure', 'Standard', 'System'],
    correctAnswer: 1,
    topic: 'Network Security',
    explanation: 'HTTPS stands for HyperText Transfer Protocol Secure, indicating encrypted communication.'
  },
  {
    id: 'cyber-3',
    type: 'coding',
    question: 'In a Caesar cipher with a shift of 3, what would be the encrypted form of the letter "A"?',
    correctAnswer: 'D',
    topic: 'Cryptography',
    explanation: 'Caesar cipher shifts each letter by a fixed amount. A shifted by 3 becomes D (A→B→C→D).'
  }
];

const studentNames = [
  'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Gupta', 'Vikram Singh',
  'Ananya Reddy', 'Karan Mehta', 'Neha Joshi', 'Aditya Kumar', 'Pooja Nair',
  'Rohan Das', 'Ishita Banerjee', 'Amit Saxena', 'Divya Choudhury', 'Sanjay Rao',
  'Meera Iyer', 'Varun Kapoor', 'Ritu Agarwal', 'Nikhil Malhotra', 'Kavita Menon'
];

const gapsByTrack = {
  'AI/ML': ['Model Evaluation', 'Neural Networks', 'Activation Functions', 'Feature Engineering', 'Regularization'],
  'Cybersecurity': ['Web Security', 'Network Security', 'Cryptography', 'Authentication', 'Threat Modeling']
};

function generateMockStudents(): StudentResult[] {
  const students: StudentResult[] = [];
  
  studentNames.forEach((name, index) => {
    const track = index % 2 === 0 ? 'AI/ML' : 'Cybersecurity';
    const correct = Math.floor(Math.random() * 4); // 0-3
    const gaps: string[] = [];
    const trackGaps = gapsByTrack[track];
    
    // Assign gaps based on performance
    if (correct < 3) {
      const numGaps = 3 - correct;
      for (let i = 0; i < numGaps && i < trackGaps.length; i++) {
        gaps.push(trackGaps[Math.floor(Math.random() * trackGaps.length)]);
      }
    }
    
    let level: 'Beginner' | 'Intermediate' | 'Ready';
    if (correct <= 1) level = 'Beginner';
    else if (correct === 2) level = 'Intermediate';
    else level = 'Ready';
    
    students.push({
      id: `student-${index + 1}`,
      user: name,
      email: `${name.toLowerCase().replace(' ', '.')}@college.edu`,
      track,
      correct,
      total: 3,
      gaps: [...new Set(gaps)], // Remove duplicates
      level,
      completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  
  return students;
}

export const mockStudents = generateMockStudents();

export const getTrackStats = (track: 'AI/ML' | 'Cybersecurity') => {
  const trackStudents = mockStudents.filter(s => s.track === track);
  const total = trackStudents.length;
  
  const levelCounts = {
    Beginner: trackStudents.filter(s => s.level === 'Beginner').length,
    Intermediate: trackStudents.filter(s => s.level === 'Intermediate').length,
    Ready: trackStudents.filter(s => s.level === 'Ready').length
  };
  
  const allGaps = trackStudents.flatMap(s => s.gaps);
  const gapCounts: Record<string, number> = {};
  allGaps.forEach(gap => {
    gapCounts[gap] = (gapCounts[gap] || 0) + 1;
  });
  
  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gap, count]) => ({ gap, count, percentage: Math.round((count / total) * 100) }));
  
  return {
    total,
    levelCounts,
    levelPercentages: {
      Beginner: Math.round((levelCounts.Beginner / total) * 100),
      Intermediate: Math.round((levelCounts.Intermediate / total) * 100),
      Ready: Math.round((levelCounts.Ready / total) * 100)
    },
    topGaps
  };
};

export const getAllStats = () => {
  const aimlStats = getTrackStats('AI/ML');
  const cyberStats = getTrackStats('Cybersecurity');
  
  const allGaps = mockStudents.flatMap(s => s.gaps);
  const gapCounts: Record<string, number> = {};
  allGaps.forEach(gap => {
    gapCounts[gap] = (gapCounts[gap] || 0) + 1;
  });
  
  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gap, count]) => ({ gap, count, percentage: Math.round((count / mockStudents.length) * 100) }));
  
  return {
    totalStudents: mockStudents.length,
    aiml: aimlStats,
    cybersecurity: cyberStats,
    topGaps
  };
};
