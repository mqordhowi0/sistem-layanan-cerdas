import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, ExternalLink, Power, 
  User, Plus, Minus, Ghost, LogIn, Home, HelpCircle, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios'; 
import { useAuth } from '../context/AuthContext'; 
// IMPOR SkeletonCard
import { SkeletonCard } from '../components/ui/Loading';

const Faq = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null); 

  // --- Cek Status Login ---
  const { isLoggedIn, user, logout } = useAuth();
  const userName = isLoggedIn ? user?.name : 'Pengunjung';

  const fetchFaqs = useCallback(async () => {
    try {
      const response = await api.get('/faqs'); 
      setFaqs(response.data);
      setOpenIndex(response.data.length > 0 ? 0 : null); 
    } catch (err) {
      console.error("Gagal fetch FAQ:", err);
      setError("Gagal memuat FAQ dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  const handleLogout = async () => {
      if (!isLoggedIn) return;
      try { await api.post('/operator/logout'); } catch (e) {}
      localStorage.clear();
      navigate('/login');
  };

  return (
    <div className="flex h-screen bg-transparent text-white overflow-hidden font-sans">
      
      {/* --- SIDEBAR (KIRI - FIXED) --- */}
      <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col p-4 hidden md:flex shrink-0">
        {/* Tombol Back to Home */}
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
          <div className="bg-blue-900/50 p-1.5 rounded-full">
            <Home size={16} />
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* User Profile Card */}
        <div className="bg-dark-800 p-3 rounded-xl flex items-center gap-3 mb-6 border border-white/5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-blue-700' : 'bg-gray-700'}`}>
            {isLoggedIn ? <User size={16} /> : <Ghost size={16} />}
          </div>
          <div className="overflow-hidden">
             <span className="text-sm font-medium block truncate w-32">{userName}</span>
             <span className="text-[10px] text-gray-500 block">{isLoggedIn ? 'Online User' : 'Guest Mode'}</span>
          </div>
        </div>

        {/* Menu Items (Dekorasi) */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
           <div className="px-3 text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Support Topics</div>
           {['General Question', 'Account Issue', 'Billing', 'Technical Support'].map((item, idx) => (
             <div key={idx} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition text-left cursor-pointer">
                <MessageSquare size={16} />
                {item}
             </div>
           ))}
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-white/10 space-y-1">
          {/* Link Chat */}
          <Link to="/chat" className="flex items-center gap-3 px-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">
             <Plus size={14} /> New Chat
          </Link>
          
          {/* Tombol FAQ (Aktif) */}
          <div className="flex items-center gap-3 px-2 py-2 text-xs bg-white/10 text-white font-medium rounded border border-white/10">
            <ExternalLink size={14} /> FAQ Center
          </div>

          {/* Link Profil (HANYA USER LOGIN) */}
          {isLoggedIn && (
            <Link to="/profile" className="flex items-center gap-3 px-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">
               <User size={14} /> My Profile
            </Link>
          )}
          
          {/* Tombol Login/Logout */}
          {isLoggedIn ? (
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-xs text-red-400 hover:bg-red-900/10 rounded transition text-left mt-2">
               <Power size={14} /> Log out
             </button>
          ) : (
             <Link to="/login" className="w-full flex items-center gap-3 px-2 py-2 text-xs text-blue-400 hover:bg-blue-900/10 rounded transition text-left mt-2">
               <LogIn size={14} /> Login Staff
             </Link>
          )}
        </div>
      </aside>

      {/* --- CONTENT AREA (KANAN - SCROLLABLE) --- */}
      <main className="flex-1 flex flex-col relative bg-dark-900 overflow-hidden">
        
        {/* Background Gradient Halus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-3xl mx-auto w-full pb-20">
                
                {/* Header Content */}
                <div className="text-center mb-12 pt-4">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-6 text-blue-300 text-xs font-bold tracking-wide uppercase">
                        <HelpCircle size={14} /> Knowledge Base
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Frequently Asked <span className="text-blue-500">Questions</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                        Temukan jawaban cepat untuk pertanyaan umum seputar layanan kami. Jika tidak menemukan jawaban, silakan hubungi operator.
                    </p>
                </div>

                {/* Loading & Error State */}
                {/* IMPLEMENTASI SkeletonCard */}
                {loading && (
                    <div className="flex flex-col gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                )}
                
                {error && <div className="text-center text-red-400 bg-red-900/10 p-4 rounded-xl border border-red-900/30">{error}</div>}
                
                {faqs.length === 0 && !loading && !error && (
                    <div className="text-center text-gray-500 bg-white/5 p-8 rounded-2xl border border-white/10">
                        Belum ada FAQ yang tersedia saat ini.
                    </div>
                )}

                {/* List FAQ Accordion */}
                <div className="flex flex-col gap-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div 
                                key={faq.id} 
                                onClick={() => toggleFAQ(index)}
                                className={`group border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
                                    ${isOpen 
                                        ? 'bg-white/5 border-blue-500/30 shadow-lg shadow-blue-900/10' 
                                        : 'bg-transparent border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="p-5 md:p-6 flex justify-between items-center gap-4">
                                    <span className={`text-base md:text-lg font-medium transition-colors ${isOpen ? 'text-blue-300' : 'text-gray-200 group-hover:text-white'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`p-2 rounded-full transition-colors shrink-0 ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                                        {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                                    </div>
                                </div>
                                
                                <div 
                                    className={`transition-all duration-300 ease-in-out overflow-hidden
                                    ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="px-6 pb-6 text-gray-400 text-sm md:text-base leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};

export default Faq;