import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Send, UserRound, Bot, MessageCircleQuestion, Ghost, Home, LogIn, LogOut, ExternalLink, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import api from '../lib/axios'; 
import echo from '../lib/echo'; 
import { useAuth } from '../context/AuthContext';
import { PageLoader, TypingBubble } from '../components/ui/Loading';

const Chat = () => {
  const navigate = useNavigate(); 
  const { isLoggedIn, user, logout } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState(null); 
  const [status, setStatus] = useState('ai_active'); 
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  const userName = isLoggedIn ? user?.name : 'Guest User';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // --- Load Session ---
  const loadExistingSession = useCallback(async (id) => {
      try {
          const response = await api.get(`/chat/session/${id}`);
          setSessionId(id);
          setMessages(response.data.messages);
          setStatus(response.data.session.status);
      } catch (error) {
          localStorage.removeItem('chat_session_id');
          startNewSession();
      } finally {
          setIsInitializing(false);
      }
  }, []);

  // --- Start Session ---
  const startNewSession = useCallback(async () => {
    setIsInitializing(true);
    // PASTIKAN LOADING AI MATI SAAT MULAI BARU
    setIsLoading(false); 
    try {
        const response = await api.post('/chat/start');
        const newId = response.data.session_id;
        setSessionId(newId);
        setStatus('ai_active');
        setMessages([]);
        localStorage.setItem('chat_session_id', newId);
    } catch (error) {
        console.error("Gagal init session:", error);
    } finally {
        setIsInitializing(false);
    }
  }, []);

  // --- Handle New Chat (FIXED) ---
  const handleNewChat = async () => {
      // 1. Matikan Loading AI secara paksa agar tidak muncul di sesi baru
      setIsLoading(false); 
      setMessages([]);
      setSessionId(null);
      
      // 2. Tampilkan Loader Halaman
      setIsInitializing(true);

      // 3. Hapus Sesi Lama
      if (sessionId) {
          try {
              await api.delete(`/chat/session/${sessionId}`);
              echo.leave(`chat-session.${sessionId}`);
          } catch (e) { console.error("Gagal hapus sesi lama", e); }
      }

      // 4. Bersihkan Storage & Mulai Baru
      localStorage.removeItem('chat_session_id');
      await startNewSession();
  };

  useEffect(() => {
      if (user?.role === 'admin') navigate('/admin/dashboard');
      const savedId = localStorage.getItem('chat_session_id');
      if (savedId) loadExistingSession(savedId);
      else startNewSession();
  }, []);

  // --- WebSocket Listener ---
  useEffect(() => {
    if (!sessionId) return;
    const channel = echo.private(`chat-session.${sessionId}`);
    
    channel.listen('.NewMessageSent', (e) => {
        const incomingMsg = e.message;
        
        if (incomingMsg.sender_type === 'ai' && incomingMsg.message.includes('Operator')) setStatus('operator_active');
        if (incomingMsg.sender_type === 'operator') setStatus('operator_active');
        
        setMessages(prev => {
            if (prev.some(m => m.id === incomingMsg.id)) return prev;

            const tempMatchIndex = prev.findIndex(m => 
                m.sender_type === incomingMsg.sender_type &&
                m.message === incomingMsg.message &&
                String(m.id).length > 10 
            );

            if (tempMatchIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[tempMatchIndex] = incomingMsg;
                return newMsgs;
            }
            return [...prev, incomingMsg];
        });
        
        // Matikan loading saat ada balasan bukan dari user
        if (incomingMsg.sender_type !== 'user') {
            setIsLoading(false);
        }
    });
    return () => echo.leave(`chat-session.${sessionId}`);
  }, [sessionId]);

  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;

    const text = inputValue;
    setInputValue("");
    setIsLoading(true); 

    const tempMsg = { 
        id: Date.now(), 
        message: text, 
        sender_type: "user", 
        created_at: new Date().toISOString() 
    };
    setMessages(p => [...p, tempMsg]);

    try {
        await api.post('/chat/send', { message: text, session_id: sessionId });
    } catch (e) { 
        console.error(e); 
        setIsLoading(false); 
    }
  };

  const handleRequestOperator = async () => {
    if (!sessionId) return;
    if (!window.confirm("Hubungkan ke operator?")) return;
    
    setMessages(prev => [...prev, {
        id: Date.now(),
        message: 'Menghubungkan ke operator...',
        sender_type: 'ai',
        created_at: new Date().toISOString()
    }]);

    try {
        await api.post('/chat/request-operator', { session_id: sessionId });
        setStatus('pending_operator');
    } catch (e) { alert('Gagal request.'); }
  };

  const handleLogout = async () => {
      await logout();
      localStorage.removeItem('chat_session_id');
      navigate('/login');
  };

  if (isInitializing) return <PageLoader text="Menyiapkan Chat Baru..." />;

  return (
    <div className="flex h-screen bg-transparent text-white overflow-hidden font-sans">
      <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col p-4 hidden md:flex shrink-0 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
          <div className="bg-blue-900/50 p-1.5 rounded-full"><Home size={16} /></div><span className="text-sm font-medium">Home</span>
        </Link>
        <div className="bg-dark-800 p-3 rounded-xl flex items-center gap-3 mb-6 border border-white/5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-blue-700' : 'bg-gray-700'}`}>
            {isLoggedIn ? <UserRound size={16} /> : <Ghost size={16} />}
          </div>
          <div className="overflow-hidden">
             <span className="text-sm font-medium block truncate w-32">{userName}</span>
             <span className="text-[10px] text-gray-500 block">{isLoggedIn ? 'Online' : 'Guest Mode'}</span>
          </div>
        </div>
        <div className={`py-2 px-3 rounded-lg text-center text-[10px] font-bold tracking-wide mb-4 border transition-all duration-500 ${
            status === 'ai_active' ? 'bg-green-900/20 text-green-400 border-green-500/20' : 
            status === 'pending_operator' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20 animate-pulse' :
            'bg-blue-900/20 text-blue-400 border-blue-500/20'
        }`}>
            {status === 'ai_active' ? 'AI ASSISTANT' : status === 'pending_operator' ? 'WAITING FOR AGENT...' : 'CONNECTED TO AGENT'}
        </div>
        
        <button onClick={handleNewChat} className="w-full bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 mb-2 border border-white/10 transition text-sm"><Plus size={16} /> New Chat</button>
        
        <button onClick={handleRequestOperator} disabled={status !== 'ai_active' || isLoading} className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2 mb-6 border border-white/10 transition text-sm disabled:opacity-30"><MessageCircleQuestion size={16} /> Request Agent</button>
        <div className="pt-4 border-t border-white/10 space-y-1 mt-auto">
          <Link to="/faq" className="flex items-center gap-3 px-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition"><ExternalLink size={14} /> FAQ Center</Link>
          {isLoggedIn ? <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-xs text-red-400 hover:bg-white/5 rounded transition text-left mt-2"><LogOut size={14} /> Sign Out</button> : <Link to="/login" className="w-full flex items-center gap-3 px-2 py-2 text-xs text-blue-400 hover:bg-blue-900/10 rounded transition text-left mt-2"><LogIn size={14} /> Login to Save</Link>}
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-dark-900 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-4">
            {messages.length === 0 && (
              <div className="text-center space-y-4 py-20 opacity-50 animate-in fade-in zoom-in-95 duration-500">
                <Bot size={48} className="mx-auto text-gray-600" />
                <p className="text-gray-400 text-sm">AI siap membantu. Silakan ketik pertanyaan Anda.</p>
              </div>
            )}
            {messages.map((msg) => {
                const isSystem = msg.sender_type === 'ai' && (msg.message.includes('Operator') || msg.message.includes('diteruskan') || msg.message.includes('Menghubungkan') || msg.message.includes('Sesi'));
                if (isSystem) return <div key={msg.id} className="flex justify-center my-2 animate-in fade-in"><span className="text-[10px] bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2"><AlertCircle size={12} /> {msg.message}</span></div>;
                return (
                  <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 ${msg.sender_type === "user" ? "self-end items-end" : "self-start items-start"}`}>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1 uppercase font-bold tracking-wide">{msg.sender_type === "user" ? "You" : msg.sender_type === "operator" ? "Customer Service" : "AI Assistant"}</div>
                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${msg.sender_type === "user" ? "bg-blue-600 text-white rounded-tr-sm" : msg.sender_type === "operator" ? "bg-indigo-600 text-white rounded-tl-sm border border-indigo-500" : "bg-white/5 text-gray-100 rounded-tl-sm border border-white/5"}`}>{msg.message}</div>
                  </div>
                )
            })}
            
            {/* Loading Bubble hanya muncul jika status AI_ACTIVE */}
            {isLoading && status === 'ai_active' && (
               <div className="self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="text-[10px] text-gray-500 px-1 mb-1 uppercase font-bold tracking-wide">AI Assistant</div>
                   <TypingBubble />
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-white/10 z-10 bg-dark-900/90 backdrop-blur-md">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-gray-200 text-sm focus:border-blue-500/50 transition placeholder-gray-600" placeholder={status === 'operator_active' ? "Type to Admin..." : "Ask AI something..."} disabled={isLoading && status === 'ai_active'} />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 transition" disabled={!inputValue.trim()}><Send size={18} /></button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Chat;