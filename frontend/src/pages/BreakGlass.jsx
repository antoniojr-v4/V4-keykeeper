import React, { useEffect, useState, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient, AuthContext } from '@/App';
import { AlertTriangle, Check, X, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BreakGlass = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/breakglass/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching break-glass requests:', error);
      toast.error('Failed to load break-glass requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await apiClient.post(`/breakglass/${requestId}/approve`);
      toast.success(response.data.message);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'denied': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canApprove = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Break-Glass Requests" description="Emergency access requests requiring dual approval" />
        
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Break-Glass Protocol</h3>
                <p className="text-sm text-red-700">
                  Emergency access requests require approval from TWO different admins/managers. All break-glass accesses are logged and generate critical alerts.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
            {loading ? (
              <div className="p-8 text-center text-[#6b7280]">Loading requests...</div>
            ) : requests.length > 0 ? (
              <div className="divide-y divide-[#e5e7eb]">
                {requests.map((request, index) => (
                  <div 
                    key={request.id} 
                    data-testid={`breakglass-request-${index}`}
                    className="p-6 hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Shield className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-[#1f2937]">
                              Break-Glass Request #{request.id.substring(0, 8)}
                            </p>
                            <p className="text-sm text-[#6b7280]">
                              Requested {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="ml-8 space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Status</p>
                              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Approvals</p>
                              <p className="text-sm text-[#1f2937] font-medium">
                                {request.approver1_id ? '1' : '0'} / 2
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-[#9ca3af] uppercase">Reason</p>
                            <p className="text-sm text-[#1f2937] mt-1">{request.reason}</p>
                          </div>

                          {request.approver1_id && (
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Approver 1</p>
                              <p className="text-sm text-green-600 mt-1">✓ Approved</p>
                            </div>
                          )}

                          {request.approver2_id && (
                            <div>
                              <p className="text-xs text-[#9ca3af] uppercase">Approver 2</p>
                              <p className="text-sm text-green-600 mt-1">✓ Approved</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && canApprove && (
                        <div className="ml-4">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            data-testid={`approve-breakglass-${index}`}
                            size="sm"
                            className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-[#e5e7eb] mx-auto mb-3" />
                <p className="text-[#6b7280]">No break-glass requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakGlass;
