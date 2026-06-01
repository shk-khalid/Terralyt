import * as React from "react";
import { Bell, Sparkles } from "lucide-react";
import { useESGStore } from "@/store/esgStore";
import { useAuth } from "@/context/AuthContext";

export const Navbar: React.FC = () => {
  const { notifications, markNotificationRead, clearNotifications } = useESGStore();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-20 h-16 w-full bg-esg-clay/85 backdrop-blur-md border-b border-esg-moss/50 flex items-center justify-between px-6 shadow-sm">
      {/* Portal Name & Status Indicators */}
      <div className="flex items-center space-x-4">
        <h1 className="text-md font-bold text-esg-dark hidden md:block">
          Operations Hub
        </h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-esg-sage text-esg-dark">
          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
          EPA standard v2026.1
        </span>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center space-x-4">

        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-esg-muted hover:text-esg-dark hover:bg-esg-moss/50 transition-colors focus-ring"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-esg-sand text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-esg-ivory border border-esg-moss/70 shadow-xl overflow-hidden z-50">
              <div className="p-4 bg-esg-clay border-b border-esg-moss/50 flex items-center justify-between">
                <span className="font-semibold text-sm text-esg-dark">System Alerts</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] font-medium text-esg-muted hover:text-esg-dark transition-colors"
                  >
                    Clear unread
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-esg-moss/30">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-esg-muted">
                    No recent warnings or uploads.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-esg-moss/20 ${
                        !n.read ? "bg-esg-moss/30 font-medium" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-xs ${
                          n.type === 'error' ? 'text-red-700' : n.type === 'warning' ? 'text-esg-sand' : 'text-esg-dark'
                        }`}>
                          {n.title}
                        </span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-esg-sand mt-1" />}
                      </div>
                      <p className="text-[10px] text-esg-muted mt-1 leading-normal">{n.description}</p>
                      <span className="text-[8px] text-esg-muted mt-2 block">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-0.5 bg-esg-border" />

        {/* Organization Entity */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-esg-dark">{user?.tenant?.company_name || "Acme Corp"}</p>
          <p className="text-[10px] text-esg-muted">{user?.tenant?.industry || "Sustainability Division"}</p>
        </div>
      </div>
    </header>
  );
};
