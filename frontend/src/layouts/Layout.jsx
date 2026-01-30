import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
    LayoutDashboard,
    Wallet,
    Calendar,
    Target,
    ArrowRightLeft,
    Settings,
    LogOut,
    TrendingUp,
    Globe,
    Sparkles,
    User,
    Bell,
    IdCardIcon
} from 'lucide-react';

export const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const { entities, selectedEntity, switchEntity } = useEntity();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [alerts, setAlerts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (selectedEntity) {
            fetchAlerts();
            const interval = setInterval(fetchAlerts, 60000);
            return () => clearInterval(interval);
        }
    }, [selectedEntity]);

    const fetchAlerts = async () => {
        try {
            const res = await api.get(`/alerts?entityId=${selectedEntity.id}`);
            setAlerts(res.data.filter(a => a.status === 'TRIGGERED'));
        } catch (error) {
            console.error('Error fetching alerts', error);
        }
    };

    const dismissAlert = async (id) => {
        try {
            await api.post(`/alerts/${id}/dismiss`);
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error dismissing alert', error);
        }
    };


    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
        { icon: ArrowRightLeft, label: t('nav.transactions'), path: '/transactions' },
        { icon: TrendingUp, label: t('nav.analytics'), path: '/analytics' },
        { icon: Calendar, label: t('nav.calendar'), path: '/calendar' },
        { icon: Target, label: t('nav.goals'), path: '/goals' },
        { icon: Sparkles, label: t('nav.rules'), path: '/rules' },
        { icon: IdCardIcon, label: t('nav.entities'), path: '/entities' },
        { icon: Settings, label: t('nav.settings'), path: '/settings' },
        { icon: User, label: t('nav.profile'), path: '/profile' },
    ];

    const toggleLanguage = () => {
        const newLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        SaldoMetria
                    </h1>
                </div>

                <nav className="px-4 space-y-1 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`no-select ${isActive(item.path)
                                ? 'sidebar-item-active flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all'
                                : 'flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-all group'
                                }`}
                        >
                            <item.icon className={`material-icons-round ${!isActive(item.path) ? 'group-hover:text-primary' : ''}`} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 space-y-4">
                    {/* Dark Mode & Language Header Controls */}
                    <div className="flex items-center justify-between px-2">
                        <button
                            onClick={toggleLanguage}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary/50 transition-all text-slate-500 hover:text-primary flex items-center justify-center"
                            title={i18n.language === 'es' ? 'Change to English' : 'Cambiar a Español'}
                        >
                            <Globe className="w-6 h-6 text-primary" />
                            <span className="ml-2 text-primary">{i18n.language === 'en' ? 'English' : 'Español'}</span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary/50 transition-all flex items-center justify-center relative ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-500'}`}
                            >
                                <Bell className="w-6 h-6 text-primary" />
                                {alerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {alerts.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 z-50 shadow-2xl overflow-hidden rounded-xl border border-slate-200 bg-white glass-panel">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {alerts.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-500 italic">
                                                No hay alertas pendientes
                                            </div>
                                        ) : (
                                            alerts.map(alert => (
                                                <div key={alert.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <p className="text-xs font-bold text-amber-500 mb-1">
                                                        {alert.type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[11px] text-slate-600 mb-2 leading-tight">{alert.message}</p>
                                                    <button
                                                        onClick={() => dismissAlert(alert.id)}
                                                        className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                                                    >
                                                        Descartar
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Entity Selector */}
                    <div className="relative group px-2">
                        <div className="w-full relative">
                            <select
                                value={selectedEntity?.id || ''}
                                onChange={(e) => switchEntity(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none cursor-pointer text-sm font-medium text-slate-700 transition-all"
                            >
                                {entities.map(entity => (
                                    <option key={entity.id} value={entity.id}>
                                        {entity.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="flex items-center justify-between gap-3 px-2 py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                                {(user?.name || user?.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate max-w-[100px]">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[100px]">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t('common.signOut')}
                        >
                            <LogOut className="w-6 h-6 text-primary" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {children}
            </main>
        </div>
    );
};
