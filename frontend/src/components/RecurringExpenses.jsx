import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';

export const RecurringExpenses = () => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
    const [recurring, setRecurring] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEntity) {
            fetchRecurring();
        }
    }, [selectedEntity]);

    const fetchRecurring = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stats/recurring?entityId=${selectedEntity.id}`);
            setRecurring(res.data);
        } catch (error) {
            console.error('Error fetching recurring:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (days) => {
        if (days < 0) return 'text-red-400'; // Overdue
        if (days <= 3) return 'text-yellow-400'; // Due soon
        return 'text-emerald-400'; // Due later
    };

    const formatDue = (days) => {
        if (days < 0) return t('dashboard.recurring.overdue', { days: Math.abs(days) });
        if (days === 0) return t('dashboard.recurring.dueToday');
        return t('dashboard.recurring.dueIn', { days });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    if (loading) return <Card className="animate-pulse h-48" />;

    return (
        <Card className="flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400 border border-blue-400/30 p-0.5 rounded" />
                {t('dashboard.recurring.title')}
            </h3>

            {recurring.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">{t('dashboard.recurring.noRecurring')}</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {recurring.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-200">{item.description}</span>
                                <span className="text-xs text-slate-500 font-mono">
                                    {t('dashboard.recurring.avgAmount', { amount: formatCurrency(item.avgAmount) })}
                                </span>
                            </div>

                            <div className={`text-right text-xs font-semibold ${getStatusColor(item.daysUntilDue)} bg-slate-900/50 px-2 py-1 rounded border border-white/5`}>
                                {formatDue(item.daysUntilDue)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
