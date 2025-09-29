import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientSubmit = () => {
  const { token } = useParams();
  const [vaultInfo, setVaultInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVaultInfo();
  }, [token]);

  const fetchVaultInfo = async () => {
    try {
      const response = await axios.get(`${API}/vaults/by-token/${token}`);
      setVaultInfo(response.data);
    } catch (error) {
      setError('Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await axios.post(`${API}/vaults/client-submit/${token}/item`, {
        vault_id: vaultInfo.vault_id,
        type: formData.get('type'),
        title: formData.get('title'),
        login: formData.get('login'),
        password: formData.get('password'),
        login_url: formData.get('login_url'),
        environment: formData.get('environment'),
        criticality: 'medium',
        tags: {
          client: vaultInfo.client_name,
          squad: formData.get('squad') || ''
        },
        notes: formData.get('notes'),
        no_copy: false,
        requires_checkout: false
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[#6b7280]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-lg text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">Link Invalid</h1>
          <p className="text-[#6b7280]">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">Successfully Submitted!</h1>
          <p className="text-[#6b7280] mb-6">
            Your credentials have been securely stored. You can close this page now.
          </p>
          <Button 
            onClick={() => setSubmitted(false)}
            className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
          >
            Submit Another Credential
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_keykeeper-9/artifacts/vspn4e79_Canecas.png" 
            alt="V4 Logo" 
            className="w-12 h-12"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937]">V4 KeyKeeper</h1>
            <p className="text-sm text-[#6b7280]">Secure Credential Submission</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Client:</strong> {vaultInfo.client_name}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Please submit your credentials securely. Your information will be encrypted and stored safely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Credential Title *</Label>
              <Input 
                id="title" 
                name="title" 
                required 
                placeholder="e.g., Google Ads Account"
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue="web_credential" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_credential">Web Credential</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="ad_token">Ad Token</SelectItem>
                  <SelectItem value="social_login">Social Login</SelectItem>
                  <SelectItem value="secure_note">Secure Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="login">Username/Email</Label>
              <Input 
                id="login" 
                name="login" 
                placeholder="username@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="login_url">Login URL</Label>
            <Input 
              id="login_url" 
              name="login_url" 
              type="url" 
              placeholder="https://example.com/login"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select name="environment" defaultValue="prod">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod">Production</SelectItem>
                  <SelectItem value="stage">Staging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="squad">Squad/Team</Label>
              <Input 
                id="squad" 
                name="squad" 
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea 
              id="notes" 
              name="notes" 
              className="w-full min-h-[80px] px-3 py-2 border border-[#e5e7eb] rounded-lg"
              placeholder="Any additional information (optional)"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-[#ff2c2c] hover:bg-[#e61919] text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Submit Securely
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#e5e7eb] text-center text-xs text-[#9ca3af]">
          <p>🔒 Your credentials are encrypted with AES-256 encryption</p>
          <p className="mt-1">V4 Company © 2025 - LGPD Compliant</p>
        </div>
      </div>
    </div>
  );
};

export default ClientSubmit;
