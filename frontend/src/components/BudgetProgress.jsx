import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';
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
            // currentDate is a Date object, format to YYYY-MM
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
        if (percent >= 100) return 'bg-red-500';
        if (percent >= 80) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    if (loading) return <Card className="animate-pulse h-48" />;
    // if (status.length === 0) return null; // Don't show if no budgets

    return (
        <Card className="mb-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400 border border-emerald-400/30 p-0.5 rounded" />
                {t('dashboard.budgets.title')}
            </h3>

            {status.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                    <p>{t('dashboard.budgets.noBudgets') || "No hay presupuestos activos"}</p>
                </div>
            ) : (
                <div className="space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {status.map((item, idx) => {
                        const isOver = item.percent >= 100;
                        return (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="font-medium text-slate-200 text-sm">{item.budget.category.name}</span>
                                    <div className="text-xs font-mono text-gray-400">
                                        <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                            {formatCurrency(item.spent)}
                                        </span>
                                        {' / '}
                                        <span>{formatCurrency(item.budget.amount)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                                    <div
                                        className={`h-2.5 rounded-full ${getProgressColor(item.percent)} transition-all duration-500`}
                                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                                    />
                                </div>

                                <p className="text-xs text-right mt-1 text-gray-500 group-hover:text-gray-400 transition-colors">
                                    {isOver ? (
                                        <span className="text-red-400 flex items-center justify-end gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {t('dashboard.budgets.overBy', { amount: formatCurrency(Math.abs(item.remaining)) })}
                                        </span>
                                    ) : (
                                        <span>{t('dashboard.budgets.left', { amount: formatCurrency(item.remaining) })}</span>
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );

};
