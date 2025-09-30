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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="relative p-2 hover:bg-[#fafafa] rounded-full transition-colors"
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5 text-[#6b7280]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#ef4444] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
              <div className="px-3 py-2 border-b">
                <p className="font-semibold text-[#1f2937]">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-[#6b7280]">{unreadCount} new</p>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Bell className="w-8 h-8 text-[#d1d5db] mx-auto mb-2" />
                  <p className="text-sm text-[#6b7280]">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => navigate(notif.link)}
                    className="px-3 py-3 cursor-pointer hover:bg-[#fafafa] focus:bg-[#fafafa] border-b last:border-b-0"
                  >
                    <div className="flex gap-3 w-full">
                      <div className="text-xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1f2937] mb-1">{notif.title}</p>
                        <p className="text-xs text-[#6b7280] line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-[#9ca3af] mt-1">{formatTimestamp(notif.timestamp)}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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