import { useState, useEffect } from 'react';
import { X, Bell, Clock, BellSlash } from '@phosphor-icons/react';

export default function ReminderSettingsModal({ isOpen, onClose, isDark = true }) {
  const [pref, setPref] = useState('15_min'); // '15_min', '1_hour', 'off'

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('kickoff_reminder_pref') || '15_min';
      setPref(saved);
    }
  }, [isOpen]);

  const handleSave = (val) => {
    setPref(val);
    localStorage.setItem('kickoff_reminder_pref', val);
    window.dispatchEvent(new Event('reminder-pref-changed'));
    onClose();
  };

  if (!isOpen) return null;

  const bg = isDark ? 'bg-[#080b28]' : 'bg-white';
  const text = isDark ? 'text-white' : 'text-[#10164f]';
  const border = isDark ? 'border-white/10' : 'border-[#10164f]/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-sm rounded-3xl border shadow-2xl ${bg} ${text} ${border} p-6 animate-slideup-modal`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-wide" style={{ fontFamily: '"FWC26", sans-serif' }}>Notification Settings</h2>
          <p className="text-xs opacity-60 mt-1">Manage your global match reminders.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSave('15_min')}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${pref === '15_min' ? 'border-[#fcb900] bg-[#fcb900]/10' : border} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <div className={`p-2 rounded-full ${pref === '15_min' ? 'bg-[#fcb900] text-[#10164f]' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <Bell size={20} weight={pref === '15_min' ? 'fill' : 'regular'} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-sm">15 Minutes Before</h3>
              <p className="text-[10px] opacity-60">Get alerted just before kickoff.</p>
            </div>
          </button>

          <button
            onClick={() => handleSave('1_hour')}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${pref === '1_hour' ? 'border-[#00FF87] bg-[#00FF87]/10' : border} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <div className={`p-2 rounded-full ${pref === '1_hour' ? 'bg-[#00FF87] text-[#10164f]' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <Clock size={20} weight={pref === '1_hour' ? 'fill' : 'regular'} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-sm">1 Hour Before</h3>
              <p className="text-[10px] opacity-60">Time to grab snacks and get ready.</p>
            </div>
          </button>

          <button
            onClick={() => handleSave('off')}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${pref === 'off' ? 'border-red-500 bg-red-500/10' : border} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <div className={`p-2 rounded-full ${pref === 'off' ? 'bg-red-500 text-white' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <BellSlash size={20} weight={pref === 'off' ? 'fill' : 'regular'} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-sm">Off</h3>
              <p className="text-[10px] opacity-60">Disable all match reminders.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
