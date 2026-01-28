import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, ArrowUpRight, ArrowDownLeft, Filter, Trash2, CreditCard } from 'lucide-react';
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

    // New Transaction Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        type: 'EXPENSE',
        categoryId: '',
        accountId: ''
    });

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        accountId: '',
        categoryId: '',
        type: '',
        startDate: '',
        endDate: ''
    });

    // Bulk selection state
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
                    // If categoryId is empty string, don't send it. If it's specific ID or 'null' (string), send it.
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
            // Set default account if available and not set
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
            const count = selectedIds.size;
            alert(`Acción completada en ${count} elementos`); // Use toast if available, fallback to alert
        } catch (error) {
            console.error('Bulk action failed', error);
            alert('Error en acción masiva');
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
            setSelectedIds(new Set(transactions.map(t => t.id)));
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
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                {/* ... Header ... */}
                <div className="flex gap-2">
                    <Button onClick={() => setIsImporting(true)} variant="secondary" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                        <ArrowDownLeft className="w-4 h-4" /> {t('transactions.import')}
                    </Button>
                    <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'ghost'} className="gap-2">
                        <Filter className="w-4 h-4" /> {t('transactions.filter')}
                    </Button>
                    <Button onClick={() => setIsCreating(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> {t('transactions.addTransaction')}
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
                <Card className="mb-6 border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('transactions.filters.startDate')}</label>
                            <input
                                type="date"
                                className="glass-input w-full text-sm py-1.5"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('transactions.filters.endDate')}</label>
                            <input
                                type="date"
                                className="glass-input w-full text-sm py-1.5"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('transactions.filters.type')}</label>
                            <select
                                className="glass-input w-full text-sm py-1.5"
                                value={filters.type}
                                onChange={e => setFilters({ ...filters, type: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allTypes')}</option>
                                <option value="INCOME">{t('transactions.income')}</option>
                                <option value="EXPENSE">{t('transactions.expense')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('entities.accounts')}</label>
                            <select
                                className="glass-input w-full text-sm py-1.5"
                                value={filters.accountId}
                                onChange={e => setFilters({ ...filters, accountId: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allAccounts')}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('transactions.category')}</label>
                            <select
                                className="glass-input w-full text-sm py-1.5"
                                value={filters.categoryId}
                                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                            >
                                <option value="">{t('transactions.filters.allCategories')}</option>
                                <option value="null">{t('transactions.filters.uncategorized')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFilters({ accountId: '', categoryId: '', type: '', startDate: '', endDate: '' });
                                // Optional: fetch immediately or wait for Apply? User experience: wait for apply or clear + apply.
                                // Let's just clear state.
                            }}
                        >
                            {t('transactions.filters.clear')}
                        </Button>
                        <Button size="sm" onClick={fetchTransactions} loading={loading}>
                            {t('transactions.filters.apply')}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Import Modal */}
            {isImporting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg border-emerald-500/50 relative animation-fade-in">
                        <h3 className="text-xl font-bold mb-4">{t('transactions.importModal.title')}</h3>
                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('transactions.importModal.selectAccount')}</label>
                                <select
                                    className="glass-input w-full"
                                    value={importAccount}
                                    onChange={e => setImportAccount(e.target.value)}
                                    required
                                >
                                    <option value="">{t('transactions.importModal.chooseAccount')}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-slate-900">
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('transactions.importModal.bankFormat')}</label>
                                <select className="glass-input w-full" disabled>
                                    <option>Santander XLS (Excel/HTML)</option>
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv,.xls,.xlsx"
                                    onChange={e => setImportFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsImporting(false)}>{t('transactions.importModal.cancel')}</Button>
                                <Button type="submit" loading={loading}>{t('transactions.importModal.submit')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {isCreating && (
                <Card className="mb-6 border-blue-500/50">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label={t('transactions.date')}
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">{t('common.type')}</label>
                            <div className="flex bg-black/20 p-1 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${formData.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                >
                                    {t('transactions.income')}
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${formData.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                >
                                    {t('transactions.expense')}
                                </button>
                            </div>
                        </div>

                        {/* Account Selector */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">{t('entities.accounts')}</label>
                            <select
                                className="glass-input"
                                value={formData.accountId}
                                onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id} className="bg-slate-800">
                                        {acc.name} ({acc.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            type="number"
                            label={t('transactions.amount')}
                            step="0.01"
                            value={formData.amount}
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

                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-sm text-gray-400 font-medium">{t('transactions.category')}</label>
                            <select
                                className="glass-input"
                                value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">{t('transactions.uncategorized')}</option>
                                {categories
                                    .filter(c => c.type === formData.type)
                                    .map(c => (
                                        <option key={c.id} value={c.id} className="bg-slate-800">
                                            {c.name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" disabled={accounts.length === 0}>{t('transactions.saveTransaction')}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.map(tx => (
                    <Card key={tx.id} className={`flex items-center justify-between p-4 group transition-colors ${selectedIds.has(tx.id) ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5'}`}>
                        <div className="flex items-center gap-4">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-600 bg-slate-800 text-emerald-500 focus:ring-offset-0 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                                checked={selectedIds.has(tx.id)}
                                onChange={() => toggleSelection(tx.id)}
                            />
                            <div className={`p-3 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {tx.type === 'INCOME' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg">{tx.description}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="capitalize">{format(new Date(tx.date), 'MMM dd, yyyy', { locale })}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" />
                                        {tx.account?.name || 'CASH'}
                                    </span>
                                    <span>•</span>
                                    <span className="bg-white/5 px-2 py-0.5 rounded text-xs">
                                        {tx.category?.name || t('transactions.uncategorized')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className={`text-lg font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                </p>
                                {tx.balance !== undefined && tx.balance !== null && (
                                    <p className="text-xs text-blue-300/70 font-mono mt-0.5">
                                        {Number(tx.balance).toLocaleString(i18n.language, { minimumFractionDigits: 2 })} EUR
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(tx.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded text-gray-400 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </Card>
                ))}

                {transactions.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        <p>{t('transactions.noTransactions')}</p>
                    </div>
                )}
            </div>


            {/* Floating Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div
                    className="fixed bg-slate-800 border border-slate-700 shadow-2xl rounded-full px-6 py-3 flex items-center justify-center gap-4 z-50"
                    style={{
                        position: 'fixed',
                        top: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        WebkitTapHighlightColor: 'transparent',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        width: '60%',
                        paddingLeft: '20px'
                    }}
                >
                    <span className="text-sm font-medium text-white whitespace-nowrap">
                        {t('transactions.table.selected', { count: selectedIds.size })}
                    </span>
                    <div className="h-6 w-px bg-slate-600 mx-2"></div>

                    {/* Bulk Category Assign */}
                    <select
                        className="bg-slate-900 border border-slate-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500"
                        onChange={(e) => {
                            if (e.target.value) {
                                handleBulkAction('UPDATE', { categoryId: e.target.value });
                                e.target.value = ''; // Reset
                            }
                        }}
                    >
                        <option value="">{t('transactions.table.bulkActions.assignCategory')}</option>
                        <option value="null">{t('transactions.uncategorized')}</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 gap-2"
                        onClick={() => handleBulkAction('DELETE')}
                        loading={isBulkActionLoading}
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('transactions.table.bulkActions.delete')}
                    </Button>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-2 text-gray-400 hover:text-white"
                    >
                        <ArrowDownLeft className="w-5 h-5 rotate-45" /> {/* Use generic icon or X */}
                    </button>
                </div>
            )}
        </div>
    );
};
