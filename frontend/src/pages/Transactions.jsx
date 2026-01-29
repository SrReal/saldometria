import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api/client';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export const Transactions = () => {
    const { selectedEntity } = useEntity();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const { t, i18n } = useTranslation();
    const locale = i18n.language.startsWith('es') ? es : enUS;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        type: 'EXPENSE',
        categoryId: '',
        accountId: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        accountId: '',
        categoryId: '',
        type: '',
        startDate: '',
        endDate: ''
    });

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

    useEffect(() => {
        if (selectedEntity) {
            fetchTransactions();
            fetchCategories();
            fetchAccounts();
        }
    }, [selectedEntity]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/transactions', {
                params: {
                    entityId: selectedEntity.id,
                    ...filters,
                    categoryId: filters.categoryId || undefined,
                    type: filters.type || undefined,
                    accountId: filters.accountId || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined
                }
            });
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories', {
                params: { entityId: selectedEntity.id }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts', {
                params: { entityId: selectedEntity.id }
            });
            setAccounts(response.data);
            if (response.data.length > 0 && !formData.accountId) {
                setFormData(prev => ({ ...prev, accountId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEntity) return;

        try {
            await api.post('/transactions', {
                ...formData,
                entityId: selectedEntity.id,
                categoryId: formData.categoryId || null,
                accountId: formData.accountId || null
            });
            await fetchTransactions();
            setIsCreating(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                type: 'EXPENSE',
                categoryId: '',
                accountId: accounts.length > 0 ? accounts[0].id : ''
            });
        } catch (error) {
            console.error('Failed to create transaction', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.delete') + '?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            await fetchTransactions();
        } catch (error) {
            console.error('Failed to delete transaction', error);
        }
    };

    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importAccount, setImportAccount] = useState('');

    const handleBulkAction = async (action, payload = {}) => {
        if (!window.confirm(t('common.confirm') || 'Are you sure?')) return;

        setIsBulkActionLoading(true);
        try {
            await api.post('/transactions/bulk-action', {
                ids: Array.from(selectedIds),
                action,
                payload
            });
            setSelectedIds(new Set());
            await fetchTransactions();
            alert(t('transactions.table.bulkActions.success', { count: selectedIds.size }));
        } catch (error) {
            console.error('Bulk action failed', error);
            alert(t('transactions.table.bulkActions.error'));
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map(tx => tx.id)));
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile || !importAccount) return;

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('accountId', importAccount);
        formData.append('entityId', selectedEntity.id);
        formData.append('adapterType', 'SANTANDER');

        setLoading(true);
        try {
            const response = await api.post('/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(t('transactions.importModal.success', { count: response.data.count }));
            setIsImporting(false);
            setImportFile(null);
            await fetchTransactions();
        } catch (error) {
            console.error('Import failed', error);
            alert(t('transactions.importModal.error') + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">swap_horiz</span>
                        {t('nav.transactions')}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{selectedEntity?.name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => setIsImporting(true)} variant="secondary">
                        <span className="material-icons-round text-lg">upload_file</span>
                        {t('transactions.import')}
                    </Button>
                    <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'secondary'}>
                        <span className="material-icons-round text-lg">filter_list</span>
                        {t('transactions.filter')}
                    </Button>
                    <Button onClick={() => setIsCreating(true)}>
                        <span className="material-icons-round text-lg">add</span>
                        {t('transactions.addTransaction')}
                    </Button>
                </div>
            </header>

            {/* Filters Section */}
            {showFilters && (
                <Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Input
                            type="date"
                            label={t('transactions.filters.startDate')}
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <Input
                            type="date"
                            label={t('transactions.filters.endDate')}
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5 flex-1 w-full">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('transactions.filters.type')}</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                value={filters.type}
                                onChange={e => setFilters({ ...filters, type: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allTypes')}</option>
                                <option value="INCOME">{t('transactions.income')}</option>
                                <option value="EXPENSE">{t('transactions.expense')}</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 w-full">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('entities.accounts')}</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                value={filters.accountId}
                                onChange={e => setFilters({ ...filters, accountId: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allAccounts')}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('transactions.category')}</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                value={filters.categoryId}
                                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allCategories')}</option>
                                <option value="null">{t('transactions.filters.uncategorized')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setFilters({ accountId: '', categoryId: '', type: '', startDate: '', endDate: '' });
                            }}
                        >
                            {t('transactions.filters.clear')}
                        </Button>
                        <Button onClick={fetchTransactions} loading={loading}>
                            {t('transactions.filters.apply')}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Creation Modal / Form */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black tracking-tight">{t('transactions.addTransaction')}</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    type="date"
                                    label={t('transactions.date')}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('common.type')}</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-full items-stretch">
                                        <button
                                            type="button"
                                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-lg transition-all ${formData.type === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                        >
                                            <span className="material-icons-round text-base">arrow_downward</span>
                                            {t('transactions.income')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-lg transition-all ${formData.type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                        >
                                            <span className="material-icons-round text-base">arrow_upward</span>
                                            {t('transactions.expense')}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('entities.accounts')}</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                        value={formData.accountId}
                                        onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    type="number"
                                    label={t('transactions.amount')}
                                    step="0.01"
                                    value={formData.amount}
                                    placeholder="0.00"
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />

                                <div className="md:col-span-2">
                                    <Input
                                        label={t('transactions.description')}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Groceries"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('transactions.category')}</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="">{t('transactions.uncategorized')}</option>
                                        {categories
                                            .filter(c => c.type === formData.type)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t('common.cancel')}</Button>
                                <Button type="submit" disabled={accounts.length === 0}>{t('transactions.saveTransaction')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Import Modal */}
            {isImporting && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black tracking-tight">{t('transactions.importModal.title')}</h3>
                            <button onClick={() => setIsImporting(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="space-y-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('transactions.importModal.selectAccount')}</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm"
                                    value={importAccount}
                                    onChange={e => setImportAccount(e.target.value)}
                                    required
                                >
                                    <option value="">{t('transactions.importModal.chooseAccount')}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('transactions.importModal.bankFormat')}</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm" disabled>
                                    <option>Santander XLS (Excel/HTML)</option>
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv,.xls,.xlsx"
                                    onChange={e => setImportFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    required
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-icons-round text-3xl">upload_file</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-700 dark:text-slate-200">{importFile ? importFile.name : 'Haz clic o arrastra tu archivo aquí'}</p>
                                        <p className="text-xs text-slate-400 font-bold mt-1">Formatos soportados: .xls, .xlsx, .csv</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="ghost" onClick={() => setIsImporting(false)}>{t('transactions.importModal.cancel')}</Button>
                                <Button type="submit" loading={loading} className="bg-emerald-600 hover:bg-emerald-700">{t('transactions.importModal.submit')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.map(tx => (
                    <Card
                        key={tx.id}
                        className={`flex items-center justify-between p-4 group transition-all hover:translate-x-1 ${selectedIds.has(tx.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    >
                        <div className="flex items-center gap-6">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-primary focus:ring-offset-0 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                checked={selectedIds.has(tx.id)}
                                onChange={() => toggleSelection(tx.id)}
                            />
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                <span className="material-icons-round text-2xl">
                                    {tx.type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white leading-tight">{tx.description}</h4>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <span className="material-icons-round text-[14px]">calendar_today</span>
                                        {format(new Date(tx.date), 'dd MMM yyyy', { locale })}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-icons-round text-[14px]">credit_card</span>
                                        {tx.account?.name || 'CASH'}
                                    </span>
                                    <span>•</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-400 shadow-sm">
                                        {tx.category?.name || t('transactions.uncategorized')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className={`text-xl font-black tracking-tight ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                </p>
                                {tx.balance !== undefined && tx.balance !== null && (
                                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">
                                        Balance: {Number(tx.balance).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(tx.id)}
                                className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-slate-400 hover:text-rose-500"
                            >
                                <span className="material-icons-round">delete</span>
                            </button>
                        </div>
                    </Card>
                ))}

                {transactions.length === 0 && !loading && (
                    <div className="text-center py-24 bg-white dark:bg-card-dark rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-icons-round text-6xl text-slate-200 dark:text-slate-800 mb-4">search_off</span>
                        <p className="text-slate-500 font-bold">{t('transactions.noTransactions')}</p>
                    </div>
                )}
            </div>

            {/* Floating Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-700 dark:border-slate-600 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
                                {selectedIds.size}
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-wider">{t('transactions.table.selected', { count: selectedIds.size })}</p>
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-[10px] text-primary hover:text-orange-400 font-black uppercase tracking-widest transition-colors"
                                >
                                    {selectedIds.size === transactions.length ? t('transactions.table.bulkActions.deselectAll') : t('transactions.table.bulkActions.selectAll')}
                                </button>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-slate-700"></div>

                        <div className="flex items-center gap-3">
                            <select
                                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleBulkAction('UPDATE', { categoryId: e.target.value });
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">{t('transactions.table.bulkActions.assignCategory')}</option>
                                <option value="null">{t('transactions.uncategorized')}</option>
                                <optgroup label={t('settings.sections.income')} className="bg-slate-900">
                                    {categories.filter(c => c.type === 'INCOME').map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label={t('settings.sections.expense')} className="bg-slate-900">
                                    {categories.filter(c => c.type === 'EXPENSE').map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </optgroup>
                            </select>

                            <Button
                                variant="danger"
                                size="sm"
                                className="h-9 px-4"
                                onClick={() => handleBulkAction('DELETE')}
                                loading={isBulkActionLoading}
                            >
                                <span className="material-icons-round text-lg">delete</span>
                                {t('transactions.table.bulkActions.delete')}
                            </Button>

                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
