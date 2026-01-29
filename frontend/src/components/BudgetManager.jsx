import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { Card } from './Card';

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
        } catch (error) {
            console.error('Error saving budget:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('settings.budgets.confirmDelete'))) return;
        try {
            await api.delete(`/budgets/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    const getBudgetForCategory = (catId) => budgets.find(b => b.categoryId === catId);

    return (
        <Card className="p-6 border-none shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-icons-round">track_changes</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{t('settings.budgets.title')}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('settings.budgets.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {categories.expense.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-sm">{t('settings.sections.noExpense')}</p>
                    </div>
                )}

                {categories.expense.map(cat => {
                    const budget = getBudgetForCategory(cat.id);
                    const isEditing = editAmount[cat.id] !== undefined;
                    const displayAmount = isEditing ? editAmount[cat.id] : (budget ? budget.amount : '');

                    return (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-primary/10 transition-all hover:translate-x-1 group">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">{cat.name}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pl-8 text-right text-sm font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
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
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title={t('common.delete')}
                                    >
                                        <span className="material-icons-round text-lg">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
