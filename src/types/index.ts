export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  websiteUrl: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
  targetRole: string;
  rawCvText: string;
  updatedAt: number;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  name: string;
  level: number;
  category: string;
}

export interface Language {
  name: string;
  level: 'native' | 'fluent' | 'intermediate' | 'basic';
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
}

export interface JobListing {
  id: string;
  url: string;
  company: string;
  title: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite' | '';
  description: string;
  requirements: string[];
  niceToHaves: string[];
  responsibilities: string[];
  salary: string;
  scrapedAt: number;
  status: 'active' | 'applied' | 'rejected' | 'interview';
}

export interface GeneratedCV {
  id: string;
  jobListingId: string;
  jobTitle: string;
  company: string;
  sections: CVSections;
  analysisScore: number;
  analysisDetails: AnalysisDetails;
  createdAt: number;
  updatedAt: number;
}

export interface CVSections {
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: string[];
  languages: string[];
}

export interface CVExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface CVEducation {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface AnalysisDetails {
  hardSkills: number;
  softSkills: number;
  experienceLevel: number;
  educationFit: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
