import React, { useState, useEffect, useCallback } from "react";
import { 
  HardDrive, MessageSquare, Plus, PlayCircle, 
  Edit, Trash2, FileText, XCircle, MessageCircle 
} from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom";
import api from '../lib/axios'; 
import echo from '../lib/echo'; 
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Loading';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // State Data
  const [pendingChats, setPendingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]); 
  const [faqCandidates, setFaqCandidates] = useState([]);
  const [publishedFaqs, setPublishedFaqs] = useState([]); 
  
  // State UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. FETCH DATA (API) ---
  const fetchData = useCallback(async () => {
    try {
      const [pendingRes, activeRes, candidateRes, publicFaqRes] = await Promise.all([
          api.get('/operator/pending-chats'),
          api.get('/operator/active-chats'),
          api.get('/operator/faq-candidates'),
          api.get('/faqs')
      ]);

      setPendingChats(pendingRes.data);
      setActiveChats(activeRes.data);
      setFaqCandidates(candidateRes.data);
      setPublishedFaqs(publicFaqRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) {
          setError("Sesi kadaluarsa. Silakan login kembali.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. REALTIME LISTENER ---
  useEffect(() => {
    fetchData(); 
    
    const channel = echo.private('operator-dashboard');
    
    // A. Listener Request Baru
    const handleQueue = (e) => {
        setPendingChats(prev => {
            if (prev.some(chat => chat.id === e.session.id)) return prev;
            return [e.session, ...prev];
        });
    };

    // B. Listener Pesan Baru
    const handleNewMessage = (e) => {
        setActiveChats(prev => prev.map(chat => {
            if (chat.id === e.message.chat_session_id) {
                return { 
                    ...chat, 
                    message_count: (chat.message_count || 0) + 1 
                };
            }
            return chat;
        }));
    };

    // C. Listener FAQ Candidate Baru (REALTIME UPDATE)
    const handleFaqCandidate = (e) => {
        setFaqCandidates(prev => {
            // Cek apakah kandidat sudah ada
            const index = prev.findIndex(item => item.id === e.candidate.id);
            
            if (index !== -1) {
                // Update item yang ada (misal ask_count nambah)
                const updatedList = [...prev];
                updatedList[index] = e.candidate;
                // Re-sort desc by ask_count
                return updatedList.sort((a, b) => b.ask_count - a.ask_count);
            } else {
                // Tambah baru di atas
                return [e.candidate, ...prev];
            }
        });
    };

    channel.listen('.ChatSessionQueued', handleQueue);
    channel.listen('.NewMessageSent', handleNewMessage);
    channel.listen('.FaqCandidateCreated', handleFaqCandidate);

    // CLEANUP
    return () => {
        channel.stopListening('.ChatSessionQueued', handleQueue);
        channel.stopListening('.NewMessageSent', handleNewMessage);
        channel.stopListening('.FaqCandidateCreated', handleFaqCandidate);
        echo.leave('operator-dashboard');
    };
  }, [fetchData]);

  // --- HANDLERS ---
  const handleTakeOver = async (sessionId) => {
    if (!window.confirm(`Ambil alih sesi #${sessionId}?`)) return;
    try {
        await api.post(`/operator/takeover/${sessionId}`);
        navigate(`/admin/chat/${sessionId}`); 
    } catch (e) { 
        alert('Gagal mengambil alih chat.'); 
    }
  };

  const handleContinueChat = (sessionId) => {
      navigate(`/admin/chat/${sessionId}`);
  };

  const handleQuickEnd = async (sessionId) => {
      if(!window.confirm(`Akhiri sesi #${sessionId} langsung dari Dashboard?`)) return;
      try {
          await api.post(`/operator/end-session/${sessionId}`);
          setActiveChats(prev => prev.filter(c => c.id !== sessionId));
          alert("Sesi berhasil diakhiri.");
      } catch (e) {
          alert("Gagal mengakhiri sesi.");
      }
  };
  
  const handleRejectFaq = async (id) => {
      if (!window.confirm('Tolak kandidat FAQ ini?')) return;
      try {
          await api.post(`/operator/faq-reject/${id}`);
          setFaqCandidates(prev => prev.filter(f => f.id !== id));
      } catch (e) { alert('Gagal menolak.'); }
  }

  const handleDeletePublishedFaq = async (id) => {
      if (!window.confirm('Hapus FAQ publik ini?')) return;
      try {
          await api.delete(`/operator/faq/${id}`);
          setPublishedFaqs(prev => prev.filter(f => f.id !== id));
      } catch (e) { alert('Gagal menghapus.'); }
  }

  if (loading) return <PageLoader text="Memuat Dashboard Admin..." />;

  return (
    <div className="w-full flex flex-col items-center pb-20 bg-dark-900 min-h-screen">
      
      {/* HEADER SIMPEL */}
      <div className="w-full max-w-7xl mt-8 mb-8 px-6">
        <h1 className="text-3xl font-bold text-white">Admin<span className="text-blue-500">Panel</span></h1>
        <p className="text-gray-400 text-xs mt-1">Manage chats and FAQs efficiently.</p>
      </div>

      {error && <div className="w-full max-w-7xl px-6 mb-4"><div className="bg-red-900/20 text-red-400 p-4 rounded-lg">{error}</div></div>}

      {/* STATS GRID */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 px-6 mb-10">
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex items-center gap-4 relative overflow-hidden">
             <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400 z-10"><MessageSquare size={24} /></div>
             <div className="z-10">
                 <span className="text-3xl font-bold text-white block">{pendingChats.length}</span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">Pending Requests</span>
             </div>
             {pendingChats.length > 0 && <div className="absolute right-0 top-0 w-2 h-2 bg-red-500 rounded-full m-3 animate-ping"></div>}
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex items-center gap-4">
             <div className="p-3 bg-blue-500/20 rounded-full text-blue-400"><HardDrive size={24} /></div>
             <div>
                 <span className="text-3xl font-bold text-white block">{faqCandidates.length}</span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">FAQ Candidates</span>
             </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex items-center gap-4">
             <div className="p-3 bg-green-500/20 rounded-full text-green-400"><FileText size={24} /></div>
             <div>
                 <span className="text-3xl font-bold text-white block">{publishedFaqs.length}</span>
                 <span className="text-xs text-gray-400 uppercase tracking-wider">Published FAQs</span>
             </div>
          </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="w-full max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KOLOM KIRI: CHAT MANAGEMENT */}
          <div className="space-y-8">
              
              {/* LIVE QUEUE (PENDING) */}
              <div className="w-full">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    Live Support Queue 
                    {pendingChats.length > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                </h3>
                
                <div className="flex flex-col gap-3">
                    {pendingChats.length === 0 ? (
                        <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-gray-500 text-center text-sm italic">
                            Tidak ada permintaan chat yang menunggu.
                        </div>
                    ) : (
                        pendingChats.map((chat) => (
                            <div key={chat.id} className="bg-dark-800 border border-yellow-500/30 shadow-lg shadow-yellow-900/10 rounded-xl px-6 py-5 flex justify-between items-center animate-in fade-in slide-in-from-left-2 transition hover:border-yellow-500/50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-yellow-500/10 p-2.5 rounded-full">
                                        <MessageSquare size={20} className="text-yellow-500" />
                                    </div>
                                    <div>
                                        <span className="text-white font-bold block text-sm">Session #{chat.id}</span>
                                        <span className="text-xs text-gray-400">Menunggu sejak {new Date(chat.updated_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleTakeOver(chat.id)} 
                                    className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-md flex items-center gap-2"
                                >
                                    Accept <PlayCircle size={12}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
              </div>

              {/* MY ACTIVE CHATS */}
              <div className="w-full">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    My Active Chats
                </h3>
                <div className="flex flex-col gap-3">
                    {activeChats.length === 0 ? (
                        <div className="p-6 bg-white/5 border border-white/5 rounded-xl text-gray-500 text-center text-sm italic">
                            Anda tidak memiliki chat aktif.
                        </div>
                    ) : (
                        activeChats.map((chat) => (
                            <div key={chat.id} className="bg-dark-800 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center hover:border-blue-500/40 transition">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-500/10 p-2.5 rounded-full hidden sm:block">
                                        <PlayCircle size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <span className="text-white font-bold block text-sm">Session #{chat.id}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-green-400 font-medium bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/20">Active</span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <MessageCircle size={10} /> {chat.message_count ?? 0} Chat
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleContinueChat(chat.id)} 
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
                                    >
                                        Open
                                    </button>
                                    <button 
                                        onClick={() => handleQuickEnd(chat.id)}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg border border-red-500/30 transition"
                                        title="Akhiri Sesi"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
              </div>
          </div>

          {/* KOLOM KANAN: FAQ MANAGEMENT */}
          <div className="space-y-8">
              <div className="w-full">
                <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">FAQ Candidates</h3>
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {faqCandidates.length === 0 ? (
                     <div className="p-6 bg-white/5 border border-white/5 rounded-xl text-gray-500 text-center text-sm italic">Tidak ada kandidat baru.</div>
                  ) : (
                     faqCandidates.map((faq) => (
                        <div key={faq.id} className="bg-black/20 border border-white/10 rounded-xl p-5 hover:bg-black/30 transition">
                            <p className="text-white font-medium mb-3 text-sm">"{faq.question_text}"</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/20">Ditanyakan {faq.ask_count}x</span>
                                <div className="flex gap-2">
                                    <Link to={`/admin/faq-approve/${faq.id}`} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition">Review</Link>
                                    <button onClick={() => handleRejectFaq(faq.id)} className="px-3 py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/30 text-xs font-bold rounded transition">Tolak</button>
                                </div>
                            </div>
                        </div>
                    ))
                  )}
                </div>
              </div>

              <div className="w-full">
                 <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h3 className="text-xl font-bold text-white">Published FAQs</h3>
                    <Link to="/admin/faq-add" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-900/20 transition">
                        <Plus size={14} /> Tambah Manual
                    </Link>
                 </div>
                 
                 <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {publishedFaqs.length === 0 ? (
                        <div className="p-6 bg-white/5 border border-white/5 rounded-xl text-gray-500 text-center text-sm italic">Belum ada FAQ yang diterbitkan.</div>
                    ) : (
                        publishedFaqs.map((faq) => (
                            <div key={faq.id} className="bg-dark-800 border border-white/5 rounded-xl p-5 hover:border-white/20 transition group">
                                <p className="text-blue-200 text-sm font-medium mb-2">{faq.question}</p>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{faq.answer}</p>
                                <div className="flex gap-4 pt-3 border-t border-white/5 opacity-60 group-hover:opacity-100 transition">
                                    <Link to={`/admin/faq-edit/${faq.id}`} className="text-xs flex items-center gap-1.5 text-gray-300 hover:text-white font-medium bg-white/5 px-2 py-1 rounded hover:bg-white/10">
                                        <Edit size={12} /> Edit
                                    </Link>
                                    <button onClick={() => handleDeletePublishedFaq(faq.id)} className="text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300 font-medium bg-red-900/10 px-2 py-1 rounded hover:bg-red-900/20">
                                        <Trash2 size={12} /> Hapus
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;