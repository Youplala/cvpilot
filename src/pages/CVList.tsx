import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

export default function CVList() {
  const { cvs, removeCV } = useAppStore();
  const navigate = useNavigate();

  if (cvs.length === 0) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No CVs generated yet</h2>
          <p className="text-gray-500 text-sm mb-6">Add a job listing and generate a tailored CV.</p>
          <Button onClick={() => navigate('/jobs')}>Go to Jobs</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Generated CVs</h1>
        <div className="space-y-4">
          {cvs.map((cv, i) => (
            <motion.div
              key={cv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-accent-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{cv.jobTitle}</h3>
                  <p className="text-sm text-accent-600">{cv.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`text-sm font-semibold ${
                        cv.analysisScore >= 70
                          ? 'text-green-600'
                          : cv.analysisScore >= 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      Score: {cv.analysisScore}/100
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/editor/${cv.id}`)}>
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/export/${cv.id}`)}>
                    PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeCV(cv.id)}>
                    ×
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
