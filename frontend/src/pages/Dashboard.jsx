import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import api from '../api/client';
import { Card } from '../components/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { RecurringExpenses } from '../components/RecurringExpenses';
import { BudgetProgress } from '../components/BudgetProgress';
import { FullScreenLoader } from '../components/FullScreenLoader';

export const Dashboard = () => {
    const { selectedEntity } = useEntity();
    const { t, i18n } = useTranslation();

    const [filterMode, setFilterMode] = useState('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());

    const [summary, setSummary] = useState({ income: 0, expense: 0, savings: 0 });
    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);

    const locale = i18n.language.startsWith('es') ? es : enUS;

    useEffect(() => {
        if (selectedEntity) {
            fetchStats();
        }
    }, [selectedEntity, currentDate, filterMode]);

    const getRange = () => {
        let start, end;
        const now = currentDate;

        switch (filterMode) {
            case 'MONTH':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'Q1': start = startOfQuarter(new Date(now.getFullYear(), 0, 1)); end = endOfQuarter(new Date(now.getFullYear(), 0, 1)); break;
            case 'Q2': start = startOfQuarter(new Date(now.getFullYear(), 3, 1)); end = endOfQuarter(new Date(now.getFullYear(), 3, 1)); break;
            case 'Q3': start = startOfQuarter(new Date(now.getFullYear(), 6, 1)); end = endOfQuarter(new Date(now.getFullYear(), 6, 1)); break;
            case 'Q4': start = startOfQuarter(new Date(now.getFullYear(), 9, 1)); end = endOfQuarter(new Date(now.getFullYear(), 9, 1)); break;
            case 'YEAR':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            default:
                start = startOfMonth(now);
                end = endOfMonth(now);
        }
        return { start, end };
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { start, end } = getRange();
            const params = {
                entityId: selectedEntity.id,
                from: format(start, 'yyyy-MM-dd'),
                to: format(end, 'yyyy-MM-dd')
            };

            const [summaryRes, expenseRes, incomeRes, forecastRes] = await Promise.all([
                api.get('/stats/summary', { params }),
                api.get('/stats/categories', { params: { ...params, type: 'EXPENSE' } }),
                api.get('/stats/categories', { params: { ...params, type: 'INCOME' } }),
                api.get('/stats/forecast', { params: { entityId: selectedEntity.id } })
            ]);

            setSummary(summaryRes.data);
            setExpenseData(expenseRes.data);
            setIncomeData(incomeRes.data);
            setForecast(forecastRes.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleFilterChange = (e) => {
        const val = e.target.value;
        const now = new Date();

        if (val === 'PREV_MONTH') {
            setFilterMode('MONTH');
            setCurrentDate(subMonths(now, 1));
        } else if (val === 'THIS_MONTH') {
            setFilterMode('MONTH');
            setCurrentDate(now);
        } else if (val.startsWith('Q')) {
            setFilterMode(val);
            setCurrentDate(now);
        } else if (val === 'YEAR') {
            setFilterMode('YEAR');
            setCurrentDate(now);
        } else {
            setFilterMode('MONTH');
        }
    };

    const navigateDate = (direction) => {
        const factor = direction === 'next' ? 1 : -1;
        if (filterMode === 'MONTH') setCurrentDate(d => subMonths(d, -factor));
        else if (filterMode === 'YEAR') setCurrentDate(d => subMonths(d, -factor * 12));
        else if (filterMode.startsWith('Q')) setCurrentDate(d => subMonths(d, -factor * 12));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amount));
    };

    const getLabel = () => {
        if (filterMode === 'MONTH') return format(currentDate, 'MMMM yyyy', { locale });
        if (filterMode === 'YEAR') return format(currentDate, 'yyyy');
        if (filterMode.startsWith('Q')) return `${filterMode} ${format(currentDate, 'yyyy')}`;
        return '';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader message={t('common.loadingStats') || 'Actualizando datos...'} />}

            {/* Header & Navigation */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shadow-sm">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-primary"
                        >
                            <span className="material-icons-round text-lg">chevron_left</span>
                        </button>
                        <span className="px-4 text-sm font-bold min-w-[120px] text-center capitalize">{getLabel()}</span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-primary"
                        >
                            <span className="material-icons-round text-lg">chevron_right</span>
                        </button>
                    </div>
                    <div className="relative">
                        <select
                            onChange={handleFilterChange}
                            defaultValue="THIS_MONTH"
                            className="appearance-none bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none cursor-pointer text-sm font-bold shadow-sm transition-all text-slate-700 dark:text-slate-200"
                        >
                            <option value="THIS_MONTH">{t('dashboard.filters.thisMonth')}</option>
                            <option value="PREV_MONTH">{t('dashboard.filters.prevMonth')}</option>
                            <option value="Q1">{t('dashboard.filters.q1')}</option>
                            <option value="Q2">{t('dashboard.filters.q2')}</option>
                            <option value="Q3">{t('dashboard.filters.q3')}</option>
                            <option value="Q4">{t('dashboard.filters.q4')}</option>
                            <option value="YEAR">{t('dashboard.filters.year')}</option>
                        </select>
                        <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-700 dark:text-slate-200"
                    >
                        <span className="material-icons-round text-sm">sync</span>
                        Sincronizar
                    </button>
                </div>
            </header>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">{t('dashboard.monthlyIncome')}</span>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                            <span className="material-icons-round">trending_up</span>
                        </div>
                    </div>
                    <div className="text-3xl font-black tracking-tight">{formatCurrency(summary.income)}</div>
                    {summary.prevIncome > 0 && (
                        <div className={`mt-2 text-xs flex items-center gap-1 font-bold ${summary.income >= summary.prevIncome ? 'text-emerald-500' : 'text-slate-400'}`}>
                            <span className="material-icons-round text-xs">{summary.income >= summary.prevIncome ? 'arrow_upward' : 'arrow_downward'}</span>
                            {((Math.abs(summary.income - summary.prevIncome) / summary.prevIncome) * 100).toFixed(1)}% vs anterior
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">{t('dashboard.monthlyExpenses')}</span>
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                            <span className="material-icons-round">trending_down</span>
                        </div>
                    </div>
                    <div className="text-3xl font-black tracking-tight">{formatCurrency(summary.expense)}</div>
                    {summary.prevExpense > 0 && (
                        <div className={`mt-2 text-xs flex items-center gap-1 font-bold ${summary.expense <= summary.prevExpense ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <span className="material-icons-round text-xs">{summary.expense <= summary.prevExpense ? 'arrow_downward' : 'arrow_upward'}</span>
                            {((Math.abs(summary.expense - summary.prevExpense) / summary.prevExpense) * 100).toFixed(1)}% vs anterior
                        </div>
                    )}
                </Card>

                <Card className="bg-primary p-6 text-white border-none shadow-xl shadow-primary/20">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-white/80 text-sm font-bold">{t('dashboard.totalBalance')}</span>
                        <div className="p-2 bg-white/20 rounded-xl">
                            <span className="material-icons-round text-white">account_balance_wallet</span>
                        </div>
                    </div>
                    <div className="text-3xl font-black tracking-tight">{forecast ? formatCurrency(forecast.currentBalance) : '...'}</div>
                    <div className="mt-4 flex gap-4 text-xs text-white/90">
                        {forecast && (
                            <>
                                <div>
                                    <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Disponible</p>
                                    <p className="font-black text-sm">{formatCurrency(forecast.available)}</p>
                                </div>
                                {forecast.reserved > 0 && (
                                    <div>
                                        <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">En Objetivos</p>
                                        <p className="font-black text-sm">{formatCurrency(forecast.reserved)}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {/* Projection Chart / Forecast */}
            {forecast && (
                <Card className="p-8">
                    <h3 className="flex items-center gap-2 font-black text-lg mb-8">
                        <span className="material-icons-round text-primary">auto_graph</span>
                        {t('dashboard.forecast.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">{t('dashboard.forecast.burnRate')}</p>
                            <p className="text-2xl font-black">{formatCurrency(forecast.dailyBurnRate)}</p>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className="bg-primary h-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">{t('dashboard.forecast.daysLeft')}</p>
                            <p className="text-2xl font-black">{forecast.daysLeft} días</p>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className="bg-primary h-full" style={{ width: '90%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">{t('dashboard.forecast.projectedBalance')}</p>
                            <p className={`text-2xl font-black ${forecast.projectedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(forecast.projectedBalance)}
                            </p>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className={`${forecast.projectedBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} h-full`} style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Categorized Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CategoryChart
                            title={t('dashboard.expensesByCategory')}
                            data={expenseData}
                            formatCurrency={formatCurrency}
                            emptyMessage={t('dashboard.noExpenses')}
                        />
                        <CategoryChart
                            title={t('dashboard.incomeByCategory')}
                            data={incomeData}
                            formatCurrency={formatCurrency}
                            emptyMessage={t('dashboard.noIncome')}
                        />
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-8">
                    {/* Active Alerts */}
                    {summary.activeAlerts?.length > 0 && (
                        <Card className="border-amber-500/20 bg-amber-500/5">
                            <h3 className="text-sm font-black text-amber-500 mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-lg">warning</span>
                                Alertas Activas ({summary.activeAlerts.length})
                            </h3>
                            <div className="space-y-3">
                                {summary.activeAlerts.slice(0, 3).map(alert => (
                                    <div key={alert.id} className="text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white dark:border-white/5 shadow-sm">
                                        {alert.message}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Top Expenses */}
                    <Card>
                        <h3 className="text-sm font-black mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-rose-500">priority_high</span>
                            Mayores Gastos del Mes
                        </h3>
                        <div className="space-y-4">
                            {expenseData.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{item.category}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatCurrency(item.total)}</span>
                                </div>
                            ))}
                            {expenseData.length === 0 && <p className="text-xs text-slate-500 italic">No hay gastos registrados</p>}
                        </div>
                    </Card>

                    <RecurringExpenses />
                    <BudgetProgress currentDate={currentDate} />
                </div>
            </div>
        </div>
    );
};

// Sub-component for Chart + Legend
const CategoryChart = ({ title, data, formatCurrency, emptyMessage }) => {
    const safeData = data.map(d => ({
        ...d,
        total: Number(d.total),
        fillColor: d.category === 'Uncategorized' ? '#e2e8f0' : (d.color || '#ff8404')
    }));

    const totalValue = safeData.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <Card className="flex flex-col">
            <h3 className="text-lg font-black mb-8 px-2">{title}</h3>

            {safeData.length > 0 ? (
                <div className="flex flex-col items-center gap-8">
                    <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={safeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="category"
                                    isAnimationActive={true}
                                    stroke="none"
                                >
                                    {safeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fillColor} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        color: '#0f172a'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black tracking-tighter">{formatCurrency(totalValue).split(',')[0]}€</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                        </div>
                    </div>

                    <div className="w-full space-y-4 px-2">
                        {safeData.map((item, idx) => {
                            const percent = totalValue > 0 ? ((item.total / totalValue) * 100).toFixed(1) : 0;
                            return (
                                <div key={idx} className="flex items-center justify-between text-xs group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: item.fillColor }}
                                        />
                                        <span className="text-slate-600 dark:text-slate-400 font-bold group-hover:text-primary transition-colors truncate max-w-[140px]" title={item.category}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-slate-400 font-black">
                                            {percent}%
                                        </span>
                                        <span className="font-black text-slate-900 dark:text-white">
                                            {formatCurrency(item.total)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
                    {emptyMessage}
                </div>
            )}
        </Card>
    );
};
