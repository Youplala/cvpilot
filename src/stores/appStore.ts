import { create } from 'zustand';
import type { UserProfile, Resume, JobListing, GeneratedCV, ChatMessage, ResumeScore } from '../types';
import * as storage from '../services/storage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  profile: UserProfile | null; // Keep for backward compatibility
  resumes: Resume[];
  selectedResumeId: string | null; // For chat interface
  jobs: JobListing[];
  cvs: GeneratedCV[];
  resumeScores: ResumeScore[];
  messages: ChatMessage[];
  toasts: Toast[];
  loading: boolean;

  init: () => Promise<void>;
  setProfile: (p: UserProfile) => Promise<void>; // Keep for backward compatibility
  
  // Resume management
  addResume: (r: Resume) => Promise<void>;
  updateResume: (r: Resume) => Promise<void>;
  removeResume: (id: string) => Promise<void>;
  setSelectedResume: (id: string | null) => void;
  
  addJob: (j: JobListing) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  addCV: (cv: GeneratedCV) => Promise<void>;
  updateCV: (cv: GeneratedCV) => Promise<void>;
  removeCV: (id: string) => Promise<void>;
  
  // Resume scoring
  addResumeScore: (score: ResumeScore) => Promise<void>;
  getScoresForJob: (jobId: string) => ResumeScore[];
  
  addMessage: (msg: ChatMessage) => Promise<void>;
  clearChat: () => Promise<void>;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  resumes: [],
  selectedResumeId: null,
  jobs: [],
  cvs: [],
  resumeScores: [],
  messages: [],
  toasts: [],
  loading: false,

  init: async () => {
    const [profile, resumes, jobs, cvs, resumeScores, messages] = await Promise.all([
      storage.getProfile(),
      storage.getResumes(),
      storage.getJobs(),
      storage.getCVs(),
      storage.getResumeScores(),
      storage.getMessages(),
    ]);
    set({ 
      profile: profile || null, 
      resumes, 
      jobs, 
      cvs, 
      resumeScores,
      messages,
      selectedResumeId: resumes.length > 0 ? resumes[0].id : null
    });
  },

  setProfile: async (p) => {
    await storage.saveProfile(p);
    set({ profile: p });
  },

  // Resume management
  addResume: async (r) => {
    await storage.saveResume(r);
    const currentResumes = get().resumes;
    const newResumes = [...currentResumes.filter((x) => x.id !== r.id), r];
    set({ 
      resumes: newResumes,
      selectedResumeId: get().selectedResumeId || r.id
    });
  },

  updateResume: async (r) => {
    await storage.saveResume(r);
    set({ resumes: get().resumes.map((x) => (x.id === r.id ? r : x)) });
  },

  removeResume: async (id) => {
    await storage.deleteResume(id);
    const newResumes = get().resumes.filter((x) => x.id !== id);
    const currentSelected = get().selectedResumeId;
    set({ 
      resumes: newResumes,
      selectedResumeId: currentSelected === id ? (newResumes[0]?.id || null) : currentSelected
    });
  },

  setSelectedResume: (id) => {
    set({ selectedResumeId: id });
  },

  addJob: async (j) => {
    await storage.saveJob(j);
    set({ jobs: [...get().jobs.filter((x) => x.id !== j.id), j] });
  },

  removeJob: async (id) => {
    await storage.deleteJob(id);
    set({ jobs: get().jobs.filter((x) => x.id !== id) });
  },

  addCV: async (cv) => {
    await storage.saveCV(cv);
    set({ cvs: [...get().cvs.filter((x) => x.id !== cv.id), cv] });
  },

  updateCV: async (cv) => {
    await storage.saveCV(cv);
    set({ cvs: get().cvs.map((x) => (x.id === cv.id ? cv : x)) });
  },

  removeCV: async (id) => {
    await storage.deleteCV(id);
    set({ cvs: get().cvs.filter((x) => x.id !== id) });
  },

  // Resume scoring
  addResumeScore: async (score) => {
    await storage.saveResumeScore(score);
    const currentScores = get().resumeScores;
    const newScores = [...currentScores.filter((s) => !(s.resumeId === score.resumeId && s.jobId === score.jobId)), score];
    set({ resumeScores: newScores });
  },

  getScoresForJob: (jobId) => {
    return get().resumeScores
      .filter((s) => s.jobId === jobId)
      .sort((a, b) => b.score - a.score); // Sort by score descending
  },

  addMessage: async (msg) => {
    await storage.saveMessage(msg);
    set({ messages: [...get().messages, msg] });
  },

  clearChat: async () => {
    await storage.clearMessages();
    set({ messages: [] });
  },

  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  setLoading: (v) => set({ loading: v }),
}));
