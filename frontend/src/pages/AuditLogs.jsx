import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient } from '@/App';
import { History, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter !== 'all') params.append('event_type', eventTypeFilter);
      
      const response = await apiClient.get(`/audit/logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadgeColor = (eventType) => {
    if (eventType.includes('created')) return 'bg-green-100 text-green-800';
    if (eventType.includes('deleted')) return 'bg-red-100 text-red-800';
    if (eventType.includes('revealed')) return 'bg-yellow-100 text-yellow-800';
    if (eventType.includes('jit')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Audit Logs" description="Complete audit trail of all system activities" />
        
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <div className="flex gap-4">
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="filter-event-type">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="item_created">Item Created</SelectItem>
                    <SelectItem value="item_revealed">Item Revealed</SelectItem>
                    <SelectItem value="item_deleted">Item Deleted</SelectItem>
                    <SelectItem value="vault_created">Vault Created</SelectItem>
                    <SelectItem value="jit_requested">JIT Requested</SelectItem>
                    <SelectItem value="jit_approved">JIT Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-[#6b7280]">Loading logs...</div>
              ) : logs.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-[#fafafa] text-left text-xs font-semibold text-[#6b7280] uppercase">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Vault</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {logs.map((log, index) => (
                      <tr 
                        key={log.id} 
                        data-testid={`audit-log-row-${index}`}
                        className="hover:bg-[#fafafa] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-[#6b7280]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getEventBadgeColor(log.event_type)}>
                            {log.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1f2937]">{log.user_email}</td>
                        <td className="px-4 py-3 text-sm text-[#6b7280]">
                          {log.details?.vault_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6b7280]">
                          {log.details?.item_title || log.details?.title || log.details?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6b7280]">{log.ip_address || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-[#e5e7eb] mx-auto mb-3" />
                  <p className="text-[#6b7280]">No audit logs found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
