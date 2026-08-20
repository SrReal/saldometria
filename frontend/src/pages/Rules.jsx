import { useState, useEffect } from 'react';
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
    ArrowRight,
    Tag,
    ListFilter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!pattern || !selectedCategoryId) return;

        try {
            if (editingRule) {
                const res = await api.put(`/rules/${editingRule.id}`, {
                    pattern,
                    categoryId: selectedCategoryId
                });
                setRules(rules.map(r => r.id === editingRule.id ? res.data : r));
                setEditingRule(null);
                toast.success('Regla actualizada');
            } else {
                const res = await api.post('/rules', {
                    entityId: selectedEntity.id,
                    pattern,
                    categoryId: selectedCategoryId
                });
                setRules([res.data, ...rules]);
                toast.success('Regla creada con éxito');
            }

            setPattern('');
            setSelectedCategoryId('');
            setEditingRule(null);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingRule(null);
        setPattern('');
        setSelectedCategoryId('');
    };

    const handleDelete = async (id) => {
        if (!confirm(t('rules.confirm.delete') || '¿Deseas eliminar esta regla?')) return;
        try {
            await api.delete(`/rules/${id}`);
            setRules(rules.filter(r => r.id !== id));
            if (editingRule?.id === id) cancelEditing();
            toast.success('Regla eliminada');
        } catch (error) {
            console.error('Error deleting rule', error);
            toast.error('Error al eliminar la regla');
        }
    };

    const handleApplyRetroactive = async () => {
        if (!confirm(t('rules.confirm.retroactive') || '¿Deseas aplicar todas las reglas activas a los movimientos históricos?')) return;

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
        if (!confirm(t('rules.confirm.ai') || '¿Deseas categorizar automáticamente con IA las transacciones pendientes?')) return;

        setLoading(true);
        try {
            const res = await api.post('/stats/ai-categorize', { entityId: selectedEntity.id });
            if (res.data.success) {
                toast.success(t('rules.alert.aiSuccess', { count: res.data.count }) || `Categorizadas ${res.data.count} transacciones con IA`);
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

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {loading && <FullScreenLoader message="Procesando reglas de categorización..." />}

            {/* Page Header */}
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

                <div className="flex items-center gap-3 flex-wrap">
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

            {/* Create / Edit Rule Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-500 absolute top-0 left-0"></div>

                <h3 className="text-base font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>{editingRule ? 'Editar Regla de Asignación' : 'Crear Nueva Regla Automática'}</span>
                </h3>

                <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
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
                        {editingRule && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={cancelEditing}
                            >
                                <X className="w-4 h-4" />
                                {t('rules.form.cancel') || 'Cancelar'}
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={!pattern || !selectedCategoryId}
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
                                    <span>{t('rules.form.create') || 'Añadir Regla'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Rules List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Reglas Activas ({rules.length})
                    </h3>
                </div>

                {rules.length === 0 && !loading && (
                    <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                            <ListFilter className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            {t('rules.list.empty') || 'No hay reglas de auto-categorización definidas'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Crea una regla introduciendo una palabra clave para que los futuros extractos bancarios se auto-clasifiquen automáticamente.
                        </p>
                    </div>
                )}

                <div className="grid gap-3">
                    {rules.map(rule => (
                        <div
                            key={rule.id}
                            className="group bg-white border border-slate-200 hover:border-primary/40 p-4 sm:p-5 rounded-2xl flex items-center justify-between transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                        Patrón Detectado
                                    </span>
                                    <div className="px-3.5 py-1 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800 border border-slate-200/80">
                                        "{rule.pattern}"
                                    </div>
                                </div>

                                <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block" />

                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                        Categoría Asignada
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shadow-sm"
                                            style={{ backgroundColor: rule.category?.color || '#94a3b8' }}
                                        />
                                        <span className="font-bold text-sm text-slate-800">
                                            {rule.category?.name || t('rules.list.deletedCategory') || 'Categoría eliminada'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditing(rule)}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
                                    title="Editar regla"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Eliminar regla"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
