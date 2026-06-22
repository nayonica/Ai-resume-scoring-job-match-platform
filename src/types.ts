export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  extractedText: string;
  selectedRole: string;
  uploadedAt: string;
}

export interface Analysis {
  id: string;
  userId: string;
  resumeId: string;
  selectedRole: string;
  atsScore: number;
  roleMatchScore: number;
  overallScore: number;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export const TARGET_ROLES = [
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer"
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

export const ROLE_REQUIREMENTS: Record<TargetRole, string[]> = {
  "Full Stack Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "REST API",
    "Git"
  ],
  "Data Analyst": [
    "Python",
    "SQL",
    "Excel",
    "Pandas",
    "Power BI",
    "Tableau",
    "Statistics",
    "Data Cleaning"
  ],
  "Data Scientist": [
    "Python",
    "Pandas",
    "NumPy",
    "Machine Learning",
    "Statistics",
    "Data Visualization",
    "Scikit-learn",
    "Data Cleaning"
  ],
  "AI/ML Engineer": [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "TensorFlow",
    "PyTorch",
    "APIs",
    "Model Deployment"
  ]
};

export const MASTER_SKILLS = [
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "Git",
  "REST API",
  "Python",
  "SQL",
  "Excel",
  "Pandas",
  "Power BI",
  "Tableau",
  "Statistics",
  "Data Cleaning",
  "NumPy",
  "Machine Learning",
  "Data Visualization",
  "Scikit-learn",
  "Deep Learning",
  "NLP",
  "TensorFlow",
  "PyTorch",
  "APIs",
  "Model Deployment"
];
