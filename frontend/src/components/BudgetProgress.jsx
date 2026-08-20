import { useState, useEffect } from 'react';
import { Card } from './Card';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import { HandCoins, MessageSquareWarning, CheckCircle2 } from 'lucide-react';

export const BudgetProgress = ({ currentDate }) => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
    const { formatCurrency } = useAuth();
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEntity) {
            fetchStatus();
        }
    }, [selectedEntity, currentDate]);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const monthStr = currentDate.toISOString().slice(0, 7);
            const res = await api.get('/budgets/status', {
                params: { entityId: selectedEntity.id, month: monthStr }
            });
            setStatus(res.data);
        } catch (error) {
            console.error('Error fetching budget status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = (percent) => {
        if (percent >= 100) return 'bg-rose-500';
        if (percent >= 80) return 'bg-amber-500';
        return 'bg-primary';
    };

    if (loading) return <Card className="animate-pulse h-48" />;

    return (
        <Card className="bg-card-light p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className='flex justify-between items-center mb-6'>
                <h3 className="flex items-center gap-2 font-bold text-lg">
                    <HandCoins className="w-5 h-5 text-primary" />
                    {t('dashboard.budgets.title')}
                </h3>
            </div>

            {status.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
                    <p className="font-bold">{t('dashboard.budgets.noBudgets') || "No hay presupuestos activos"}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {status.map((item, idx) => {
                        const isOver = item.percent >= 100;
                        return (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.budget.category.name}</span>
                                    <div className="text-slate-500">
                                        <span className={isOver ? 'text-rose-500' : 'text-slate-900'}>
                                            {formatCurrency(item.spent)}
                                        </span>
                                        <span className="mx-1 text-slate-400">/</span>
                                        <span className="text-slate-500">{formatCurrency(item.budget.amount)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className={`${getProgressColor(item.percent)} bg-primary h-full rounded-full`}
                                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-slate-400">{item.percent.toFixed(0)}% Utilizado</span>
                                    <p className="text-xs text-slate-500">
                                        {isOver ? (
                                            <span className="text-rose-500 flex items-center gap-1 transition-colors">
                                                <MessageSquareWarning className="material-icons-round" />
                                                {t('dashboard.budgets.overBy', { amount: formatCurrency(Math.abs(item.remaining)) })}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">{t('dashboard.budgets.left', { amount: formatCurrency(item.remaining) })}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );

};
