import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export const Profile = () => {
    const { user, login, updateUser } = useAuth();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('€');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
            setEmail(user.email);
            setCurrency(user.currency || '€');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('profile.passwordsDoNotMatch') || 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: name !== user.name ? name : undefined,
                email: email !== user.email ? email : undefined,
                currency: currency !== user.currency ? currency : undefined,
                newPassword: newPassword || undefined
            };

            const response = await api.patch('/auth/me', payload);

            if (response.data.ok) {
                updateUser(response.data.user);
                setMessage({ type: 'success', text: t('profile.success') || 'Profile updated successfully' });
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <span className="material-icons-round text-primary text-4xl">account_circle</span>
                    {t('nav.profile') || 'User Profile'}
                </h2>
                <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('profile.subtitle') || 'Manage your account settings'}</p>
            </header>

            <Card className="p-8 border-none shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* User Info Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <span className="material-icons-round text-primary text-base">person</span>
                            {t('profile.personalInfo') || 'Personal Information'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label={t('settings.form.name') || 'Name'}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('settings.form.name')}
                                required
                            />

                            <Input
                                label={t('common.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 w-full md:w-1/2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">
                                {t('settings.form.currency') || 'Currency'}
                            </label>
                            <div className="relative">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm appearance-none"
                                >
                                    <option value="€">Euro (€)</option>
                                    <option value="$">US Dollar ($)</option>
                                    <option value="£">British Pound (£)</option>
                                    <option value="¥">Japanese Yen (¥)</option>
                                </select>
                                <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <span className="material-icons-round text-primary text-base">lock</span>
                            {t('profile.security') || 'Security'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label={t('profile.newPassword') || 'New Password'}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="********"
                            />
                            <Input
                                label={t('profile.confirmPassword') || 'Confirm Password'}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="********"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300 ${message.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 border border-rose-200 dark:border-rose-800/50'}`}>
                            <span className="material-icons-round">
                                {message.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <span className="text-sm font-black uppercase tracking-tight">{message.text}</span>
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <Button type="submit" loading={loading} className="h-12 px-8 min-w-[160px]">
                            <span className="material-icons-round">save</span>
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
