import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const Profile = () => {
    const { user, login, updateUser } = useAuth(); // We might need to update user context if email changes
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

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
                newPassword: newPassword || undefined
            };

            const response = await api.patch('/auth/me', payload);

            if (response.data.ok) {
                updateUser(response.data.user);
                setMessage({ type: 'success', text: t('profile.success') || 'Profile updated successfully' });
                // If email changed, we might want to update local auth state, but for now we assume reload or re-login if critical. 
                // Ideally, AuthContext should have a generic update method, or we just reload window.
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
        <div className="max-w-2xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gradient mb-2">{t('nav.profile') || 'User Profile'}</h1>
                <p className="text-gray-400">{t('profile.subtitle') || 'Manage your account settings'}</p>
            </header>

            <Card className="p-6 border-blue-500/20">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-white/90 pb-2 border-b border-white/5">
                            <User className="w-5 h-5 text-indigo-400" />
                            {t('profile.personalInfo') || 'Personal Information'}
                        </div>

                        <Input
                            label={t('settings.form.name') || 'Name'}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('settings.form.name')}
                        />

                        <Input
                            label={t('common.email')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-white/90 pb-2 border-b border-white/5">
                            <Lock className="w-5 h-5 text-indigo-400" />
                            {t('profile.security') || 'Security'}
                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" loading={loading} className="gap-2">
                            <Save className="w-4 h-4" />
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
