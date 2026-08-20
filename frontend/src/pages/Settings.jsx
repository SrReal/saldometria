import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { BudgetManager } from '../components/BudgetManager';
import { AlertManager } from '../components/AlertManager';
import {
    Settings as SettingsIcon,
    Tag,
    Plus,
    Trash2,
    Sliders,
    Bell,
    Check,
    Palette
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Settings = () => {
    const { selectedEntity } = useEntity();
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'budgets', 'alerts'

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
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            const res = await api.post('/categories', {
                entityId: selectedEntity.id,
                name: newName.trim(),
                type: newType,
                color: newColor
            });
            setCategories([...categories, res.data]);
            setNewName('');
            setNewColor('#ff8404');
            toast.success('Categoría creada con éxito');
        } catch (error) {
            console.error('Error creating category', error);
            toast.error('Error al crear la categoría');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('settings.confirm.delete') || '¿Deseas eliminar esta categoría?')) return;
        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Categoría eliminada');
        } catch (error) {
            console.error('Error deleting category', error);
            toast.error('Error al eliminar la categoría');
        }
    };

    const colors = [
        '#ff8404', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#84cc16',
        '#06b6d4', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
    ];

    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
    const incomeCategories = categories.filter(c => c.type === 'INCOME');

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {loading && <FullScreenLoader message="Cargando configuración..." />}

            {/* Page Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <SettingsIcon className="w-6 h-6 text-primary" />
                        </div>
                        {t('settings.title') || 'Configuración del Entorno'}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                        {t('settings.subtitle') || 'Personaliza categorías, límites de presupuesto mensual y alertas automáticas'}
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Categorías</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('budgets')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'budgets'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Presupuestos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'alerts'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Alertas</span>
                    </button>
                </div>
            </header>

            {/* TAB: Categories */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Create Category Form Column */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 relative overflow-hidden sticky top-6">
                        <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-500 absolute top-0 left-0"></div>

                        <h3 className="text-base font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" />
                            {t('settings.newCategory') || 'Nueva Categoría'}
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <Input
                                label={t('settings.form.name') || 'Nombre de Categoría'}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('settings.form.placeholder') || 'Ej: Supermercado, Alquiler, Ventas...'}
                                required
                            />

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('settings.form.type') || 'Tipo'}
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-xl h-[42px] items-stretch border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setNewType('EXPENSE')}
                                        className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${newType === 'EXPENSE'
                                            ? 'bg-white text-rose-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {t('transactions.expense') || 'Gasto'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType('INCOME')}
                                        className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${newType === 'INCOME'
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {t('transactions.income') || 'Ingreso'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                                    {t('settings.form.color') || 'Color Identificativo'}
                                </label>
                                <div className="flex flex-wrap gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    {colors.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewColor(c)}
                                            className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center relative shadow-sm"
                                            style={{ backgroundColor: c }}
                                        >
                                            {newColor === c && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                                        </button>
                                    ))}
                                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 relative flex items-center justify-center cursor-pointer">
                                        <input
                                            type="color"
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            title="Color personalizado"
                                        />
                                        <Palette className="w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full shadow-md shadow-primary/20">
                                <Plus className="w-4 h-4" />
                                {t('settings.createCategory') || 'Añadir Categoría'}
                            </Button>
                        </form>
                    </div>

                    {/* Categories List Column */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Expenses Categories */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    Categorías de Gasto ({expenseCategories.length})
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {expenseCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 group hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span
                                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {category.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <p className="col-span-full py-4 text-center text-xs text-slate-400">
                                        No hay categorías de gasto creadas.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Income Categories */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Categorías de Ingreso ({incomeCategories.length})
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {incomeCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 group hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span
                                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {category.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {incomeCategories.length === 0 && (
                                    <p className="col-span-full py-4 text-center text-xs text-slate-400">
                                        No hay categorías de ingreso creadas.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Budgets */}
            {activeTab === 'budgets' && (
                <div className="space-y-6">
                    <BudgetManager />
                </div>
            )}

            {/* TAB: Alerts */}
            {activeTab === 'alerts' && (
                <div className="space-y-6">
                    <AlertManager />
                </div>
            )}
        </div>
    );
};
