import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { Card } from './Card';
import { Trash2, TrendingUp, AlertCircle, Save } from 'lucide-react';

export const BudgetManager = () => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
    const [categories, setCategories] = useState({ expense: [], income: [] });
    const [budgets, setBudgets] = useState([]);


    // Form state
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

            // Transform flat array to object with groups
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
            fetchData(); // Refresh
            setEditAmount(prev => ({ ...prev, [categoryId]: undefined })); // Clear edit state
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
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">{t('settings.budgets.title')}</h2>
                    <p className="text-sm text-gray-400">{t('settings.budgets.subtitle')}</p>
                </div>
            </div>

            <div className="space-y-4">
                {categories.expense.length === 0 && (
                    <p className="text-gray-500 italic text-sm">{t('settings.sections.noExpense')}</p>
                )}

                {categories.expense.map(cat => {
                    const budget = getBudgetForCategory(cat.id);
                    const isEditing = editAmount[cat.id] !== undefined;
                    const displayAmount = isEditing ? editAmount[cat.id] : (budget ? budget.amount : '');

                    return (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/80 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="font-medium text-slate-200">{cat.name}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-32 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 pl-7 text-right text-sm text-white focus:ring-emerald-500 focus:border-emerald-500"
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
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
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
