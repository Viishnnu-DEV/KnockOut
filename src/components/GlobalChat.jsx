import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '../lib/firebase';
import { ChatCircleDots, X, PaperPlaneRight, Globe, Fire, WarningCircle } from '@phosphor-icons/react';
import { getUserChatIdentity, cleanMessage } from '../utils/chatUtils';
import { getMatchStatus } from '../matchData';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const COOLDOWN_MS = 15000;

export default function GlobalChat({ matches, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [lastSent, setLastSent] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  
  const messagesEndRef = useRef(null);
  const [identity] = useState(() => getUserChatIdentity());

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpen);
    return () => window.removeEventListener('open-chat', handleOpen);
  }, []);

  // Find if there's any LIVE match
  const liveMatch = matches?.find(m => getMatchStatus(m).label === 'LIVE');

  useEffect(() => {
    if (!liveMatch && activeTab !== 'global') {
      setActiveTab('global');
    }
  }, [liveMatch, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const roomPath = activeTab === 'global' ? 'chat/global' : `chat/${activeTab}`;
    const chatRef = ref(realtimeDb, roomPath);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const loadedMessages = Object.entries(data)
          .map(([key, val]) => ({ id: key, ...val }))
          // Client-side 15m TTL filter
          .filter(msg => !msg.timestamp || (now - msg.timestamp < FIFTEEN_MINUTES))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownLeft > 0) {
      const timer = setInterval(() => {
        setCooldownLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownLeft]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const now = Date.now();
    if (now - lastSent < COOLDOWN_MS) {
      return;
    }

    const cleanedText = cleanMessage(inputText);
    const roomPath = activeTab === 'global' ? 'chat/global' : `chat/${activeTab}`;
    const chatRef = ref(realtimeDb, roomPath);

    try {
      await push(chatRef, {
        nickname: identity.nickname,
        flag: identity.flag,
        text: cleanedText,
        timestamp: serverTimestamp()
      });
      setInputText('');
      setLastSent(now);
      setCooldownLeft(15);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const bgStyle = isDark ? 'rgba(8, 11, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  const borderStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)';
  const textStyle = isDark ? '#ffffff' : '#10164f';
  const subTextStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(16, 22, 79, 0.5)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.04)';

  return (
    <>
      {/* Chat Modal */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[550px] max-h-[75vh] rounded-2xl flex flex-col shadow-2xl z-[100] theme-transition animate-fadein"
          style={{
            background: bgStyle,
            border: `1px solid ${borderStyle}`,
            backdropFilter: 'blur(16px)',
            color: textStyle
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: borderStyle }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{identity.flag}</span>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide" style={{ fontFamily: '"FWC26", sans-serif' }}>Fan Zone</span>
                <span className="text-[10px] uppercase" style={{ color: subTextStyle }}>{identity.nickname}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity p-1">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-2 border-b gap-2" style={{ borderColor: borderStyle }}>
            <button
              onClick={() => setActiveTab('global')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'global' ? 'bg-[#fcb900] text-[#10164f]' : 'opacity-60 hover:opacity-100'}`}
              style={{ background: activeTab === 'global' ? '#fcb900' : 'transparent' }}
            >
              <Globe size={14} /> Global
            </button>
            {liveMatch && (
              <button
                onClick={() => setActiveTab(liveMatch.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors relative`}
                style={{ 
                  background: activeTab === liveMatch.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: activeTab === liveMatch.id ? '#ff3333' : 'inherit',
                  border: activeTab === liveMatch.id ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent'
                }}
              >
                <Fire size={14} weight={activeTab === liveMatch.id ? "fill" : "regular"} className={activeTab === liveMatch.id ? "text-[#ff3333] animate-pulse" : "opacity-60"} /> 
                <span className={activeTab !== liveMatch.id ? "opacity-60" : ""}>Match Live</span>
              </button>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" data-lenis-prevent="true">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center gap-2">
                <ChatCircleDots size={32} />
                <span className="text-xs uppercase font-bold tracking-wider">No messages yet.<br/>Be the first to chat!</span>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.nickname === identity.nickname;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-[9px] mb-0.5 opacity-60 flex gap-1 items-center">
                      {!isMe && <span>{msg.flag} {msg.nickname}</span>}
                    </span>
                    <div 
                      className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'rounded-tr-sm bg-[#fcb900] text-[#10164f]' : 'rounded-tl-sm'}`}
                      style={!isMe ? { background: inputBg } : {}}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t flex gap-2 items-center relative" style={{ borderColor: borderStyle }}>
            {cooldownLeft > 0 && (
              <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[10px] bg-red-500/90 text-white px-2 py-0.5 rounded-full shadow flex items-center gap-1 font-bold animate-pulse">
                  <WarningCircle size={12} /> Cooldown: {cooldownLeft}s
                </span>
              </div>
            )}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-colors"
              style={{ background: inputBg, color: textStyle }}
              maxLength={100}
              disabled={cooldownLeft > 0}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || cooldownLeft > 0}
              className="w-10 h-10 rounded-full bg-[#00FF87] text-[#004643] flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
