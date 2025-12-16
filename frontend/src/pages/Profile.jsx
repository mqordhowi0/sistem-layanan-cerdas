import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { LogOut, Save, X, Edit3 } from 'lucide-react';
import api from '../lib/axios'; 
import { ButtonSpinner } from '../components/ui/Loading';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [bio, setBio] = useState('');

  useEffect(() => {
      if (user) setBio(user.bio || '');
  }, [user]);
  
  const handleLogout = async () => {
      if (window.confirm("Yakin ingin logout?")) {
          await logout();
          navigate('/');
      }
  }

  const handleSave = async () => {
      setLoading(true);
      setStatusMessage(null);
      
      try {
          await api.post('/operator/profile-update', { bio: bio });
          setStatusMessage({ type: 'success', text: 'Bio berhasil diperbarui.' });
          setIsEditing(false);
      } catch (error) {
          console.error("Update gagal:", error);
          setStatusMessage({ type: 'error', text: 'Gagal menyimpan bio.' });
      } finally {
          setLoading(false);
      }
  }

  return (
    // PERBAIKAN: Gunakan flex container penuh untuk sentralisasi
    <div className="w-full h-full min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
          
          {/* Header Profil */}
          <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/30 text-3xl font-bold text-white shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                  <h1 className="text-2xl md:text-3xl font-bold text-white truncate">{user?.name || 'Nama Pengguna'}</h1>
                  <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Member Active
                  </p>
              </div>
          </div>

          {statusMessage && (
              <div className={`p-4 mb-6 rounded-xl text-sm border font-medium flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {statusMessage.text}
              </div>
          )}
          
          <div className="space-y-8">
            
            {/* Bagian Bio */}
            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">About Me</label>
                  {!isEditing && (
                      <button onClick={() => setIsEditing(true)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition bg-blue-500/10 px-3 py-1 rounded-full">
                          <Edit3 size={12} /> Edit Bio
                      </button>
                  )}
               </div>
               
               <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Belum ada bio. Ceritakan sedikit tentang diri Anda..."
                  className={`w-full min-h-[150px] p-4 rounded-xl outline-none resize-none transition duration-200 text-base leading-relaxed
                    ${isEditing 
                      ? 'bg-dark-800 text-white border border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 shadow-inner' 
                      : 'bg-white/5 text-gray-300 border border-white/5 cursor-default'
                    }`}
               />
            </div>

            {/* Tombol Aksi */}
            <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
              {isEditing ? (
                  <>
                    <button 
                      onClick={() => { setIsEditing(false); setBio(user?.bio || ''); }}
                      disabled={loading}
                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition text-sm font-medium flex items-center gap-2"
                    >
                      <X size={18} /> Cancel
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                      {loading ? <><ButtonSpinner /> Saving...</> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </>
              ) : (
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl transition text-sm font-medium flex items-center gap-2"
                  >
                    <LogOut size={18} /> Log Out
                  </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;