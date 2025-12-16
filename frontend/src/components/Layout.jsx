import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, User, LogIn, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import echo from '../lib/echo';

const Layout = ({ children, showNavbar = true }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State untuk Notifikasi Admin
  const [pendingCount, setPendingCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- LOGIKA NOTIFIKASI GLOBAL (HANYA ADMIN) ---
  useEffect(() => {
    if (user?.role === 'admin') {
      // 1. Fetch awal jumlah pending
      api.get('/operator/pending-chats')
         .then(res => setPendingCount(res.data.length))
         .catch(err => console.error(err));

      // 2. Listen Realtime
      const channel = echo.private('operator-dashboard');
      channel.listen('.ChatSessionQueued', (e) => {
          // Tambah counter saat ada request baru
          setPendingCount(prev => prev + 1);
          // Opsional: Mainkan suara notifikasi
          // new Audio('/notification.mp3').play().catch(()=>{});
      });

      return () => echo.leave('operator-dashboard');
    }
  }, [user]);

  const handleLogout = async () => {
      await logout();
      navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans flex flex-col">
      {showNavbar && (
        <nav className="border-b border-white/10 bg-dark-800/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo / Brand */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white">AI</span>
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block">Layanan<span className="text-blue-500">Cerdas</span></span>
              </Link>

              {/* Right Side Icons */}
              <div className="flex items-center gap-6">
                
                {/* --- FITUR BARU: LONCENG NOTIFIKASI (ADMIN ONLY) --- */}
                {isLoggedIn && user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="relative p-2 text-gray-400 hover:text-white transition">
                        <Bell size={20} />
                        {pendingCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </Link>
                )}

                {/* User Profile / Login Button */}
                {!isLoggedIn ? (
                  <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10">
                    <LogIn size={16} /> Login
                  </Link>
                ) : (
                  <div className="relative">
                    {/* Trigger Dropdown */}
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 bg-black/20 hover:bg-black/40 border border-white/10 pl-2 pr-4 py-1.5 rounded-full transition"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-xs text-gray-400">Welcome,</p>
                            <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-500 ml-1" />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                            {user?.role === 'admin' ? (
                                <Link to="/admin/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
                                    <Home size={16} /> Dashboard
                                </Link>
                            ) : (
                                <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
                                    <User size={16} /> My Profile
                                </Link>
                            )}
                            
                            <div className="border-t border-white/10 my-1"></div>
                            
                            <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition">
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full">
        {children}
      </main>
      
      {/* Footer Simple */}
      <footer className="border-t border-white/5 py-8 mt-auto bg-black/20">
         <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Sistem Layanan Cerdas. All rights reserved.
         </div>
      </footer>
    </div>
  );
};

export default Layout;