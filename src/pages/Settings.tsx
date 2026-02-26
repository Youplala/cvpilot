import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { exportAllData, importAllData, clearAllData } from '../services/storage';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

export default function Settings() {
  const { addToast, init } = useAppStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      addToast('API key updated', 'success');
    } else {
      localStorage.removeItem('gemini_api_key');
      addToast('API key removed', 'info');
    }
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cvpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported', 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAllData(data);
        if (data.apiKey) localStorage.setItem('gemini_api_key', data.apiKey);
        await init();
        addToast('Data imported successfully', 'success');
      } catch {
        addToast('Failed to import data', 'error');
      }
    };
    input.click();
  };

  const handleClear = async () => {
    if (!confirm('This will delete ALL your data. Are you sure?')) return;
    await clearAllData();
    await init();
    setApiKey('');
    addToast('All data cleared', 'info');
  };

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* API Key */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Gemini API Key</h2>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
          />
          <Button size="sm" onClick={handleSaveKey}>
            Save Key
          </Button>
        </div>

        {/* Data */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Data Management</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleExport}>
              📥 Export Data
            </Button>
            <Button size="sm" variant="secondary" onClick={handleImport}>
              📤 Import Data
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-3">
            This will permanently delete all your profiles, jobs, CVs, and chat history.
          </p>
          <Button size="sm" variant="danger" onClick={handleClear}>
            🗑️ Clear All Data
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
