import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
    User,
    Mail,
    Lock,
    KeyRound,
    Coins,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Profile = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('€');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (data.ok) {
                    updateUser(data.user);
                }
            } catch (error) {
                console.error('Failed to fetch profile', error);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setCurrency(user.currency || '€');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword && newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('profile.passwordsDoNotMatch') || 'Las contraseñas no coinciden' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: name !== user?.name ? name : undefined,
                email: email !== user?.email ? email : undefined,
                currency: currency !== user?.currency ? currency : undefined,
                newPassword: newPassword || undefined
            };

            const response = await api.patch('/auth/me', payload);

            if (response.data.ok) {
                updateUser(response.data.user);
                setMessage({ type: 'success', text: t('profile.success') || 'Perfil y credenciales actualizados con éxito' });
                toast.success('Perfil actualizado correctamente');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Error al actualizar el perfil';
            setMessage({ type: 'error', text: errorMsg });
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Page Header */}
            <header className="pb-2 border-b border-slate-200">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    {t('nav.profile') || 'Mi Perfil de Usuario'}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                    {t('profile.subtitle') || 'Gestiona tu información personal, moneda por defecto y credenciales de acceso'}
                </p>
            </header>

            {/* Profile Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-orange-500 to-amber-400 absolute top-0 left-0"></div>

                {/* Feedback Message Banner */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-3 animate-in fade-in ${message.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* User Info Section */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
                            <User className="w-4 h-4 text-primary" />
                            {t('profile.personalInfo') || 'Información de la Cuenta'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('profile.name') || 'Nombre Completo'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('common.email') || 'Correo Electrónico'}
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
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                {t('profile.currency') || 'Moneda Predeterminada'}
                            </label>
                            <div className="relative max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Coins className="w-4 h-4 text-slate-400" />
                                </div>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all appearance-none"
                                >
                                    <option value="€">EUR (€) — Euro</option>
                                    <option value="$">USD ($) — Dólar Estadounidense</option>
                                    <option value="£">GBP (£) — Libra Esterlina</option>
                                    <option value="CHF">CHF (Fr) — Franco Suizo</option>
                                    <option value="MXN">MXN ($) — Peso Mexicano</option>
                                    <option value="COP">COP ($) — Peso Colombiano</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="space-y-5 pt-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
                            <KeyRound className="w-4 h-4 text-primary" />
                            {t('profile.security') || 'Seguridad y Cambio de Contraseña'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('profile.newPassword') || 'Nueva Contraseña'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Dejar en blanco para mantener la actual"
                                        minLength={6}
                                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('profile.confirmPassword') || 'Confirmar Nueva Contraseña'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repetir nueva contraseña"
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full sm:w-auto px-8"
                        >
                            <Save className="w-4 h-4" />
                            <span>{t('profile.saveChanges')}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
