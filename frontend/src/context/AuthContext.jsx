import React, { createContext, useState, useContext } from 'react';
import api from '../lib/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user_data');
        return saved ? JSON.parse(saved) : null;
    });
    
    const isLoggedIn = !!token;
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await api.post('/login', { email, password });
            const { token, user } = response.data;

            // Simpan Data Penting
            localStorage.setItem('token', token);
            localStorage.setItem('user_data', JSON.stringify(user));
            localStorage.setItem('user_role', user.role); // <--- PENTING UNTUK ROUTING
            localStorage.setItem('user_name', user.name);

            setToken(token);
            setUser(user);

            return user; // Return user object agar bisa dicek di Login.jsx
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try { if (token) await api.post('/operator/logout'); } catch (e) {}
        localStorage.clear();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);