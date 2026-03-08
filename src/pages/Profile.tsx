import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { parseCV } from '../services/gemini';
import { extractTextFromPDF } from '../services/pdf';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import type { Resume } from '../types';

export default function Profile() {
  const { resumes, addResume, updateResume, removeResume, addToast } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cvText: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await extractTextFromPDF(file);
      const parsed = await parseCV(text);

      const newResume: Resume = {
        id: crypto.randomUUID(),
        name: parsed.fullName || file.name.replace('.pdf', ''),
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        linkedinUrl: parsed.linkedinUrl || '',
        websiteUrl: parsed.websiteUrl || '',
        summary: parsed.summary || '',
        experiences: (parsed.experiences || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        education: (parsed.education || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        skills: parsed.skills || [],
        languages: parsed.languages || [],
        certifications: parsed.certifications || [],
        projects: (parsed.projects || []).map((p) => ({ ...p, id: crypto.randomUUID() })),
        targetRole: parsed.targetRole || '',
        rawCvText: text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await addResume(newResume);
      addToast('Resume uploaded successfully!', 'success');
    } catch (err) {
      addToast(`Failed to upload resume: ${(err as Error).message}`, 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleTextSubmit = async () => {
    if (!formData.cvText.trim() || !formData.name.trim()) return;

    setUploading(true);
    try {
      const parsed = await parseCV(formData.cvText);

      const newResume: Resume = {
        id: crypto.randomUUID(),
        name: formData.name,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        linkedinUrl: parsed.linkedinUrl || '',
        websiteUrl: parsed.websiteUrl || '',
        summary: parsed.summary || '',
        experiences: (parsed.experiences || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        education: (parsed.education || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        skills: parsed.skills || [],
        languages: parsed.languages || [],
        certifications: parsed.certifications || [],
        projects: (parsed.projects || []).map((p) => ({ ...p, id: crypto.randomUUID() })),
        targetRole: parsed.targetRole || '',
        rawCvText: formData.cvText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await addResume(newResume);
      setFormData({ name: '', cvText: '' });
      setShowForm(false);
      addToast('Resume added successfully!', 'success');
    } catch (err) {
      addToast(`Failed to parse resume: ${(err as Error).message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await removeResume(id);
      addToast('Resume deleted', 'info');
    }
  };

  const updateField = (resume: Resume, field: string, value: unknown) => {
    updateResume({ ...resume, [field]: value, updatedAt: Date.now() });
    addToast('Resume updated', 'success');
    setEditing(null);
  };

  const EditableField = ({ label, resume, field, value }: { 
    label: string; 
    resume: Resume;
    field: string; 
    value: string; 
  }) => (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      {editing === `${resume.id}-${field}` ? (
        <input
          autoFocus
          defaultValue={value}
          onBlur={(e) => updateField(resume, field, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && updateField(resume, field, (e.target as HTMLInputElement).value)}
          className="w-full px-2 py-1 border border-accent-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      ) : (
        <div
          className="text-sm text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2 min-h-[28px]"
          onClick={() => setEditing(`${resume.id}-${field}`)}
        >
          {value || <span className="text-gray-300 italic">Click to edit</span>}
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Resumes</h1>
            <p className="text-gray-500 mt-1">Manage multiple resumes for different positions</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              onClick={() => document.getElementById('file-upload')?.click()}
              loading={uploading}
            >
              📎 Upload PDF
            </Button>
            <Button onClick={() => setShowForm(true)}>
              ➕ Add Text Resume
            </Button>
          </div>
        </div>

        {/* Add Resume Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 mb-6 overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Resume</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Senior Developer Resume"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CV Text
                  </label>
                  <textarea
                    value={formData.cvText}
                    onChange={(e) => setFormData({ ...formData, cvText: e.target.value })}
                    placeholder="Paste your CV text here..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!formData.name.trim() || !formData.cvText.trim()}
                    loading={uploading}
                  >
                    Parse & Add Resume
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {resumes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No resumes yet</h2>
            <p className="text-gray-500 mb-6">Upload or add your first resume to get started.</p>
          </div>
        )}

        {/* Resumes List */}
        <div className="space-y-6">
          {resumes.map((resume, index) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">{resume.name}</h3>
                  <p className="text-sm text-gray-500">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(resume.id, resume.name)}
                  className="text-red-600 hover:bg-red-50"
                >
                  🗑️ Delete
                </Button>
              </div>
              
              <div className="p-4 grid md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Basic Information</h4>
                  <EditableField label="Full Name" resume={resume} field="fullName" value={resume.fullName} />
                  <EditableField label="Email" resume={resume} field="email" value={resume.email} />
                  <EditableField label="Phone" resume={resume} field="phone" value={resume.phone} />
                  <EditableField label="Location" resume={resume} field="location" value={resume.location} />
                  <EditableField label="Target Role" resume={resume} field="targetRole" value={resume.targetRole} />
                </div>

                {/* Summary Stats */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Profile Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Experience:</span>
                      <span className="font-medium">{resume.experiences.length} positions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Education:</span>
                      <span className="font-medium">{resume.education.length} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Skills:</span>
                      <span className="font-medium">{resume.skills.length} skills</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Languages:</span>
                      <span className="font-medium">{resume.languages.length} languages</span>
                    </div>
                  </div>
                  {resume.summary && (
                    <div className="mt-4">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Summary</label>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{resume.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}