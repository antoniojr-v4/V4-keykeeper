import React, { useEffect, useState, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient, AuthContext } from '@/App';
import { Clock, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const JITRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/jit/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching JIT requests:', error);
      toast.error('Failed to load JIT requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await apiClient.post(`/jit/${requestId}/approve`);
      toast.success('Request approved');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await apiClient.post(`/jit/${requestId}/deny`);
      toast.success('Request denied');
      fetchRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      toast.error(error.response?.data?.detail || 'Failed to deny request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canApprove = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="JIT Access Requests" description="Manage temporary access requests" />
        
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
            {loading ? (
              <div className="p-8 text-center text-[#6b7280]">Loading requests...</div>
            ) : requests.length > 0 ? (
              <div className="divide-y divide-[#e5e7eb]">
                {requests.map((request, index) => (
                  <div 
                    key={request.id} 
                    data-testid={`jit-request-${index}`}
                    className="p-6 hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-5 h-5 text-[#6b7280]" />
                          <div>
                            <p className="font-semibold text-[#1f2937]">
                              Access Request #{request.id.substring(0, 8)}
                            </p>
                            <p className="text-sm text-[#6b7280]">
                              Requested {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="ml-8 space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Duration</p>
                              <p className="text-sm text-[#1f2937] font-medium">{request.requested_duration_hours} hours</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Status</p>
                              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-[#9ca3af] uppercase">Reason</p>
                            <p className="text-sm text-[#1f2937] mt-1">{request.reason}</p>
                          </div>

                          {request.expires_at && (
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Expires At</p>
                              <p className="text-sm text-[#1f2937] mt-1">
                                {new Date(request.expires_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && canApprove && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            data-testid={`approve-jit-${index}`}
                            size="sm"
                            className="bg-[#10b981] hover:bg-[#059669] text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDeny(request.id)}
                            data-testid={`deny-jit-${index}`}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-[#e5e7eb] mx-auto mb-3" />
                <p className="text-[#6b7280]">No JIT requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JITRequests;
