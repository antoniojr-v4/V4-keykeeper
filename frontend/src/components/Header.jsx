import React, { useContext } from 'react';
import { AuthContext } from '@/App';
import { Bell, ChevronDown } from 'lucide-react';

const Header = ({ title, description }) => {
  const { user } = useContext(AuthContext);

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

          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#fafafa] rounded-lg cursor-pointer transition-colors" data-testid="user-profile">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-[#1f2937]">{user?.name || 'User'}</p>
              <p className="text-xs text-[#6b7280] capitalize">{user?.role || 'contributor'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6b7280]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;