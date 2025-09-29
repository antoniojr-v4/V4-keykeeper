import React, { useEffect, useState, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient, AuthContext } from '@/App';
import { FolderPlus, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, ChevronRight, Key, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const VaultExplorer = () => {
  const { user } = useContext(AuthContext);
  const [vaults, setVaults] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedVault, setSelectedVault] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterEnv, setFilterEnv] = useState('all');
  const [filterCrit, setFilterCrit] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [showJITRequest, setShowJITRequest] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [revealedPassword, setRevealedPassword] = useState(null);

  useEffect(() => {
    fetchVaults();
  }, []);

  useEffect(() => {
    if (selectedVault) {
      fetchItems();
    }
  }, [selectedVault, searchQuery, filterType, filterEnv, filterCrit]);

  const fetchVaults = async () => {
    try {
      const response = await apiClient.get('/vaults');
      setVaults(response.data);
    } catch (error) {
      console.error('Error fetching vaults:', error);
      toast.error('Failed to load vaults');
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVault) params.append('vault_id', selectedVault.id);
      if (searchQuery) params.append('search', searchQuery);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterEnv !== 'all') params.append('environment', filterEnv);
      if (filterCrit !== 'all') params.append('criticality', filterCrit);
      
      const response = await apiClient.get(`/items?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiClient.post('/vaults', {
        name: formData.get('name'),
        type: formData.get('type'),
        parent_id: selectedVault?.id || null,
        tags: {
          client: formData.get('client') || '',
          squad: formData.get('squad') || ''
        }
      });
      
      toast.success('Vault created successfully');
      setShowCreateVault(false);
      fetchVaults();
    } catch (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiClient.post('/items', {
        vault_id: selectedVault.id,
        type: formData.get('type'),
        title: formData.get('title'),
        login: formData.get('login'),
        password: formData.get('password'),
        login_url: formData.get('login_url'),
        environment: formData.get('environment'),
        criticality: formData.get('criticality'),
        tags: {
          client: formData.get('client') || '',
          squad: formData.get('squad') || ''
        },
        notes: formData.get('notes'),
        login_instructions: formData.get('login_instructions')
      });
      
      toast.success('Item created successfully');
      setShowCreateItem(false);
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item');
    }
  };

  const handleRevealPassword = async (itemId) => {
    try {
      const response = await apiClient.post(`/items/${itemId}/reveal`);
      setRevealedPassword(response.data.password);
      toast.success('Password revealed');
    } catch (error) {
      console.error('Error revealing password:', error);
      toast.error('Failed to reveal password');
    }
  };

  const handleCopyPassword = (password) => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await apiClient.delete(`/items/${itemId}`);
      toast.success('Item deleted successfully');
      fetchItems();
      setShowItemDetail(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleRequestJIT = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiClient.post('/jit/request', {
        item_id: selectedItem.id,
        vault_id: selectedItem.vault_id,
        reason: formData.get('reason'),
        requested_duration_hours: parseInt(formData.get('duration'))
      });
      
      toast.success('JIT access requested successfully');
      setShowJITRequest(false);
    } catch (error) {
      console.error('Error requesting JIT:', error);
      toast.error('Failed to request JIT access');
    }
  };

  const getCriticalityColor = (crit) => {
    switch (crit) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnvColor = (env) => {
    return env === 'prod' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header title="Vault Explorer" description="Manage your password vaults and items" />
        
        <div className="flex-1 flex">
          {/* Left Panel - Vaults Tree */}
          <div className="w-80 bg-white border-r border-[#e5e7eb] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1f2937]">Vaults</h3>
              <Dialog open={showCreateVault} onOpenChange={setShowCreateVault}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="create-vault-btn" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Vault</DialogTitle>
                    <DialogDescription>Create a new vault to organize your passwords</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateVault}>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Vault Name</Label>
                        <Input id="name" name="name" required placeholder="e.g., Client X" />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue="client">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="squad">Squad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="client">Client Tag</Label>
                        <Input id="client" name="client" placeholder="Optional" />
                      </div>
                      <div>
                        <Label htmlFor="squad">Squad Tag</Label>
                        <Input id="squad" name="squad" placeholder="Optional" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">Create Vault</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-1">
              {vaults.map((vault) => (
                <button
                  key={vault.id}
                  data-testid={`vault-item-${vault.id}`}
                  onClick={() => setSelectedVault(vault)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedVault?.id === vault.id
                      ? 'bg-[#ff2c2c] text-white'
                      : 'hover:bg-[#fafafa] text-[#1f2937]'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{vault.name}</span>
                </button>
              ))}
              
              {vaults.length === 0 && (
                <div className="text-center py-8 text-[#6b7280] text-sm">
                  <FolderPlus className="w-8 h-8 mx-auto mb-2 text-[#e5e7eb]" />
                  No vaults yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Items */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedVault ? (
              <>
                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-[#e5e7eb]">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                        <Input
                          data-testid="search-items-input"
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px]" data-testid="filter-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="web_credential">Web Credential</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="ad_token">Ad Token</SelectItem>
                        <SelectItem value="ssh_key">SSH Key</SelectItem>
                        <SelectItem value="db_credential">DB Credential</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterEnv} onValueChange={setFilterEnv}>
                      <SelectTrigger className="w-[150px]" data-testid="filter-env">
                        <SelectValue placeholder="Environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Environments</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                        <SelectItem value="stage">Staging</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterCrit} onValueChange={setFilterCrit}>
                      <SelectTrigger className="w-[150px]" data-testid="filter-criticality">
                        <SelectValue placeholder="Criticality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={showCreateItem} onOpenChange={setShowCreateItem}>
                      <DialogTrigger asChild>
                        <Button data-testid="create-item-btn" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          New Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Item</DialogTitle>
                          <DialogDescription>Add a new password or secret to {selectedVault.name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateItem}>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" required placeholder="e.g., Google Ads Account" />
                              </div>
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue="web_credential">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="web_credential">Web Credential</SelectItem>
                                    <SelectItem value="api_key">API Key</SelectItem>
                                    <SelectItem value="ad_token">Ad Token</SelectItem>
                                    <SelectItem value="ssh_key">SSH Key</SelectItem>
                                    <SelectItem value="db_credential">DB Credential</SelectItem>
                                    <SelectItem value="secure_note">Secure Note</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="login">Login/Username</Label>
                                <Input id="login" name="login" placeholder="username@example.com" />
                              </div>
                              <div>
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" placeholder="••••••••" />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="login_url">Login URL</Label>
                              <Input id="login_url" name="login_url" type="url" placeholder="https://example.com/login" />
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
                                <Label htmlFor="criticality">Criticality</Label>
                                <Select name="criticality" defaultValue="medium">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="client">Client Tag</Label>
                                <Input id="client" name="client" placeholder="Optional" />
                              </div>
                              <div>
                                <Label htmlFor="squad">Squad Tag</Label>
                                <Input id="squad" name="squad" placeholder="Optional" />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <textarea 
                                id="notes" 
                                name="notes" 
                                className="w-full min-h-[80px] px-3 py-2 border border-[#e5e7eb] rounded-lg"
                                placeholder="Additional notes (encrypted)"
                              />
                            </div>

                            <div>
                              <Label htmlFor="login_instructions">Login Instructions</Label>
                              <Input id="login_instructions" name="login_instructions" placeholder="e.g., Use VPN first" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">Create Item</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Items Grid */}
                {loading ? (
                  <div className="text-center py-12 text-[#6b7280]">Loading items...</div>
                ) : items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        data-testid={`item-card-${item.id}`}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowItemDetail(true);
                          setRevealedPassword(null);
                        }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:border-[#ff2c2c] hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-[#ff2c2c]/10 rounded-lg flex items-center justify-center">
                              <Key className="w-5 h-5 text-[#ff2c2c]" />
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Badge className={getCriticalityColor(item.criticality)}>{item.criticality}</Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-[#1f2937] mb-1 truncate">{item.title}</h3>
                        <p className="text-xs text-[#6b7280] mb-2 truncate">{item.login || 'No login'}</p>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getEnvColor(item.environment)}>{item.environment}</Badge>
                          <Badge variant="outline" className="text-xs">{item.type.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="w-16 h-16 text-[#e5e7eb] mx-auto mb-4" />
                    <p className="text-[#6b7280] mb-4">No items in this vault yet</p>
                    <Button 
                      onClick={() => setShowCreateItem(true)}
                      className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Item
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FolderPlus className="w-16 h-16 text-[#e5e7eb] mx-auto mb-4" />
                  <p className="text-[#6b7280]">Select a vault to view its items</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={showItemDetail} onOpenChange={setShowItemDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>Item details and password reveal</DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="text-sm text-[#6b7280] mt-1">{selectedItem.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label>Login/Username</Label>
                  <p className="text-sm text-[#6b7280] mt-1">{selectedItem.login || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label>Login URL</Label>
                {selectedItem.login_url ? (
                  <a 
                    href={selectedItem.login_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[#ff2c2c] hover:underline mt-1 block"
                  >
                    {selectedItem.login_url}
                  </a>
                ) : (
                  <p className="text-sm text-[#6b7280] mt-1">N/A</p>
                )}
              </div>

              <div>
                <Label>Password</Label>
                <div className="flex gap-2 mt-1">
                  {revealedPassword ? (
                    <>
                      <Input value={revealedPassword} readOnly className="flex-1" />
                      <Button 
                        onClick={() => handleCopyPassword(revealedPassword)}
                        data-testid="copy-password-btn"
                        variant="outline"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => setRevealedPassword(null)}
                        variant="outline"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleRevealPassword(selectedItem.id)}
                      data-testid="reveal-password-btn"
                      className="bg-[#ff2c2c] hover:bg-[#e61919] text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Reveal Password
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Environment</Label>
                  <Badge className={`${getEnvColor(selectedItem.environment)} mt-1`}>{selectedItem.environment}</Badge>
                </div>
                <div>
                  <Label>Criticality</Label>
                  <Badge className={`${getCriticalityColor(selectedItem.criticality)} mt-1`}>{selectedItem.criticality}</Badge>
                </div>
              </div>

              {selectedItem.login_instructions && (
                <div>
                  <Label>Login Instructions</Label>
                  <p className="text-sm text-[#6b7280] mt-1">{selectedItem.login_instructions}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[#e5e7eb] flex justify-between gap-2">
                <Button 
                  onClick={() => setShowJITRequest(true)}
                  data-testid="request-jit-btn"
                  variant="outline"
                  className="border-[#ff2c2c] text-[#ff2c2c] hover:bg-[#ff2c2c] hover:text-white"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Request Temporary Access
                </Button>
                <Button 
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  data-testid="delete-item-btn"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* JIT Request Modal */}
      <Dialog open={showJITRequest} onOpenChange={setShowJITRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Temporary Access</DialogTitle>
            <DialogDescription>Request time-limited access to this item</DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <form onSubmit={handleRequestJIT}>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Item</Label>
                  <p className="text-sm text-[#6b7280] mt-1">{selectedItem.title}</p>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Select name="duration" defaultValue="2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Access</Label>
                  <textarea 
                    id="reason" 
                    name="reason" 
                    required
                    className="w-full min-h-[80px] px-3 py-2 border border-[#e5e7eb] rounded-lg mt-1"
                    placeholder="Explain why you need temporary access..."
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="bg-[#ff2c2c] hover:bg-[#e61919] text-white">
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultExplorer;
