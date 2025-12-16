import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Faq from './pages/Faq';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddFaq from './pages/AdminAddFaq';
import ChatAdmin from './pages/ChatAdmin'; 

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="text-white text-center p-20">Memuat...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children ? children : <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard Biasa (Punya Container) */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        
        {/* Chat User: Full Width (Custom Layout di dalam Chat.jsx) */}
        <Route path="/chat" element={<Chat />} />
        
        {/* FAQ User: Punya Container */}
        <Route path="/faq" element={<Layout><Faq /></Layout>} />

        <Route element={<ProtectedRoute />}>
           <Route path="/profile" element={<Layout><Profile /></Layout>} />
           
           <Route path="/admin">
              {/* Admin Dashboard: Punya Container */}
              <Route path="dashboard" element={<Layout username="Admin"><AdminDashboard /></Layout>} />
              
              {/* --- ADMIN CHAT: FULL WIDTH --- */}
              <Route path="chat/:sessionId" element={<Layout fullWidth={true} username="Admin"><ChatAdmin /></Layout>} /> 
              
              {/* --- ADMIN ADD FAQ: FULL WIDTH --- */}
              <Route path="faq-add" element={<Layout fullWidth={true} username="Admin"><AdminAddFaq /></Layout>} />
              <Route path="faq-approve/:candidateId" element={<Layout fullWidth={true} username="Admin"><AdminAddFaq mode="approve" /></Layout>} />
              <Route path="faq-edit/:faqId" element={<Layout fullWidth={true} username="Admin"><AdminAddFaq mode="edit" /></Layout>} />
           </Route>
        </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
       <BrowserRouter>
          <AppRoutes />
       </BrowserRouter>
    </AuthProvider>
  );
}

export default App;