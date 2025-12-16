import axios from 'axios';

const api = axios.create({
    // Pastikan ini mengarah ke port backend Laravel kamu
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    // PERBAIKAN: Gunakan 'token' (sesuai AuthContext), bukan 'operator_token'
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;