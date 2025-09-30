import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, apiClient } from '@/App';
import { Bell, ChevronDown, User, Settings, LogOut, Clock, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header = ({ title, description }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const getNotificationIcon = (type) => {
    if (type === 'breakglass') return '🚨';
    if (type === 'jit_request') return '⏰';
    if (type === 'expiring') return '⚠️';
    return '🔔';
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white border-b border-[#e5e7eb] px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-[#1f2937]">{title}</h1>
          {description && (
            <p className="text-sm text-[#6b7280] mt-1">{description}</p>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button 
            className="relative p-2 hover:bg-[#fafafa] rounded-full transition-colors"
            data-testid="notifications-btn"
          >
            <Bell className="w-5 h-5 text-[#6b7280]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#fafafa] rounded-lg cursor-pointer transition-colors" data-testid="user-profile">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#ff2c2c] flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-[#1f2937]">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#6b7280] capitalize">{user?.role || 'contributor'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#6b7280]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[#1f2937]">{user?.name}</p>
                <p className="text-xs text-[#6b7280]">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')}
                    data-testid="menu-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={logout}
                data-testid="menu-logout"
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;