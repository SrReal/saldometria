import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, getDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export const Calendar = () => {
    const { t, i18n } = useTranslation();
    const { selectedEntity } = useEntity();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);

    const locale = i18n.language.startsWith('es') ? es : enUS;

    useEffect(() => {
        if (selectedEntity) {
            fetchEvents();
        }
    }, [selectedEntity, currentDate]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const monthStr = format(currentDate, 'yyyy-MM');
            const res = await api.get('/stats/calendar', {
                params: { entityId: selectedEntity.id, month: monthStr }
            });
            setEvents(res.data);
            setSelectedDay(null);
        } catch (error) {
            console.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (dir) => {
        setCurrentDate(prev => dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDayOfWeek = getDay(monthStart);
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = Array.from({ length: monthEnd.getDate() }, (_, i) => i + 1);
    const blanks = Array.from({ length: offset }, (_, i) => i);

    const getEventsForDay = (day) => {
        const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const targetStr = format(target, 'yyyy-MM-dd');
        return events.filter(e => e.date === targetStr);
    };

    const handleDayClick = (day) => {
        const evs = getEventsForDay(day);
        if (evs.length > 0) {
            setSelectedDay({ day, events: evs });
        } else {
            setSelectedDay(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader message="Cargando calendario..." />}

            {/* Header Area */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">calendar_month</span>
                        {t('calendar.title') || 'Calendario Financiero'}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1 capitalize">{format(currentDate, 'MMMM yyyy', { locale })}</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 active:scale-95"
                    >
                        <span className="material-icons-round">chevron_left</span>
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 active:scale-95"
                    >
                        <span className="material-icons-round">chevron_right</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Calendar Card */}
                <Card className="lg:col-span-3 p-6 shadow-sm border-none">
                    <div className="grid grid-cols-7 mb-6 text-center">
                        {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                            <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                        {blanks.map(i => (
                            <div key={`blank-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl opacity-30" />
                        ))}

                        {daysInMonth.map(day => {
                            const dayEvents = getEventsForDay(day);
                            const income = dayEvents.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
                            const expense = dayEvents.filter(e => e.type !== 'INCOME').reduce((sum, e) => sum + e.amount, 0);
                            const hasRecurring = dayEvents.some(e => e.type === 'RECURRING_EXPENSE');
                            const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                            const isSelected = selectedDay && selectedDay.day === day;

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        aspect-square p-3 rounded-2xl transition-all cursor-pointer relative group flex flex-col justify-between border-2
                                        ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-slate-50/30 dark:bg-slate-800/30'}
                                        ${isToday ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-black ${isToday ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {day}
                                    </span>

                                    <div className="space-y-0.5 text-[10px] text-right font-black flex flex-col items-end">
                                        {income > 0 && <div className="text-emerald-500">+{Math.round(income)}€</div>}
                                        {expense > 0 && <div className="text-rose-500">-{Math.round(expense)}€</div>}
                                    </div>

                                    {hasRecurring && (
                                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Sidebar Details */}
                <Card className="lg:col-span-1 p-6 border-none shadow-sm flex flex-col h-fit">
                    <h3 className="text-sm font-black mb-8 border-b border-primary/10 pb-4 uppercase tracking-wider text-slate-500">
                        {selectedDay
                            ? format(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.day), 'EEEE d MMM', { locale })
                            : t('calendar.selectDay') || 'Detalles del día'}
                    </h3>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedDay ? (
                            selectedDay.events.map((ev, idx) => (
                                <div key={idx} className="flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-primary/20 transition-all hover:translate-x-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2">{ev.description}</span>
                                        <span className={`text-sm font-black whitespace-nowrap ${ev.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {ev.type === 'INCOME' ? '+' : '-'}{formatCurrency(ev.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm
                                            ${ev.status === 'PROJECTED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                                        `}>
                                            {ev.status === 'PROJECTED' ? 'Estimado' : 'Real'}
                                        </span>
                                        {ev.type === 'RECURRING_EXPENSE' && (
                                            <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm border border-primary/5">Recurrente</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-4 ring-8 ring-slate-50/50 dark:ring-slate-800/50">
                                    <span className="material-icons-round text-4xl">event_note</span>
                                </div>
                                <p className="text-slate-400 font-bold text-xs">{t('calendar.selectDayPrompt') || 'Selecciona un día para ver los detalles'}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
