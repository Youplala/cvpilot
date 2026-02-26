import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { testApiKey } from '../services/gemini';

interface Props {
  onComplete: () => void;
}

export default function ApiKeySetup({ onComplete }: Props) {
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async () => {
    setTesting(true);
    setError('');
    const ok = await testApiKey(key.trim());
    setTesting(false);
    if (ok) {
      setSuccess(true);
      localStorage.setItem('gemini_api_key', key.trim());
      setTimeout(onComplete, 1000);
    } else {
      setError('Invalid API key. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to CVPilot</h1>
          <p className="text-gray-500 mt-2 text-sm">
            AI-powered CV tailoring, 100% in your browser.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Get a free key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-500 hover:text-accent-600 underline"
              >
                Google AI Studio
              </a>
            </p>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400"
              onKeyDown={(e) => e.key === 'Enter' && key.trim() && handleTest()}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}

          {success && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-2 text-green-600 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Key verified!
            </motion.div>
          )}

          <Button
            onClick={handleTest}
            disabled={!key.trim()}
            loading={testing}
            className="w-full"
            size="lg"
          >
            Test & Save Key
          </Button>

          <p className="text-xs text-center text-gray-400 mt-4">
            🔒 Your key stays in your browser. We never see it.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
