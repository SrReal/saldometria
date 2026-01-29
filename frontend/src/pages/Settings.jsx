import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { BudgetManager } from '../components/BudgetManager';
import { AlertManager } from '../components/AlertManager';

export const Settings = () => {
    const { selectedEntity } = useEntity();
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('EXPENSE');
    const [newColor, setNewColor] = useState('#ff8404');

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
            setNewColor('#ff8404');
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
        '#ff8404', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#84cc16',
        '#06b6d4', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader message="Cargando configuración..." />}

            <header>
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <span className="material-icons-round text-primary text-4xl">settings</span>
                    {t('settings.title')}
                </h2>
                <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column */}
                <Card className="lg:col-span-5 p-6 border-none shadow-sm sticky top-8">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                        <span className="material-icons-round text-primary">add_circle</span>
                        {t('settings.newCategory')}
                    </h3>

                    <form onSubmit={handleCreate} className="space-y-6">
                        <Input
                            label={t('settings.form.name')}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('settings.form.placeholder')}
                            required
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('settings.form.type')}</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11 items-stretch">
                                <button
                                    type="button"
                                    onClick={() => setNewType('EXPENSE')}
                                    className={`flex-1 flex items-center justify-center text-xs font-black rounded-lg transition-all ${newType === 'EXPENSE'
                                        ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t('transactions.expense')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewType('INCOME')}
                                    className={`flex-1 flex items-center justify-center text-xs font-black rounded-lg transition-all ${newType === 'INCOME'
                                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t('transactions.income')}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">{t('settings.form.color')}</label>
                            <div className="flex flex-wrap gap-3 p-1">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setNewColor(c)}
                                        className={`w-10 h-10 rounded-xl transition-all duration-200 outline-none hover:scale-110 ${newColor === c
                                            ? 'ring-4 ring-primary/20 scale-110 shadow-lg'
                                            : 'opacity-70 hover:opacity-100'
                                            }`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.form.preview')}</span>
                                <span
                                    className="px-4 py-1.5 rounded-xl text-xs font-black text-white shadow-sm transition-all"
                                    style={{ backgroundColor: newColor }}
                                >
                                    {newName || t('settings.newCategory')}
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={!newName}
                                className="w-full h-12"
                            >
                                <span className="material-icons-round">add</span>
                                {t('settings.form.create')}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Managers and Category List Column */}
                <div className="lg:col-span-7 space-y-8">
                    <BudgetManager />

                    {selectedEntity && (
                        <AlertManager entityId={selectedEntity.id} />
                    )}

                    {/* Expenses Categories */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-rose-500 flex items-center justify-between border-b border-rose-500/10 pb-4 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round">trending_down</span>
                                <span>{t('settings.sections.expense')}</span>
                            </div>
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">{categories.filter(c => c.type === 'EXPENSE').length}</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                                <div key={cat.id} className="group bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-primary/20 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
                                    >
                                        <span className="material-icons-round text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                            {categories.filter(c => c.type === 'EXPENSE').length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    {t('settings.sections.noExpense')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Income Categories */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-emerald-500 flex items-center justify-between border-b border-emerald-500/10 pb-4 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round">trending_up</span>
                                <span>{t('settings.sections.income')}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">{categories.filter(c => c.type === 'INCOME').length}</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.filter(c => c.type === 'INCOME').map(cat => (
                                <div key={cat.id} className="group bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-primary/20 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
                                    >
                                        <span className="material-icons-round text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                            {categories.filter(c => c.type === 'INCOME').length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
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
