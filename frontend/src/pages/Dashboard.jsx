import React, { useState, useEffect, useCallback } from 'react';
import { Send, Zap, Target, Activity, Plus, Minus, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
// IMPOR SkeletonCard
import { SkeletonCard } from '../components/ui/Loading';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LOGIKA REDIRECT ADMIN ---
  // Jika yang login adalah admin, lempar ke dashboard admin
  useEffect(() => {
    if (user?.role === 'admin') {
        navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  // --- FETCH DATA ---
  const fetchPublicFaqs = useCallback(async () => {
    try {
        const response = await api.get('/faqs');
        setFaqs(response.data.slice(0, 4)); 
    } catch (err) {
        console.error("Error:", err);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicFaqs();
  }, [fetchPublicFaqs]);

  return (
    <div className="w-full flex flex-col items-center pb-20">
        {/* Konten Dashboard */}
        <div className="w-full pt-24 px-4 max-w-7xl"> 
          
          <div className="mt-8 mb-8 text-center relative">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                 Welcome, <span className="text-white">{isLoggedIn ? user?.name : 'Guest'}</span>
            </h1>
            <p className="text-gray-400 text-xs mt-4 tracking-[0.2em] uppercase">AI-Powered Customer Support</p>
          </div>

          <div className="w-full bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 inline-flex items-center relative z-10">
              <span className="border-l-4 border-blue-600 pl-4 mr-3 h-10 flex items-center">Smart</span> Assistant
            </h2>
            
            <div className="flex flex-col items-center gap-8 relative z-10">
               
               {/* TOMBOL NAVIGASI UTAMA */}
               {!isLoggedIn ? (
                   // Mode Tamu
                   <div className="flex flex-col sm:flex-row items-center gap-4">
                     <Link to="/chat" className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-bold transition shadow-lg transform hover:scale-105">
                        Chat as Guest <Send size={16} />
                     </Link>
                     <span className="text-gray-500 text-xs">OR</span>
                     <Link to="/login" className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition border border-blue-500/30">
                        <LogIn size={16} /> Login for Full Access
                     </Link>
                   </div>
               ) : (
                   // Mode User Login
                   <Link to="/chat" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg flex items-center gap-2 text-base font-bold transition shadow-lg shadow-blue-600/20 transform hover:scale-105">
                      Start New Session <Send size={18} />
                   </Link>
               )}
               
               <p className="text-gray-500 text-xs max-w-md">
                 {isLoggedIn ? "Riwayat chat akan tersimpan." : "Login untuk menyimpan riwayat chat Anda."}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl text-center mt-6 border-t border-white/5 pt-8">
                  <FeatureIcon icon={<Zap size={20} />} title="Instant" desc="Real-time AI answers" />
                  <FeatureIcon icon={<Target size={20} />} title="Accurate" desc="Context-aware responses" />
                  <FeatureIcon icon={<Activity size={20} />} title="Hybrid" desc="AI + Human Support" />
               </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="w-full mt-20 max-w-4xl mx-auto">
             <div className="text-center mb-10">
                <h2 className="text-sm font-semibold text-blue-200 uppercase tracking-wider bg-white/5 px-4 py-1 rounded-full inline-block">Popular Questions</h2>
             </div>
             
             {/* IMPLEMENTASI SkeletonCard */}
             {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqs.map((faq) => (
                       <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
             )}
             
             <div className="text-center mt-8">
                <Link to="/faq" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm border-b border-blue-500/30 pb-0.5 hover:border-blue-400 transition">
                    View All FAQs <Plus size={12} />
                </Link>
             </div>
          </div>
        </div>
    </div>
  );
};

const FeatureIcon = ({ icon, title, desc }) => (
    <div className="flex flex-col items-center gap-2 group">
        <div className="p-3 bg-white/5 rounded-full group-hover:bg-blue-600/20 group-hover:text-blue-400 transition text-gray-400">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <p className="text-[11px] text-gray-500 px-2">{desc}</p>
    </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div onClick={() => setIsOpen(!isOpen)} className={`bg-black/40 border border-white/10 rounded-lg p-5 cursor-pointer transition-all hover:bg-dark-800 ${isOpen ? 'ring-1 ring-blue-500/50 bg-dark-800' : ''}`}>
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-400'}`}>{question}</span>
        {isOpen ? <Minus size={16} className="text-blue-400" /> : <Plus size={16} className="text-gray-600" />}
      </div>
      {isOpen && <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed">{answer}</div>}
    </div>
  );
};

export default Dashboard;