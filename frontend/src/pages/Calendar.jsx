import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, getDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';

export const Calendar = () => {
    const { t, i18n } = useTranslation();
    const { selectedEntity } = useEntity();
    const { formatCurrency } = useAuth();
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
        <div className="flex-1 overflow-y-auto space-y-6">
            {loading && <FullScreenLoader message="Cargando calendario..." />}

            {/* Header Area */}
            <div class="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-slate-800 capitalize tracking-wide">{format(currentDate, 'MMMM yyyy', { locale })}
                    </h2>
                </div>
                <div class="flex items-center gap-1">
                    <button class="p-2 hover:bg-slate-100 rounded-full text-primary flex items-center justify-center transition-all"
                        onClick={() => navigateMonth('prev')}>
                        <ChevronLeft />
                    </button>
                    <button class="p-2 hover:bg-slate-100 rounded-full text-primary flex items-center justify-center transition-all"
                        onClick={() => navigateMonth('next')}>
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Calendar Card */}
                <div className="calendar-grid border-b border-slate-200 bg-slate-50">
                    {(t('calendar.days', { returnObjects: true }) || ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']).map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold text-slate-400">{d}</div>
                    ))}
                </div>

                <div className="calendar-grid min-h-[500px]">
                    {blanks.map(i => (
                        <div key={`blank-${i}`} className="p-2 border-r border-b border-slate-100 bg-slate-50/30" />
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
                                className={`p-2 ${isToday ? 'border border-primary hover:bg-slate-50 bg-slate-50/30' :
                                    isSelected ? 'border border-primary bg-primary/5' : 'border-r border-b border-slate-100 min-h-[100px] hover:bg-slate-50 bg-slate-50/30'}`}
                            >
                                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                                    {day}
                                </span>

                                <div className="space-y-0.5 text-[10px] text-right font-black flex flex-col items-end">
                                    {income > 0 && <div className="text-[10px] font-bold text-emerald-500">+{formatNumber(income, 0)} {currencySymbol}</div>}
                                    {expense > 0 && <div className="text-[10px] font-bold text-rose-500">-{formatNumber(expense, 0)} {currencySymbol}</div>}
                                </div>

                                {hasRecurring && (
                                    <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sidebar Details */}
            <Card className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 capitalize">
                        {selectedDay
                            ? format(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.day), 'EEEE d MMM', { locale })
                            : t('calendar.selectDay') || 'Detalles del día'}
                    </h3>
                </div>

                <div className="divide-y divide-slate-100">
                    {selectedDay ?
                        (<>
                            {selectedDay.events.map((ev, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors no-select">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full ${ev.type === 'INCOME' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} flex items-center justify-center`}>
                                            {ev.type === 'INCOME' ?
                                                <TrendingUp className="w-5 h-5" /> :
                                                <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{ev.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs text-slate-500 ${ev.status === 'PROJECTED' ? 'bg-blue-100 text-blue-600' : ''}`}>{ev.status === 'PROJECTED' ? 'Estimado' : 'Real'}</span>
                                                <span className="text-xs text-slate-400">•</span>
                                                <span className="text-xs text-slate-500">{ev.type === 'RECURRING_EXPENSE' ? 'Recurrente' : 'Unico'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${ev.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {ev.type === 'INCOME' ? '+' : '-'}{formatCurrency(ev.amount)}
                                        </span>

                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-slate-50/30 flex justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('calendar.dailyBalance')}</p>
                                    {(() => {
                                        const income = selectedDay.events.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
                                        const expense = selectedDay.events.filter(e => e.type !== 'INCOME').reduce((sum, e) => sum + e.amount, 0);
                                        const balance = income - expense;
                                        return (
                                            <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </>) : (
                            <div className="text-center py-20 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white mb-4 ring-8 ring-primary/50">
                                    <CalendarIcon className="text-4xl" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">{t('calendar.selectDayPrompt') || 'Selecciona un día para ver los detalles'}</p>
                            </div>
                        )}
                </div>
            </Card>
        </div>
    );
};
