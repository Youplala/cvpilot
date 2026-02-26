import { openDB, IDBPDatabase } from 'idb';
import type { UserProfile, JobListing, GeneratedCV, ChatMessage } from '../types';

const DB_NAME = 'cvpilot';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('jobs')) {
          db.createObjectStore('jobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cvs')) {
          db.createObjectStore('cvs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Profile
export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  const all = await db.getAll('profiles');
  return all[0] as UserProfile | undefined;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('profiles', profile);
}

// Jobs
export async function getJobs(): Promise<JobListing[]> {
  const db = await getDB();
  return (await db.getAll('jobs')) as JobListing[];
}

export async function getJob(id: string): Promise<JobListing | undefined> {
  const db = await getDB();
  return (await db.get('jobs', id)) as JobListing | undefined;
}

export async function saveJob(job: JobListing): Promise<void> {
  const db = await getDB();
  await db.put('jobs', job);
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('jobs', id);
}

// CVs
export async function getCVs(): Promise<GeneratedCV[]> {
  const db = await getDB();
  return (await db.getAll('cvs')) as GeneratedCV[];
}

export async function getCV(id: string): Promise<GeneratedCV | undefined> {
  const db = await getDB();
  return (await db.get('cvs', id)) as GeneratedCV | undefined;
}

export async function saveCV(cv: GeneratedCV): Promise<void> {
  const db = await getDB();
  await db.put('cvs', cv);
}

export async function deleteCV(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cvs', id);
}

// Chat messages
export async function getMessages(): Promise<ChatMessage[]> {
  const db = await getDB();
  const msgs = (await db.getAll('messages')) as ChatMessage[];
  return msgs.sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put('messages', msg);
}

export async function clearMessages(): Promise<void> {
  const db = await getDB();
  await db.clear('messages');
}

// Export/Import
export async function exportAllData() {
  const db = await getDB();
  return {
    profiles: await db.getAll('profiles'),
    jobs: await db.getAll('jobs'),
    cvs: await db.getAll('cvs'),
    messages: await db.getAll('messages'),
    apiKey: localStorage.getItem('gemini_api_key'),
  };
}

export async function importAllData(data: Record<string, unknown[]>) {
  const db = await getDB();
  const tx = db.transaction(['profiles', 'jobs', 'cvs', 'messages'], 'readwrite');
  for (const item of (data.profiles || []) as UserProfile[]) {
    await tx.objectStore('profiles').put(item);
  }
  for (const item of (data.jobs || []) as JobListing[]) {
    await tx.objectStore('jobs').put(item);
  }
  for (const item of (data.cvs || []) as GeneratedCV[]) {
    await tx.objectStore('cvs').put(item);
  }
  for (const item of (data.messages || []) as ChatMessage[]) {
    await tx.objectStore('messages').put(item);
  }
  await tx.done;
}

export async function clearAllData() {
  const db = await getDB();
  await db.clear('profiles');
  await db.clear('jobs');
  await db.clear('cvs');
  await db.clear('messages');
  localStorage.removeItem('gemini_api_key');
}
