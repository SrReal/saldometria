import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api/client';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, CheckCircle2, X, TrendingUp, TrendingDown, FileUp, SearchX, Calendar1, Landmark, Trash, Trash2 } from 'lucide-react';

export const Transactions = () => {
    const { selectedEntity } = useEntity();
    const { currencySymbol, formatCurrency } = useAuth();
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

    const [filters, setFilters] = useState({
        accountId: '',
        categoryId: '',
        type: '',
        startDate: '',
        endDate: ''
    });

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showFormAccountDropdown, setShowFormAccountDropdown] = useState(false);
    const [showFormCategoryDropdown, setShowFormCategoryDropdown] = useState(false);
    const [showImportAccountDropdown, setShowImportAccountDropdown] = useState(false);
    const [showBulkCategoryDropdown, setShowBulkCategoryDropdown] = useState(false);
    const [selectedBulkCategory, setSelectedBulkCategory] = useState(null);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Cerrar todos los dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown]')) {
                setShowCategoryDropdown(false);
                setShowTypeDropdown(false);
                setShowAccountDropdown(false);
                setShowFormAccountDropdown(false);
                setShowFormCategoryDropdown(false);
                setShowImportAccountDropdown(false);
                setShowBulkCategoryDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedEntity) {
            fetchTransactions();
            fetchCategories();
            fetchAccounts();
        }
    }, [selectedEntity]);

    const fetchTransactions = async (page = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get('/transactions', {
                params: {
                    entityId: selectedEntity.id,
                    page,
                    limit: ITEMS_PER_PAGE,
                    categoryId: filters.categoryId || undefined,
                    type: filters.type || undefined,
                    accountId: filters.accountId || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined
                }
            });

            // Si el backend devuelve { data, total, page, totalPages }
            if (response.data.data) {
                setTransactions(response.data.data);
                setTotalCount(response.data.total || 0);
                setTotalPages(response.data.totalPages || Math.ceil((response.data.total || 0) / ITEMS_PER_PAGE));
                setCurrentPage(response.data.page || page);
            } else {
                // Fallback si el backend devuelve array directo
                setTransactions(response.data);
                setTotalCount(response.data.length);
                setTotalPages(1);
            }
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

        setLoading(true);

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
        } finally {
            setLoading(false);
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
    const [importMessage, setImportMessage] = useState({ type: '', text: '' });

    const handleBulkAction = async (action, payload = {}) => {
        if (!window.confirm(t('common.confirm'))) return;

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

            setImportMessage({ type: 'success', text: t('transactions.importModal.success', { count: response.data.count }) });
            setImportFile(null);
            await fetchTransactions();
        } catch (error) {
            console.error('Import failed', error);
            setImportMessage({ type: 'error', text: t('transactions.importModal.error') + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-6">
                    <Button
                        variant="secondary"
                        onClick={() => setIsImporting(true)}
                    >
                        <FileUp className="w-4 h-4" />
                        <span>{t('transactions.import')}</span>
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4" />
                        <span>{t('transactions.addTransaction')}</span>
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('transactions.filters.startDate')}</label>
                        <input
                            className={`w-full bg-slate-50 border-none rounded-lg focus:ring-2 py-2.5 focus:ring-primary text-sm`}
                            type="date"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('transactions.filters.endDate')}</label>
                        <input
                            className={`w-full bg-slate-50 border-none rounded-lg focus:ring-2 py-2.5 focus:ring-primary text-sm`}
                            type="date"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="relative" data-dropdown>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('transactions.filters.type')}</label>
                        <button
                            type="button"
                            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                            className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-primary/50"
                        >
                            <span>
                                {filters.type === ''
                                    ? t('transactions.filters.allTypes')
                                    : filters.type === 'INCOME'
                                        ? t('transactions.income')
                                        : t('transactions.expense')
                                }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showTypeDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                                <button
                                    onClick={() => { setFilters({ ...filters, type: '' }); setShowTypeDropdown(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.type === '' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {t('transactions.filters.allTypes')}
                                </button>
                                <button
                                    onClick={() => { setFilters({ ...filters, type: 'INCOME' }); setShowTypeDropdown(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${filters.type === 'INCOME' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    {t('transactions.income')}
                                </button>
                                <button
                                    onClick={() => { setFilters({ ...filters, type: 'EXPENSE' }); setShowTypeDropdown(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${filters.type === 'EXPENSE' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    {t('transactions.expense')}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative" data-dropdown>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('entities.accounts')}</label>
                        <button
                            type="button"
                            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                            className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-primary/50"
                        >
                            <span>
                                {filters.accountId === ''
                                    ? t('transactions.filters.allAccounts')
                                    : accounts.find(a => a.id === filters.accountId)?.name || t('transactions.filters.allAccounts')
                                }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showAccountDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setFilters({ ...filters, accountId: '' }); setShowAccountDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.accountId === '' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {t('transactions.filters.allAccounts')}
                                    </button>
                                    {accounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => { setFilters({ ...filters, accountId: acc.id }); setShowAccountDropdown(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.accountId === acc.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {acc.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative" data-dropdown>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('transactions.category')}</label>
                        <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-primary/50"
                        >
                            <span>
                                {filters.categoryId === ''
                                    ? t('transactions.filters.allCategories')
                                    : filters.categoryId === 'null'
                                        ? t('transactions.filters.uncategorized')
                                        : categories.find(c => c.id === filters.categoryId)?.name || t('transactions.filters.allCategories')
                                }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {/* Opciones especiales */}
                                    <button
                                        onClick={() => { setFilters({ ...filters, categoryId: '' }); setShowCategoryDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.categoryId === '' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {t('transactions.filters.allCategories')}
                                    </button>
                                    <button
                                        onClick={() => { setFilters({ ...filters, categoryId: 'null' }); setShowCategoryDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filters.categoryId === 'null' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {t('transactions.filters.uncategorized')}
                                    </button>

                                    {/* Categorías de Gastos */}
                                    {categories.filter(c => c.type === 'EXPENSE').length > 0 && (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border-y border-slate-200">
                                                {t('transactions.expense')}
                                            </div>
                                            {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setFilters({ ...filters, categoryId: cat.id }); setShowCategoryDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${filters.categoryId === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#ff8404' }} />
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </>
                                    )}

                                    {/* Categorías de Ingresos */}
                                    {categories.filter(c => c.type === 'INCOME').length > 0 && (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border-y border-slate-200">
                                                {t('transactions.income')}
                                            </div>
                                            {categories.filter(c => c.type === 'INCOME').map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setFilters({ ...filters, categoryId: cat.id }); setShowCategoryDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${filters.categoryId === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#22c55e' }} />
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setFilters({ accountId: '', categoryId: '', type: '', startDate: '', endDate: '' });
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                        {t('transactions.filters.clear')}
                    </Button>
                    <Button onClick={fetchTransactions} loading={loading}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        {t('transactions.filters.apply')}
                    </Button>
                </div>
            </Card>

            {/* Creation Modal / Form */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <Card className="w-full max-w-[640px] glass-modal rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-[fadeInZoom_0.3s_ease-out_forwards]">
                        <div className="px-8 py-5 flex items-center justify-between border-b border-[#ff8404]/10">
                            <h3 className="text-xl font-bold text-[#121616] tracking-tight">{t('transactions.addTransaction')}</h3>
                            <button onClick={() => setIsCreating(false)} className="group p-2 rounded-full hover:bg-black/5 transition-colors">
                                <X className="material-symbols-outlined text-gray-400 group-hover:text-primary text-2xl transition-colors" />
                            </button>
                        </div>

                        <form className="p-8 flex flex-col gap-6 overflow-visible">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.date')}</label>
                                    <input
                                        className={`w-full h-11 pl-4 text-sm font-medium glass-input rounded-xl outline-none`}
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('common.type')}</label>
                                    <div className="flex p-1 glass-input rounded-xl h-full items-stretch">
                                        <button
                                            type="button"
                                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-lg transition-all ${formData.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            {t('transactions.income')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-lg transition-all ${formData.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                        >
                                            <TrendingDown className="w-4 h-4" />
                                            {t('transactions.expense')}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative flex flex-col gap-2" data-dropdown>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('entities.accounts')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormAccountDropdown(!showFormAccountDropdown)}
                                        className="w-full h-11 flex items-center justify-between glass-input rounded-xl px-4 text-sm font-medium text-slate-700 transition-all"
                                    >
                                        <span>
                                            {formData.accountId
                                                ? accounts.find(a => a.id === formData.accountId)?.name
                                                : t('common.selectAccount')
                                            }
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFormAccountDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showFormAccountDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                {accounts.map(acc => (
                                                    <button
                                                        key={acc.id}
                                                        type="button"
                                                        onClick={() => { setFormData({ ...formData, accountId: acc.id }); setShowFormAccountDropdown(false); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${formData.accountId === acc.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        {acc.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.amount')}</label>
                                    <input
                                        className={`w-full h-11 pl-4 text-sm font-medium glass-input rounded-xl outline-none`}
                                        type="number"
                                        value={formData.amount}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.description')}</label>
                                    <input
                                        className={`w-full h-11 pl-4 text-sm font-medium glass-input rounded-xl outline-none`}
                                        type="text"
                                        value={formData.description}
                                        placeholder="e.g. Groceries"
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="relative flex flex-col gap-2" data-dropdown>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.category')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormCategoryDropdown(!showFormCategoryDropdown)}
                                        className="w-full h-11 flex items-center justify-between glass-input rounded-xl px-4 text-sm font-medium text-slate-700 transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            {formData.categoryId ? (
                                                <>
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categories.find(c => c.id === formData.categoryId)?.color || '#ff8404' }} />
                                                    {categories.find(c => c.id === formData.categoryId)?.name}
                                                </>
                                            ) : (
                                                t('transactions.uncategorized')
                                            )}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFormCategoryDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showFormCategoryDropdown && (
                                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[200]">
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                <button
                                                    type="button"
                                                    onClick={() => { setFormData({ ...formData, categoryId: '' }); setShowFormCategoryDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${formData.categoryId === '' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    {t('transactions.uncategorized')}
                                                </button>
                                                {categories
                                                    .filter(c => c.type === formData.type)
                                                    .map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => { setFormData({ ...formData, categoryId: cat.id }); setShowFormCategoryDropdown(false); }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${formData.categoryId === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#ff8404' }} />
                                                            {cat.name}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                        <div className="p-8 flex justify-between items-center border-t border-[#ff8404]/5">
                            <Button className='text-sm font-bold text-gray-500 hover:text-primary transition-colors px-2'
                                type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t('common.cancel')}</Button>
                            <Button className='px-8 py-3 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2'
                                type="button"
                                disabled={accounts.length === 0 || !formData.accountId || !formData.amount || !formData.description || loading}
                                onClick={handleSubmit}>{t('transactions.saveTransaction')}</Button>
                        </div>
                    </Card>
                </div >
            )}

            {/* Import Modal */}
            {
                isImporting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
                        <Card className="w-full max-w-[640px] glass-modal rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-[fadeInZoom_0.3s_ease-out_forwards]">
                            <div className="px-8 py-5 flex items-center justify-between border-b border-[#ff8404]/10">
                                <h3 className="text-xl font-bold text-[#121616] tracking-tight">{t('transactions.importModal.title')}</h3>
                                <button onClick={() => setIsImporting(false)} className="group p-2 rounded-full hover:bg-black/5 transition-colors">
                                    <X className="material-symbols-outlined text-gray-400 group-hover:text-primary text-2xl transition-colors" />
                                </button>
                            </div>

                            <form className="p-8 flex flex-col gap-6 overflow-visible">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="relative flex flex-col gap-2" data-dropdown>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.importModal.selectAccount')}</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowImportAccountDropdown(!showImportAccountDropdown)}
                                            className="w-full h-11 flex items-center justify-between glass-input rounded-xl px-4 text-sm font-medium text-slate-700 transition-all"
                                        >
                                            <span>
                                                {importAccount
                                                    ? `${accounts.find(a => a.id === importAccount)?.name} (${accounts.find(a => a.id === importAccount)?.type})`
                                                    : t('transactions.importModal.chooseAccount')
                                                }
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showImportAccountDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showImportAccountDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    {accounts.map(acc => (
                                                        <button
                                                            key={acc.id}
                                                            type="button"
                                                            onClick={() => { setImportAccount(acc.id); setShowImportAccountDropdown(false); }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${importAccount === acc.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            {acc.name} ({acc.type})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-0.5">{t('transactions.importModal.bankFormat')}</label>
                                        <div className="w-full h-11 flex items-center justify-between glass-input rounded-xl px-4 text-sm font-medium text-slate-400 cursor-not-allowed opacity-70">
                                            <span>Santander XLS (Excel/HTML)</span>
                                            <ChevronDown className="w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>

                                    <div className="col-span-2 border-2 border-dashed border-primary rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept=".csv,.xls,.xlsx"
                                            onChange={e => { setImportFile(e.target.files[0]); setImportMessage({ type: '', text: '' }); }}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FileUp className="w-8 h-8 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-700">{importFile ? importFile.name : t('transactions.importModal.dropzone')}</p>
                                                <p className="text-xs text-slate-400 font-bold mt-1">{t('transactions.importModal.supportedFormats')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Mensaje de resultado de importación */}
                            {importMessage.text && (
                                <div className={`mx-8 p-4 rounded-xl flex items-center gap-3 ${importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                    importMessage.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                                        'bg-red-50 text-red-700'
                                    }`}>
                                    {importMessage.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <X className="w-5 h-5" />
                                    )}
                                    <span className="text-sm font-medium">{importMessage.text}</span>
                                </div>
                            )}

                            <div className="p-8 flex justify-between items-center border-t border-[#ff8404]/5">
                                <Button className='text-sm font-bold text-gray-500 hover:text-primary transition-colors px-2'
                                    type="button" variant="ghost" onClick={() => { setIsImporting(false); setImportMessage({ type: '', text: '' }); }}>{t('transactions.importModal.cancel')}</Button>
                                {importMessage.type === 'success' ? (
                                    <Button className='px-8 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2'
                                        type="button"
                                        onClick={() => { setIsImporting(false); setImportMessage({ type: '', text: '' }); }}>{t('common.close')}</Button>
                                ) : (
                                    <Button className='px-8 py-3 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2'
                                        type="button"
                                        disabled={loading}
                                        onClick={() => {
                                            if (!importAccount || !importFile) {
                                                setImportMessage({ type: 'warning', text: t('common.requiredFields') });
                                                return;
                                            }
                                            handleImport({ preventDefault: () => { } });
                                        }}>{loading ? t('common.loading') : t('transactions.importModal.submit')}</Button>
                                )}
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* Transactions List */}
            <div className="space-y-3">
                {transactions.map(tx => (
                    <Card
                        key={tx.id}
                        className={`group bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4 hover:shadow-md transition-shadow`}
                    >
                        <div className="flex items-center gap-6">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-xl border-slate-300 text-primary focus:ring-primary"
                                checked={selectedIds.has(tx.id)}
                                onChange={() => toggleSelection(tx.id)}
                            />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {tx.type === 'INCOME' ?
                                    <TrendingUp className="w-5 h-5" /> :
                                    <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate text-slate-800">{tx.description}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar1 className="w-3 h-3" />
                                        {format(new Date(tx.date), 'dd MMM yyyy', { locale })}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Landmark className="w-3 h-3" />
                                        {tx.account?.name || 'CASH'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                        {tx.category?.name || t('transactions.uncategorized')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex items-center gap-6">
                            <div className="text-right">
                                <p className={`text-lg font-bold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </p>
                                {tx.balance !== undefined && tx.balance !== null && (
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Saldo: {formatCurrency(tx.balance)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(tx.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    </Card>
                ))}

                {transactions.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 glass-modal rounded-2xl border border-dashed border-primary/30">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <SearchX className="w-10 h-10 text-primary/50" />
                        </div>
                        <p className="text-lg font-bold text-slate-600 mb-2">{t('transactions.noTransactions')}</p>
                        <p className="text-sm text-slate-400">{t('transactions.noTransactionsHint')}</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); fetchTransactions(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Número de páginas */}
                        {(() => {
                            const pages = [];
                            const showEllipsis = totalPages > 5;

                            if (!showEllipsis) {
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                }
                            } else {
                                // Siempre mostrar primera página
                                pages.push(1);

                                if (currentPage > 3) {
                                    pages.push('...');
                                }

                                // Páginas alrededor de la actual
                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                    if (!pages.includes(i)) pages.push(i);
                                }

                                if (currentPage < totalPages - 2) {
                                    pages.push('...');
                                }

                                // Siempre mostrar última página
                                if (!pages.includes(totalPages)) pages.push(totalPages);
                            }

                            return pages.map((page, idx) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => { setCurrentPage(page); fetchTransactions(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ));
                        })()}

                        <button
                            onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); fetchTransactions(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div >

            {/* Floating Bulk Actions Bar */}
            {
                selectedIds.size > 0 && (
                    <div className="fixed bottom-10 left-[calc(16rem+2rem)] right-8 z-50">
                        <div className="glass-panel border-2 border-primary/20 shadow-[0_20px_50px_rgba(255,132,4,0.15)] rounded-2xl px-8 py-4 flex items-center justify-between mx-auto max-w-6xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
                                    {selectedIds.size}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{t('transactions.table.selected', { count: selectedIds.size })}</p>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-[11px] text-slate-500"
                                    >
                                        {selectedIds.size === transactions.length ? t('transactions.table.bulkActions.deselectAll') : t('transactions.table.bulkActions.selectAll')}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative" data-dropdown>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkCategoryDropdown(!showBulkCategoryDropdown)}
                                        className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-primary/50"
                                    >
                                        <span>
                                            {selectedBulkCategory
                                                ? (selectedBulkCategory === 'null'
                                                    ? t('transactions.uncategorized')
                                                    : categories.find(c => c.id === selectedBulkCategory)?.name || t('transactions.table.bulkActions.assignCategory'))
                                                : t('transactions.table.bulkActions.assignCategory')
                                            }
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBulkCategoryDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showBulkCategoryDropdown && (
                                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                <button
                                                    onClick={() => { setSelectedBulkCategory('null'); setShowBulkCategoryDropdown(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedBulkCategory === 'null' ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    {t('transactions.uncategorized')}
                                                </button>

                                                {/* Gastos */}
                                                {categories.filter(c => c.type === 'EXPENSE').length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border-y border-slate-200">
                                                            {t('transactions.expense')}
                                                        </div>
                                                        {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                onClick={() => { setSelectedBulkCategory(cat.id); setShowBulkCategoryDropdown(false); }}
                                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${selectedBulkCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                            >
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#ff8404' }} />
                                                                {cat.name}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}

                                                {/* Ingresos */}
                                                {categories.filter(c => c.type === 'INCOME').length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border-y border-slate-200">
                                                            {t('transactions.income')}
                                                        </div>
                                                        {categories.filter(c => c.type === 'INCOME').map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                onClick={() => { setSelectedBulkCategory(cat.id); setShowBulkCategoryDropdown(false); }}
                                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${selectedBulkCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                                            >
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#22c55e' }} />
                                                                {cat.name}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => {
                                        if (selectedBulkCategory) {
                                            handleBulkAction('UPDATE', { categoryId: selectedBulkCategory });
                                            setSelectedBulkCategory(null);
                                        }
                                    }}
                                    disabled={!selectedBulkCategory}
                                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    loading={isBulkActionLoading}
                                >
                                    {t('transactions.table.bulkActions.apply')}
                                </Button>

                                <Button
                                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-colors bg-rose-500 hover:bg-rose-600 text-white transition-all active:scale-95"
                                    onClick={() => handleBulkAction('DELETE')}
                                    loading={isBulkActionLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('transactions.table.bulkActions.delete')}
                                </Button>

                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="ml-2 p-2 hover:bg-slate-200 rounded-full transition-colors group"
                                >
                                    <X className="text-slate-400 group-hover:text-slate-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
