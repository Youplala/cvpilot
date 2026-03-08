import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { batchScoreResumes } from '../services/gemini';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import type { ResumeScore } from '../types';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const { 
    resumes, 
    jobs, 
    resumeScores,
    addResumeScore,
    getScoresForJob,
    addToast 
  } = useAppStore();
  
  const [scoring, setScoring] = useState(false);
  const [scores, setScores] = useState<ResumeScore[]>([]);

  const job = jobs.find(j => j.id === jobId);

  useEffect(() => {
    if (jobId) {
      const existingScores = getScoresForJob(jobId);
      setScores(existingScores);
    }
  }, [jobId, getScoresForJob, resumeScores]);

  const handleScoreResumes = async () => {
    if (!job || resumes.length === 0) return;

    setScoring(true);
    try {
      addToast('Scoring resumes... This may take a moment.', 'info');
      const newScores = await batchScoreResumes(resumes, job);
      
      // Save scores to store
      for (const score of newScores) {
        await addResumeScore(score);
      }
      
      setScores(newScores);
      addToast(`Successfully scored ${newScores.length} resumes!`, 'success');
    } catch (err) {
      addToast(`Failed to score resumes: ${(err as Error).message}`, 'error');
    } finally {
      setScoring(false);
    }
  };

  if (!job) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Job not found</h2>
          <p className="text-gray-500">The job you're looking for doesn't exist.</p>
        </div>
      </PageTransition>
    );
  }

  if (resumes.length === 0) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No resumes to compare</h2>
          <p className="text-gray-500 mb-6">Add some resumes first to compare them against this job.</p>
          <Button onClick={() => window.location.hash = '#/profile'}>
            Add Resumes
          </Button>
        </div>
      </PageTransition>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Comparison</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900">{job.title}</h2>
            <p className="text-accent-600">{job.company}</p>
            <p className="text-sm text-gray-500 mt-1">{job.location} • {job.type}</p>
          </div>
        </div>

        {/* Score/Rescore Button */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {scores.length > 0 
              ? `Comparing ${scores.length} resumes` 
              : `Ready to score ${resumes.length} resumes`}
          </p>
          <Button
            onClick={handleScoreResumes}
            loading={scoring}
            disabled={scoring}
          >
            {scores.length > 0 ? '🔄 Re-score All' : '⚡ Score Resumes'}
          </Button>
        </div>

        {/* Scores List */}
        {scores.length > 0 ? (
          <div className="space-y-4">
            {scores.map((scoreData, index) => {
              const resume = resumes.find(r => r.id === scoreData.resumeId);
              if (!resume) return null;

              return (
                <motion.div
                  key={scoreData.resumeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header with ranking */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-accent-100 text-accent-700 font-bold text-sm rounded-full">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{resume.name}</h3>
                          <p className="text-sm text-gray-500">{resume.fullName}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scoreData.score)}`}>
                        {scoreData.score}% Match
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Hard Skills', value: scoreData.analysisDetails.hardSkills },
                        { label: 'Soft Skills', value: scoreData.analysisDetails.softSkills },
                        { label: 'Experience', value: scoreData.analysisDetails.experienceLevel },
                        { label: 'Education', value: scoreData.analysisDetails.educationFit }
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                            {item.label}
                          </div>
                          <div className="relative h-2 bg-gray-100 rounded-full mb-1">
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full transition-all ${getScoreBarColor(item.value)}`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-700">{item.value}%</div>
                        </div>
                      ))}
                    </div>

                    {/* Analysis details */}
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2">✅ Strengths</h4>
                        <ul className="space-y-1">
                          {scoreData.analysisDetails.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 mb-2">⚠️ Gaps</h4>
                        <ul className="space-y-1">
                          {scoreData.analysisDetails.gaps.map((gap, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {scoreData.analysisDetails.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-blue-700 mb-2">💡 Recommendations</h4>
                        <ul className="space-y-1">
                          {scoreData.analysisDetails.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No comparison data yet</h3>
            <p className="text-gray-500">Click "Score Resumes" to analyze how your resumes match this job.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}