import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './stores/appStore';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ApiKeySetup from './pages/ApiKeySetup';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import CVList from './pages/CVList';
import Generate from './pages/Generate';
import Editor from './pages/Editor';
import Export from './pages/Export';
import Settings from './pages/Settings';

export default function App() {
  const init = useAppStore((s) => s.init);
  const [hasKey, setHasKey] = useState(!!localStorage.getItem('gemini_api_key'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init().then(() => setReady(true));
  }, [init]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <>
        <Toast />
        <ApiKeySetup onComplete={() => setHasKey(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toast />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/cvs" element={<CVList />} />
          <Route path="/generate/:jobId" element={<Generate />} />
          <Route path="/editor/:cvId" element={<Editor />} />
          <Route path="/export/:cvId" element={<Export />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
