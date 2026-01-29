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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader />}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">trending_up</span>
                        {t('analytics.title') || 'Análisis Financiero'}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('analytics.subtitle') || 'Visión detallada de tu evolución'}</p>
                </div>
            </header>

            {/* Filters Cards */}
            <Card className="border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('analytics.filters.dateRange') || 'Rango de Fechas'}</label>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium appearance-none"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="year">Este Año</option>
                                <option value="6months">Últimos 6 Meses</option>
                                <option value="all">Todo el historial</option>
                                <option value="custom">Personalizado</option>
                            </select>
                            <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                        </div>
                    </div>

                    {dateRange === 'custom' && (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Desde</label>
                                <input
                                    type="date"
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium"
                                    value={customFrom}
                                    onChange={e => setCustomFrom(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Hasta</label>
                                <input
                                    type="date"
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium"
                                    value={customTo}
                                    onChange={e => setCustomTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className={dateRange === 'custom' ? "md:col-span-1" : "md:col-span-3"}>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('analytics.filters.accounts')}</label>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <button
                                onClick={() => setSelectedAccounts([])}
                                className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${selectedAccounts.length === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary'}`}
                            >
                                {t('analytics.filters.allAccounts')}
                            </button>
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccount(acc.id)}
                                    className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${selectedAccounts.includes(acc.id) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary'}`}
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
                <Card className="p-6 border-none shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                            <span className="material-icons-round">trending_up</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{t('analytics.kpis.totalIncome')}</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(kpiTotalIncome)}</p>
                </Card>
                <Card className="p-6 border-none shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                            <span className="material-icons-round">trending_down</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{t('analytics.kpis.totalExpense')}</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(kpiTotalExpense)}</p>
                </Card>
                <Card className="p-6 bg-primary border-none shadow-xl shadow-primary/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-white/20 text-white rounded-xl">
                            <span className="material-icons-round">savings</span>
                        </div>
                        <span className="text-white/80 text-sm font-bold uppercase tracking-wider">{t('analytics.kpis.netSavings')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-white">{formatCurrency(kpiSavings)}</p>
                        <span className="text-sm font-black text-white/70">({kpiSavingsRate.toFixed(1)}%)</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <Card className="lg:col-span-2 p-8 shadow-sm">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                        <span className="material-icons-round text-primary">bar_chart</span>
                        {t('analytics.charts.monthlyEvolution')}
                    </h3>
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
                <Card className="p-8 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                        <span className="material-icons-round text-primary">pie_chart</span>
                        {t('analytics.charts.categoryBreakdown')}
                    </h3>
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
                                            <span className="text-slate-600 dark:text-slate-400 capitalize">{item.category}</span>
                                        </div>
                                        <span className="text-slate-900 dark:text-white">{formatCurrency(item.total)}</span>
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
