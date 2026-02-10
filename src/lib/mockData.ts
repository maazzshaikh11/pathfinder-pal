// Mock data for PlacementPal demo

export type TrackType = 'Programming & DSA' | 'Data Science & ML' | 'Database Management & SQL' | 'Backend / Web Dev';

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

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  type: 'mcq' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  topic: string;
  explanation: string;
  difficulty: DifficultyLevel;
}

export const programmingDsaQuestions: Question[] = [
  {
    id: 'dsa-1',
    type: 'mcq',
    question: 'What is the time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 1,
    topic: 'Searching Algorithms',
    explanation: 'Binary search divides the search space in half each step, giving O(log n) time complexity.',
    difficulty: 'Easy'
  },
  {
    id: 'dsa-2',
    type: 'mcq',
    question: 'Which data structure is used for BFS traversal of a graph?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Linked List'],
    correctAnswer: 1,
    topic: 'Graph Algorithms',
    explanation: 'BFS uses a Queue (FIFO) to explore nodes level by level.',
    difficulty: 'Easy'
  },
  {
    id: 'dsa-3',
    type: 'coding',
    question: 'What is the worst-case time complexity of QuickSort? Express in Big-O notation (e.g., O(n^2)).',
    correctAnswer: 'O(n^2)',
    topic: 'Sorting Algorithms',
    explanation: 'QuickSort degrades to O(n^2) when the pivot selection is poor (e.g., already sorted array with first element as pivot).',
    difficulty: 'Medium'
  },
  {
    id: 'dsa-4',
    type: 'mcq',
    question: 'Which technique is used to solve the 0/1 Knapsack problem optimally?',
    options: ['Greedy', 'Dynamic Programming', 'Divide and Conquer', 'Backtracking'],
    correctAnswer: 1,
    topic: 'Dynamic Programming',
    explanation: 'The 0/1 Knapsack problem requires Dynamic Programming for an optimal solution as greedy does not guarantee optimality.',
    difficulty: 'Medium'
  },
  {
    id: 'dsa-5',
    type: 'coding',
    question: 'In a min-heap with n elements, what is the time complexity of extracting the minimum element? Express in Big-O notation.',
    correctAnswer: 'O(log n)',
    topic: 'Heaps & Priority Queues',
    explanation: 'Extracting the min removes the root and requires heapify-down, which takes O(log n).',
    difficulty: 'Hard'
  }
];

export const dataScienceMlQuestions: Question[] = [
  {
    id: 'dsml-1',
    type: 'mcq',
    question: 'Which metric is most appropriate for evaluating a model on an imbalanced classification dataset?',
    options: ['Accuracy', 'F1-Score', 'Mean Squared Error', 'R-squared'],
    correctAnswer: 1,
    topic: 'Model Evaluation',
    explanation: 'F1-Score balances precision and recall, making it ideal for imbalanced datasets where accuracy can be misleading.',
    difficulty: 'Medium'
  },
  {
    id: 'dsml-2',
    type: 'mcq',
    question: 'What is the purpose of dropout in neural networks?',
    options: ['Speed up training', 'Reduce overfitting', 'Increase model capacity', 'Normalize inputs'],
    correctAnswer: 1,
    topic: 'Neural Networks',
    explanation: 'Dropout randomly deactivates neurons during training, preventing co-adaptation and reducing overfitting.',
    difficulty: 'Easy'
  },
  {
    id: 'dsml-3',
    type: 'coding',
    question: 'Write a Python function that calculates the sigmoid activation function. The function should take a number x and return 1 / (1 + e^(-x)). What would be the output for x = 0?',
    correctAnswer: '0.5',
    topic: 'Activation Functions',
    explanation: 'sigmoid(0) = 1/(1+e^0) = 1/2 = 0.5. The sigmoid function maps any input to a value between 0 and 1.',
    difficulty: 'Medium'
  },
  {
    id: 'dsml-4',
    type: 'mcq',
    question: 'What technique is used to prevent gradient vanishing in deep networks?',
    options: ['Max Pooling', 'Batch Normalization', 'Softmax', 'One-Hot Encoding'],
    correctAnswer: 1,
    topic: 'Deep Learning',
    explanation: 'Batch Normalization normalizes layer inputs, stabilizing gradients and enabling deeper networks to train effectively.',
    difficulty: 'Hard'
  },
  {
    id: 'dsml-5',
    type: 'coding',
    question: 'In a confusion matrix, if TP=80, FP=10, TN=85, FN=25, what is the precision value? (Round to 2 decimal places)',
    correctAnswer: '0.89',
    topic: 'Model Evaluation',
    explanation: 'Precision = TP/(TP+FP) = 80/(80+10) = 80/90 ≈ 0.89. It measures the accuracy of positive predictions.',
    difficulty: 'Hard'
  }
];

export const databaseSqlQuestions: Question[] = [
  {
    id: 'db-1',
    type: 'mcq',
    question: 'Which normal form eliminates transitive dependencies?',
    options: ['1NF', '2NF', '3NF', 'BCNF'],
    correctAnswer: 2,
    topic: 'Normalization',
    explanation: '3NF eliminates transitive dependencies where non-key attributes depend on other non-key attributes.',
    difficulty: 'Medium'
  },
  {
    id: 'db-2',
    type: 'mcq',
    question: 'Which SQL clause is used to filter groups of rows?',
    options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
    correctAnswer: 1,
    topic: 'SQL Queries',
    explanation: 'HAVING filters groups after GROUP BY, while WHERE filters individual rows before grouping.',
    difficulty: 'Easy'
  },
  {
    id: 'db-3',
    type: 'coding',
    question: 'What type of JOIN returns all rows from both tables, matching where possible and filling NULLs otherwise? (One word answer)',
    correctAnswer: 'FULL',
    topic: 'SQL Joins',
    explanation: 'A FULL (OUTER) JOIN returns all rows from both tables, with NULLs where there is no match.',
    difficulty: 'Easy'
  },
  {
    id: 'db-4',
    type: 'mcq',
    question: 'Which property of ACID ensures that a transaction is treated as a single unit?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctAnswer: 0,
    topic: 'Transactions & ACID',
    explanation: 'Atomicity ensures all operations in a transaction succeed or none do — it is all-or-nothing.',
    difficulty: 'Medium'
  },
  {
    id: 'db-5',
    type: 'coding',
    question: 'What is the worst-case time complexity of a query on an unindexed column with n rows? Express in Big-O notation.',
    correctAnswer: 'O(n)',
    topic: 'Indexing & Optimization',
    explanation: 'Without an index, the database must perform a full table scan, resulting in O(n) time complexity.',
    difficulty: 'Hard'
  }
];

export const backendWebDevQuestions: Question[] = [
  {
    id: 'backend-1',
    type: 'mcq',
    question: 'Which HTTP method is idempotent and used to update a resource completely?',
    options: ['POST', 'PUT', 'PATCH', 'DELETE'],
    correctAnswer: 1,
    topic: 'REST APIs',
    explanation: 'PUT is idempotent and replaces the entire resource. Calling it multiple times produces the same result.',
    difficulty: 'Easy'
  },
  {
    id: 'backend-2',
    type: 'mcq',
    question: 'What does middleware do in an Express.js application?',
    options: ['Renders HTML pages', 'Intercepts and processes requests before reaching route handlers', 'Manages the database', 'Compiles JavaScript'],
    correctAnswer: 1,
    topic: 'Node.js & Express',
    explanation: 'Middleware functions have access to the request and response objects and can execute code, modify them, or end the request-response cycle.',
    difficulty: 'Easy'
  },
  {
    id: 'backend-3',
    type: 'coding',
    question: 'In JWT authentication, what are the three parts of a token separated by? (One character answer)',
    correctAnswer: '.',
    topic: 'Authentication & JWT',
    explanation: 'A JWT consists of three parts: Header, Payload, and Signature, separated by dots (.).',
    difficulty: 'Medium'
  },
  {
    id: 'backend-4',
    type: 'mcq',
    question: 'Which status code indicates that the server understood the request but refuses to authorize it?',
    options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '500 Internal Server Error'],
    correctAnswer: 1,
    topic: 'HTTP Status Codes',
    explanation: '403 Forbidden means the server understood the request but the client does not have permission to access the resource.',
    difficulty: 'Medium'
  },
  {
    id: 'backend-5',
    type: 'coding',
    question: 'In Node.js, what built-in module is used to create an HTTP server? (One word, lowercase)',
    correctAnswer: 'http',
    topic: 'Node.js & Express',
    explanation: 'The built-in "http" module in Node.js provides functionality to create HTTP servers and make HTTP requests.',
    difficulty: 'Hard'
  }
];

const studentNames = [
  'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Gupta', 'Vikram Singh',
  'Ananya Reddy', 'Karan Mehta', 'Neha Joshi', 'Aditya Kumar', 'Pooja Nair',
  'Rohan Das', 'Ishita Banerjee', 'Amit Saxena', 'Divya Choudhury', 'Sanjay Rao',
  'Meera Iyer', 'Varun Kapoor', 'Ritu Agarwal', 'Nikhil Malhotra', 'Kavita Menon'
];

const gapsByTrack: Record<TrackType, string[]> = {
  'Programming & DSA': ['Searching Algorithms', 'Graph Algorithms', 'Sorting Algorithms', 'Dynamic Programming', 'Heaps & Priority Queues'],
  'Data Science & ML': ['Model Evaluation', 'Neural Networks', 'Activation Functions', 'Deep Learning', 'Feature Engineering'],
  'Database Management & SQL': ['Normalization', 'SQL Queries', 'SQL Joins', 'Transactions & ACID', 'Indexing & Optimization'],
  'Backend / Web Dev': ['REST APIs', 'Node.js & Express', 'Authentication & JWT', 'HTTP Status Codes', 'API Design']
};

const tracks: TrackType[] = ['Programming & DSA', 'Data Science & ML', 'Database Management & SQL', 'Backend / Web Dev'];

function generateMockStudents(): StudentResult[] {
  const students: StudentResult[] = [];
  
  studentNames.forEach((name, index) => {
    const track = tracks[index % 4];
    const correct = Math.floor(Math.random() * 6); // 0-5
    const gaps: string[] = [];
    const trackGaps = gapsByTrack[track];
    
    if (correct < 5) {
      const numGaps = 5 - correct;
      for (let i = 0; i < numGaps && i < trackGaps.length; i++) {
        gaps.push(trackGaps[Math.floor(Math.random() * trackGaps.length)]);
      }
    }
    
    let level: 'Beginner' | 'Intermediate' | 'Ready';
    if (correct <= 2) level = 'Beginner';
    else if (correct <= 4) level = 'Intermediate';
    else level = 'Ready';
    
    students.push({
      id: `student-${index + 1}`,
      user: name,
      email: `${name.toLowerCase().replace(' ', '.')}@college.edu`,
      track,
      correct,
      total: 5,
      gaps: [...new Set(gaps)],
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
  const progStats = getTrackStats('Programming & DSA');
  const dsmlStats = getTrackStats('Data Science & ML');
  const dbStats = getTrackStats('Database Management & SQL');
  const backendStats = getTrackStats('Backend / Web Dev');
  
  const allGaps = mockStudents.flatMap(s => s.gaps);
  const gapCounts: Record<string, number> = {};
  allGaps.forEach(gap => {
    gapCounts[gap] = (gapCounts[gap] || 0) + 1;
  });
  
  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([gap, count]) => ({ gap, count, percentage: Math.round((count / mockStudents.length) * 100) }));
  
  return {
    totalStudents: mockStudents.length,
    programming: progStats,
    datascience: dsmlStats,
    database: dbStats,
    backend: backendStats,
    topGaps
  };
};
