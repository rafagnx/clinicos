import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Briefcase,
    TrendingUp,
    Settings,
    LayoutDashboard,
    LogOut,
    Users,
    ShieldCheck,
    Search,
    Bell,
    Moon,
    Sun,
    Menu,
    PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Theme Context for Admin Panel
const ThemeContext = React.createContext({
    isDark: true,
    toggleTheme: () => { }
});

export const useAdminTheme = () => React.useContext(ThemeContext);

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleTheme = () => setIsDark(!isDark);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Empresas', icon: Briefcase, path: '/admin/organizations' },
        { name: 'Financeiro', icon: TrendingUp, path: '/admin/financial' },
        { name: 'Usuários', icon: Users, path: '/admin/users' },
        { name: 'Relatórios', icon: Settings, path: '/admin/reports' }, // Added to match screenshots more
        { name: 'Configurações', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <div className={cn(
                "min-h-screen font-sans transition-colors duration-300",
                isDark ? "bg-[#151A25] text-slate-100" : "bg-slate-50 text-slate-900"
            )}>
                <div className="flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <aside className={cn(
                        "flex flex-col border-r transition-all duration-300 z-30",
                        isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-200",
                        sidebarOpen ? "w-64" : "w-20"
                    )}>
                        {/* Brand */}
                        <div className={cn(
                            "h-16 flex items-center px-6 border-b",
                            isDark ? "border-slate-800" : "border-slate-200"
                        )}>
                            <img src="/clinicos-logo.png" alt="ClinicOS Logo" className="w-8 h-8 object-contain mr-3 flex-shrink-0" />
                            {sidebarOpen && (
                                <div className="flex flex-col animate-in fade-in duration-300">
                                    <span className="text-lg font-bold tracking-tight">ClinicOS</span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-50">Admin Panel</span>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                        isActive
                                            ? (isDark ? "bg-indigo-600/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")
                                            : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
                                    )}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className={cn("w-5 h-5 flex-shrink-0", sidebarOpen ? "" : "mx-auto")} />
                                            {sidebarOpen && <span>{item.name}</span>}
                                            {!sidebarOpen && (
                                                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 z-50 whitespace-nowrap pointer-events-none">
                                                    {item.name}
                                                </div>
                                            )}
                                            {isActive && sidebarOpen && (
                                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Footer Sidebar */}
                        <div className={cn(
                            "p-4 border-t",
                            isDark ? "border-slate-800" : "border-slate-200"
                        )}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2",
                                    !sidebarOpen && "justify-center px-0"
                                )}
                                onClick={handleSignOut}
                            >
                                <LogOut className="w-5 h-5" />
                                {sidebarOpen && "Sair"}
                            </Button>
                        </div>
                    </aside>

                    {/* Main Section */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Navbar */}
                        <header className={cn(
                            "h-16 flex items-center justify-between px-6 border-b z-20",
                            isDark ? "bg-[#0B0E14] border-slate-800" : "bg-white border-slate-200"
                        )}>
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                    <Menu className="w-5 h-5" />
                                </Button>
                                <div className="hidden md:flex items-center relative">
                                    <Search className="w-4 h-4 absolute left-3 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search anything..."
                                        className={cn(
                                            "pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64",
                                            isDark ? "bg-[#151A25] text-slate-200 placeholder:text-slate-600" : "bg-slate-100 text-slate-900"
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 gap-2 shadow-lg shadow-indigo-500/20"
                                    onClick={() => navigate('/organization/new')}
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    New
                                </Button>

                                <div className="h-6 w-px bg-slate-700/20 mx-1"></div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="rounded-full"
                                >
                                    {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                                </Button>

                                <AdminNotifications />

                                <div className="flex items-center gap-3 pl-2">
                                    <div className="relative group cursor-pointer">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>
                                        <Avatar className="w-9 h-9 relative border-2 border-[#0B0E14]">
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback>RA</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium leading-none text-slate-200">Rafa</p>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                                            Super Admin
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Content Area */}
                        <main className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-indigo-500/20">
                            <Outlet context={{ isDark }} />
                        </main>
                    </div>
                </div>
            </div>
        </ThemeContext.Provider>
    );
}
