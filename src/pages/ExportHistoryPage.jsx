import { useState, useEffect } from 'react';
import { exportApi } from '../api/services';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errorHandler';
import html2pdf from 'html2pdf.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ExportHistoryPage({ onNavigate }) {
  const toast = useToast();
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [downloading, setDownloading] = useState(null); // exportId currently downloading

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await exportApi.getHistory();
      setExports(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(record) {
    if (downloading) return; // prevent double-click
    setDownloading(record.exportId);
    try {
      // Fetch the full export record which includes generatedHtml
      const res = await exportApi.getJobStatus(record.exportId);
      const exportJob = res.data.data;

      if (!exportJob || !exportJob.generatedHtml) {
        toast.error('No generated content found for this export. Please re-export from the editor.');
        return;
      }

      // Create a temporary hidden container to render the HTML for PDF generation
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '700px';
      container.style.background = 'white';
      container.innerHTML = exportJob.generatedHtml;
      document.body.appendChild(container);

      const fileName = exportJob.fileName
        ? exportJob.fileName.replace(/\.\w+$/, '.pdf')
        : `Resume_Export_${record.exportId}.pdf`;

      const opt = {
        margin:      [0.3, 0.3, 0.3, 0.3],
        filename:    fileName,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(container).save();
      toast.success('PDF downloaded successfully!');

      // Clean up the temporary container
      document.body.removeChild(container);
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download: ' + getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => onNavigate('dashboard')}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Export History</h1>
          <p className="text-xs text-slate-400">All resume exports you have generated</p>
        </div>
        <button onClick={loadHistory}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          <span className="material-symbols-outlined text-sm">refresh</span>Refresh
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <span className="material-symbols-outlined text-5xl animate-spin mb-3">progress_activity</span>
            <p className="text-sm">Loading export history…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-red-400">
            <span className="material-symbols-outlined text-5xl mb-3">error</span>
            <p className="text-sm font-medium">{error}</p>
            <button onClick={loadHistory}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && exports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <span className="material-symbols-outlined text-6xl mb-3">download</span>
            <p className="text-sm font-medium text-slate-400">No exports yet</p>
            <p className="text-xs text-slate-300 mt-1">Export a resume to see it here</p>
            <button onClick={() => onNavigate('dashboard')}
              className="mt-5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90">
              Go to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && exports.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {exports.length} export{exports.length !== 1 ? 's' : ''} found
            </p>
            {exports.map((record) => (
              <div key={record.exportId}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {record.exportFormat === 'PDF' ? 'picture_as_pdf' : 'html'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {record.fileName || `Export #${record.exportId}`}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">
                      {record.exportFormat}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {record.status}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(record.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onNavigate('editor', { resumeId: record.resumeId })}
                    title="Open in editor"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => handleDownload(record)}
                    disabled={record.status !== 'COMPLETED' || downloading === record.exportId}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className={`material-symbols-outlined text-xs ${downloading === record.exportId ? 'animate-spin' : ''}`}>
                      {downloading === record.exportId ? 'progress_activity' : 'download'}
                    </span>
                    {downloading === record.exportId ? 'Generating…' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}