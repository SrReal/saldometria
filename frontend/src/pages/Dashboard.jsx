import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import {
    ChevronLeft, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Wallet,
    ChartColumn, BanknoteX, TriangleAlert, OctagonX, MessageCircleWarning, BellRing
} from 'lucide-react';
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
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('THIS_MONTH');

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown]')) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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

            console.log('Summary response:', summaryRes.data);
            setSummary(summaryRes.data);
            setExpenseData(expenseRes.data);
            setIncomeData(incomeRes.data);
            setForecast(forecastRes.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setTimeout(() => setLoading(false), 1500);
        }
    };

    const handleFilterChange = (val) => {
        const now = new Date();
        setSelectedFilter(val);
        setShowFilterDropdown(false);

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
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-primary"
                        >
                            <ChevronLeft className="material-icons-round text-lg" />
                        </button>
                        <span className="px-3 text-sm font-medium capitalize">{getLabel()}</span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-primary"
                        >
                            <ChevronRight className="material-icons-round text-lg" />
                        </button>
                    </div>
                    <div className="relative" data-dropdown>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all min-w-[140px] justify-between"
                        >
                            <span>
                                {selectedFilter === 'THIS_MONTH' && t('dashboard.filters.thisMonth')}
                                {selectedFilter === 'PREV_MONTH' && t('dashboard.filters.prevMonth')}
                                {selectedFilter === 'Q1' && t('dashboard.filters.q1')}
                                {selectedFilter === 'Q2' && t('dashboard.filters.q2')}
                                {selectedFilter === 'Q3' && t('dashboard.filters.q3')}
                                {selectedFilter === 'Q4' && t('dashboard.filters.q4')}
                                {selectedFilter === 'YEAR' && t('dashboard.filters.year')}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="py-1">
                                    <button onClick={() => handleFilterChange('THIS_MONTH')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'THIS_MONTH' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.thisMonth')}
                                    </button>
                                    <button onClick={() => handleFilterChange('PREV_MONTH')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'PREV_MONTH' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.prevMonth')}
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button onClick={() => handleFilterChange('Q1')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'Q1' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.q1')}
                                    </button>
                                    <button onClick={() => handleFilterChange('Q2')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'Q2' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.q2')}
                                    </button>
                                    <button onClick={() => handleFilterChange('Q3')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'Q3' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.q3')}
                                    </button>
                                    <button onClick={() => handleFilterChange('Q4')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'Q4' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.q4')}
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button onClick={() => handleFilterChange('YEAR')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedFilter === 'YEAR' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        {t('dashboard.filters.year')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card-light p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-sm font-medium">{t('dashboard.monthlyIncome')}</span>
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp className="material-icons-round" />
                        </div>
                    </div>
                    <div className="text-3xl font-black">{formatCurrency(summary.income)}</div>
                    {summary.prevIncome > 0 && (
                        <div className={`mt-2 text-xs flex items-center gap-1 font-medium ${summary.income >= summary.prevIncome ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {summary.income >= summary.prevIncome ? <TrendingUp /> : <TrendingDown />}
                            {((Math.abs(summary.income - summary.prevIncome) / summary.prevIncome) * 100).toFixed(1)}% vs anterior
                        </div>
                    )}
                </Card>

                <Card className="bg-card-light p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-sm font-medium">{t('dashboard.monthlyExpenses')}</span>
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <TrendingDown className="material-icons-round" />
                        </div>
                    </div>
                    <div className="text-3xl font-black">{formatCurrency(summary.expense)}</div>
                    {summary.prevExpense > 0 && (
                        <div className={`mt-2 text-xs flex items-center gap-1 font-medium ${summary.expense <= summary.prevExpense ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {summary.expense <= summary.prevExpense ? <TrendingDown /> : <TrendingUp />}
                            {((Math.abs(summary.expense - summary.prevExpense) / summary.prevExpense) * 100).toFixed(1)}% vs anterior
                        </div>
                    )}
                </Card>

                <Card className="bg-primary p-6 rounded-2xl shadow-lg shadow-primary/20 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-white/80 text-sm font-medium">{t('dashboard.totalBalance')}</span>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Wallet className="material-icons-round" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold">{forecast ? formatCurrency(forecast.currentBalance) : '...'}</div>
                    <div className="mt-4 flex gap-4 text-xs text-white/90">
                        {forecast && (
                            <>
                                <div>
                                    <p className="text-white/60">Disponible</p>
                                    <p className="font-semibold">{formatCurrency(forecast.available)}</p>
                                </div>
                                {forecast.reserved > 0 && (
                                    <div>
                                        <p className="text-white/60">En Objetivos</p>
                                        <p className="font-semibold">{formatCurrency(forecast.reserved)}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {/* Projection Chart / Forecast */}
            {forecast && (
                <Card className="bg-card-light p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <h3 className="flex items-center gap-2 font-bold text-lg mb-8 mt-2">
                        <ChartColumn className="material-icons-round text-primary" />
                        {t('dashboard.forecast.title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">{t('dashboard.forecast.burnRate')}</p>
                            <p className="text-2xl font-bold">{formatCurrency(forecast.dailyBurnRate)}</p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, (forecast.dailyBurnRate / (summary.income / 30)) * 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">{t('dashboard.forecast.daysLeft')}</p>
                            <p className="text-2xl font-bold">{forecast.daysLeft} días</p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, ((new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() - forecast.daysLeft) / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()) * 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">{t('dashboard.forecast.projectedBalance')}</p>
                            <p className={`text-2xl font-bold ${forecast.projectedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(forecast.projectedBalance)}
                            </p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                                <div className={`${forecast.projectedBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} h-full`} style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <RecurringExpenses />
                <BudgetProgress currentDate={currentDate} />
            </div>

            {/* Top Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="bg-card-light p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-lg mb-8">
                        <BanknoteX className="material-icons-round text-primary" />
                        {t('dashboard.topExpenses')}
                    </h3>
                    <div className="w-full space-y-3">
                        {expenseData.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.category}</span>
                                </div>
                                <span className="font-semibold">{formatCurrency(item.total)}</span>
                            </div>
                        ))}
                        {expenseData.length === 0 && <p className="text-xs text-slate-500 italic">{t('dashboard.noExpensesRecorded')}</p>}
                    </div>
                </Card>
                {summary.activeAlerts?.length > 0 && (
                    <Card className="bg-card-light p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="space-y-8">
                            {/* Active Alerts */}
                            <h3 className="flex items-center gap-2 font-bold text-lg mb-8">
                                <TriangleAlert className="text-primary" />
                                {t('dashboard.alerts.title')} ({summary.activeAlerts.length})
                            </h3>
                            <div className="w-full space-y-3">
                                {summary.activeAlerts.slice(0, 3).map(alert => {
                                    // Generar mensaje si no existe o formatearlo
                                    const getMessage = () => {
                                        // Para LOW_BALANCE, generar mensaje con saldo formateado
                                        if (alert.type === 'LOW_BALANCE' && alert.account?.balance !== undefined) {
                                            return `${t('dashboard.alerts.lowBalance')}: ${formatCurrency(alert.account.balance)}`;
                                        }
                                        if (alert.message) return alert.message;
                                        switch (alert.type) {
                                            case 'LOW_BALANCE':
                                                return t('dashboard.alerts.lowBalance');
                                            case 'BUDGET_EXCEEDED':
                                                return t('dashboard.alerts.budgetExceeded');
                                            case 'LARGE_TRANSACTION':
                                                return t('dashboard.alerts.largeTransaction', { amount: formatCurrency(alert.threshold) });
                                            default:
                                                return t('dashboard.alerts.configured');
                                        }
                                    };
                                    // Obtener contexto (cuenta o categoría)
                                    const getContext = () => {
                                        if (alert.account?.name) return alert.account.name;
                                        if (alert.category?.name) return alert.category.name;
                                        return null;
                                    };
                                    const context = getContext();
                                    return (
                                        <div key={alert.id} className="flex items-start gap-3 text-sm text-slate-600 bg-amber-50 p-3 rounded-xl">
                                            {alert.status === 'TRIGGERED' ? <OctagonX className={`material-icons-round text-sm mt-0.5 ${alert.status === 'TRIGGERED' ? 'text-rose-500' : 'text-amber-500'}`} /> : <MessageCircleWarning className={`material-icons-round text-sm mt-0.5 ${alert.status === 'TRIGGERED' ? 'text-rose-500' : 'text-amber-500'}`} />}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium">{getMessage()}
                                                        {alert.status === 'TRIGGERED' && (
                                                            <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><BellRing className="w-3 h-3" /> {t('dashboard.alerts.triggered')}</p>
                                                        )}
                                                    </p>
                                                    {context && (
                                                        <div className="text-right">
                                                            <span className={`text-sm ${alert.status === 'TRIGGERED' ? 'bg-rose-500' : 'bg-amber-500'} text-white px-2 py-0.5 rounded-full`}>
                                                                {context}
                                                            </span>
                                                            {alert.type === 'LOW_BALANCE' && alert.threshold && (
                                                                <p className="text-[10px] text-slate-400 mt-1">
                                                                    {t('dashboard.alerts.belowThreshold', { amount: formatCurrency(alert.threshold) })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Main Content Areas */}
                {/* Categorized Charts Row */}
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
        <Card className="bg-card-light p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-6">{title}</h3>

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

                    <div className="w-full space-y-3">
                        {safeData.map((item, idx) => {
                            const percent = totalValue > 0 ? ((item.total / totalValue) * 100).toFixed(1) : 0;
                            return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.fillColor }}
                                        />
                                        <span title={item.category}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 ml-1">
                                            ({percent}%)
                                        </span>
                                        <span className="font-semibold">
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
