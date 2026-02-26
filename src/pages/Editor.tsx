import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { improveSection } from '../services/gemini';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import type { GeneratedCV } from '../types';

export default function Editor() {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const { cvs, updateCV, jobs, addToast } = useAppStore();
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const [improving, setImproving] = useState<string | null>(null);

  useEffect(() => {
    const found = cvs.find((c) => c.id === cvId);
    if (found) setCv({ ...found });
  }, [cvId, cvs]);

  if (!cv) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">CV not found.</p>
          <Button className="mt-4" onClick={() => navigate('/cvs')}>Back to CVs</Button>
        </div>
      </PageTransition>
    );
  }

  const job = jobs.find((j) => j.id === cv.jobListingId);
  const jobContext = job ? `${job.title} at ${job.company}: ${job.requirements.join(', ')}` : '';

  const handleSave = async () => {
    await updateCV({ ...cv, updatedAt: Date.now() });
    addToast('CV saved!', 'success');
  };

  const handleImprove = async (section: string, content: string) => {
    setImproving(section);
    try {
      const improved = await improveSection(section, content, jobContext);
      if (section === 'summary') {
        setCv({ ...cv, sections: { ...cv.sections, summary: improved } });
      }
      addToast(`${section} improved!`, 'success');
    } catch (err) {
      addToast(`Error: ${(err as Error).message}`, 'error');
    } finally {
      setImproving(null);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit CV</h1>
            <p className="text-sm text-accent-600 mt-1">{cv.jobTitle} at {cv.company}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSave}>Save</Button>
            <Button onClick={() => navigate(`/export/${cv.id}`)}>Export PDF</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* CV Editor - 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-600">Summary</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={improving === 'summary'}
                  onClick={() => handleImprove('summary', cv.sections.summary)}
                >
                  ✨ AI Improve
                </Button>
              </div>
              <textarea
                value={cv.sections.summary}
                onChange={(e) =>
                  setCv({ ...cv, sections: { ...cv.sections, summary: e.target.value } })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-500 resize-none"
              />
            </motion.div>

            {/* Experience */}
            {cv.sections.experiences.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-600">
                    {exp.title} — {exp.company}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={improving === `exp-${i}`}
                    onClick={() =>
                      handleImprove(`experience at ${exp.company}`, exp.highlights.join('\n'))
                    }
                  >
                    ✨ AI Improve
                  </Button>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                </div>
                {exp.highlights.map((h, j) => (
                  <input
                    key={j}
                    value={h}
                    onChange={(e) => {
                      const newExps = [...cv.sections.experiences];
                      newExps[i] = {
                        ...newExps[i],
                        highlights: newExps[i].highlights.map((x, k) =>
                          k === j ? e.target.value : x
                        ),
                      };
                      setCv({ ...cv, sections: { ...cv.sections, experiences: newExps } });
                    }}
                    className="w-full px-2 py-1.5 border-b border-gray-50 text-sm focus:outline-none focus:border-accent-300 mb-1"
                  />
                ))}
              </motion.div>
            ))}

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Skills</h3>
              <textarea
                value={cv.sections.skills.join(', ')}
                onChange={(e) =>
                  setCv({
                    ...cv,
                    sections: {
                      ...cv.sections,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-500 resize-none"
              />
            </motion.div>
          </div>

          {/* Job Reference - 1 col */}
          {job && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 rounded-xl border border-gray-200 p-5 h-fit sticky top-20"
            >
              <h3 className="text-sm font-semibold text-gray-600 mb-3">📋 Job Reference</h3>
              <h4 className="font-medium text-sm text-gray-900">{job.title}</h4>
              <p className="text-sm text-accent-600 mb-3">{job.company}</p>
              {job.requirements.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Requirements</p>
                  <ul className="space-y-1 mb-3">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600">• {r}</li>
                    ))}
                  </ul>
                </>
              )}
              {job.niceToHaves.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nice to Have</p>
                  <ul className="space-y-1">
                    {job.niceToHaves.map((r, i) => (
                      <li key={i} className="text-xs text-gray-500">• {r}</li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
