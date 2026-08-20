import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { Sliders, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const BudgetManager = () => {
    const { t } = useTranslation();
    const { currencySymbol } = useAuth();
    const { selectedEntity } = useEntity();
    const [categories, setCategories] = useState({ expense: [], income: [] });
    const [budgets, setBudgets] = useState([]);
    const [editAmount, setEditAmount] = useState({});

    useEffect(() => {
        if (selectedEntity) {
            fetchData();
        }
    }, [selectedEntity]);

    const fetchData = async () => {
        try {
            const [catRes, budgetRes] = await Promise.all([
                api.get('/categories', { params: { entityId: selectedEntity.id } }),
                api.get('/budgets', { params: { entityId: selectedEntity.id } })
            ]);

            const allCats = catRes.data || [];
            setCategories({
                expense: allCats.filter(c => c.type === 'EXPENSE'),
                income: allCats.filter(c => c.type === 'INCOME')
            });

            setBudgets(budgetRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSave = async (categoryId, amount) => {
        try {
            await api.post('/budgets', {
                entityId: selectedEntity.id,
                categoryId,
                amount: parseFloat(amount),
                period: 'MONTHLY'
            });
            fetchData();
            setEditAmount(prev => ({ ...prev, [categoryId]: undefined }));
            toast.success('Presupuesto guardado');
        } catch (error) {
            console.error('Error saving budget:', error);
            toast.error('Error al guardar el presupuesto');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('settings.budgets.confirmDelete') || '¿Deseas eliminar este límite de presupuesto?')) return;
        try {
            await api.delete(`/budgets/${id}`);
            fetchData();
            toast.success('Presupuesto eliminado');
        } catch (error) {
            console.error('Error deleting budget:', error);
            toast.error('Error al eliminar presupuesto');
        }
    };

    const getBudgetForCategory = (catId) => budgets.find(b => b.categoryId === catId);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sliders className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                        {t('settings.budgets.title') || 'Límites de Presupuesto Mensual por Categoría'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        {t('settings.budgets.subtitle') || 'Fija topes de gasto para recibir alertas cuando alcances el 80% o 100%'}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {categories.expense.length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl p-6">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">{t('settings.sections.noExpense') || 'No hay categorías de gasto configuradas.'}</p>
                    </div>
                )}

                {categories.expense.map(cat => {
                    const budget = getBudgetForCategory(cat.id);
                    const isEditing = editAmount[cat.id] !== undefined;
                    const displayAmount = isEditing ? editAmount[cat.id] : (budget ? budget.amount : '');

                    return (
                        <div
                            key={cat.id}
                            className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary/30 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                    {cat.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                        {currencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-7 text-right text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                        value={displayAmount}
                                        onChange={(e) => setEditAmount(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                        onBlur={() => {
                                            if (displayAmount && displayAmount !== (budget?.amount?.toString())) {
                                                handleSave(cat.id, displayAmount);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave(cat.id, displayAmount);
                                        }}
                                    />
                                </div>

                                {budget && (
                                    <button
                                        onClick={() => handleDelete(budget.id)}
                                        className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title={t('common.delete') || 'Eliminar'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
