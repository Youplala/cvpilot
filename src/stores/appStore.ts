import { create } from 'zustand';
import type { UserProfile, JobListing, GeneratedCV, ChatMessage } from '../types';
import * as storage from '../services/storage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  profile: UserProfile | null;
  jobs: JobListing[];
  cvs: GeneratedCV[];
  messages: ChatMessage[];
  toasts: Toast[];
  loading: boolean;

  init: () => Promise<void>;
  setProfile: (p: UserProfile) => Promise<void>;
  addJob: (j: JobListing) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  addCV: (cv: GeneratedCV) => Promise<void>;
  updateCV: (cv: GeneratedCV) => Promise<void>;
  removeCV: (id: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => Promise<void>;
  clearChat: () => Promise<void>;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  jobs: [],
  cvs: [],
  messages: [],
  toasts: [],
  loading: false,

  init: async () => {
    const [profile, jobs, cvs, messages] = await Promise.all([
      storage.getProfile(),
      storage.getJobs(),
      storage.getCVs(),
      storage.getMessages(),
    ]);
    set({ profile: profile || null, jobs, cvs, messages });
  },

  setProfile: async (p) => {
    await storage.saveProfile(p);
    set({ profile: p });
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
