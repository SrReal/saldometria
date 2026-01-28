import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { Trash2, Plus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';

export const Rules = () => {
    const { selectedEntity } = useEntity();
    const { t } = useTranslation();
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
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
                // UPDATE
                const res = await api.put(`/rules/${editingRule.id}`, {
                    pattern,
                    categoryId: selectedCategoryId
                });
                setRules(rules.map(r => r.id === editingRule.id ? res.data : r));
                setEditingRule(null);
            } else {
                // CREATE
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
            // Optional: Reload stats if dashboard depends on it? Or just let user navigate.
        } catch (error) {
            console.error('Error applying rules', error);
            alert(t('rules.alert.retroactiveError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative">
            {loading && <FullScreenLoader message="Cargando reglas..." />}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        {t('rules.title')}
                    </h2>
                    <p className="text-gray-400">{t('rules.subtitle')}</p>
                </div>

                <button
                    onClick={handleApplyRetroactive}
                    className="text-sm bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Sparkles className="w-4 h-4" />
                    {t('rules.applyRetroactive')}
                </button>
            </div>

            {/* Create Rule Form */}
            <Card>
                <form onSubmit={handleCreateOrUpdate} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {editingRule ? t('rules.form.editPatternLabel') : t('rules.form.patternLabel')}
                        </label>
                        <input
                            type="text"
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder={t('rules.form.placeholder')}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                        />
                    </div>

                    {/* Type Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('rules.form.typeLabel')}</label>
                        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                            <button
                                type="button"
                                onClick={() => setSelectedType('EXPENSE')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${selectedType === 'EXPENSE' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t('transactions.expense')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedType('INCOME')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${selectedType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t('transactions.income')}
                            </button>
                        </div>
                    </div>

                    <div className="md:w-1/3 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t('rules.form.assignCategory')}</label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                        >
                            <option value="">{t('rules.form.select')}</option>
                            {categories
                                .filter(cat => cat.type === selectedType)
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {editingRule && (
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 rounded-lg transition-colors"
                            >
                                {t('rules.form.cancel')}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!pattern || !selectedCategoryId}
                            className={`${editingRule ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors`}
                        >
                            {editingRule ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editingRule ? t('rules.form.update') : t('rules.form.create')}
                        </button>
                    </div>
                </form>
            </Card>

            {/* Rules List */}
            <div className="grid gap-4">
                {rules.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">
                        {t('rules.list.empty')}
                    </div>
                )}

                {rules.map(rule => (
                    <div key={rule.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-slate-700 rounded text-sm font-mono text-white">
                                "{rule.pattern}"
                            </div>
                            <span className="text-gray-500">→</span>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: rule.category?.color || '#94a3b8' }}
                                />
                                <span className="font-medium">{rule.category?.name || t('rules.list.deletedCategory')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEditing(rule)}
                                className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </button>
                            <button
                                onClick={() => handleDelete(rule.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
