import React, { useState } from 'react';
import { Github, CheckCircle2, Copy, GitBranch, ArrowUpRight, Terminal, RefreshCw, AlertCircle } from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUrl: string;
  onSaveRemoteUrl: (url: string) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  remoteUrl,
  onSaveRemoteUrl
}) => {
  const [urlInput, setUrlInput] = useState(remoteUrl || 'https://github.com/s4gnikz/LOSSLESS-HIFI-PLAYER.git');
  const [copied, setCopied] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const pushCommand = `git remote add origin ${urlInput || '<YOUR_REPO_URL>'}\ngit branch -M main\ngit push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pushCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveRemoteUrl(urlInput.trim());
    setPushStatus('Remote URL updated to ' + urlInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-audiophile-900 border border-audiophile-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-audiophile-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-audiophile-800 border border-audiophile-700 text-gold-atmos">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                GitHub Repository Sync
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Deployment & Source Versioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-audiophile-800"
          >
            ✕
          </button>
        </div>

        {/* Repository Remote URL Setting */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 font-mono">
            GitHub Remote Repository URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://github.com/yourusername/lossless-hifi-player.git"
              className="flex-1 px-3.5 py-2 rounded-xl bg-audiophile-950 border border-audiophile-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-atmos to-amber-500 text-black font-bold text-xs shadow-glow-atmos hover:scale-105 transition-all"
            >
              Save Remote
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            All code updates, commits, audio engine logic, and presets are saved to your local Git history on branch <span className="text-white font-mono">main</span>.
          </p>
        </div>

        {/* Terminal Push Instructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Direct Push Commands
            </span>
            <button
              onClick={handleCopy}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-mono"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Commands'}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-audiophile-950 border border-audiophile-800 font-mono text-xs text-slate-300 overflow-x-auto select-all">
            <pre className="text-cyan-300">{pushCommand}</pre>
          </div>
        </div>

        {/* Status notice */}
        {pushStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{pushStatus}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-audiophile-800 hover:bg-audiophile-700 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

