import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, BarChart3,
  Menu, X, LogOut, Settings, ChevronDown, Bell, Tag, MessageSquare, Target, Building2, ArrowLeft
} from "lucide-react";
import NotificationList from "@/components/notifications/NotificationList";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";

const navigation = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Agenda", href: "Agenda", icon: Calendar },
  { name: "Pacientes", href: "Patients", icon: Users },
  { name: "Leads", href: "Leads", icon: Target },
  { name: "Chat", href: "Chat", icon: MessageSquare },
  { name: "Promoções", href: "Promotions", icon: Tag },
  { name: "Planos", href: "TreatmentPlans", icon: FileText },
  { name: "WhatsApp", href: "WhatsAppSettings", icon: MessageSquare },
  { name: "Equipe", href: "Professionals", icon: Stethoscope },
  { name: "Prontuários", href: "MedicalRecords", icon: FileText },
  { name: "Relatórios", href: "Reports", icon: BarChart3 },
  { name: "Configurações", href: "ClinicSettings", icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic"],
    queryFn: async () => {
      const clinics = await base44.entities.Clinic.list();
      return clinics[0];
    }
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({
        read: false,
        user_id: user?.id
      });
      return notifications.length;
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  const location = useLocation();

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <NotificationPermissionPrompt />

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-hidden">
        <style>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
              {clinicSettings?.logo_url ? (
                <img src={clinicSettings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">
                {clinicSettings?.name || "ClinicOS"}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Gestão Inteligente
              </p>
            </div>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.href);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
              <AvatarImage src={user?.photo_url} />
              <AvatarFallback className="bg-white text-slate-400">
                {user?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">
                {user?.role || "Profissional"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-600" />
          </Button>
          <h1 className="font-bold text-slate-900">{clinicSettings?.name || "ClinicOS"}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.photo_url} />
            <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Sidebar Mobile (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900">Menu</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.includes(item.href);
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Painel de Notificações */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="p-0 w-full sm:max-w-md">
          <SheetHeader className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificações
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  {unreadCount} novas
                </Badge>
              )}
            </div>
          </SheetHeader>
          <div className="h-[calc(100vh-88px)] overflow-y-auto">
            <NotificationList user={user} onClose={() => setNotificationsOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Conteúdo Principal */}
      <main className="flex-1 relative overflow-x-hidden">
        {/* Header Desktop (Breadcrumbs/User) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Settings className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentPageName}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>ClinicOS</span>
                <span>/</span>
                <span className="text-slate-600 font-medium">{currentPageName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="relative border-slate-200 hover:bg-slate-50"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-3 pl-2 pr-4 py-6 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                  <Avatar className="w-8 h-8 border border-slate-200">
                    <AvatarImage src={user?.photo_url} />
                    <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                <DropdownMenuItem className="rounded-lg gap-2 py-3 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Minha Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg gap-2 py-3 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

