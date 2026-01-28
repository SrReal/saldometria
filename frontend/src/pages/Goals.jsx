import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { Target, Plus, PiggyBank, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Goals = () => {
    const { t } = useTranslation();
    const { selectedEntity } = useEntity();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    // Form
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        color: '#3b82f6',
        icon: 'target'
    });

    useEffect(() => {
        if (selectedEntity) fetchGoals();
    }, [selectedEntity]);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/goals?entityId=${selectedEntity.id}`);
            setGoals(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching goals');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, entityId: selectedEntity.id };
            if (editingGoal) {
                await api.patch(`/goals/${editingGoal.id}`, payload);
                toast.success('Goal updated');
            } else {
                await api.post('/goals', payload);
                toast.success('Goal created');
            }
            setShowModal(false);
            setEditingGoal(null);
            fetchGoals();
        } catch (error) {
            console.error(error);
            toast.error('Error saving goal');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.deleteConfirm') || 'Are you sure?')) return;
        try {
            await api.delete(`/goals/${id}`);
            toast.success('Goal deleted');
            fetchGoals();
        } catch {
            toast.error('Error deleting goal');
        }
    };

    const openModal = (goal = null) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                deadline: goal.deadline || '',
                color: goal.color,
                icon: goal.icon
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                color: '#3b82f6',
                icon: 'target'
            });
        }
        setShowModal(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {loading && <FullScreenLoader />}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-400" />
                        {t('goals.title') || 'Objetivos de Ahorro'}
                    </h2>
                    <p className="text-gray-400">{t('goals.subtitle') || 'Define tus metas financieras'}</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('goals.newGoal') || 'Nuevo Objetivo'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

                    return (
                        <Card key={goal.id} className="relative group">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => openModal(goal)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(goal.id)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-slate-800 border border-slate-700">
                                    <PiggyBank className="w-6 h-6" style={{ color: goal.color }} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{goal.name}</h3>
                                    {goal.deadline && (
                                        <p className="text-xs text-slate-500">
                                            Meta: {new Date(goal.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Ahorrado</span>
                                    <span className="font-bold text-slate-200">{formatCurrency(goal.currentAmount)}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{progress.toFixed(0)}%</span>
                                    <span>Objetivo: {formatCurrency(goal.targetAmount)}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold mb-6">
                            {editingGoal ? (t('goals.edit') || 'Editar Objetivo') : (t('goals.create') || 'Nuevo Objetivo')}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Coche Nuevo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Meta (€)</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-field w-full"
                                        value={formData.targetAmount}
                                        onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Ya ahorrado (€)</label>
                                    <input
                                        type="number"
                                        className="input-field w-full"
                                        value={formData.currentAmount}
                                        onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Límite</label>
                                    <input
                                        type="date"
                                        className="input-field w-full"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                                    <input
                                        type="color"
                                        className="w-full h-10 rounded bg-transparent border border-slate-600 cursor-pointer"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
