import { useState, useEffect, useMemo } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';
import {
    Sparkles,
    Brain,
    RotateCcw,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Tag,
    ListFilter,
    Search,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { showConfirm } from '../utils/swal';

export const Rules = () => {
    const { selectedEntity } = useEntity();
    const { t } = useTranslation();
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [pattern, setPattern] = useState('');
    const [selectedType, setSelectedType] = useState('EXPENSE');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [editingRule, setEditingRule] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Table Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'EXPENSE', 'INCOME'
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedRuleIds, setSelectedRuleIds] = useState(new Set());

    useEffect(() => {
        if (selectedEntity) {
            fetchData();
        }
    }, [selectedEntity]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, catsRes] = await Promise.all([
                api.get(`/rules?entityId=${selectedEntity.id}`),
                api.get(`/categories?entityId=${selectedEntity.id}`)
            ]);
            setRules(rulesRes.data);
            setCategories(catsRes.data);
            setSelectedRuleIds(new Set());
        } catch (error) {
            console.error('Error fetching data', error);
            toast.error('Error al cargar reglas y categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!pattern.trim() || !selectedCategoryId) return;

        try {
            if (editingRule) {
                const res = await api.put(`/rules/${editingRule.id}`, {
                    pattern: pattern.trim(),
                    categoryId: selectedCategoryId
                });
                setRules(rules.map(r => r.id === editingRule.id ? res.data : r));
                setEditingRule(null);
                toast.success('Regla actualizada');
            } else {
                const res = await api.post('/rules', {
                    entityId: selectedEntity.id,
                    pattern: pattern.trim(),
                    categoryId: selectedCategoryId
                });
                setRules([res.data, ...rules]);
                toast.success('Regla creada con éxito');
            }

            setPattern('');
            setSelectedCategoryId('');
            setEditingRule(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error saving rule', error);
            toast.error('Error al guardar la regla');
        }
    };

    const startEditing = (rule) => {
        setEditingRule(rule);
        setPattern(rule.pattern);
        setSelectedCategoryId(rule.categoryId || '');
        const cat = categories.find(c => c.id === rule.categoryId);
        if (cat) setSelectedType(cat.type);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingRule(null);
        setPattern('');
        setSelectedCategoryId('');
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: t('rules.confirm.delete') || '¿Eliminar regla?',
            text: 'Las nuevas transacciones no se categorizarán automáticamente con esta regla.',
            confirmButtonText: t('common.delete') || 'Eliminar',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'warning',
            isDanger: true,
        });
        if (!confirmed) return;

        try {
            await api.delete(`/rules/${id}`);
            setRules(rules.filter(r => r.id !== id));
            setSelectedRuleIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            if (editingRule?.id === id) cancelEditing();
            toast.success('Regla eliminada');
        } catch (error) {
            console.error('Error deleting rule', error);
            toast.error('Error al eliminar la regla');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRuleIds.size === 0) return;

        const count = selectedRuleIds.size;
        const confirmed = await showConfirm({
            title: `¿Eliminar ${count} reglas seleccionadas?`,
            text: 'Esta acción no se puede deshacer y las reglas dejarán de aplicarse.',
            confirmButtonText: `Eliminar ${count} reglas`,
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'warning',
            isDanger: true,
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            const idsToDelete = Array.from(selectedRuleIds);
            await api.post('/rules/bulk-delete', {
                ids: idsToDelete,
                entityId: selectedEntity.id
            });
            setRules(rules.filter(r => !selectedRuleIds.has(r.id)));
            setSelectedRuleIds(new Set());
            toast.success(`Eliminadas ${count} reglas`);
        } catch (error) {
            console.error('Error in bulk delete', error);
            toast.error('Error al eliminar las reglas seleccionadas');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyRetroactive = async () => {
        const confirmed = await showConfirm({
            title: t('rules.confirm.retroactive') || '¿Aplicar reglas a histórico?',
            text: 'Se evaluarán todas las reglas activas sobre los movimientos anteriores.',
            confirmButtonText: 'Aplicar reglas',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'question',
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await api.post('/rules/apply', { entityId: selectedEntity.id });
            toast.success(t('rules.alert.retroactiveSuccess', { count: res.data.count }) || `Reglas aplicadas a ${res.data.count} movimientos`);
        } catch (error) {
            console.error('Error applying rules', error);
            toast.error(t('rules.alert.retroactiveError') || 'Error al aplicar reglas retroactivas');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyAI = async () => {
        const confirmed = await showConfirm({
            title: t('rules.confirm.ai') || '¿Categorizar con IA?',
            text: 'El motor inteligente analizará movimientos huérfanos, creará nuevas reglas reutilizables y categorías si es necesario.',
            confirmButtonText: 'Iniciar IA',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'info',
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await api.post('/stats/ai-categorize', { entityId: selectedEntity.id });
            if (res.data.success) {
                await fetchData();
                const msg = res.data.message || `Categorizadas ${res.data.count} transacciones con IA`;
                toast.success(msg, { duration: 5000 });
            } else {
                toast.error(res.data.message || 'Error en categorización por IA');
            }
        } catch (error) {
            console.error('Error in AI categorization', error);
            toast.error(t('rules.alert.aiError') || 'Error al conectar con el servicio de IA');
        } finally {
            setLoading(false);
        }
    };

    // Extraer únicamente las categorías que existen en las reglas actuales
    const availableFilterCategories = useMemo(() => {
        const map = new Map();
        rules.forEach(rule => {
            if (rule.category && rule.category.id) {
                if (!map.has(rule.category.id)) {
                    map.set(rule.category.id, rule.category);
                }
            }
        });
        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [rules]);

    // Función de normalización para búsqueda semántica (elimina acentos, diacríticos y mayúsculas)
    const normalizeString = (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    };

    // Filtrado Inteligente de Reglas
    const filteredRules = useMemo(() => {
        const queryNorm = normalizeString(searchTerm);

        return rules.filter(rule => {
            // Filtro por Tipo
            if (filterType !== 'ALL') {
                const ruleType = rule.category?.type;
                if (ruleType !== filterType) return false;
            }

            // Filtro por Categoría
            if (filterCategory !== 'ALL') {
                if (String(rule.categoryId) !== String(filterCategory)) return false;
            }

            // Búsqueda Semántica
            if (queryNorm) {
                const patternNorm = normalizeString(rule.pattern);
                const categoryNorm = normalizeString(rule.category?.name);
                const typeNorm = normalizeString(rule.category?.type === 'INCOME' ? 'ingreso income' : 'gasto expense');

                const matches = patternNorm.includes(queryNorm) ||
                    categoryNorm.includes(queryNorm) ||
                    typeNorm.includes(queryNorm);

                if (!matches) return false;
            }

            return true;
        });
    }, [rules, searchTerm, filterType, filterCategory]);

    // Resetear a la primera página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterCategory, itemsPerPage]);

    // Paginación
    const totalPages = Math.max(1, Math.ceil(filteredRules.length / itemsPerPage));
    const paginatedRules = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRules.slice(start, start + itemsPerPage);
    }, [filteredRules, currentPage, itemsPerPage]);

    // Selección masiva de la página actual
    const isAllPageSelected = paginatedRules.length > 0 && paginatedRules.every(r => selectedRuleIds.has(r.id));
    const isSomePageSelected = paginatedRules.some(r => selectedRuleIds.has(r.id)) && !isAllPageSelected;

    const toggleSelectAllPage = () => {
        const next = new Set(selectedRuleIds);
        if (isAllPageSelected) {
            paginatedRules.forEach(r => next.delete(r.id));
        } else {
            paginatedRules.forEach(r => next.add(r.id));
        }
        setSelectedRuleIds(next);
    };

    const toggleSelectRule = (id) => {
        const next = new Set(selectedRuleIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedRuleIds(next);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            {loading && <FullScreenLoader message="Procesando reglas de categorización..." />}

            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        {t('rules.title') || 'Reglas de Auto-Categorización'}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                        {t('rules.subtitle') || 'Asigna categorías automáticamente según palabras clave en la descripción bancaria'}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                        onClick={() => {
                            if (showForm && !editingRule) {
                                setShowForm(false);
                            } else {
                                setEditingRule(null);
                                setPattern('');
                                setSelectedCategoryId('');
                                setShowForm(true);
                            }
                        }}
                        className="shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{showForm && !editingRule ? 'Cerrar Formulario' : 'Nueva Regla'}</span>
                    </Button>
                    <Button
                        onClick={handleApplyAI}
                        variant="secondary"
                    >
                        <Brain className="w-4 h-4 text-primary" />
                        <span>{t('rules.applyAI')}</span>
                    </Button>
                    <Button
                        onClick={handleApplyRetroactive}
                        variant="secondary"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>{t('rules.applyRetroactive')}</span>
                    </Button>
                </div>
            </header>

            {/* Create / Edit Rule Form (Colapsable) */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 relative overflow-hidden transition-all animate-in slide-in-from-top-4 duration-200">
                    <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-500 absolute top-0 left-0"></div>

                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary" />
                            <span>{editingRule ? 'Editar Regla de Asignación' : 'Crear Nueva Regla Automática'}</span>
                        </h3>
                        <button
                            type="button"
                            onClick={cancelEditing}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Pattern Input */}
                        <div className="md:col-span-5">
                            <Input
                                label={editingRule ? t('rules.form.editPatternLabel') || 'Patrón / Texto en descripción' : t('rules.form.patternLabel') || 'Si la descripción contiene'}
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                placeholder={t('rules.form.placeholder') || 'Ej: Netflix, Uber, Mercadona, Nómina...'}
                                required
                            />
                        </div>

                        {/* Type Selector Toggle */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                {t('rules.form.typeLabel') || 'Tipo de Movimiento'}
                            </label>
                            <div className="flex bg-slate-100 p-1 rounded-xl h-[42px] items-stretch border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedType('EXPENSE'); setSelectedCategoryId(''); }}
                                    className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${selectedType === 'EXPENSE'
                                        ? 'bg-white text-rose-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {t('transactions.expense') || 'Gasto'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedType('INCOME'); setSelectedCategoryId(''); }}
                                    className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${selectedType === 'INCOME'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {t('transactions.income') || 'Ingreso'}
                                </button>
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                {t('rules.form.assignCategory') || 'Asignar a Categoría'}
                            </label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all h-[42px]"
                            >
                                <option value="">{t('rules.form.select') || 'Seleccionar Categoría...'}</option>
                                {categories
                                    .filter(cat => cat.type === selectedType)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="md:col-span-12 flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={cancelEditing}
                            >
                                <X className="w-4 h-4" />
                                {t('rules.form.cancel') || 'Cancelar'}
                            </Button>
                            <Button
                                type="submit"
                                disabled={!pattern.trim() || !selectedCategoryId}
                                className="shadow-md shadow-primary/20"
                            >
                                {editingRule ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>{t('rules.form.update') || 'Actualizar Regla'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>{t('rules.form.create') || 'Guardar Regla'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                    {/* Semantic Search */}
                    <div className="lg:col-span-6 relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por patrón, comercio o categoría..."
                            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Type */}
                    <div className="lg:col-span-3">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="ALL">Todos los Tipos</option>
                            <option value="EXPENSE">Solo Gastos</option>
                            <option value="INCOME">Solo Ingresos</option>
                        </select>
                    </div>

                    {/* Filter Category (Solo categorías existentes en las reglas) */}
                    <div className="lg:col-span-3">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="ALL">Todas las Categorías ({availableFilterCategories.length})</option>
                            {availableFilterCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions Banner */}
                {selectedRuleIds.size > 0 && (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-slate-800">
                                {selectedRuleIds.size} {selectedRuleIds.size === 1 ? 'regla seleccionada' : 'reglas seleccionadas'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedRuleIds(new Set())}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-white/60 transition-colors"
                            >
                                Deseleccionar
                            </button>
                            <Button
                                onClick={handleBulkDelete}
                                variant="secondary"
                                className="!py-1.5 !px-3 !text-xs !bg-rose-50 !text-rose-600 !border-rose-200 hover:!bg-rose-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar seleccionadas ({selectedRuleIds.size})</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Rules Content: Mobile Cards + Desktop Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-full">
                
                {/* Mobile View: Cards List (< 640px) */}
                <div className="block sm:hidden divide-y divide-slate-100">
                    {/* Mobile Header with Select All */}
                    {paginatedRules.length > 0 && (
                        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={isAllPageSelected}
                                    ref={el => { if (el) el.indeterminate = isSomePageSelected; }}
                                    onChange={toggleSelectAllPage}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-slate-300 cursor-pointer"
                                />
                                <span>Seleccionar todo ({paginatedRules.length})</span>
                            </label>
                            <span className="text-[11px] font-semibold text-slate-400">Pág {currentPage} de {totalPages}</span>
                        </div>
                    )}

                    {paginatedRules.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                                <ListFilter className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">No se encontraron reglas</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                {rules.length === 0
                                    ? 'No tienes reglas creadas. Puedes crear una nueva o categorizar automáticamente con IA.'
                                    : 'Ninguna regla coincide con los filtros aplicados.'}
                            </p>
                        </div>
                    ) : (
                        paginatedRules.map(rule => {
                            const isSelected = selectedRuleIds.has(rule.id);
                            const isExpense = rule.category?.type === 'EXPENSE';

                            return (
                                <div
                                    key={`mobile-${rule.id}`}
                                    className={`p-3.5 flex flex-col gap-2.5 transition-colors ${
                                        isSelected ? 'bg-primary/5' : 'hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectRule(rule.id)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-slate-300 cursor-pointer flex-shrink-0"
                                            />
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-800 truncate max-w-[200px]">
                                                "{rule.pattern}"
                                            </div>
                                        </label>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => startEditing(rule)}
                                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Editar regla"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Eliminar regla"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pl-6">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: rule.category?.color || '#cbd5e1' }}
                                            />
                                            <span className="text-xs font-bold text-slate-700 truncate">
                                                {rule.category?.name || 'Sin categoría'}
                                            </span>
                                        </div>

                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                                            isExpense
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        }`}>
                                            {isExpense ? <TrendingDown className="w-3 h-3 text-rose-500" /> : <TrendingUp className="w-3 h-3 text-emerald-500" />}
                                            {isExpense ? 'Gasto' : 'Ingreso'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View: Full Data Table (>= 640px) */}
                <div className="hidden sm:block overflow-x-auto w-full max-w-full custom-scrollbar">
                    <table className="w-full min-w-[640px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                <th className="py-3.5 px-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllPageSelected}
                                        ref={el => { if (el) el.indeterminate = isSomePageSelected; }}
                                        onChange={toggleSelectAllPage}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-slate-300 cursor-pointer"
                                        title="Seleccionar todas en esta página"
                                    />
                                </th>
                                <th className="py-3.5 px-4">Patrón / Palabra Clave</th>
                                <th className="py-3.5 px-4">Tipo</th>
                                <th className="py-3.5 px-4">Categoría Asignada</th>
                                <th className="py-3.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedRules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-400">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                                            <ListFilter className="w-6 h-6" />
                                        </div>
                                        <p className="font-bold text-slate-700 text-sm">No se encontraron reglas</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            {rules.length === 0
                                                ? 'No tienes reglas creadas. Puedes crear una nueva o categorizar automáticamente con IA.'
                                                : 'Ninguna regla coincide con los filtros o término de búsqueda aplicado.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRules.map(rule => {
                                    const isSelected = selectedRuleIds.has(rule.id);
                                    const isExpense = rule.category?.type === 'EXPENSE';

                                    return (
                                        <tr
                                            key={rule.id}
                                            className={`transition-colors group ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectRule(rule.id)}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-slate-300 cursor-pointer"
                                                />
                                            </td>

                                            {/* Pattern */}
                                            <td className="py-3 px-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-800">
                                                    "{rule.pattern}"
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${isExpense
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                                    }`}>
                                                    {isExpense ? (
                                                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                                    ) : (
                                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                    )}
                                                    {isExpense ? 'Gasto' : 'Ingreso'}
                                                </span>
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full shadow-xs flex-shrink-0"
                                                        style={{ backgroundColor: rule.category?.color || '#cbd5e1' }}
                                                    />
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {rule.category?.name || 'Categoría no encontrada'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => startEditing(rule)}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Editar regla"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(rule.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Eliminar regla"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination & Summary Footer */}
                {filteredRules.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                        {/* Summary & Per Page */}
                        <div className="flex items-center gap-3">
                            <span>
                                Mostrando <strong className="text-slate-800">{Math.min(filteredRules.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong className="text-slate-800">{Math.min(filteredRules.length, currentPage * itemsPerPage)}</strong> de <strong className="text-slate-800">{filteredRules.length}</strong> reglas
                            </span>
                            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                                <span>Por página:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Page Navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Página anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    return (
                                        <div key={p} className="flex items-center">
                                            {prev && p - prev > 1 && (
                                                <span className="px-1 text-slate-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(p)}
                                                className={`min-w-[28px] h-7 px-2 text-xs font-bold rounded-lg transition-colors ${currentPage === p
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    );
                                })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Página siguiente"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
