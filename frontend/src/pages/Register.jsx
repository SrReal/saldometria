import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Wallet,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    AlertCircle,
    Globe,
    ShieldCheck,
    TrendingUp,
    Layers,
    UserPlus
} from 'lucide-react';

export const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Error al registrar la cuenta');
            setLoading(false);
        }
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(nextLang);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] relative overflow-hidden font-sans">
            {/* Background Decorative Ambient Blobs */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Language Switcher (Top-Right) */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                >
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{i18n.language === 'es' ? 'Español' : 'English'}</span>
                </button>
            </div>

            {/* Main Register Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                    {/* Top Accent Gradient Line */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-orange-500 to-amber-400"></div>

                    <div className="p-8 sm:p-10">
                        {/* Brand Logo & Header */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-sm">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
                                Saldo<span className="text-primary">Metria</span>
                            </h1>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                                {t('common.createAccount')} — Tu panel financiero integral
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2.5">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Register Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('common.email')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('common.password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex="-1"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>{t('common.signUp')}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Sign In Link */}
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-500 font-medium">
                                {t('common.hasAccount')}{' '}
                                <Link
                                    to="/login"
                                    className="text-primary hover:text-orange-600 font-bold ml-1 hover:underline transition-colors"
                                >
                                    {t('common.signIn')}
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Features Strip */}
                    <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 flex items-center justify-around text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Multi-Entidad</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <span>Forecast Saldo</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>100% Privado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
