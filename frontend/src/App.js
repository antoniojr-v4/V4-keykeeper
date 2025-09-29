import React, { useState, useEffect, createContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import VaultExplorer from "@/pages/VaultExplorer";
import AuditLogs from "@/pages/AuditLogs";
import JITRequests from "@/pages/JITRequests";
import ImportPage from "@/pages/ImportPage";
import Settings from "@/pages/Settings";
import BreakGlass from "@/pages/BreakGlass";
import ClientSubmit from "@/pages/ClientSubmit";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthContext = createContext(null);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-v4-background">
        <div className="text-v4-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, logout, setUser }}>
      <div className="App">
        <Toaster position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/vaults" element={token ? <VaultExplorer /> : <Navigate to="/login" />} />
            <Route path="/audit" element={token ? <AuditLogs /> : <Navigate to="/login" />} />
            <Route path="/jit" element={token ? <JITRequests /> : <Navigate to="/login" />} />
            <Route path="/import" element={token ? <ImportPage /> : <Navigate to="/login" />} />
            <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/breakglass" element={token ? <BreakGlass /> : <Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;