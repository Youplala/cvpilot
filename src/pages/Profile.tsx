import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

export default function Profile() {
  const { profile, setProfile, addToast } = useAppStore();
  const [editing, setEditing] = useState<string | null>(null);

  if (!profile) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No profile yet</h2>
          <p className="text-gray-500 mb-6">Go to the Chat tab to upload your CV and build your profile.</p>
          <Button onClick={() => window.location.hash = '#/chat'}>Start Chat</Button>
        </div>
      </PageTransition>
    );
  }

  const updateField = (field: string, value: unknown) => {
    setProfile({ ...profile, [field]: value, updatedAt: Date.now() });
    addToast('Profile updated', 'success');
    setEditing(null);
  };

  const EditableField = ({ label, field, value }: { label: string; field: string; value: string }) => (
    <div className="py-3 border-b border-gray-50">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      {editing === field ? (
        <input
          autoFocus
          defaultValue={value}
          onBlur={(e) => updateField(field, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && updateField(field, (e.target as HTMLInputElement).value)}
          className="w-full px-2 py-1 border border-accent-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      ) : (
        <div
          className="text-sm text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2 min-h-[28px]"
          onClick={() => setEditing(field)}
        >
          {value || <span className="text-gray-300 italic">Click to edit</span>}
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Profile</h1>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Basic Information</h2>
          <EditableField label="Full Name" field="fullName" value={profile.fullName} />
          <EditableField label="Email" field="email" value={profile.email} />
          <EditableField label="Phone" field="phone" value={profile.phone} />
          <EditableField label="Location" field="location" value={profile.location} />
          <EditableField label="LinkedIn" field="linkedinUrl" value={profile.linkedinUrl} />
          <EditableField label="Website" field="websiteUrl" value={profile.websiteUrl} />
          <EditableField label="Target Role" field="targetRole" value={profile.targetRole} />
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Professional Summary</h2>
          {editing === 'summary' ? (
            <textarea
              autoFocus
              defaultValue={profile.summary}
              onBlur={(e) => updateField('summary', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-accent-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          ) : (
            <p
              className="text-sm text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => setEditing('summary')}
            >
              {profile.summary || <span className="text-gray-300 italic">Click to add a summary</span>}
            </p>
          )}
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Experience ({profile.experiences.length})
          </h2>
          {profile.experiences.map((exp, i) => (
            <div key={exp.id || i} className="py-3 border-b border-gray-50 last:border-0">
              <div className="font-medium text-sm text-gray-900">{exp.title}</div>
              <div className="text-sm text-accent-600">{exp.company}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
              </div>
              <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
              {exp.highlights.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {exp.highlights.map((h, j) => (
                    <li key={j} className="text-sm text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-accent-400">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {profile.experiences.length === 0 && (
            <p className="text-sm text-gray-300 italic">No experience added yet</p>
          )}
        </motion.div>

        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Education ({profile.education.length})
          </h2>
          {profile.education.map((edu, i) => (
            <div key={edu.id || i} className="py-3 border-b border-gray-50 last:border-0">
              <div className="font-medium text-sm text-gray-900">{edu.degree} in {edu.field}</div>
              <div className="text-sm text-accent-600">{edu.school}</div>
              <div className="text-xs text-gray-400 mt-0.5">{edu.startDate} — {edu.endDate}</div>
            </div>
          ))}
          {profile.education.length === 0 && (
            <p className="text-sm text-gray-300 italic">No education added yet</p>
          )}
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-accent-50 text-accent-700 text-sm rounded-full">
                {s.name}
              </span>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-gray-300 italic">No skills added yet</p>
            )}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((l, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {l.name} — {l.level}
              </span>
            ))}
            {profile.languages.length === 0 && (
              <p className="text-sm text-gray-300 italic">No languages added yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
