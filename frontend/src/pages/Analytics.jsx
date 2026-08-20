import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { FullScreenLoader } from '../components/FullScreenLoader';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { ChevronDown, ArrowUp, ArrowDown, ChartNoAxesColumn, ChartPie } from 'lucide-react';

const COLORS = ['#ff8404', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

export const Analytics = () => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
    const { formatCurrency } = useAuth();

    const [loading, setLoading] = useState(false);
    const [evolutionData, setEvolutionData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [dateRange, setDateRange] = useState('6months');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown]')) {
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);


    useEffect(() => {
        if (selectedEntity) {
            fetchAccounts();
            fetchData();
        }
    }, [selectedEntity, dateRange, customFrom, customTo, selectedAccounts]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts', { params: { entityId: selectedEntity.id } });
            setAccounts(res.data);
        } catch (error) {
            console.error('Error fetching accounts', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                entityId: selectedEntity.id,
                accountIds: selectedAccounts.length > 0 ? selectedAccounts.join(',') : undefined
            };

            const now = new Date();
            if (dateRange === 'year') {
                params.from = `${now.getFullYear()}-01-01`;
                params.to = `${now.getFullYear()}-12-31`;
            } else if (dateRange === '6months') {
                const start = new Date(now);
                start.setMonth(now.getMonth() - 5);
                start.setDate(1);
                params.from = start.toISOString().split('T')[0];
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                params.to = end.toISOString().split('T')[0];
            } else if (dateRange === 'all') {
                params.from = '2000-01-01';
                params.to = '2099-12-31';
            } else if (dateRange === 'custom' && customFrom && customTo) {
                params.from = customFrom;
                params.to = customTo;
            }

            const evoRes = await api.get('/stats/evolution', { params });
            setEvolutionData(evoRes.data);

            const catBreakdownRes = await api.get('/stats/categories', {
                params: { ...params, type: 'EXPENSE' }
            });
            setCategoryData(catBreakdownRes.data);

        } catch (error) {
            console.error('Error fetching analytics', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAccount = (id) => {
        setSelectedAccounts(prev =>
            prev.includes(id) ? prev.filter(accId => accId !== id) : [...prev, id]
        );
    };

    const kpiTotalIncome = evolutionData.reduce((acc, curr) => acc + curr.income, 0);
    const kpiTotalExpense = evolutionData.reduce((acc, curr) => acc + curr.expense, 0);
    const kpiSavings = kpiTotalIncome - kpiTotalExpense;
    const kpiSavingsRate = kpiTotalIncome > 0 ? (kpiSavings / kpiTotalIncome) * 100 : 0;

    const calculateTrend = (data, key) => {
        if (data.length < 2) return { value: 0, direction: 'neutral' };
        const last = data[data.length - 1][key];
        const prev = data[data.length - 2][key];

        if (prev === 0) {
            if (last === 0) return { value: 0, direction: 'neutral' };
            return { value: 100, direction: 'up', isPositive: true };
        }

        const diff = ((last - prev) / prev) * 100;
        return {
            value: Math.abs(diff).toFixed(1),
            direction: diff > 0 ? 'down' : diff < 0 ? 'up' : 'neutral',
            isPositive: diff > 0
        };
    };

    const incomeTrend = calculateTrend(evolutionData, 'income');
    const expenseTrend = calculateTrend(evolutionData, 'expense');

    return (
        <div>
            {loading && <FullScreenLoader />}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <p className="text-slate-500 mt-1">{t('analytics.subtitle') || 'Visión detallada de tu evolución'}.</p>
            </header>

            {/* Filters Cards */}
            <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('analytics.filters.dateRange') || 'Rango de Fechas'}</label>
                        <div className="relative" data-dropdown>
                            <button
                                onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-all"
                            >
                                <span>
                                    {dateRange === 'year' && t('analytics.filters.thisYear')}
                                    {dateRange === '6months' && t('analytics.filters.last6Months')}
                                    {dateRange === 'all' && t('analytics.filters.allHistory')}
                                    {dateRange === 'custom' && t('analytics.filters.custom')}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showDateDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                    <div className="py-1">
                                        <button
                                            onClick={() => { setDateRange('year'); setShowDateDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateRange === 'year' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {t('analytics.filters.thisYear')}
                                        </button>
                                        <button
                                            onClick={() => { setDateRange('6months'); setShowDateDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateRange === '6months' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {t('analytics.filters.last6Months')}
                                        </button>
                                        <button
                                            onClick={() => { setDateRange('all'); setShowDateDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateRange === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {t('analytics.filters.allHistory')}
                                        </button>
                                        <button
                                            onClick={() => { setDateRange('custom'); setShowDateDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateRange === 'custom' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {t('analytics.filters.custom')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex gap-4 col-span-2">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Desde</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border-none rounded-lg focus:ring-2 py-2.5 focus:ring-primary text-sm"
                                    value={customFrom}
                                    onChange={e => setCustomFrom(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hasta</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border-none rounded-lg focus:ring-2 py-2.5 focus:ring-primary text-sm"
                                    value={customTo}
                                    onChange={e => setCustomTo(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('analytics.filters.accounts')}</label>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <button
                                onClick={() => setSelectedAccounts([])}
                                className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${selectedAccounts.length === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:text-primary'}`}
                            >
                                {t('analytics.filters.allAccounts')}
                            </button>
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccount(acc.id)}
                                    className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${selectedAccounts.includes(acc.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:text-primary'}`}
                                >
                                    {acc.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('analytics.kpis.totalIncome')}</p>
                    <div className="mt-4 flex items-end gap-2">
                        <span className="text-3xl font-bold text-emerald-500">{formatCurrency(kpiTotalIncome)}</span>
                        {incomeTrend.direction !== 'neutral' && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-md mb-1.5 flex items-center gap-1 ${incomeTrend.direction === 'up' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                                {incomeTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {incomeTrend.value}%
                            </span>
                        )}
                    </div>
                </Card>
                <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('analytics.kpis.totalExpense')}</p>
                    <div className="mt-4 flex items-end gap-2">
                        <span className="text-3xl font-bold text-rose-500">{formatCurrency(kpiTotalExpense)}</span>
                        {expenseTrend.direction !== 'neutral' && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-md mb-1.5 flex items-center gap-1 ${expenseTrend.direction === 'down' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                                {expenseTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {expenseTrend.value}%
                            </span>
                        )}
                    </div>
                </Card>
                <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('analytics.kpis.netSavings')}</p>
                    <div className="mt-4 flex flex-col gap-1">
                        <span className="text-3xl font-bold text-primary">{formatCurrency(kpiSavings)}</span>
                        <span className="text-sm font-medium text-slate-400">{t('analytics.kpis.savingsRatio')}: <span className="text-primary font-bold">{kpiSavingsRate.toFixed(1)}%</span></span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <Card className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-2">
                            <ChartNoAxesColumn className="w-4 h-4 text-primary" />
                            <h2 class="text-xl font-bold">{t('analytics.charts.monthlyEvolution')}</h2>
                        </div>
                    </div>

                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={evolutionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
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
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="income" name={t('transactions.income')} fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="expense" name={t('transactions.expense')} fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Categories Chart */}
                <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-8">
                        <ChartPie className="w-4 h-4 text-primary" />
                        <h2 className="text-xl font-bold">{t('analytics.charts.categoryBreakdown')}</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="total"
                                        nameKey="category"
                                        isAnimationActive={true}
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                                <span className="material-icons-round text-5xl mb-2 opacity-10">pie_chart_outline</span>
                                <p className="font-bold">{t('analytics.charts.noData')}</p>
                            </div>
                        )}

                        {categoryData.length > 0 && (
                            <div className="mt-8 space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                                {categoryData.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }} />
                                            <span className="text-sm font-medium text-slate-600">{item.category}</span>
                                        </div>
                                        <span className="text-sm font-bold ml-2">{formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div >
    );
};
