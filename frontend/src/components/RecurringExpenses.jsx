import { useState, useEffect } from 'react';
import { Card } from './Card';
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

    const getStatusStyle = (days) => {
        if (days < 0) return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'; // Overdue
        if (days <= 3) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'; // Due soon
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'; // Due later
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
            <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-black text-lg">
                    <span className="material-icons-round text-primary">event_upcoming</span>
                    {t('dashboard.recurring.title')}
                </h3>
            </div>

            {recurring.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
                    <span className="material-icons-round text-4xl mb-2 opacity-20">check_circle</span>
                    <p className="text-xs font-bold">{t('dashboard.recurring.noRecurring')}</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                    {recurring.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <span className="material-icons-round">receipt_long</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm line-clamp-1 text-slate-800 dark:text-slate-200">{item.description}</p>
                                    <p className="text-xs text-slate-500 font-bold">{formatCurrency(item.avgAmount)}</p>
                                </div>
                            </div>

                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusStyle(item.daysUntilDue)}`}>
                                {formatDue(item.daysUntilDue)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
