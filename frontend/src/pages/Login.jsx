import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-primary/20 rounded-full mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">SaldoMetria</h1>
                    <p className="text-gray-400">{t('common.welcomeBack')}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label={t('common.email')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label={t('common.password')}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="mt-2">{t('common.signIn')}</Button>
                </form>

                <p className="text-center mt-6 text-gray-400">
                    {t('common.noAccount')} <Link to="/register" className="text-primary hover:text-primary-hover">{t('common.signUp')}</Link>
                </p>
            </Card>
        </div>
    );
};
