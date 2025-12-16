import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

const Signup = () => {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Setelah signup, arahkan ke Login agar user memasukkan kredensial
    navigate('/login'); 
  };

  return (
    <Layout showNavbar={false}>
      <div className="w-full max-w-md mt-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-2">Daftar Akun Baru</h1>
          <p className="text-gray-400">Buat akun Anda untuk memulai.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Email / Nomor Telepon" 
              className="w-full bg-dark-800 border border-transparent focus:border-blue-500 text-white rounded-lg px-4 py-3 outline-none transition placeholder-gray-500"
            />
          </div>
          
          <div>
            <input 
              type="text" 
              placeholder="Nama Lengkap" 
              className="w-full bg-dark-800 border border-transparent focus:border-blue-500 text-white rounded-lg px-4 py-3 outline-none transition placeholder-gray-500"
            />
          </div>

          <div>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-dark-800 border border-transparent focus:border-blue-500 text-white rounded-lg px-4 py-3 outline-none transition placeholder-gray-500"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-black font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition mt-6"
          >
            Daftar Sekarang
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 flex justify-center items-center text-sm">
          <div className="text-gray-500">
            Sudah punya akun? <Link to="/login" className="text-white font-medium hover:underline ml-1">Login</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;