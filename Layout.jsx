import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, BarChart3,
  Menu, X, LogOut, Settings, ChevronDown, Bell, Tag, MessageSquare, Target, Moon, Sun, Search,
  ChevronLeft, ChevronRight, Activity, DollarSign
} from "lucide-react";
import NotificationList from "@/components/notifications/NotificationList";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Theme Context
const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => { }
});

export const useAppTheme = () => React.useContext(ThemeContext);

const navigation = [
  {
    group: "Principal",
    items: [
      { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
      { name: "Agenda", href: "Agenda", icon: Calendar },
    ]
  },
  {
    group: "Clínica",
    items: [
      { name: "Pacientes", href: "Patients", icon: Users },
      { name: "Prontuários", href: "MedicalRecords", icon: FileText },
    ]
  },
  {
    group: "Comercial",
    items: [
      { name: "Leads", href: "Leads", icon: Target },
      { name: "Chat", href: "Chat", icon: MessageSquare },
      { name: "Promoções", href: "Promotions", icon: Tag },
      { name: "WhatsApp", href: "WhatsAppSettings", icon: MessageSquare },
    ]
  },
  {
    group: "Gestão",
    items: [
      { name: "Financeiro", href: "Financial", icon: DollarSign },
      { name: "Equipe", href: "Professionals", icon: Stethoscope },
      { name: "Relatórios", href: "Reports", icon: BarChart3 },
    ]
  },
  {
    group: "Sistema",
    items: [
      { name: "Configurações", href: "ClinicSettings", icon: Settings },
    ]
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [isDark, setIsDark] = useState(false); // Default to light for regular users typically, but let's default to false to match expectations or true if they want full modernization. Let's start light but allow toggle.
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => setIsDark(!isDark);

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (e) {
        return null;
      }
    },
    retry: false
  });

  useEffect(() => {
    if (!authLoading && !user && window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.startsWith('/accept-invitation')) {
      // Auto-redirect disabled during dev to allow viewing layout, but should be enabled in prod.
      // window.location.href = '/login'; 
    }
  }, [user, authLoading]);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      try {
        const all = await base44.entities.ClinicSettings.list();
        return all[0] || null;
      } catch (e) { return null; }
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavItem = ({ item, isActive }) => (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isCollapsed ? "justify-center px-0" : "mx-2",
        isActive
          ? (isDark ? "bg-indigo-600/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")
          : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
      )}
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon className={cn("w-5 h-5 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
      {!isCollapsed && <span>{item.name}</span>}

      {/* Tooltip for collapsed state is handled by parent, but we can do it here too */}
      {!isCollapsed && isActive && (
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
      )}
    </Link>
  );

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={cn(
        "min-h-screen font-sans transition-colors duration-300 flex",
        isDark ? "bg-[#151A25] text-slate-100" : "bg-slate-50 text-slate-900"
      )}>
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 bottom-0 left-0 z-50 h-[100dvh] transition-all duration-300 ease-in-out border-r flex flex-col",
            isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-200",
            sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
            isCollapsed ? "md:w-20" : "md:w-64"
          )}
        >
          {/* Header */}
          <div className={cn(
            "h-16 flex items-center px-6 border-b shrink-0",
            isDark ? "border-slate-800" : "border-slate-200",
            isCollapsed && "justify-center px-0"
          )}>
            {!isCollapsed ? (
              <div className="flex items-center">
                <img src="/clinicos-logo.png" alt="ClinicOS" className="w-8 h-8 object-contain mr-3" />
                <div className="flex flex-col">
                  <span className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>ClinicOS</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-50">SaaS</span>
                </div>
              </div>
            ) : (
              <img src="/clinicos-logo.png" alt="ClinicOS" className="w-8 h-8 object-contain" />
            )}

            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide px-2">
            <TooltipProvider delayDuration={0}>
              {navigation.map((group, idx) => (
                <div key={idx}>
                  {!isCollapsed && group.group && (
                    <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      {group.group}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname.includes(item.href);
                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <div><NavItem item={item} isActive={isActive} /></div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-800 text-white ml-2 z-50">
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }
                      return <NavItem key={item.name} item={item} isActive={isActive} />
                    })}
                  </div>
                </div>
              ))}
            </TooltipProvider>

            {/* Admin Link */}
            {(user?.email === "rafamarketingdb@gmail.com" || user?.role === "admin") && (
              <div className={cn("mt-4 pt-4 border-t mx-2", isDark ? "border-slate-800" : "border-slate-200")}>
                {!isCollapsed && <h3 className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider opacity-50">Administração</h3>}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/admin"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative bg-gradient-to-r from-rose-500/10 to-purple-500/10 hover:from-rose-500/20 hover:to-purple-500/20 text-rose-500 border border-rose-500/20",
                          isCollapsed ? "justify-center px-0" : ""
                        )}
                      >
                        <Target className="w-5 h-5" />
                        {!isCollapsed && <span>Super Admin</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Super Admin</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </nav>

          {/* Footer User Profile */}
          {user && (
            <div className={cn("p-4 border-t", isDark ? "border-slate-800 bg-[#0B0E14]" : "border-slate-200 bg-white")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent">
                    <div className={cn("flex items-center gap-3 w-full", isCollapsed && "justify-center")}>
                      <Avatar className="w-9 h-9 border border-indigo-500/30">
                        <AvatarImage src={user.photo_url} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <div className="text-left overflow-hidden">
                          <p className={cn("text-sm font-medium truncate", isDark ? "text-slate-200" : "text-slate-900")}>
                            {user.name || user.display_name || "Usuário"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      )}
                      {!isCollapsed && <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("w-56", isDark ? "bg-[#1C2333] border-slate-800 text-slate-200" : "")}>
                  <DropdownMenuItem asChild>
                    <Link to="/Profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
          {/* Top Header */}
          <header className={cn(
            "h-16 flex items-center justify-between px-6 border-b sticky top-0 z-40 backdrop-blur-md",
            isDark ? "bg-[#0B0E14]/80 border-slate-800" : "bg-white/80 border-slate-200"
          )}>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex">
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>

              <div className="hidden md:flex items-center relative">
                <Search className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="search"
                  placeholder="Buscar..."
                  className={cn(
                    "pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64",
                    isDark ? "bg-[#151A25] text-slate-200 placeholder:text-slate-600" : "bg-slate-100 text-slate-900"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className={cn("w-80 p-0", isDark ? "bg-[#1C2333] border-slate-800 text-slate-200" : "")}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold">Notificações</h4>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    <NotificationList
                      notifications={notifications}
                      onMarkAsRead={async (id) => await base44.entities.Notification.update(id, { read: true })}
                      onDelete={async (id) => await base44.entities.Notification.delete(id)}
                      user={user}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Content Viewport */}
          <main className="flex-1 p-6 overflow-x-hidden">
            <Outlet context={{ isDark }} />
          </main>
        </div>

        <NotificationPermissionPrompt />
      </div>
    </ThemeContext.Provider>
  );
}
