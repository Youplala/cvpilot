import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { generateTailoredCV } from '../services/gemini';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import PageTransition from '../components/PageTransition';
import type { GeneratedCV, JobListing } from '../types';

function AnimatedScore({ score }: { score: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCurrent(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = current >= 70 ? 'text-green-500' : current >= 40 ? 'text-yellow-500' : 'text-red-500';
  return <span className={`text-5xl font-bold ${color}`}>{current}</span>;
}

export default function Generate() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile, jobs, addCV, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const job = jobs.find((j) => j.id === jobId);

  useEffect(() => {
    if (!profile || !job) return;
    generateCV(profile, job);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateCV(p: NonNullable<typeof profile>, j: JobListing) {
    setLoading(true);
    try {
      const { sections, analysis } = await generateTailoredCV(p, j);
      const generated: GeneratedCV = {
        id: crypto.randomUUID(),
        jobListingId: j.id,
        jobTitle: j.title,
        company: j.company,
        sections,
        analysisScore: Math.round(
          (analysis.hardSkills + analysis.softSkills + analysis.experienceLevel + analysis.educationFit) / 4
        ),
        analysisDetails: analysis,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await addCV(generated);
      setCv(generated);
      addToast('CV generated!', 'success');
    } catch (err) {
      addToast(`Error: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!job || !profile) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Job or profile not found.</p>
          <Button className="mt-4" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Generating your tailored CV...</h1>
          <p className="text-gray-500 text-sm mb-8">AI is analyzing your profile against the job requirements.</p>
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-24" />
            <Skeleton className="h-60" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!cv) return null;

  const { analysisDetails: a } = cv;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV for {cv.jobTitle}</h1>
            <p className="text-sm text-accent-600 mt-1">{cv.company}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/editor/${cv.id}`)}>
              Edit CV
            </Button>
            <Button onClick={() => navigate(`/export/${cv.id}`)}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-center"
        >
          <p className="text-sm text-gray-500 mb-2">Compatibility Score</p>
          <AnimatedScore score={cv.analysisScore} />
          <p className="text-sm text-gray-400 mt-1">/ 100</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Hard Skills', val: a.hardSkills },
              { label: 'Soft Skills', val: a.softSkills },
              { label: 'Experience', val: a.experienceLevel },
              { label: 'Education', val: a.educationFit },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-lg font-semibold text-gray-800">{item.val}</div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Strengths & Gaps */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-sm font-semibold text-green-600 mb-3">✅ Strengths</h3>
            <ul className="space-y-1.5">
              {a.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700">{s}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-sm font-semibold text-orange-600 mb-3">⚠️ Gaps</h3>
            <ul className="space-y-1.5">
              {a.gaps.map((g, i) => (
                <li key={i} className="text-sm text-gray-700">{g}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Recommendations */}
        {a.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent-50 rounded-xl border border-accent-100 p-5 mb-6"
          >
            <h3 className="text-sm font-semibold text-accent-700 mb-3">💡 Recommendations</h3>
            <ul className="space-y-1.5">
              {a.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-accent-800">{r}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* CV Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Generated CV Preview</h3>
          
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Summary</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{cv.sections.summary}</p>
          </div>

          {cv.sections.experiences.map((exp, i) => (
            <div key={i} className="mb-3 py-2 border-t border-gray-50">
              <div className="font-medium text-sm text-gray-900">{exp.title} at {exp.company}</div>
              <div className="text-xs text-gray-400">
                {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.highlights.map((h, j) => (
                  <li key={j} className="text-sm text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-accent-400">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {cv.sections.skills.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {cv.sections.skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded">{s}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
