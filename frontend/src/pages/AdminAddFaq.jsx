import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { ArrowLeft, Save, CheckCircle, FileQuestion, Edit } from 'lucide-react';
// IMPOR PageLoader & ButtonSpinner
import { PageLoader, ButtonSpinner } from '../components/ui/Loading';

const AdminAddFaq = ({ mode = 'create' }) => {
  const { candidateId, faqId } = useParams(); 
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode !== 'create');

  useEffect(() => {
    const loadData = async () => {
        try {
            if (mode === 'approve' && candidateId) {
                const response = await api.get('/operator/faq-candidates');
                const item = response.data.find(c => c.id == candidateId);
                if (item) setQuestion(item.question_text);
            } else if (mode === 'edit' && faqId) {
                const response = await api.get('/faqs');
                const item = response.data.find(f => f.id == faqId);
                if (item) { setQuestion(item.question); setAnswer(item.answer); }
            }
        } catch (err) { } finally { setFetching(false); }
    };
    loadData();
  }, [mode, candidateId, faqId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (mode === 'approve') await api.post(`/operator/faq-approve/${candidateId}`, { answer });
        else if (mode === 'edit') await api.put(`/operator/faq/${faqId}`, { question, answer });
        else await api.post('/operator/faq-create', { question, answer });
        navigate('/admin/dashboard');
    } catch (err) { alert("Gagal menyimpan."); } finally { setLoading(false); }
  };

  // IMPLEMENTASI PageLoader
  if (fetching) return <PageLoader text="Memuat Data..." />;

  return (
    // FULL WIDTH CONTAINER
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-dark-900 text-white px-6 py-8">
        
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                {mode === 'approve' ? <CheckCircle className="text-green-500" /> : mode === 'edit' ? <Edit className="text-yellow-500" /> : <FileQuestion className="text-blue-500" />}
                {mode === 'approve' ? 'Moderasi FAQ' : mode === 'edit' ? 'Edit FAQ' : 'Tambah FAQ'}
            </h1>
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition">
                <ArrowLeft size={18} /> Kembali
            </Link>
        </div>

        {/* FORM FULL WIDTH */}
        <div className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-full gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Pertanyaan</label>
                    <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={mode === 'approve' || loading} className="w-full bg-dark-800 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition text-lg" required />
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Jawaban Resmi</label>
                    <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={loading} className="w-full flex-1 min-h-[300px] bg-dark-800 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none resize-none text-base leading-relaxed" placeholder="Tulis jawaban..." required></textarea>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading || !answer.trim()} className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-8 rounded-xl font-bold transition shadow-lg flex items-center gap-2">
                        {/* IMPLEMENTASI ButtonSpinner */}
                        {loading ? <ButtonSpinner /> : <Save size={20} />} Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AdminAddFaq;