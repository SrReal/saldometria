import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';

export const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

            <Card className="w-full max-w-md p-10 border-none shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-orange-600"></div>

                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5 group hover:-rotate-6 transition-all duration-300">
                        <span className="material-icons-round text-primary text-5xl">person_add_alt</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white mb-2">FinanceHub</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide uppercase opacity-60">{t('common.createAccount')}</p>
                </div>

                {error && (
                    <div className="bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 p-4 rounded-2xl mb-8 text-xs font-black uppercase tracking-tight flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="material-icons-round text-lg">error_outline</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label={t('common.email')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="h-12"
                    />
                    <Input
                        label={t('common.password')}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12"
                    />

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:translate-y-[-2px]"
                            loading={loading}
                        >
                            {t('common.signUp')}
                            <span className="material-icons-round text-lg">rocket_launch</span>
                        </Button>
                    </div>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                        {t('common.hasAccount')}{' '}
                        <Link to="/login" className="text-primary hover:text-orange-400 transition-colors decoration-2 underline-offset-4 ml-1">
                            {t('common.signIn')}
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};
