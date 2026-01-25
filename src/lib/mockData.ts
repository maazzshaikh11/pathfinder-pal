// Mock data for PlacementPal demo

export type TrackType = 'AI/ML' | 'Cybersecurity' | 'Systems & IoT' | 'Blockchain';

export interface StudentResult {
  id: string;
  user: string;
  email: string;
  track: TrackType;
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

export const iotQuestions: Question[] = [
  {
    id: 'iot-1',
    type: 'mcq',
    question: 'Which protocol is commonly used for lightweight messaging in IoT applications?',
    options: ['HTTP', 'MQTT', 'FTP', 'SMTP'],
    correctAnswer: 1,
    topic: 'IoT Protocols',
    explanation: 'MQTT (Message Queuing Telemetry Transport) is designed for low-bandwidth, high-latency networks, making it ideal for IoT.'
  },
  {
    id: 'iot-2',
    type: 'mcq',
    question: 'What is the primary purpose of a Real-Time Operating System (RTOS)?',
    options: ['Maximum throughput', 'Guaranteed response times', 'Multi-user support', 'High memory capacity'],
    correctAnswer: 1,
    topic: 'Real-time Processing',
    explanation: 'RTOS prioritizes deterministic timing and guaranteed response times for time-critical applications.'
  },
  {
    id: 'iot-3',
    type: 'coding',
    question: 'In embedded C, what is the typical size (in bytes) of an unsigned char used to represent sensor readings?',
    correctAnswer: '1',
    topic: 'Embedded Systems',
    explanation: 'An unsigned char is typically 1 byte (8 bits), allowing values from 0 to 255.'
  }
];

export const blockchainQuestions: Question[] = [
  {
    id: 'blockchain-1',
    type: 'mcq',
    question: 'Which consensus mechanism does Ethereum 2.0 primarily use?',
    options: ['Proof of Work', 'Proof of Stake', 'Delegated Proof of Stake', 'Proof of Authority'],
    correctAnswer: 1,
    topic: 'Consensus Mechanisms',
    explanation: 'Ethereum 2.0 transitioned to Proof of Stake for improved energy efficiency and scalability.'
  },
  {
    id: 'blockchain-2',
    type: 'mcq',
    question: 'What is a smart contract?',
    options: ['A legal document on blockchain', 'Self-executing code on blockchain', 'A type of cryptocurrency', 'A wallet address'],
    correctAnswer: 1,
    topic: 'Smart Contracts',
    explanation: 'Smart contracts are self-executing programs stored on a blockchain that automatically enforce and execute agreement terms.'
  },
  {
    id: 'blockchain-3',
    type: 'coding',
    question: 'In Solidity, what keyword is used to make a function callable only by the contract owner? (Hint: it\'s a common modifier name)',
    correctAnswer: 'onlyOwner',
    topic: 'Smart Contracts',
    explanation: 'onlyOwner is a common modifier pattern in Solidity that restricts function access to the contract owner.'
  }
];

const studentNames = [
  'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Gupta', 'Vikram Singh',
  'Ananya Reddy', 'Karan Mehta', 'Neha Joshi', 'Aditya Kumar', 'Pooja Nair',
  'Rohan Das', 'Ishita Banerjee', 'Amit Saxena', 'Divya Choudhury', 'Sanjay Rao',
  'Meera Iyer', 'Varun Kapoor', 'Ritu Agarwal', 'Nikhil Malhotra', 'Kavita Menon'
];

const gapsByTrack: Record<TrackType, string[]> = {
  'AI/ML': ['Model Evaluation', 'Neural Networks', 'Activation Functions', 'Feature Engineering', 'Regularization'],
  'Cybersecurity': ['Web Security', 'Network Security', 'Cryptography', 'Authentication', 'Threat Modeling'],
  'Systems & IoT': ['IoT Protocols', 'Real-time Processing', 'Embedded Systems', 'Sensor Networks', 'Edge Computing'],
  'Blockchain': ['Smart Contracts', 'Consensus Mechanisms', 'DeFi', 'Cryptographic Hashing', 'Token Standards']
};

const tracks: TrackType[] = ['AI/ML', 'Cybersecurity', 'Systems & IoT', 'Blockchain'];

function generateMockStudents(): StudentResult[] {
  const students: StudentResult[] = [];
  
  studentNames.forEach((name, index) => {
    const track = tracks[index % 4];
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

export const getTrackStats = (track: TrackType) => {
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
