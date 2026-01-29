import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';

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
            } else {
                const res = await api.post('/rules', {
                    entityId: selectedEntity.id,
                    pattern,
                    categoryId: selectedCategoryId
                });
                setRules([res.data, ...rules]);
            }

            setPattern('');
            setSelectedCategoryId('');
            setEditingRule(null);
        } catch (error) {
            console.error('Error saving rule', error);
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
        if (!confirm(t('rules.confirm.delete'))) return;
        try {
            await api.delete(`/rules/${id}`);
            setRules(rules.filter(r => r.id !== id));
            if (editingRule?.id === id) cancelEditing();
        } catch (error) {
            console.error('Error deleting rule', error);
        }
    };

    const handleApplyRetroactive = async () => {
        if (!confirm(t('rules.confirm.retroactive'))) return;

        setLoading(true);
        try {
            const res = await api.post('/rules/apply', { entityId: selectedEntity.id });
            alert(t('rules.alert.retroactiveSuccess', { count: res.data.count }));
        } catch (error) {
            console.error('Error applying rules', error);
            alert(t('rules.alert.retroactiveError'));
        } finally {
            setLoading(false);
        }
    };

    const handleApplyAI = async () => {
        if (!confirm(t('rules.confirm.ai'))) return;

        setLoading(true);
        try {
            const res = await api.post('/stats/ai-categorize', { entityId: selectedEntity.id });
            if (res.data.success) {
                alert(t('rules.alert.aiSuccess', { count: res.data.count }));
            } else {
                alert(t('rules.alert.aiError') + ': ' + (res.data.message || ''));
            }
        } catch (error) {
            console.error('Error in AI categorization', error);
            alert(t('rules.alert.aiError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader message="Cargando reglas..." />}

            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">auto_awesome</span>
                        {t('rules.title')}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('rules.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleApplyAI}
                        variant="ghost"
                        className="text-primary hover:bg-primary/10 border border-primary/20"
                    >
                        <span className="material-icons-round text-lg">psychology</span>
                        {t('rules.applyAI')}
                    </Button>
                    <Button
                        onClick={handleApplyRetroactive}
                        variant="secondary"
                    >
                        <span className="material-icons-round text-lg">settings_backup_restore</span>
                        {t('rules.applyRetroactive')}
                    </Button>
                </div>
            </header>

            {/* Create Rule Form */}
            <Card className="p-8 border-none shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

                <form onSubmit={handleCreateOrUpdate} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full translate-y-[-2px]">
                        <Input
                            label={editingRule ? t('rules.form.editPatternLabel') : t('rules.form.patternLabel')}
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder={t('rules.form.placeholder')}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 translate-y-[-2px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('rules.form.typeLabel')}</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11 items-stretch min-w-[200px]">
                            <button
                                type="button"
                                onClick={() => setSelectedType('EXPENSE')}
                                className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedType === 'EXPENSE'
                                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {t('transactions.expense')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedType('INCOME')}
                                className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedType === 'INCOME'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {t('transactions.income')}
                            </button>
                        </div>
                    </div>

                    <div className="md:w-1/3 w-full translate-y-[-2px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider mb-1.5 block">{t('rules.form.assignCategory')}</label>
                        <div className="relative">
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm appearance-none h-11"
                            >
                                <option value="">{t('rules.form.select')}</option>
                                {categories
                                    .filter(cat => cat.type === selectedType)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                            </select>
                            <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {editingRule && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-11"
                            >
                                {t('rules.form.cancel')}
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={!pattern || !selectedCategoryId}
                            className="h-11 px-8"
                        >
                            <span className="material-icons-round">
                                {editingRule ? 'check' : 'add'}
                            </span>
                            {editingRule ? t('rules.form.update') : t('rules.form.create')}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Rules List */}
            <div className="grid gap-4">
                {rules.length === 0 && !loading && (
                    <div className="py-24 text-center bg-white dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-600 mx-auto mb-6">
                            <span className="material-icons-round text-5xl">list_alt</span>
                        </div>
                        <p className="text-slate-500 font-bold">{t('rules.list.empty')}</p>
                    </div>
                )}

                {rules.map(rule => (
                    <div key={rule.id} className="group bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-primary/20 p-5 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Patrón</span>
                                <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 shadow-inner">
                                    {rule.pattern}
                                </div>
                            </div>

                            <span className="material-icons-round text-slate-300">arrow_forward</span>

                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Categoría</span>
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white/10"
                                        style={{ backgroundColor: rule.category?.color || '#94a3b8' }}
                                    />
                                    <span className="font-black text-sm text-slate-700 dark:text-slate-200">{rule.category?.name || t('rules.list.deletedCategory')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                            <button
                                onClick={() => startEditing(rule)}
                                className="p-2.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
                            >
                                <span className="material-icons-round text-xl">edit</span>
                            </button>
                            <button
                                onClick={() => handleDelete(rule.id)}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all shadow-sm"
                            >
                                <span className="material-icons-round text-xl">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
