import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { parseJobListing } from '../services/gemini';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import PageTransition from '../components/PageTransition';
import type { JobListing } from '../types';

export default function Jobs() {
  const { jobs, addJob, removeJob, profile, addToast } = useAppStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdd = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parseJobListing(text.trim());
      const job: JobListing = {
        id: crypto.randomUUID(),
        url: '',
        company: parsed.company || '',
        title: parsed.title || '',
        location: parsed.location || '',
        type: (parsed.type as JobListing['type']) || '',
        description: parsed.description || '',
        requirements: parsed.requirements || [],
        niceToHaves: parsed.niceToHaves || [],
        responsibilities: parsed.responsibilities || [],
        salary: parsed.salary || '',
        scrapedAt: Date.now(),
        status: 'active',
      };
      await addJob(job);
      setText('');
      addToast(`Added: ${job.title} at ${job.company}`, 'success');
    } catch (err) {
      addToast(`Failed: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (jobId: string) => {
    if (!profile) {
      addToast('Build your profile first via Chat', 'error');
      return;
    }
    navigate(`/generate/${jobId}`);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Listings</h1>

        {/* Add job from text */}
        <div className="flex flex-col gap-2 mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full job posting text here..."
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 resize-y"
          />
          <Button onClick={handleAdd} loading={loading} disabled={!text.trim()} className="self-end">
            Add Job
          </Button>
        </div>

        {loading && (
          <div className="space-y-3 mb-6">
            <Skeleton className="h-32" />
          </div>
        )}

        {/* Job list */}
        {jobs.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No jobs yet</h2>
            <p className="text-gray-500 text-sm">Paste a job posting text above to get started.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-accent-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{job.title || 'Untitled'}</h3>
                      <p className="text-sm text-accent-600 mt-0.5">{job.company}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.type && <span>🏢 {job.type}</span>}
                        {job.salary && <span>💰 {job.salary}</span>}
                      </div>
                      {job.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.requirements.slice(0, 5).map((r, j) => (
                            <span key={j} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded">
                              {r}
                            </span>
                          ))}
                          {job.requirements.length > 5 && (
                            <span className="text-xs text-gray-400">+{job.requirements.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" onClick={() => handleGenerate(job.id)}>
                        Generate CV
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeJob(job.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </PageTransition>
  );
}
