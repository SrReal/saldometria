import { useState, useEffect } from 'react';
import { Card } from './Card';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import { Calendar1, CircleCheckBig, Newspaper } from 'lucide-react';
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
        if (days < 0) return 'bg-rose-100 text-rose-600'; // Overdue
        if (days <= 3) return 'bg-amber-100 text-amber-600'; // Due soon
        return 'bg-slate-100 text-slate-500'; // Due later
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
        <Card className="bg-card-light p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                    <Calendar1 className="material-icons-round text-primary" />
                    {t('dashboard.recurring.title')}
                </h3>
            </div>
            {recurring.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
                    <CircleCheckBig className="material-icons-round text-4xl mb-2 text-emerald-500" />
                    <p className="text-xs font-bold">{t('dashboard.recurring.noRecurring')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recurring.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Newspaper className="material-icons-round" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm line-clamp-2">{item.description}</p>
                                    <p className="text-xs text-slate-500">{formatCurrency(item.avgAmount)}</p>
                                </div>
                            </div>

                            <span className={`text-xs font-medium px-2 py-1 text-rose-600 rounded ${getStatusStyle(item.daysUntilDue)}`}>
                                {formatDue(item.daysUntilDue)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
