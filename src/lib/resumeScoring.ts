import { TrackType } from './mockData';

export interface ResumeAnalysis {
  fileName: string;
  skillMatchScore: number;
  projectQualityScore: number;
  experienceScore: number;
  resumeStructureScore: number;
  actionVerbsScore: number;
  consistencyScore: number;
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

// Skills required for each track
const trackSkills: Record<TrackType, string[]> = {
  'Programming & DSA': [
    'c', 'c++', 'java', 'python', 'data structures', 'algorithms',
    'arrays', 'linked list', 'trees', 'graphs', 'dynamic programming',
    'sorting', 'searching', 'recursion', 'competitive programming'
  ],
  'Data Science & ML': [
    'python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning',
    'neural networks', 'data science', 'pandas', 'numpy', 'scikit-learn',
    'nlp', 'computer vision', 'keras', 'jupyter', 'data analysis'
  ],
  'Database Management & SQL': [
    'sql', 'mysql', 'postgresql', 'mongodb', 'database', 'normalization',
    'indexing', 'query optimization', 'joins', 'stored procedures',
    'nosql', 'redis', 'data modeling', 'acid', 'transactions'
  ],
  'Backend / Web Dev': [
    'node.js', 'express', 'rest api', 'graphql', 'javascript', 'typescript',
    'docker', 'git', 'ci/cd', 'microservices', 'authentication', 'jwt',
    'websockets', 'nginx', 'aws'
  ]
};

// Action verbs that indicate impact
const actionVerbs = [
  'developed', 'implemented', 'designed', 'created', 'built', 'led',
  'managed', 'optimized', 'improved', 'achieved', 'delivered', 'launched',
  'automated', 'integrated', 'analyzed', 'reduced', 'increased', 'enhanced'
];

// Simulate extracting text from resume (in real app, this would use PDF parsing)
export const simulateResumeContent = (fileName: string): string => {
  // This simulates extracted resume content
  // In production, you'd use a PDF parser
  const simulatedContent = `
    John Doe
    Software Engineer
    
    Skills:
    Python, TensorFlow, Machine Learning, Data Analysis, Neural Networks
    JavaScript, React, Node.js, SQL, Git
    
    Experience:
    Software Engineer at Tech Corp (2022-2024)
    - Developed machine learning models for prediction
    - Implemented data pipelines using Python and pandas
    - Led team of 3 engineers on ML projects
    
    Projects:
    - Built a sentiment analysis tool using NLP techniques
    - Created a recommendation system with collaborative filtering
    - Developed REST APIs for data services
    
    Education:
    B.Tech in Computer Science, 2022
    GPA: 3.8/4.0
  `.toLowerCase();
  
  return simulatedContent;
};

export const analyzeResume = (
  resumeContent: string, 
  selectedTrack: TrackType | null
): ResumeAnalysis => {
  const content = resumeContent.toLowerCase();
  const requiredSkills = selectedTrack ? trackSkills[selectedTrack] : 
    Object.values(trackSkills).flat();
  
  // Calculate Skill Match Score
  const matchedSkills = requiredSkills.filter(skill => 
    content.includes(skill.toLowerCase())
  );
  const skillMatchScore = requiredSkills.length > 0 
    ? (matchedSkills.length / requiredSkills.length) * 100 
    : 0;
  
  const missingSkills = requiredSkills.filter(skill => 
    !content.includes(skill.toLowerCase())
  ).slice(0, 5); // Top 5 missing skills
  
  // Calculate Project Quality Score (based on project mentions)
  const projectKeywords = ['project', 'built', 'developed', 'created', 'implemented'];
  const projectMentions = projectKeywords.reduce((count, kw) => 
    count + (content.match(new RegExp(kw, 'gi'))?.length || 0), 0
  );
  const projectQualityScore = Math.min(projectMentions * 10, 100);
  
  // Calculate Experience Score
  const expKeywords = ['experience', 'years', 'intern', 'engineer', 'developer', 'analyst'];
  const expMentions = expKeywords.reduce((count, kw) => 
    count + (content.match(new RegExp(kw, 'gi'))?.length || 0), 0
  );
  const experienceScore = Math.min(expMentions * 12, 100);
  
  // Calculate Resume Structure Score (based on section presence)
  const sections = ['skills', 'experience', 'education', 'projects', 'summary'];
  const sectionCount = sections.filter(s => content.includes(s)).length;
  const resumeStructureScore = (sectionCount / sections.length) * 100;
  
  // Calculate Action Verbs & Impact Score
  const actionVerbCount = actionVerbs.reduce((count, verb) => 
    count + (content.match(new RegExp(verb, 'gi'))?.length || 0), 0
  );
  const actionVerbsScore = Math.min(actionVerbCount * 8, 100);
  
  // Consistency Score (simulated - based on overall structure)
  const consistencyScore = Math.min(
    (resumeStructureScore * 0.5 + actionVerbsScore * 0.5),
    100
  );
  
  // Calculate Overall Resume Score using the formula
  const overallScore = 
    0.30 * skillMatchScore +
    0.25 * projectQualityScore +
    0.15 * experienceScore +
    0.10 * resumeStructureScore +
    0.10 * actionVerbsScore +
    0.10 * consistencyScore;
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (skillMatchScore < 50) {
    recommendations.push(`Add more ${selectedTrack || 'technical'} skills to your resume`);
  }
  if (projectQualityScore < 50) {
    recommendations.push('Include more project descriptions with quantified outcomes');
  }
  if (actionVerbsScore < 50) {
    recommendations.push('Use more action verbs like "developed", "implemented", "led"');
  }
  if (missingSkills.length > 0) {
    recommendations.push(`Consider learning: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  
  return {
    fileName: '',
    skillMatchScore: Math.round(skillMatchScore),
    projectQualityScore: Math.round(projectQualityScore),
    experienceScore: Math.round(experienceScore),
    resumeStructureScore: Math.round(resumeStructureScore),
    actionVerbsScore: Math.round(actionVerbsScore),
    consistencyScore: Math.round(consistencyScore),
    overallScore: Math.round(overallScore),
    matchedSkills,
    missingSkills,
    recommendations
  };
};
