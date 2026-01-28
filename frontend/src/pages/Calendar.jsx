import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
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
            setSelectedDay(null); // Reset selection on month change
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

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday
    // Adjust for Monday start (Spain)
    // 0(Sun) -> 6, 1(Mon) -> 0
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
        <div className="max-w-7xl mx-auto space-y-6 relative h-[calc(100vh-100px)] flex flex-col">
            {loading && <FullScreenLoader message="Cargando calendario..." />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-blue-500" />
                        {t('calendar.title') || 'Calendario Financiero'}
                    </h2>
                    <p className="text-gray-400">{format(currentDate, 'MMMM yyyy', { locale })}</p>
                </div>

                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-700 rounded"><ChevronLeft /></button>
                    <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-700 rounded"><ChevronRight /></button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2 overflow-y-auto flex flex-col">
                    <div className="grid grid-cols-7 mb-4 text-center text-gray-400 text-sm font-medium border-b border-slate-700 pb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {blanks.map(i => <div key={`blank-${i}`} className="min-h-[80px] bg-slate-900/20 rounded" />)}

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
                                    style={{
                                        minHeight: '140px',
                                        border: isSelected ? '2px solid #3b82f6' : '1px solid #94a3b8',
                                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)'
                                    }}
                                    className={`
                                        p-2 rounded-lg transition-all cursor-pointer relative group flex flex-col justify-between
                                        ${!isSelected && 'hover:bg-slate-800'}
                                        ${isToday ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>{day}</span>

                                    <div className="space-y-0.5 text-xs text-right">
                                        {income > 0 && <div className="text-emerald-400 font-bold">+{Math.round(income)}</div>}
                                        {expense > 0 && <div className="text-red-400 font-bold">-{Math.round(expense)}</div>}
                                    </div>

                                    {hasRecurring && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Sidebar Details */}
                <Card className="overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">
                        {selectedDay
                            ? format(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.day), 'EEEE d, MMMM', { locale })
                            : t('calendar.selectDay') || 'Selecciona un día'}
                    </h3>

                    {selectedDay ? (
                        <div className="space-y-4">
                            {selectedDay.events.map((ev, idx) => (
                                <div key={idx} className="flex flex-col p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-slate-100">{ev.description}</span>
                                        <span className={`font-bold ${ev.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {ev.type === 'INCOME' ? '+' : '-'}{formatCurrency(ev.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider
                                            ${ev.status === 'PROJECTED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-700 text-slate-400'}
                                        `}>
                                            {ev.status === 'PROJECTED' ? 'Estimado' : 'Real'}
                                        </span>
                                        {ev.type === 'RECURRING_EXPENSE' && (
                                            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Recurrente</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                            <p>Haz clic en un día para ver los movimientos</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
