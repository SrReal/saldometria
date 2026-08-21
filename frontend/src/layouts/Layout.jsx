import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Logo } from '../components/Logo';
import {
    LayoutDashboard,
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
    IdCardIcon,
    ChevronDown,
    Menu,
    X,
    MoreHorizontal
} from 'lucide-react';

export const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const { entities, selectedEntity, switchEntity } = useEntity();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [alerts, setAlerts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showEntityDropdown, setShowEntityDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (selectedEntity) {
            fetchAlerts();
            const interval = setInterval(fetchAlerts, 60000);
            return () => clearInterval(interval);
        }
    }, [selectedEntity]);

    // Cerrar el drawer móvil al cambiar de ruta
    useEffect(() => {
        setMobileMenuOpen(false);
        setShowNotifications(false);
        setShowEntityDropdown(false);
    }, [location.pathname]);

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

    const mobileBottomItems = [
        { icon: LayoutDashboard, label: 'Inicio', path: '/' },
        { icon: ArrowRightLeft, label: 'Movimientos', path: '/transactions' },
        { icon: TrendingUp, label: 'Analítica', path: '/analytics' },
        { icon: Calendar, label: 'Calendario', path: '/calendar' },
    ];

    const toggleLanguage = () => {
        const newLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row w-full overflow-x-hidden">
            {/* Top Navigation Bar (Mobile / Tablet only) */}
            <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 px-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link to="/" className="flex items-center">
                        <Logo size="sm" showText={true} />
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Notifications Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 bg-slate-50 border border-slate-200 rounded-xl transition-all relative ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-600'}`}
                            aria-label="Notificaciones"
                        >
                            <Bell className="w-5 h-5 text-primary" />
                            {alerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {alerts.length}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-72 z-50 shadow-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alertas</span>
                                    <span className="text-[11px] font-semibold text-slate-400">{alerts.length} pendientes</span>
                                </div>
                                <div className="max-h-[280px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                                    {alerts.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-500 italic">
                                            {t('dashboard.alerts.noPendingAlerts')}
                                        </div>
                                    ) : (
                                        alerts.map(alert => (
                                            <div key={alert.id} className="p-3 hover:bg-slate-50 transition-colors">
                                                <p className="text-xs font-bold text-amber-600 mb-0.5">
                                                    {t(`dashboard.alerts.types.${alert.type}`) || alert.type.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-[11px] text-slate-600 mb-2 leading-tight">{alert.message}</p>
                                                <button
                                                    onClick={() => dismissAlert(alert.id)}
                                                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                                                >
                                                    {t('dashboard.alerts.dismiss')}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Entity quick switcher */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-primary/50 transition-all max-w-[130px]"
                        >
                            <span className="truncate">{selectedEntity?.name || 'Entidad'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${showEntityDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showEntityDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {entities.map(entity => (
                                        <button
                                            key={entity.id}
                                            onClick={() => {
                                                switchEntity(entity.id);
                                                setShowEntityDropdown(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors ${selectedEntity?.id === entity.id
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            {entity.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop Fixed + Mobile Off-Canvas Drawer) */}
            <aside
                className={`fixed top-0 bottom-0 left-0 w-72 sm:w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Brand Header */}
                <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 lg:border-none">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                        <Logo size="md" showText={true} />
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="px-3 sm:px-4 py-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`no-select flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl font-medium text-sm transition-all group ${active
                                    ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Controls Panel */}
                <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
                    {/* Entity Selector Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                            className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-primary/50 focus:outline-none transition-all shadow-2xs"
                        >
                            <span className="truncate">{selectedEntity?.name || t('nav.selectEntity')}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${showEntityDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showEntityDropdown && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {entities.map(entity => (
                                        <button
                                            key={entity.id}
                                            onClick={() => {
                                                switchEntity(entity.id);
                                                setShowEntityDropdown(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors ${selectedEntity?.id === entity.id
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            {entity.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Language & Notifications (Desktop) */}
                    <div className="hidden lg:flex items-center justify-between gap-2">
                        <button
                            onClick={toggleLanguage}
                            className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-xl hover:border-primary/50 transition-all text-xs font-bold text-slate-700 hover:text-primary flex items-center justify-center gap-1.5 shadow-2xs"
                            title={i18n.language === 'es' ? 'Change to English' : 'Cambiar a Español'}
                        >
                            <Globe className="w-4 h-4 text-primary" />
                            <span>{i18n.language === 'en' ? 'English' : 'Español'}</span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 bg-white border border-slate-200 rounded-xl hover:border-primary/50 transition-all flex items-center justify-center relative shadow-2xs ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-500'}`}
                            >
                                <Bell className="w-4 h-4 text-primary" />
                                {alerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {alerts.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 z-50 shadow-2xl rounded-xl border border-slate-200 bg-white overflow-hidden">
                                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                                        {alerts.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-500 italic">
                                                {t('dashboard.alerts.noPendingAlerts')}
                                            </div>
                                        ) : (
                                            alerts.map(alert => (
                                                <div key={alert.id} className="p-3 hover:bg-slate-50 transition-colors">
                                                    <p className="text-xs font-bold text-amber-600 mb-0.5">
                                                        {t(`dashboard.alerts.types.${alert.type}`) || alert.type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[11px] text-slate-600 mb-2 leading-tight">{alert.message}</p>
                                                    <button
                                                        onClick={() => dismissAlert(alert.id)}
                                                        className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                                                    >
                                                        {t('dashboard.alerts.dismiss')}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                                {(user?.name || user?.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Usuario'}</p>
                                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t('common.signOut')}
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Application View */}
            <main className="flex-1 ml-0 lg:ml-64 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-12 min-h-screen relative flex flex-col bg-[#f8fafc] w-full max-w-full overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Mobile Navigation Bar (Mobile only) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-lg">
                {mobileBottomItems.map(item => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 mb-0.5 ${active ? 'text-primary scale-110' : 'text-slate-400'} transition-transform`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* More / Menu Drawer Trigger */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-400" />
                    <span>Más</span>
                </button>
            </nav>
        </div>
    );
};
