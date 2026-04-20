import React, { useState, useEffect } from 'react';
import { Lock, Unlock, UserPlus, Fingerprint, Wifi, WifiOff, ShieldCheck, Clock, History, AlertTriangle, Settings, Save, X, Globe } from 'lucide-react';

const App = () => {
  // --- STATE FOR BLYNK CONFIGURATION ---
  const [config, setConfig] = useState(() => {
    return {
      token: localStorage.getItem('blynk_token') || "QL5cLTOwPI4luF4yiUoo2sUsWG-iQlPo",
      host: localStorage.getItem('blynk_host') || "blr1.blynk.cloud" // blr1 is usually the India/Asia server
    };
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiError, setApiError] = useState(null);

  const activeHost = config.host.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkDeviceStatus();
    
    const statusInterval = setInterval(() => {
      checkDeviceStatus();
    }, 5000); // Check every 5 seconds for Blynk
    
    return () => {
      clearInterval(timer);
      clearInterval(statusInterval);
    };
  }, [config]);

  const addLog = (message) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 8));
  };

  const saveConfig = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    let hostInput = (formData.get('host') || "blynk.cloud").trim();
    hostInput = hostInput.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

    const newConfig = {
      token: formData.get('token').trim(),
      host: hostInput
    };
    
    localStorage.setItem('blynk_token', newConfig.token);
    localStorage.setItem('blynk_host', newConfig.host);
    
    setConfig(newConfig);
    setShowSettings(false);
    setApiError(null);
    addLog("Blynk Config Updated");
  };

  const checkDeviceStatus = async () => {
    if (!config.token || config.token === "") return;
    
    try {
      // Blynk API to check if hardware is online
      let endpoint = `https://${activeHost}/external/api/isHardwareConnected?token=${config.token}`;

      const response = await fetch(endpoint);
      const text = await response.text();
      
      if (response.status === 400 || text.includes("Invalid token")) {
        setApiError("Invalid Auth Token. Check your settings.");
        setStatus('offline');
        return;
      }

      setApiError(null);
      // Blynk returns literal string "true" or "false"
      setStatus(text === "true" ? 'online' : 'offline');
      
    } catch (error) {
      console.error("[Blynk Network Error]", error);
      setApiError(`Network Error. If your computer year is still 2026, the browser may block this.`);
      setStatus('offline');
    }
  };

  const callBlynkPin = async (actionName, pin) => {
    if (status !== 'online') return;
    setLoading(true);

    try {
      // Blynk API to write a '1' to a Virtual Pin
      let endpoint = `https://${activeHost}/external/api/update?token=${config.token}&${pin}=1`;

      const response = await fetch(endpoint);
      
      if (response.ok) {
        addLog(`Success: ${actionName}`);
      } else {
        addLog(`Failed: HTTP ${response.status}`);
      }
    } catch (error) {
      addLog(`Network Blocked`);
      console.error("[Blynk API Error]", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Smart Lock Terminal
            </h1>
            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400" /> {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                <Settings size={14} /> Configure
              </button>
            </div>
          </div>
          
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border transition-all duration-500 shadow-lg ${status === 'online' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
            <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
            {status === 'online' ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="font-bold uppercase tracking-widest text-xs">{status}</span>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Settings className="text-blue-400" /> Blynk Setup
              </h2>
              
              <form onSubmit={saveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Blynk Server</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 text-slate-500" size={16} />
                    <input name="host" defaultValue={activeHost} required placeholder="blynk.cloud or blr1.blynk.cloud" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Auth Token</label>
                  <input name="token" type="password" defaultValue={config.token} required placeholder="Paste your 32-character token" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                </div>
                
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-6">
                  <Save size={18} /> Apply Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Diagnostic Errors */}
        {apiError && (
          <div className="mb-8 p-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl text-rose-200 flex items-start gap-4">
            <div className="bg-rose-500/20 p-2 rounded-xl text-rose-500 mt-0.5"><AlertTriangle size={20} /></div>
            <div>
              <p className="font-bold text-base mb-1 text-rose-400 tracking-tight">Connection Error</p>
              <p className="text-sm opacity-90 leading-relaxed font-medium">{apiError}</p>
              <div className="mt-4 flex gap-4">
                <button onClick={() => setShowSettings(true)} className="text-xs font-bold bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all uppercase tracking-tighter">Open Settings</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-slate-800/80 p-10 rounded-[2.5rem] shadow-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-8 transition-all duration-700 relative ${status === 'online' ? 'bg-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50'}`}>
                <Lock size={80} className={`transition-all duration-500 ${status === 'online' ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-600'}`} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Remote Unlock</h2>
              <p className="text-slate-400 mb-10 max-w-sm">Trigger the secure door release sequence.</p>
              <button
                onClick={() => callBlynkPin('Remote Unlock', 'V1')}
                disabled={loading || status !== 'online'}
                className={`w-full max-w-xs py-5 bg-blue-600 hover:bg-blue-500 border-blue-400/20 disabled:bg-slate-700/50 disabled:text-slate-500 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl border`}
              >
                {loading ? <div className="h-7 w-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Unlock size={24} /> ACTIVATE</>}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-slate-800/80 p-7 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 px-1">
                <ShieldCheck size={16} className="text-emerald-500" /> Admin Tools
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => callBlynkPin('Enroll Card', 'V2')} disabled={status !== 'online' || loading} className="flex items-center gap-4 p-5 bg-slate-900/40 hover:bg-slate-700/60 rounded-2xl transition-all disabled:opacity-40">
                  <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500"><UserPlus size={24} /></div>
                  <div className="text-left"><p className="font-bold text-slate-200 text-sm">New Card</p><p className="text-xs text-slate-500">Authorize Scan</p></div>
                </button>
                <button onClick={() => callBlynkPin('Enroll Finger', 'V3')} disabled={status !== 'online' || loading} className="flex items-center gap-4 p-5 bg-slate-900/40 hover:bg-slate-700/60 rounded-2xl transition-all disabled:opacity-40">
                  <div className="bg-purple-500/10 p-3 rounded-xl text-purple-500"><Fingerprint size={24} /></div>
                  <div className="text-left"><p className="font-bold text-slate-200 text-sm">New Finger</p><p className="text-xs text-slate-500">Add Biometric</p></div>
                </button>
              </div>
            </div>

            <div className="bg-slate-800/80 p-7 rounded-[2.5rem] border border-slate-700/50 shadow-2xl flex-grow flex flex-col min-h-[300px]">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 px-1">
                <History size={16} className="text-blue-500" /> Event Log
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-600 italic text-center py-10">No events recorded</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/30 animate-in fade-in slide-in-from-right-2">
                      <span className="text-slate-300 text-sm font-medium">{log.message}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded uppercase">{log.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;