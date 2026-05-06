import React, { useEffect, useState } from 'react';
import { Download, AlertCircle, X, ArrowDownCircle } from 'lucide-react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type Phase = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

const UpdateChecker: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{ downloaded: number; total?: number }>({ downloaded: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await check();
        if (cancelled) return;
        if (result) {
          setUpdate(result);
          setPhase('available');
        }
      } catch (err) {
        // Network failure, dev mode, etc — silent. Don't bother the user.
        console.warn('Update check failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstall = async () => {
    if (!update) return;
    setPhase('downloading');
    setError(null);
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          setProgress({ downloaded: 0, total: event.data.contentLength });
        } else if (event.event === 'Progress') {
          setProgress(prev => ({ ...prev, downloaded: prev.downloaded + event.data.chunkLength }));
        } else if (event.event === 'Finished') {
          setPhase('ready');
        }
      });
      await relaunch();
    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPhase('error');
    }
  };

  if (phase === 'idle' || dismissed) return null;

  const percent = progress.total
    ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100))
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 panel shadow-lg max-w-sm w-full mx-4">
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          {phase === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )}
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {phase === 'available' && `Mise à jour ${update?.version} disponible`}
            {phase === 'downloading' && 'Téléchargement...'}
            {phase === 'ready' && 'Redémarrage en cours...'}
            {phase === 'error' && 'Erreur de mise à jour'}
          </h3>
        </div>
        {(phase === 'available' || phase === 'error') && (
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Plus tard"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        {phase === 'available' && update && (
          <>
            <p className="text-xs text-gray-600 mb-3">
              Une nouvelle version est disponible. L'application redémarrera après installation.
            </p>
            {update.body && (
              <details className="mb-3">
                <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                  Voir les notes de version
                </summary>
                <pre className="text-[11px] text-gray-600 mt-2 whitespace-pre-wrap max-h-32 overflow-auto">
                  {update.body}
                </pre>
              </details>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDismissed(true)} className="btn btn-default">
                Plus tard
              </button>
              <button onClick={handleInstall} className="btn btn-primary">
                <Download className="h-3.5 w-3.5" />
                Installer
              </button>
            </div>
          </>
        )}

        {phase === 'downloading' && (
          <>
            <div className="h-2 bg-gray-200 rounded overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 tabular-nums">
              {progress.total
                ? `${(progress.downloaded / 1024 / 1024).toFixed(1)} / ${(progress.total / 1024 / 1024).toFixed(1)} MB · ${percent}%`
                : `${(progress.downloaded / 1024 / 1024).toFixed(1)} MB`}
            </p>
          </>
        )}

        {phase === 'ready' && (
          <p className="text-xs text-gray-600">L'application va redémarrer...</p>
        )}

        {phase === 'error' && (
          <>
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <div className="flex justify-end">
              <button onClick={() => setDismissed(true)} className="btn btn-default">
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;
