import * as React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ClipboardList, 
  UploadCloud, 
  History, 
  FileText, 
  Settings, 
  Leaf,
  LogOut,
  Building2
} from "lucide-react";
import { useESGStore } from "@/store/esgStore";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 1280 : false;
  });
  const { user } = useESGStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = React.useMemo(() => {
    if (!user?.name) return "?";
    const parts = user.name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }, [user]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Facilities", path: "/facilities", icon: Building2 },
    { name: "Review Queue", path: "/review", icon: ClipboardList },
    { name: "Upload Center", path: "/upload", icon: UploadCloud },
    { name: "Upload History", path: "/history", icon: History },
    { name: "Audit Logs", path: "/logs", icon: FileText },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for drawer overlay on screens < 1280px when expanded */}
      {!isCollapsed && (
        <div 
          className="xl:hidden fixed inset-0 bg-black/35 z-20 transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside 
        className={`xl:sticky fixed top-0 left-0 h-screen bg-esg-clay border-r border-esg-moss/65 flex flex-col justify-between transition-all duration-300 z-30 shadow-sm ${
          isCollapsed ? "w-20" : "w-64 shadow-xl xl:shadow-sm"
        }`}
      >
        {/* Brand Section (Clickable to toggle sidebar state on screens < 1280px) */}
        <div>
          <button
            onClick={() => {
              if (window.innerWidth < 1280) {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className={`w-full h-16 flex items-center border-b border-esg-moss/50 focus-ring text-left transition-colors cursor-pointer hover:bg-esg-moss/30 xl:cursor-default xl:pointer-events-none xl:hover:bg-transparent ${
              isCollapsed ? "justify-center px-2" : "justify-start px-4 space-x-3"
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="h-9 w-9 rounded-xl bg-esg-sage flex items-center justify-center shadow-inner-soft shrink-0">
              <Leaf className="h-5 w-5 text-esg-dark" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-esg-dark tracking-tight whitespace-nowrap">
                Terra<span className="text-esg-muted font-normal">lyt</span>
              </span>
            )}
          </button>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5 mt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-all duration-200 focus-ring ${
                    isCollapsed ? "justify-center px-0 py-2.5" : "justify-start px-3 py-2.5 space-x-3"
                  } ${
                    isActive 
                      ? "bg-esg-sage text-esg-dark font-semibold shadow-sm" 
                      : "text-esg-muted hover:bg-esg-moss/50 hover:text-esg-dark"
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Profile & Logout Section */}
        <div className={`p-4 border-t border-esg-moss/50 bg-esg-moss/20 flex flex-col ${isCollapsed ? "items-center" : ""}`}>
          {user && (
            <div className={`flex items-center mb-3 ${isCollapsed ? "justify-center" : "space-x-3 w-full"}`}>
              <div className="h-9 w-9 rounded-full bg-esg-sage border border-esg-moss/50 flex items-center justify-center text-xs font-bold text-esg-dark shadow-inner shrink-0">
                {initials}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-esg-dark truncate">{user.name}</p>
                  <p className="text-[10px] text-esg-muted truncate">{user.role}</p>
                </div>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className={`w-full text-xs ${isCollapsed ? "justify-center px-0" : "justify-start space-x-3"}`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0 text-esg-muted" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};
