import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Lock, Ghost } from 'lucide-react'; 
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
// IMPOR ButtonSpinner
import { ButtonSpinner } from '../components/ui/Loading';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth(); // Ambil status login & data user
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. PERBAIKAN: Redirect Otomatis jika Sudah Login ---
  useEffect(() => {
    if (isLoggedIn && user) {
      // Jika Admin -> Ke Dashboard Admin
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Jika User -> Ke Home
        navigate('/');
      }
    }
  }, [isLoggedIn, user, navigate]);

  // --- 2. Handler Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        // Fungsi login di AuthContext me-return data user
        const loggedInUser = await login(email, password); 
        
        // Redirect sesuai role (redundansi aman selain useEffect)
        if (loggedInUser.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            navigate('/'); 
        }

    } catch (err) {
        const errorMsg = err.response?.data?.message || 'Login gagal. Cek email/password.';
        setError(errorMsg);
    } finally {
        setLoading(false);
    }
  };

  // --- 3. PERBAIKAN: Handler Tamu (Bersihkan Sisa User Lama) ---
  const handleGuestAccess = () => {
    // PENTING: Hapus semua data user sebelumnya agar tidak "nyangkut"
    localStorage.clear(); 
    
    // Set data tamu baru
    const guestId = 'guest-' + Math.floor(Math.random() * 1000000);
    localStorage.setItem('user_id', guestId);
    localStorage.setItem('user_role', 'guest');
    
    // Reload halaman atau redirect paksa agar state AuthContext ter-reset
    // Kita pakai navigate, tapi AuthContext akan mendeteksi tidak ada token
    navigate('/');
    // Opsi lain: window.location.href = '/'; (lebih brutal tapi pasti bersih)
  };

  return (
    // --- PERBAIKAN: showNavbar={false} agar tombol login navbar HILANG ---
    <Layout showNavbar={false}>
      <div className="flex flex-col items-center justify-center w-full flex-grow min-h-[calc(100vh-200px)]">
        
        <div className="w-full max-w-md bg-black/40 p-8 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Login untuk mengakses akun Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-dark-800 border border-white/10 text-white rounded-xl px-4 py-3.5 pl-11 focus:border-blue-500 outline-none transition placeholder-gray-600 focus:bg-dark-900" 
                    required 
                  />
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
            </div>
            <div>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-dark-800 border border-white/10 text-white rounded-xl px-4 py-3.5 pl-11 focus:border-blue-500 outline-none transition placeholder-gray-600 focus:bg-dark-900" 
                    required 
                  />
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
            </div>

            {error && <p className="text-red-400 text-center text-sm bg-red-900/20 p-2 rounded">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-70"
            >
              {/* IMPLEMENTASI ButtonSpinner */}
              {loading ? <><ButtonSpinner /> Memproses...</> : <>Masuk Akun <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs mb-4 uppercase tracking-wider">Belum punya akun?</p>
              <button 
                  onClick={handleGuestAccess} 
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition border border-white/10"
              >
                  <Ghost size={18} /> Lanjut sebagai Tamu
              </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;