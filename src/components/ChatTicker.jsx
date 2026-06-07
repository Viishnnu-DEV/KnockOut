import { useState, useEffect } from 'react';
import { PaperPlane, ChatCenteredDots, SoccerBall, Fire, Trophy } from '@phosphor-icons/react';

// Word filter for profanity/spam
const PROFANITY_WORDS = ['badword', 'spam', 'abuse', 'fuck', 'shit', 'asshole', 'bastard', 'bitch'];

function filterMessage(text) {
  let filtered = text;
  PROFANITY_WORDS.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

const DEFAULT_MESSAGES = [
  { id: '1', text: "VAMOS ARGENTINA! 🇦🇷", timestamp: Date.now() - 50000 },
  { id: '2', text: "COME ON BRAZIL! ⚽", timestamp: Date.now() - 40000 },
  { id: '3', text: "MESSI GOAT! 🔥", timestamp: Date.now() - 30000 },
  { id: '4', text: "ITALY WE MISS YOU! 🇮🇹", timestamp: Date.now() - 20000 },
  { id: '5', text: "METLIFE HERE WE COME! 🏆", timestamp: Date.now() - 10000 }
];

async function loadChatMessages() {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const result = await window.storage.get(`chat:messages`, true);
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (err) {
    console.error("Shared storage chat read error:", err);
  }

  try {
    const local = localStorage.getItem('chat:messages');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("LocalStorage chat read error:", err);
  }

  return DEFAULT_MESSAGES;
}

async function saveChatMessages(messages) {
  const clean = messages.filter((m) => Date.now() - m.timestamp < 24 * 60 * 60 * 1000).slice(0, 50);
  
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(`chat:messages`, JSON.stringify(clean), true);
    }
  } catch (err) {
    console.error("Shared storage chat write error:", err);
  }

  try {
    localStorage.setItem('chat:messages', JSON.stringify(clean));
  } catch (err) {
    console.error("LocalStorage chat write error:", err);
  }
}

export default function ChatTicker({ isDark }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadMessages = async () => {
    const list = await loadChatMessages();
    setMessages(list);
  };

  useEffect(() => {
    setTimeout(() => {
      loadMessages();
    }, 0);

    // Refresh chat messages every 15 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handlePostMessage = async (text) => {
    if (!text.trim()) return;

    // Check rate limit (1 message per 60s)
    const now = Date.now();
    const lastVoted = localStorage.getItem('last_chat_submit');
    if (lastVoted && now - Number(lastVoted) < 60000) {
      alert("Rate limit: Please wait 60s before posting another message!");
      return;
    }

    const cleanText = filterMessage(text.slice(0, 25));
    const newMsg = {
      id: `${now}-${Math.random()}`,
      text: cleanText,
      timestamp: now,
      country: '🇮🇳'
    };

    const updated = [newMsg, ...messages].slice(0, 50);
    setMessages(updated);
    await saveChatMessages(updated);
    localStorage.setItem('last_chat_submit', String(now));
    setInputText('');
    setIsFormOpen(false);
  };

  const handleQuickReaction = (reaction) => {
    handlePostMessage(reaction);
  };

  // Generate scrolling text line
  const tickerText = messages.map(m => `${m.country || '🇮🇳'} "${m.text.toUpperCase()}"`).join('  •  ') + '  •  ';

  return (
    <div 
      className="fixed bottom-[64px] sm:bottom-0 left-0 w-full z-[9999] select-none flex flex-col pointer-events-none"
    >
      {/* Reactions Panel (Only visible when form or reactions are toggled) */}
      {isFormOpen && (
        <div 
          className="mx-auto mb-2 p-3.5 rounded-2xl border flex flex-col gap-2.5 pointer-events-auto shadow-2xl animate-slideup-modal max-w-sm w-full bg-[#050508]/95 border-white/10 text-white"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF87]">Quick Reactions</span>
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="text-[10px] uppercase font-bold text-red-400 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickReaction("⚽ GOAL!!!")}
              className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
            >
              <SoccerBall size={12} />
              <span>⚽ GOAL!</span>
            </button>
            <button
              onClick={() => handleQuickReaction("🔥 WHAT A MATCH!")}
              className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
            >
              <Fire size={12} />
              <span>🔥 FIRE!</span>
            </button>
            <button
              onClick={() => handleQuickReaction("😱 SHOCKED!")}
              className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
            >
              <span>😱 SHOCK!</span>
            </button>
            <button
              onClick={() => handleQuickReaction("🏆 CHAMPIONS!")}
              className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
            >
              <Trophy size={12} />
              <span>🏆 CHAMP!</span>
            </button>
          </div>

          {/* Chat text input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handlePostMessage(inputText); }}
            className="flex gap-2 border-t border-white/10 pt-2.5 mt-1"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 25))}
              placeholder="Cheer your team (max 25 chars)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00FF87] transition-colors"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-[#00FF87] text-[#050508] flex items-center justify-center hover:bg-[#00e578] transition-colors cursor-pointer"
            >
              <PaperPlane size={14} weight="fill" />
            </button>
          </form>
        </div>
      )}

      {/* Main horizontal ticker bar */}
      <div 
        className="w-full h-11 flex items-center justify-between pointer-events-auto border-t text-white bg-[#050508]/92"
        style={{ 
          backdropFilter: 'blur(8px)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16,22,79,0.08)'
        }}
      >
        {/* Left Live Badge */}
        <div className="flex items-center gap-1.5 px-4 bg-[#050508] z-10 border-r border-white/10 h-full select-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00FF87]" style={{ fontFamily: '"FWC26", sans-serif' }}>
            FANS LIVE
          </span>
        </div>

        {/* Scrolling text track */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <div className="marquee-track flex items-center h-full text-xs font-semibold tracking-wider whitespace-nowrap">
            <span>{tickerText}</span>
            <span>{tickerText}</span>
          </div>
        </div>

        {/* Right Cheer Button */}
        <div className="px-3 bg-[#050508] z-10 border-l border-white/10 h-full flex items-center">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3 py-1 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#00FF87] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-[#00FF87]/25 transition-all"
            style={{ fontFamily: '"FWC26", sans-serif' }}
          >
            <ChatCenteredDots size={12} weight="fill" />
            <span className="hidden sm:inline">Cheer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
