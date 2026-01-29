import { useState, useEffect } from 'react';
import { Card } from './Card';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';

export const BudgetProgress = ({ currentDate }) => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getProgressColor = (percent) => {
        if (percent >= 100) return 'bg-rose-500';
        if (percent >= 80) return 'bg-amber-500';
        return 'bg-primary';
    };

    if (loading) return <Card className="animate-pulse h-48" />;

    return (
        <Card className="mb-4">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <span className="material-icons-round text-primary">track_changes</span>
                {t('dashboard.budgets.title')}
            </h3>

            {status.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                    <span className="material-icons-round text-4xl mb-2 opacity-20">assignment_turned_in</span>
                    <p className="font-bold">{t('dashboard.budgets.noBudgets') || "No hay presupuestos activos"}</p>
                </div>
            ) : (
                <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {status.map((item, idx) => {
                        const isOver = item.percent >= 100;
                        return (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">{item.budget.category.name}</span>
                                    <div className="text-[11px] font-black tracking-tight">
                                        <span className={isOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>
                                            {formatCurrency(item.spent)}
                                        </span>
                                        <span className="mx-1 text-slate-400">/</span>
                                        <span className="text-slate-500">{formatCurrency(item.budget.amount)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full rounded-full ${getProgressColor(item.percent)} transition-all duration-700 ease-out shadow-sm`}
                                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] font-black text-slate-400">{item.percent.toFixed(0)}% Utilizado</span>
                                    <p className="text-[10px] font-bold">
                                        {isOver ? (
                                            <span className="text-rose-500 flex items-center gap-1 transition-colors">
                                                <span className="material-icons-round text-[12px]">warning</span>
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
