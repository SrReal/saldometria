import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { useTranslation } from 'react-i18next';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import api from '../api/client';
import { Card } from '../components/Card';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { RecurringExpenses } from '../components/RecurringExpenses';
import { BudgetProgress } from '../components/BudgetProgress';

import { FullScreenLoader } from '../components/FullScreenLoader';

export const Dashboard = () => {
    const { selectedEntity } = useEntity();
    const { t, i18n } = useTranslation();

    const [filterMode, setFilterMode] = useState('MONTH'); // 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'
    const [currentDate, setCurrentDate] = useState(new Date());

    // For Quarter/Year modes, currentDate serves as the anchor

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
            case 'PREV_MONTH':
                // Note: handled elsewhere
                break;
            case 'Q1': start = startOfQuarter(new Date(now.getFullYear(), 0, 1)); end = endOfQuarter(new Date(now.getFullYear(), 0, 1)); break;
            case 'Q2': start = startOfQuarter(new Date(now.getFullYear(), 3, 1)); end = endOfQuarter(new Date(now.getFullYear(), 3, 1)); break;
            case 'Q3': start = startOfQuarter(new Date(now.getFullYear(), 6, 1)); end = endOfQuarter(new Date(now.getFullYear(), 6, 1)); break;
            case 'Q4': start = startOfQuarter(new Date(now.getFullYear(), 9, 1)); end = endOfQuarter(new Date(now.getFullYear(), 9, 1)); break;
            case 'YEAR':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            default: // MONTH
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
            setCurrentDate(now); // Year matters
        } else if (val === 'YEAR') {
            setFilterMode('YEAR');
            setCurrentDate(now);
        } else {
            setFilterMode('MONTH'); // Fallback
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
        <div className="max-w-7xl mx-auto space-y-6 relative">
            {loading && <FullScreenLoader message={t('common.loadingStats') || 'Actualizando datos...'} />}

            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
                    <p className="text-gray-400">{selectedEntity?.name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <select
                            onChange={handleFilterChange}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                            defaultValue="THIS_MONTH"
                        >
                            <option value="THIS_MONTH">{t('dashboard.filters.thisMonth')}</option>
                            <option value="PREV_MONTH">{t('dashboard.filters.prevMonth')}</option>
                            <option value="Q1">{t('dashboard.filters.q1')}</option>
                            <option value="Q2">{t('dashboard.filters.q2')}</option>
                            <option value="Q3">{t('dashboard.filters.q3')}</option>
                            <option value="Q4">{t('dashboard.filters.q4')}</option>
                            <option value="YEAR">{t('dashboard.filters.year')}</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg">
                        <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-medium min-w-[140px] text-center capitalize">
                            {getLabel()}
                        </span>
                        <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-emerald-400 font-medium mb-1">{t('dashboard.monthlyIncome')}</p>
                            <h3 className="text-3xl font-bold">{formatCurrency(summary.income)}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-red-400 font-medium mb-1">{t('dashboard.monthlyExpenses')}</p>
                            <h3 className="text-3xl font-bold">{formatCurrency(summary.expense)}</h3>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-blue-400 font-medium mb-1">{t('dashboard.totalBalance')}</p>
                            <h3 className="text-3xl font-bold">{forecast ? formatCurrency(forecast.currentBalance) : '...'}</h3>

                            {forecast && forecast.reserved > 0 && (
                                <div className="mt-2 space-y-1 text-xs">
                                    <div className="flex justify-between gap-4 text-emerald-400">
                                        <span>Disponible:</span>
                                        <span className="font-bold">{formatCurrency(forecast.available)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4 text-orange-400">
                                        <span>En Objetivos:</span>
                                        <span className="font-bold">{formatCurrency(forecast.reserved)}</span>
                                    </div>
                                </div>
                            )}
                            {!forecast?.reserved && <p className="text-xs text-gray-400 mt-1">{t('common.accumulated')}</p>}
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
            </div>


            {/* Forecast & Recurring Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Forecast takes 2/3 on large screens */}
                <div className="xl:col-span-2">
                    {forecast && (
                        <Card className="h-full">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-400 border border-purple-400/30 p-0.5 rounded" />
                                {t('dashboard.forecast.title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                    <p className="text-gray-400 text-sm mb-1">{t('dashboard.forecast.burnRate')}</p>
                                    <p className="text-2xl font-bold font-mono text-white">{formatCurrency(forecast.dailyBurnRate)}</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                    <p className="text-gray-400 text-sm mb-1">{t('dashboard.forecast.daysLeft')}</p>
                                    <p className="text-2xl font-bold font-mono text-white">{forecast.daysLeft} días</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                    <p className="text-gray-400 text-sm mb-1">{t('dashboard.forecast.projectedBalance')}</p>
                                    <p className={`text-2xl font-bold font-mono ${forecast.projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(forecast.projectedBalance)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Recurring takes 1/3 */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <RecurringExpenses />
                    <BudgetProgress currentDate={currentDate} />
                </div>
            </div>

            {/* Charts Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expenses Chart */}
                <CategoryChart
                    title={t('dashboard.expensesByCategory')}
                    data={expenseData}
                    formatCurrency={formatCurrency}
                    emptyMessage={t('dashboard.noExpenses')}
                />

                {/* Income Chart */}
                <CategoryChart
                    title={t('dashboard.incomeByCategory')}
                    data={incomeData}
                    formatCurrency={formatCurrency}
                    emptyMessage={t('dashboard.noIncome')}
                />
            </div>
        </div >
    );
};

// Sub-component for Chart + Legend
const CategoryChart = ({ title, data, formatCurrency, emptyMessage }) => {
    // Colors for uncategorized
    const safeData = data.map(d => ({
        ...d,
        total: Number(d.total),
        fillColor: d.category === 'Uncategorized' ? '#334155' : (d.color || '#94a3b8')
    }));

    const totalValue = safeData.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <Card className="min-h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold mb-6">{title}</h3>

            {safeData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-8 h-full">
                    {/* Fixed Size Chart */}
                    <div className="flex-shrink-0">
                        <PieChart width={220} height={220}>
                            <Pie
                                data={safeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="total"
                                nameKey="category"
                                isAnimationActive={false}
                                stroke="none"
                            >
                                {safeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fillColor} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                        </PieChart>
                    </div>

                    {/* Custom Legend */}
                    <div className="flex-1 w-full space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                        {safeData.map((item, idx) => {
                            const percent = totalValue > 0 ? ((item.total / totalValue) * 100).toFixed(1) : 0;
                            return (
                                <div key={idx} className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.fillColor }}
                                        />
                                        <span className="text-gray-300 group-hover:text-white transition-colors truncate max-w-[120px]" title={item.category}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 font-medium bg-slate-800 px-1.5 py-0.5 rounded">
                                            [{percent}%]
                                        </span>
                                        <span className="font-mono font-medium text-gray-200">
                                            {formatCurrency(item.total)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                    {emptyMessage}
                </div>
            )}
        </Card>
    );
};
