import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, XCircle, Bot, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import echo from '../lib/echo';
import { PageLoader } from '../components/ui/Loading';

const ChatAdmin = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState('ai_active');
  const messagesEndRef = useRef(null);

  // 1. Fetch History
  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await api.get(`/operator/chat/history/${sessionId}`);
      setMessages(response.data.messages);
      setSessionStatus(response.data.session.status);
    } catch (error) { 
        console.error("Gagal load history:", error);
        // Jika history gagal dimuat (misal karena sudah dihapus), lempar ke dashboard
        if (error.response && error.response.status === 404) {
            alert("Sesi ini sudah tidak tersedia.");
            navigate('/admin/dashboard');
        }
    } finally { 
        setLoading(false); 
    }
  }, [sessionId, navigate]);

  // 2. Realtime Listener
  useEffect(() => {
    fetchChatHistory();
    
    console.log(`📡 Listening to Reverb channel: chat-session.${sessionId}`);
    const channel = echo.private(`chat-session.${sessionId}`);
    
    // A. Listener Pesan Masuk
    const handleNewMessage = (e) => { 
        const incomingMsg = e.message;
        console.log("📨 Incoming Message:", incomingMsg);
        
        setMessages(prev => {
            if (prev.some(msg => msg.id === incomingMsg.id)) return prev;

            // Logika Replace Pesan Sementara (Double Bubble Fix)
            if (incomingMsg.sender_type === 'operator') {
                const tempMsgIndex = prev.findIndex(m => 
                    m.sender_type === 'operator' && 
                    m.message === incomingMsg.message && 
                    String(m.id).length > 10 
                );

                if (tempMsgIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[tempMsgIndex] = incomingMsg;
                    return newMessages;
                }
            }
            return [...prev, incomingMsg];
        });
        
        setTimeout(scrollToBottom, 100);
    };

    // B. Listener Sesi Berakhir (FITUR BARU)
    // Jika User menekan "New Chat", admin akan menerima sinyal ini
    const handleSessionEnded = (e) => {
        alert("User telah mengakhiri sesi chat ini.");
        navigate('/admin/dashboard');
    };

    // Pasang Listener
    channel.listen('.NewMessageSent', handleNewMessage);
    channel.listen('.ChatSessionEnded', handleSessionEnded); // <--- INI KUNCINYA

    return () => {
        console.log("🔌 Leaving channel");
        channel.stopListening('.NewMessageSent', handleNewMessage);
        channel.stopListening('.ChatSessionEnded', handleSessionEnded);
        echo.leave(`chat-session.${sessionId}`);
    };
  }, [sessionId, fetchChatHistory, navigate]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // 3. Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const text = inputValue;
    setInputValue("");

    const tempId = Date.now();
    const tempMsg = { 
        id: tempId, 
        message: text, 
        sender_type: 'operator', 
        created_at: new Date().toISOString() 
    };

    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
        await api.post('/operator/send-message', { session_id: sessionId, message: text });
    } catch (error) { 
        console.error("Gagal kirim:", error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Gagal mengirim pesan (Mungkin sesi sudah berakhir).");
    }
  };

  // 4. End Session
  const handleEndSession = async () => {
      if (!window.confirm("Akhiri sesi? User akan dikembalikan ke AI.")) return;
      try {
          await api.post(`/operator/end-session/${sessionId}`);
          navigate('/admin/dashboard');
      } catch (e) { alert("Gagal mengakhiri sesi."); }
  };

  if (loading) return <PageLoader text="Memuat Sesi Chat..." />;

  return (
    <div className="flex flex-col h-screen bg-dark-900 text-white font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-dark-800 shadow-md z-20">
        <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                <ArrowLeft size={22} />
            </Link>
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    Session #{sessionId} 
                    {sessionStatus === 'operator_active' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>}
                </h2>
                <p className="text-xs text-gray-400">Live Support Control</p>
            </div>
        </div>
        
        <div className="flex gap-4">
            {sessionStatus === 'operator_active' && (
                <button onClick={handleEndSession} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-2 rounded-lg text-xs font-bold border border-red-500/30 flex items-center gap-2 transition">
                    <XCircle size={16} /> End Chat
                </button>
            )}
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-500/20">
                <ShieldCheck size={16} /> ADMIN
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-black/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-full flex flex-col gap-4 pb-4 px-4">
            {messages.map((msg) => {
                const isMe = msg.sender_type === 'operator';
                const isSystem = msg.sender_type === 'ai' && (msg.message.includes('Operator') || msg.message.includes('Sesi'));
                
                if (isSystem) return <div key={msg.id} className="self-center my-6 bg-white/5 text-gray-400 text-xs px-6 py-1.5 rounded-full border border-white/5 italic">{msg.message}</div>;

                return (
                    <div key={msg.id} className={`flex flex-col gap-1 max-w-[75%] animate-in fade-in slide-in-from-bottom-2 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1 uppercase font-bold tracking-wide">{isMe ? 'You (Admin)' : msg.sender_type === 'user' ? 'User' : 'Bot'}</div>
                        <div className={`px-6 py-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-lg
                            ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm border border-indigo-500' : 'bg-dark-700 text-gray-200 rounded-tl-sm border border-white/10'}`}>
                            {msg.sender_type === 'ai' && <Bot size={14} className="inline mr-2 mb-0.5 text-gray-500"/>}
                            {msg.message}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-dark-800 border-t border-white/10 z-20">
        {sessionStatus === 'operator_active' ? (
            <form onSubmit={handleSend} className="w-full relative flex gap-4">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white text-base focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition"
                />
                <button type="submit" disabled={!inputValue.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl transition disabled:opacity-50 flex items-center justify-center shadow-lg"><Send size={20} /></button>
            </form>
        ) : (
            <div className="text-center text-gray-500 py-4 bg-black/20 rounded-xl border border-white/5">This session is not active. <Link to="/admin/dashboard" className="text-blue-400 hover:underline">Go back</Link></div>
        )}
      </div>
    </div>
  );
};

export default ChatAdmin;