import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/App';
import { Eye, EyeOff, Copy, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ViewSecret = () => {
  const { token } = useParams();
  const [secret, setSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchSecret();
  }, [token]);

  // Countdown timer - only starts when secret is loaded
  useEffect(() => {
    if (!secret || error || loading) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Don't auto-close, just show message
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secret, error, loading]);

  const fetchSecret = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/view-secret/${token}`);
      setSecret(response.data);
      setViewed(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Secret not found or already viewed');
      } else if (err.response?.status === 410) {
        setError(err.response.data.detail || 'This secret has expired or been viewed');
      } else {
        setError('Failed to load secret');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, isPassword = false) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    if (isPassword) {
      setPasswordCopied(true);
      toast.success('Password copied! Window will close in 3 seconds...', { duration: 3000 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff2c2c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading secret...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">Unable to Access Secret</h1>
          <p className="text-[#6b7280] mb-6">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> One-time secrets can only be viewed once. If you've already viewed this secret, it has been permanently deleted for security.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#ff2c2c]/10 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#ff2c2c]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2937]">Secure Secret View</h1>
              <p className="text-sm text-[#6b7280]">One-time access only</p>
            </div>
          </div>
          
          {/* Countdown Timer */}
          {!passwordCopied && (
            <div className="text-center">
              <div className={`text-3xl font-bold ${countdown <= 10 ? 'text-red-600' : 'text-[#ff2c2c]'}`}>
                {countdown}s
              </div>
              <p className="text-xs text-[#6b7280]">Auto-close</p>
            </div>
          )}
          
          {passwordCopied && (
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                ✓ Copied
              </div>
              <p className="text-xs text-[#6b7280]">Closing...</p>
            </div>
          )}
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              ⚠️ This secret has been viewed and permanently deleted
            </p>
            <p className="text-xs text-red-700">
              {passwordCopied 
                ? 'Password copied! Window will close in 3 seconds...'
                : `Save the information now. Window auto-closes in ${countdown} seconds.`
              }
            </p>
          </div>
        </div>

        {/* Secret Details */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Title</label>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3">
              <p className="text-[#1f2937] font-medium">{secret?.title}</p>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Type</label>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3">
              <p className="text-[#6b7280] text-sm">{secret?.type?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          {/* Login */}
          {secret?.login && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Login / Username</label>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex items-center justify-between">
                <p className="text-[#1f2937]">{secret.login}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(secret.login)}
                  className="hover:bg-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Password */}
          {secret?.password && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Password
                {passwordCopied && <span className="ml-2 text-green-600 text-xs">✓ Copied</span>}
              </label>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex items-center justify-between gap-2">
                <p className="text-[#1f2937] font-mono flex-1">
                  {showPassword ? secret.password : '••••••••••••'}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:bg-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(secret.password, true)}
                    className={`hover:bg-white ${passwordCopied ? 'bg-green-50 text-green-600' : ''}`}
                    disabled={passwordCopied}
                  >
                    {passwordCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* URL */}
          {secret?.login_url && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">URL</label>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex items-center justify-between">
                <a 
                  href={secret.login_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#ff2c2c] hover:underline truncate"
                >
                  {secret.login_url}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(secret.login_url)}
                  className="hover:bg-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {secret?.notes && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Notes</label>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3">
                <p className="text-[#6b7280] text-sm whitespace-pre-wrap">{secret.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Secret viewed successfully</p>
            </div>
            
            {passwordCopied && (
              <Button
                onClick={() => window.close()}
                className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
              >
                Close Window
              </Button>
            )}
          </div>
          <p className="text-xs text-[#9ca3af]">
            This secret has been permanently deleted from our servers for security.
            {countdown === 0 && !passwordCopied && (
              <span className="block mt-2 text-[#ff2c2c] font-medium">
                ⚠️ Timer expired. Please close this window manually.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewSecret;
