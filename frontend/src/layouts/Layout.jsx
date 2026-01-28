import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Wallet,
    Calendar,
    Target,
    ArrowRightLeft,
    Settings,
    LogOut,
    ChevronDown,
    Globe,
    Sparkles,
    User
} from 'lucide-react';

export const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const { entities, selectedEntity, switchEntity } = useEntity();
    const { t, i18n } = useTranslation();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
        { icon: ArrowRightLeft, label: t('nav.transactions'), path: '/transactions' },
        { icon: Calendar, label: t('nav.calendar'), path: '/calendar' },
        { icon: Target, label: t('nav.goals'), path: '/goals' },
        { icon: Sparkles, label: t('nav.rules'), path: '/rules' },
        { icon: Wallet, label: t('nav.entities'), path: '/entities' },
        { icon: Settings, label: t('nav.settings'), path: '/settings' },
        { icon: User, label: t('nav.profile'), path: '/profile' },
    ];

    const toggleLanguage = () => {
        const newLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="layout-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-indigo-500" />
                        SaldoMetria
                    </h1>
                </div>

                {/* Entity Selector */}
                <div className="px-4 mb-6">
                    <div className="relative group">
                        <button className="w-full glass-input flex items-center justify-between text-sm py-2 px-3 bg-white/5 border-white/5 hover:border-white/10">
                            <span className="truncate font-medium">
                                {selectedEntity ? selectedEntity.name : t('nav.selectEntity')}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                        </button>
                        <div className="absolute top-full left-0 w-full mt-2 glass-panel opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden shadow-2xl bg-gray-900">
                            {entities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => switchEntity(entity.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm border-b border-white/5 last:border-0"
                                >
                                    {entity.name}
                                </button>
                            ))}
                            <Link to="/entities" className="block w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-blue-400 font-medium">
                                + {t('nav.manageEntities')}
                            </Link>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-indigo-400' : 'opacity-70'}`} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 mt-auto bg-black/20">
                    {/* Language Switcher */}
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium mb-2"
                    >
                        <Globe className="w-4 h-4" />
                        <span>{i18n.language === 'es' ? 'Español' : 'English'}</span>
                    </button>

                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                            {(user?.name || user?.email)}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t('common.signOut')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="container py-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
