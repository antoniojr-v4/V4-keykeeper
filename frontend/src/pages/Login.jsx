import React, { useState } from 'react';
import { FolderLock, Shield, Lock, Clock } from 'lucide-react';
import { API } from '@/App';
import axios from 'axios';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/google/login`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_keykeeper-9/artifacts/0r1wv7ei_image.png" 
              alt="V4 Logo" 
              className="w-16 h-16"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#1f2937]">V4 KeyKeeper</h1>
              <p className="text-[#6b7280]">Enterprise Password Manager</p>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1f2937] mb-1">LGPD Compliant</h3>
                <p className="text-sm text-[#6b7280]">Full audit trail and data residency in Brazil with AES-256 encryption</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1f2937] mb-1">Zero-Knowledge Security</h3>
                <p className="text-sm text-[#6b7280]">Client-side encryption ensures your secrets remain private</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1f2937] mb-1">JIT Access Control</h3>
                <p className="text-sm text-[#6b7280]">Temporary access with approval workflow and auto-expiration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Welcome back</h2>
            <p className="text-[#6b7280]">Sign in with your V4 Company Google account</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            data-testid="google-login-btn"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="text-xs text-[#9ca3af] text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy. Only @v4company.com accounts are authorized.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
