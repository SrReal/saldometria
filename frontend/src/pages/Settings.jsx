import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { Trash2, Plus, Tag, Palette, Edit2, Check, X, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { BudgetManager } from '../components/BudgetManager';

export const Settings = () => {
    const { selectedEntity } = useEntity();
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('EXPENSE');
    const [newColor, setNewColor] = useState('#cbd5e1');

    useEffect(() => {
        if (selectedEntity) {
            fetchCategories();
        }
    }, [selectedEntity]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/categories?entityId=${selectedEntity.id}`);
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName) return;

        try {
            const res = await api.post('/categories', {
                entityId: selectedEntity.id,
                name: newName,
                type: newType,
                color: newColor
            });
            setCategories([...categories, res.data]);
            setNewName('');
            setNewColor('#cbd5e1');
        } catch (error) {
            console.error('Error creating category', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('settings.confirm.delete'))) return;
        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting category', error);
        }
    };

    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
        '#f43f5e', '#64748b'
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            {loading && <FullScreenLoader message="Cargando configuración..." />}

            <div>
                <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    <Tag className="w-8 h-8 text-indigo-500" />
                    {t('settings.title')}
                </h2>
                <p className="text-slate-400 text-lg">{t('settings.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="sticky top-6 border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-400" />
                            {t('settings.newCategory')}
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-6">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.form.name')}</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={t('settings.form.placeholder')}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent p-3 placeholder-slate-600"
                                />
                            </div>

                            {/* Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.form.type')}</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setNewType('EXPENSE')}
                                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${newType === 'EXPENSE'
                                            ? 'bg-red-500/20 text-red-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {t('transactions.expense')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType('INCOME')}
                                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${newType === 'INCOME'
                                            ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {t('transactions.income')}
                                    </button>
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">{t('settings.form.color')}</label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewColor(c)}
                                            className={`w-10 h-10 rounded-lg transition-all duration-200 outline-none ring-2 ring-offset-2 ring-offset-slate-800 ${newColor === c
                                                ? 'ring-white scale-110'
                                                : 'ring-transparent hover:scale-105 hover:ring-white/20'
                                                }`}
                                            style={{ backgroundColor: c, height: '40px', width: '40px' }}
                                            aria-label={`Seleccionar color ${c}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview & Submit */}
                            <div className="pt-4 border-t border-slate-700/50 space-y-4">
                                <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                                    <span>{t('settings.form.preview')}</span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm`}
                                        style={{ backgroundColor: newColor }}
                                    >
                                        {newName || t('settings.newCategory')}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newName}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    {t('settings.form.create')}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Column */}
                <div className="lg:col-span-7 space-y-6">
                    <BudgetManager />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-red-400 flex items-center justify-between border-b border-white/5 pb-2">
                            <span>{t('settings.sections.expense')}</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{categories.filter(c => c.type === 'EXPENSE').length}</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                                <div key={cat.id} className="group bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 p-3 rounded-xl flex items-center justify-between transition-all hover:bg-slate-800/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                        <span className="font-medium text-slate-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {categories.filter(c => c.type === 'EXPENSE').length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                                    {t('settings.sections.noExpense')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold text-emerald-400 flex items-center justify-between border-b border-white/5 pb-2">
                            <span>{t('settings.sections.income')}</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{categories.filter(c => c.type === 'INCOME').length}</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.filter(c => c.type === 'INCOME').map(cat => (
                                <div key={cat.id} className="group bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 p-3 rounded-xl flex items-center justify-between transition-all hover:bg-slate-800/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                        <span className="font-medium text-slate-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {categories.filter(c => c.type === 'INCOME').length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                                    {t('settings.sections.noIncome')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
