import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Briefcase,
    TrendingUp,
    Settings,
    LayoutDashboard,
    LogOut,
    Users,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

export default function AdminLayout() {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await authClient.signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Empresas', icon: Briefcase, path: '/admin/organizations' },
        { name: 'Financeiro', icon: TrendingUp, path: '/admin/financial' },
        { name: 'Usuários', icon: Users, path: '/admin/users' },
        { name: 'Configurações', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1e293b] text-white flex-shrink-0 hidden md:flex flex-col border-r border-slate-700">
                {/* Brand */}
                <div className="p-6 border-b border-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight">ClinicOS</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Super Admin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10 gap-2"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4" />
                        Sair do Sistema
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                {/* Top Header (Optional or part of pages) */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between md:hidden">
                    <span className="font-bold text-slate-900">Admin Panel</span>
                    {/* Mobile Toggle would go here */}
                </div>

                <Outlet />
            </main>
        </div>
    );
}
