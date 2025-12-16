import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios'; // Kita pakai axios langsung untuk authorizer

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    
    // --- PERBAIKAN: GUNAKAN CUSTOM AUTHORIZER ---
    // Ini memastikan token diambil TERBARU dari localStorage setiap kali connect.
    // Bukan diambil sekali saat halaman dimuat.
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                // Ambil token langsung dari localStorage saat ini juga
                const token = localStorage.getItem('token'); 
                
                axios.post('http://localhost:8000/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                }, {
                    headers: {
                        // Jika ada token kirim, jika tidak biarkan kosong (untuk guest)
                        Authorization: token ? `Bearer ${token}` : undefined
                    }
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    callback(true, error);
                });
            }
        };
    },
});

export default echo;