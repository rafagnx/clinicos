import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";
import { base44 } from "@/lib/base44Client";
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
  ChevronLeft, ChevronRight, Activity, DollarSign, Sparkles, Megaphone
} from "lucide-react";
import { useFeatures } from "@/hooks/useFeatures";
import NotificationList from "@/components/notifications/NotificationList";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ChatProvider, useChat } from "@/context/ChatContext";
import FloatingChatWindow from "@/components/chat/FloatingChatWindow";

// Theme Context
const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => { }
});

export const useAppTheme = () => React.useContext(ThemeContext);

const SubscriptionBadge = ({ org, user }) => {
  if (user?.email === 'rafamarketingdb@gmail.com') {
    return <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-1.5 py-0.5 rounded-md font-black italic tracking-widest ml-2 shadow-lg shadow-amber-500/30">MASTER</span>;
  }
  // Check for 'active' or our manual override status
  // Also check if user is root admin to show PRO
  if (org?.subscription_status === 'active' || org?.subscription_status === 'manual_override' || user?.email === 'marketingorofacial@gmail.com' || user?.email === 'kriscilainemiranda@gmail.com') {
    return <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-md font-black italic tracking-widest ml-2 shadow-lg shadow-purple-500/30">PRO</span>;
  }
  return (
    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold tracking-widest ml-2 uppercase">
      {org?.subscription_status === 'trialing' ? 'FREE 7D' : 'FREE'}
    </span>
  );
};

const navigation = [
  {
    group: "Principal",
    items: [
      { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-500" },
      { name: "Agenda", href: "Agenda", icon: Calendar, gradient: "from-purple-500 to-pink-500" },
    ]
  },
  {
    group: "Clínica",
    items: [
      { name: "Pacientes", href: "Patients", icon: Users, gradient: "from-emerald-500 to-teal-500" },
      { name: "Prontuários", href: "MedicalRecords", icon: FileText, gradient: "from-orange-500 to-red-500" },
      { name: "Planos de Tratamento", href: "TreatmentPlans", icon: Sparkles, gradient: "from-cyan-500 to-blue-500" },
    ]
  },
  {
    group: "Comercial",
    items: [
      { name: "Leads", href: "Leads", icon: Target, gradient: "from-violet-500 to-purple-500" },
      { name: "Chat Equipe", href: "Chat", icon: MessageSquare, gradient: "from-blue-500 to-indigo-500" },
      { name: "Promoções", href: "Promotions", icon: Tag, gradient: "from-pink-500 to-rose-500" },
      { name: "WhatsApp", href: "WhatsAppSettings", icon: MessageSquare, gradient: "from-green-500 to-emerald-500" },
    ]
  },
  {
    group: "Gestão",
    items: [
      { name: "Financeiro", href: "Financial", icon: DollarSign, gradient: "from-yellow-500 to-orange-500" },
      { name: "Equipe", href: "Professionals", icon: Stethoscope, gradient: "from-cyan-500 to-blue-500" },
      { name: "Relatórios", href: "Reports", icon: BarChart3, gradient: "from-indigo-500 to-purple-500" },
    ]
  },
  {
    group: "Sistema",
    items: [
      { name: "Configurações", href: "ClinicSettings", icon: Settings, gradient: "from-slate-500 to-gray-500" },
    ]
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();



  const activeOrgId = localStorage.getItem("active-org-id");

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

  // Auto-detect Organization & Process Invites
  useEffect(() => {
    if (!user) return; // Wait for authenticated user

    const init = async () => {
      // 1. Process any pending invites first
      try {
        await base44.auth.processPendingInvites();
      } catch (e) { console.warn("Invite processing warning", e); }

      const storedOrgId = localStorage.getItem("active-org-id");
      if (!storedOrgId) {
        try {
          const orgs = await base44.auth.getUserOrganizations();
          if (orgs && orgs.length > 0) {
            const firstOrg = orgs[0].organizationId || orgs[0].id;
            localStorage.setItem("active-org-id", firstOrg);

            // Only reload if NOT processing an OAuth hash (prevent loop)
            if (!window.location.hash.includes('access_token')) {
              setTimeout(() => window.location.reload(), 100);
            }
          }
        } catch (e) {
          console.warn("Could not auto-select organization", e);
        }
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user && window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.startsWith('/accept-invitation')) {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      try {
        const all = await base44.entities.ClinicSettings.list();
        return all[0] || null;
      } catch (e) { return null; }
    },
    // CRITICAL FIX: Only fetch settings if we have an Organization Context
    enabled: !!user && !!activeOrgId
  });

  const { data: organization } = useQuery({
    queryKey: ["active-org", user?.active_organization_id],
    queryFn: async () => {
      if (!user?.active_organization_id) return null;

      // Use the proper authenticated client instead of manual fetch
      try {
        const orgs = await base44.auth.getUserOrganizations();
        // Find the active organization in the list
        const activeOrg = orgs.find(o => o.organizationId === user.active_organization_id || o.id === user.active_organization_id);

        if (activeOrg) {
          // Map fields if necessary to match expected structure
          return {
            ...activeOrg,
            id: activeOrg.organizationId || activeOrg.id
          };
        }
        return null;
      } catch (e) { return null; }
    },
    enabled: !!user?.active_organization_id
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id }, "-created_date"),
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const { hasFeature } = useFeatures();

  // Dynamic Navigation builder
  const dynamicNavigation = React.useMemo(() => {
    // Deep copy to avoid mutating the static reference
    const nav = JSON.parse(JSON.stringify(navigation));

    // Inject Marketing module if enabled
    if (hasFeature('marketing')) {
      const comGroup = nav.find(g => g.group === "Comercial");
      if (comGroup) {
        comGroup.items.push({
          name: "Marketing",
          href: "Marketing",
          icon: Megaphone, // Will rely on icon component matching, check if JSON stringify breaks icon references?
          // PROBLEM: JSON.stringify will kill the 'icon' property because it's a React component/function.
          // WE CANNOT USE JSON.parse(JSON.stringify) for components.
          gradient: "from-pink-600 to-rose-600"
        });
      }
    }
    return nav;
  }, [hasFeature]);

  // FIX: Since we can't deep copy components easily, let's map the static array instead.
  const finalNavigation = navigation.map(group => {
    if (group.group === "Comercial" && hasFeature('marketing')) {
      // Return new group object with appended item
      // Check if already exists to be safe? (map runs every render but returns new array)
      return {
        ...group,
        items: [
          ...group.items,
          {
            name: "Marketing",
            href: "Marketing",
            icon: Megaphone,
            gradient: "from-pink-600 to-rose-600"
          }
        ]
      };
    }
    return group;
  });

  const NavItem = ({ item, isActive }) => (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "mx-2",
        isActive
          ? (isDark
            ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-lg shadow-indigo-500/20"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-md shadow-indigo-200/50")
          : (isDark
            ? "text-slate-400 hover:text-white hover:bg-white/5"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
      )}
      onClick={() => setSidebarOpen(false)}
    >
      {/* Icon with gradient on hover */}
      <div className={cn(
        "relative p-2 rounded-lg transition-all duration-300",
        isActive && `bg-gradient-to-br ${item.gradient} shadow-lg`
      )}>
        <item.icon className={cn(
          "w-5 h-5 transition-all duration-300",
          isActive ? "text-white" : (isDark ? "text-slate-400 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900")
        )} />

        {/* Glow effect on active */}
        {isActive && (
          <div className={cn(
            "absolute inset-0 rounded-lg blur-xl opacity-50 bg-gradient-to-br",
            item.gradient
          )} />
        )}
      </div>

      {!isCollapsed && <span className="relative z-10">{item.name}</span>}

      {/* Active indicator */}
      {!isCollapsed && isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );

  // Subscription Lock Logic
  const SubscriptionLock = () => (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Sua assinatura expirou</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            O período de teste ou sua assinatura chegou ao fim. Para continuar gerenciando sua clínica com excelência, reative seu plano.
          </p>
          <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg rounded-xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02]">
            <Link to="/ClinicSettings">
              Reativar Acesso Agora
            </Link>
          </Button>
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Precisa de ajuda? <a href="#" className="underline hover:text-indigo-500">Fale com o suporte</a>
          </p>
        </div>
      </div>
    </div>
  );

  const isSubscriptionActive = !organization || // Allow if org loading or not found yet (prevent flash) 
    ['active', 'trialing', 'manual_override'].includes(organization?.subscription_status) ||
    user?.email === 'rafamarketingdb@gmail.com';

  // Check if we are still loading auth or if we need to redirect
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] animate-pulse-slow delay-700"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse">Carregando ClinicOS...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <ChatProvider>
        <LayoutContent
          user={user}
          isDark={isDark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          toggleTheme={toggleTheme}
          unreadCount={unreadCount}
          notifications={notifications}
          finalNavigation={finalNavigation}
          activeOrgId={activeOrgId}
          isSubscriptionActive={isSubscriptionActive}
          SubscriptionLock={SubscriptionLock}
        />
      </ChatProvider>
    </ThemeContext.Provider>
  );
}

// Separate component to consume ChatContext

function LayoutContent({
  user, isDark, sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed,
  toggleTheme, unreadCount, notifications, finalNavigation, activeOrgId,
  isSubscriptionActive, SubscriptionLock
}) {
  const { activeRecipient, isOpen, isMinimized, closeChat, toggleMinimize, updateStatus, getStatus, currentUser } = useChat();

  return (
    <>
      {!isSubscriptionActive && <SubscriptionLock />}
      <div className={cn(
        "min-h-screen font-sans transition-colors duration-300 flex",
        isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" : "bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900"
      )}>
        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            x: sidebarOpen || window.innerWidth >= 768 ? 0 : -280,
            width: isCollapsed && window.innerWidth >= 768 ? 80 : 280
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed top-0 bottom-0 left-0 z-50 h-[100dvh] flex flex-col transition-all duration-300",
            isDark
              ? "bg-[#0B0F17] border-r border-[#1E293B] shadow-2xl shadow-black/40 text-slate-200"
              : "bg-white/90 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl shadow-slate-200/50"
          )}
        >
          {/* Header with Logo */}
          <div className={cn(
            "h-14 flex items-center px-4 border-b shrink-0 transition-all duration-300",
            isDark ? "border-[#1E293B]" : "border-slate-200/50",
            isCollapsed && "justify-center px-0"
          )}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 animate-in fade-in duration-300 slide-in-from-left-2">
                <img
                  src="/logo-clinica.png"
                  alt="ClinicOS"
                  className="h-8 w-auto object-contain"
                />

                {/* Stylized Text Name */}
                <span className={cn(
                  "text-xl font-display font-bold tracking-tight",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  ClinicOS

                  {/* Subscription Badge */}
                  <SubscriptionBadge org={null} user={user} />
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <img
                  src="/logo-clinica.png"
                  alt="ClinicOS"
                  className="h-8 w-8 object-contain"
                />
              </div>
            )}

            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Neon Separator for Premium Feel */}
          <div className={cn("h-[1px] w-full", isDark ? "bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" : "bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent")} />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                  display: none;
              }
            `}</style>
            <TooltipProvider delayDuration={0}>
              {finalNavigation.map((group, idx) => (
                <div key={idx} className="mb-3">
                  {!isCollapsed && group.group && (
                    <h3 className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600">
                      {group.group}
                    </h3>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname.includes(item.href);
                      // Custom Nav Item logic moved inside loop for simplicity in refactor
                      const content = (
                        <Link
                          to={createPageUrl(item.href)}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                            isCollapsed ? "justify-center px-0" : "mx-2",
                            isActive
                              ? (isDark
                                ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-lg shadow-indigo-500/20"
                                : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-md shadow-indigo-200/50")
                              : (isDark
                                ? "text-slate-400 hover:text-white hover:bg-white/5"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className={cn(
                            "relative p-2 rounded-lg transition-all duration-300",
                            isActive && `bg-gradient-to-br ${item.gradient} shadow-lg`
                          )}>
                            <item.icon className={cn(
                              "w-5 h-5 transition-all duration-300",
                              isActive ? "text-white" : (isDark ? "text-slate-400 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900")
                            )} />
                            {isActive && (
                              <div className={cn(
                                "absolute inset-0 rounded-lg blur-xl opacity-50 bg-gradient-to-br",
                                item.gradient
                              )} />
                            )}
                          </div>
                          {!isCollapsed && <span className="relative z-10">{item.name}</span>}
                          {!isCollapsed && isActive && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                        </Link>
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <div>{content}</div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className={cn(
                              "ml-2 z-50 font-medium",
                              isDark ? "bg-slate-800 text-white border-slate-700" : "bg-white text-slate-900 border-slate-200"
                            )}>
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }
                      return <div key={item.name}>{content}</div>
                    })}
                  </div>
                </div>
              ))}
            </TooltipProvider>

            {/* Admin Link */}
            {(user?.email === "rafamarketingdb@gmail.com" || user?.role === "admin") && (
              <div className={cn("mt-4 pt-4 border-t mx-2", isDark ? "border-slate-800" : "border-slate-200")}>
                {!isCollapsed && <h3 className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600">Administração</h3>}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/admin"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative",
                          "bg-gradient-to-r from-rose-500/10 to-purple-500/10 hover:from-rose-500/20 hover:to-purple-500/20",
                          "text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/10",
                          isCollapsed ? "justify-center px-0" : ""
                        )}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600">
                          <Target className="w-5 h-5 text-white" />
                        </div>
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
            <div className={cn(
              "p-4 border-t relative overflow-hidden transition-colors duration-300",
              isDark ? "border-slate-800/50 bg-[#0B0F17]" : "border-slate-200/50 bg-white"
            )}>
              {/* Neon Glow Background for Container */}
              {user.email === 'rafamarketingdb@gmail.com' && (
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent relative z-10 h-auto">
                    <div className={cn("flex items-center gap-3 w-full", isCollapsed && "justify-center")}>

                      {/* Avatar with Neon Glow */}
                      <div className="relative">
                        {user.email === 'rafamarketingdb@gmail.com' && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-70 blur-sm animate-pulse-soft" />
                        )}
                        <Avatar className={cn(
                          "w-10 h-10 relative shadow-xl",
                          user.email === 'rafamarketingdb@gmail.com' ? "border-2 border-white/10" : "border-2 border-indigo-500/30"
                        )}>
                          <AvatarImage
                            src={user.email === 'rafamarketingdb@gmail.com' ? '/rafa-avatar.png' : user.photo_url}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold">
                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Status Indicator (Absolute on Avatar) */}
                      {!isCollapsed && ( // Only show when expanded to avoid clutter
                        <span className={cn(
                          "absolute bottom-0 left-7 w-3.5 h-3.5 border-2 border-white dark:border-[#0B0F17] rounded-full z-20",
                          getStatus(user.id) === "online" ? "bg-emerald-500" : (getStatus(user.id) === "busy" ? "bg-amber-500" : "bg-slate-400")
                        )} />
                      )}



                      {!isCollapsed && (
                        <div className="text-left overflow-hidden flex-1 group">
                          {user.email === 'rafamarketingdb@gmail.com' ? (
                            <>
                              <p className={cn(
                                "text-base font-bold truncate leading-none mb-1",
                                isDark ? "text-white" : "text-slate-900"
                              )}>
                                Rafa
                              </p>
                              <p className="text-[10px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 uppercase drop-shadow-sm">
                                SUPER ADMIN
                              </p>
                            </>
                          ) : (
                            <>
                              <p className={cn("text-sm font-semibold truncate", isDark ? "text-slate-200" : "text-slate-900")}>
                                {user.name || "Usuário"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </>
                          )}
                        </div>
                      )}
                      {!isCollapsed && <ChevronDown className={cn("w-4 h-4 ml-auto transition-colors", isDark ? "text-slate-600" : "text-slate-400")} />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("w-56", isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white")}>


                  {/* Status Selector - DISABLED (Always Green) */}
                  {/* 
                  <DropdownMenuItem onClick={() => updateStatus("online")} className="cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    <span>Online</span>
                    {getStatus(user.id) === "online" && <span className="ml-auto text-xs opacity-50">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus("busy")} className="cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    <span>Ocupado</span>
                    {getStatus(user.id) === "busy" && <span className="ml-auto text-xs opacity-50">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus("offline")} className="cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                    <span>Invisível</span>
                    {getStatus(user.id) === "offline" && <span className="ml-auto text-xs opacity-50">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? "bg-slate-800" : ""} />
                  */}


                  <DropdownMenuItem asChild>
                    <Link to="/Profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? "bg-slate-800" : ""} />
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
        </motion.aside>

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-20" : "md:ml-[280px]"
        )}>
          {/* Top Header */}
          <header className={cn(
            "h-16 flex items-center justify-between px-6 border-b sticky top-0 z-40 relative overflow-hidden transition-colors duration-300",
            isDark
              ? "bg-slate-950/80 backdrop-blur-xl border-slate-800 shadow-lg shadow-black/20"
              : "bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-lg shadow-slate-200/20"
          )}>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

            <div className="flex items-center gap-4 relative z-10">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex hover:bg-indigo-500/10 transition-colors"
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>

              <div className="hidden md:flex items-center relative">
                <Search className="w-4 h-4 absolute left-3 text-slate-500" />
                <input
                  type="search"
                  placeholder="Buscar..."
                  className={cn(
                    "pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64",
                    isDark ? "bg-slate-900/50 text-slate-200 placeholder:text-slate-600 border border-slate-800" : "bg-white text-slate-900 border border-slate-200"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-indigo-500/10 transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-indigo-500/10 transition-colors">
                    <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-wiggle")} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full border-2 border-background animate-pulse-soft shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className={cn("w-80 p-4", isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white")}>
                  <NotificationList
                    notifications={notifications}
                    onMarkAsRead={async (id) => await base44.entities.Notification.update(id, { read: true })}
                    onDelete={async (id) => await base44.entities.Notification.delete(id)}
                    user={user}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Content Viewport */}
          <main className="flex-1 p-6 overflow-x-hidden">
            <Outlet context={{ isDark }} />
          </main>
        </div>

        {/* Global Chat Window */}
        {isOpen && activeRecipient && user && (
          <FloatingChatWindow
            recipient={activeRecipient}
            currentUser={user}
            onClose={closeChat}
            isMinimized={isMinimized}
            onToggleMinimize={toggleMinimize}
          />
        )}

        <NotificationPermissionPrompt />
        <PWAInstallPrompt />
        <UserOnboarding />
      </div>
    </>
  );
}

import UserOnboarding from "@/components/onboarding/UserOnboarding";

