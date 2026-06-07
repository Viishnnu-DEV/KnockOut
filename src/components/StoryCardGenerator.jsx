import { useState, useCallback, useEffect } from 'react';
import { Download, WhatsappLogo, Copy, X, Image as ImageIcon, CircleNotch, CheckCircle } from '@phosphor-icons/react';

// Load image safely with CORS handling
const loadImg = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export default function StoryCardGenerator({ 
  match, 
  teamA, 
  teamB, 
  flagA, 
  flagB, 
  istTime, 
  istDate, 
  isOpen, 
  onClose,
  mode = 'match', // 'match' or 'team'
  teamStats // Used for team card mode
}) {
  const [dataURL, setDataURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const generateCard = useCallback(async () => {
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (mode === 'match') {
        canvas.width = 1080;
        canvas.height = 1920;

        // Background: deep black with subtle grid pattern
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, 1080, 1920);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1080; i += 60) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1920); ctx.stroke();
        }
        for (let i = 0; i < 1920; i += 60) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
        }

        // Top neon green accent bar (full width, 8px)
        ctx.fillStyle = '#00FF87';
        ctx.fillRect(0, 0, 1080, 8);

        // KICKOFF IST branding (top)
        ctx.fillStyle = '#00FF87';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KICKOFF IST', 540, 120);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '28px Arial';
        ctx.fillText('FIFA WORLD CUP 2026', 540, 165);

        // Match round badge
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(match.group || match.round?.toUpperCase() || 'GROUP STAGE', 540, 280);

        // VS divider line
        ctx.strokeStyle = 'rgba(0,255,135,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 960); ctx.lineTo(940, 960); ctx.stroke();

        // Load Flag Images
        const [imgA, imgB] = await Promise.all([loadImg(flagA), loadImg(flagB)]);

        // Team A (left side)
        if (imgA) {
          ctx.drawImage(imgA, 170, 620, 200, 130);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(170, 620, 200, 130);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px Arial';
          ctx.fillText(teamA.slice(0, 3).toUpperCase(), 270, 695);
        }
        // Team A name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Arial';
        const nameA = teamA?.toUpperCase() || 'TEAM A';
        ctx.fillText(nameA.length > 8 ? nameA.slice(0, 8) : nameA, 270, 920);

        // VS text (center)
        ctx.fillStyle = '#00FF87';
        ctx.font = 'bold 96px Arial';
        ctx.fillText('VS', 540, 880);

        // Team B (right side)
        if (imgB) {
          ctx.drawImage(imgB, 710, 620, 200, 130);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(710, 620, 200, 130);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px Arial';
          ctx.fillText(teamB.slice(0, 3).toUpperCase(), 810, 695);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Arial';
        const nameB = teamB?.toUpperCase() || 'TEAM B';
        ctx.fillText(nameB.length > 8 ? nameB.slice(0, 8) : nameB, 810, 920);

        // IST Time (hero element)
        ctx.fillStyle = '#00FF87';
        ctx.font = 'bold 96px Arial';
        ctx.fillText(istTime + ' IST', 540, 1100);

        // Date
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '44px Arial';
        ctx.fillText(istDate, 540, 1170);

        // Stadium
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '36px Arial';
        ctx.fillText('📍 ' + (match.stadium || 'World Cup Stadium'), 540, 1260);

        // Neon green circle decoration
        ctx.strokeStyle = 'rgba(0,255,135,0.08)';
        ctx.lineWidth = 120;
        ctx.beginPath();
        ctx.arc(540, 960, 400, 0, Math.PI * 2);
        ctx.stroke();

        // Bottom watermark
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '32px Arial';
        ctx.fillText('kickoffist.com • All times in IST', 540, 1820);

        // Bottom neon green bar
        ctx.fillStyle = '#00FF87';
        ctx.fillRect(0, 1912, 1080, 8);
      } else {
        // Team Card Mode (1080x1080 square card)
        canvas.width = 1080;
        canvas.height = 1080;

        // Background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, 1080, 1080);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1080; i += 60) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
        }

        // Accent bars
        ctx.fillStyle = '#00FF87';
        ctx.fillRect(0, 0, 1080, 8);
        ctx.fillRect(0, 1072, 1080, 8);

        // Title
        ctx.fillStyle = '#00FF87';
        ctx.font = 'bold 44px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KICKOFF IST TEAM PROFILE', 540, 90);

        // Load Flag
        const flagImg = await loadImg(flagA);
        if (flagImg) {
          ctx.drawImage(flagImg, 440, 160, 200, 130);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(440, 160, 200, 130);
        }

        // Team Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 82px Arial';
        ctx.fillText(teamA.toUpperCase(), 540, 380);

        // Details
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '36px Arial';
        ctx.fillText(`GROUP: ${teamStats?.group || 'N/A'}`, 540, 470);
        
        ctx.font = '36px Arial';
        ctx.fillText(`FIFA RANKING: ${teamStats?.ranking || 'N/A'}`, 540, 530);

        // Favorites count (Mock/fans stats)
        const fanCount = teamStats?.favsCount || Math.floor(Math.random() * 15000) + 1200;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Arial';
        ctx.fillText(`⭐ Favorited by ${fanCount.toLocaleString()} fans on KICKOFF IST`, 540, 680);

        // Grid outline
        ctx.strokeStyle = 'rgba(0,255,135,0.2)';
        ctx.lineWidth = 4;
        ctx.strokeRect(100, 600, 880, 150);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '28px Arial';
        ctx.fillText('Supporting teams converted to Indian Standard Time (IST)', 540, 850);

        // Bottom Watermark
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '28px Arial';
        ctx.fillText('kickoffist.com • All times in IST', 540, 990);
      }

      setDataURL(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [mode, match, teamA, teamB, flagA, flagB, istTime, istDate, teamStats]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        generateCard();
      }, 0);
    }
  }, [isOpen, generateCard]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = mode === 'match' 
      ? `kickoffist-${teamA}-vs-${teamB}.png`
      : `kickoffist-team-${teamA}.png`;
    link.href = dataURL;
    link.click();
    triggerToast("📥 Download started!");
  };

  const handleWhatsappShare = () => {
    const text = mode === 'match'
      ? `⚽ ${teamA} vs ${teamB}\n🕐 ${istTime} IST\n📅 ${istDate}\n\nCheck KICKOFF IST for all World Cup 2026 timings in IST!`
      : `⭐ Support ${teamA} in the FIFA World Cup 2026!\n\nView full IST match timings on KICKOFF IST!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyToClipboard = async () => {
    try {
      const blob = await (await fetch(dataURL)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      triggerToast("📋 Copied image to clipboard!");
    } catch {
      triggerToast("❌ Copy to clipboard not supported on this browser.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-[#0b0c15] border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-5 z-10 animate-slideup-modal overflow-y-auto max-h-[95vh] scrollbar-hide text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <h4 className="text-sm font-bold uppercase tracking-wider text-[#00FF87] flex items-center gap-1.5" style={{ fontFamily: '"FWC26", sans-serif' }}>
          <ImageIcon size={16} />
          <span>Share {mode === 'match' ? 'Match Story' : 'Team Stats'} Card</span>
        </h4>

        {/* Preview Screen */}
        <div className="w-full flex items-center justify-center bg-black/30 rounded-2xl border border-white/5 p-4 min-h-[300px] relative">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <CircleNotch size={32} className="animate-spin text-[#00FF87]" />
              <span className="text-xs opacity-60">Rendering graphic...</span>
            </div>
          ) : dataURL ? (
            <img 
              src={dataURL} 
              alt="Story Preview" 
              className={`max-h-[380px] rounded-lg border border-white/10 object-contain shadow-2xl ${
                mode === 'match' ? 'aspect-[9/16]' : 'aspect-square'
              }`} 
            />
          ) : (
            <span className="text-xs opacity-50">Preview unavailable</span>
          )}
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={!dataURL}
            className="w-full py-2.5 rounded-xl bg-[#00FF87] text-[#050508] font-bold text-xs uppercase tracking-wider hover:bg-[#00e578] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            style={{ fontFamily: '"FWC26", sans-serif' }}
          >
            <Download size={14} weight="bold" />
            <span>Download PNG</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyToClipboard}
              disabled={!dataURL}
              className="py-2.5 rounded-xl border border-white/10 bg-white/5 font-semibold text-[11px] uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Copy size={13} />
              <span>Copy Image</span>
            </button>
            <button
              onClick={handleWhatsappShare}
              className="py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <WhatsappLogo size={14} weight="fill" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toast */}
      {showToast && (
        <div
          className="fixed bottom-16 right-4 z-[9999] px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl border border-emerald-500/40 bg-[#0b0c15] text-white animate-slideup-modal"
        >
          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
