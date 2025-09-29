import React, { useEffect, useState, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient, AuthContext } from '@/App';
import { Users, Settings as SettingsIcon, Bell, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchUsers();
      fetchSettings();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings/webhook');
      setWebhookUrl(response.data.webhook_url || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiClient.post('/users/invite', {
        email: formData.get('email'),
        name: formData.get('name'),
        role: formData.get('role')
      });
      
      toast.success('User invited successfully');
      setShowInviteUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await apiClient.put(`/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.put(`/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleSaveWebhook = async () => {
    try {
      await apiClient.post('/settings/webhook', { webhook_url: webhookUrl });
      toast.success('Webhook configuration saved');
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook configuration');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contributor': return 'bg-green-100 text-green-800 border-green-200';
      case 'client': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="flex min-h-screen bg-[#fafafa]">
        <Sidebar />
        <div className="flex-1">
          <Header title="Settings" description="Access denied" />
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Settings" description="Manage system configuration and users" />
        
        <div className="p-8">
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="general" data-testid="tab-general">
                <SettingsIcon className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1f2937]">User Management</h2>
                <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                  <DialogTrigger asChild>
                    <Button data-testid="invite-user-btn" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">
                      <Users className="w-4 h-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New User</DialogTitle>
                      <DialogDescription>Send an invitation to a new user</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteUser}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="email">Email (@v4company.com)</Label>
                          <Input id="email" name="email" type="email" required placeholder="user@v4company.com" />
                        </div>
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" name="name" required placeholder="John Doe" />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select name="role" defaultValue="contributor">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="contributor">Contributor</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">Send Invitation</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-[#6b7280]">Loading users...</div>
                ) : users.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#fafafa] text-left text-xs font-semibold text-[#6b7280] uppercase">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Last Login</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {users.map((u, index) => (
                        <tr key={u.id} data-testid={`user-row-${index}`} className="hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#ff2c2c] flex items-center justify-center text-white font-semibold text-sm">
                                  {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-[#1f2937]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6b7280]">{u.email}</td>
                          <td className="px-4 py-3">
                            <Select 
                              value={u.role} 
                              onValueChange={(newRole) => handleUpdateUserRole(u.id, newRole)}
                              disabled={u.id === user.id}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6b7280]">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              disabled={u.id === user.id}
                              data-testid={`toggle-status-${index}`}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-[#e5e7eb] mx-auto mb-3" />
                    <p className="text-[#6b7280]">No users found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <h2 className="text-xl font-bold text-[#1f2937]">Notification Settings</h2>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] space-y-4">
                <div>
                  <Label htmlFor="webhook">Google Chat Webhook URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://chat.googleapis.com/v1/spaces/..."
                      className="flex-1"
                      data-testid="webhook-input"
                    />
                    <Button 
                      onClick={handleSaveWebhook}
                      data-testid="save-webhook-btn"
                      className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <p className="text-sm text-[#6b7280] mt-2">
                    Configure the Google Chat webhook to receive notifications for critical events
                  </p>
                </div>

                <div className="pt-4 border-t border-[#e5e7eb]">
                  <h3 className="font-semibold text-[#1f2937] mb-2">Events that trigger notifications:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#6b7280]">
                    <li>Critical password reveals (high criticality items)</li>
                    <li>JIT access requests</li>
                    <li>JIT access approvals/denials</li>
                    <li>Break-glass access (future)</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <h2 className="text-xl font-bold text-[#1f2937]">General Settings</h2>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb]">
                <h3 className="font-semibold text-[#1f2937] mb-4">System Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Version:</span>
                    <span className="font-medium text-[#1f2937]">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Database:</span>
                    <span className="font-medium text-[#1f2937]">MongoDB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Encryption:</span>
                    <span className="font-medium text-[#1f2937]">AES-256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">LGPD Compliant:</span>
                    <span className="font-medium text-green-600">✓ Yes</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
