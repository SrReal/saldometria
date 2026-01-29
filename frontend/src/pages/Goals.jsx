import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { toast } from 'react-hot-toast';

export const Goals = () => {
    const { t, i18n } = useTranslation();
    const { formatCurrency, currencySymbol } = useAuth();
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
        color: '#ff8404',
        icon: 'savings'
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
                icon: goal.icon || 'savings'
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                color: '#ff8404',
                icon: 'savings'
            });
        }
        setShowModal(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {loading && <FullScreenLoader />}

            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">track_changes</span>
                        {t('goals.title') || 'Objetivos de Ahorro'}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('goals.subtitle') || 'Define tus metas financieras'}</p>
                </div>
                <Button onClick={() => openModal()}>
                    <span className="material-icons-round text-lg">add</span>
                    {t('goals.newGoal') || 'Nuevo Objetivo'}
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {goals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

                    return (
                        <Card key={goal.id} className="relative group p-6 border-none shadow-sm hover:translate-y-[-4px] transition-all">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                <button onClick={() => openModal(goal)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-icons-round text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDelete(goal.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                                    <span className="material-icons-round text-lg">delete</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-5 mb-8">
                                <div className="p-4 rounded-2xl shadow-sm flex items-center justify-center" style={{ backgroundColor: `${goal.color}15`, border: `1px solid ${goal.color}30` }}>
                                    <span className="material-icons-round text-3xl" style={{ color: goal.color }}>
                                        {goal.icon || 'savings'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">{goal.name}</h3>
                                    {goal.deadline && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="material-icons-round text-slate-400 text-xs text-[14px]">event</span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Meta: {new Date(goal.deadline).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ahorrado</span>
                                    <span className="font-black text-xl text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                                </div>

                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                                        style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span style={{ color: goal.color }}>{progress.toFixed(0)}% Completado</span>
                                    <span className="text-slate-400">Objetivo: {formatCurrency(goal.targetAmount)}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {goals.length === 0 && !loading && (
                    <div className="md:col-span-2 lg:col-span-3 py-24 text-center bg-white dark:bg-card-dark rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-600 mx-auto mb-6">
                            <span className="material-icons-round text-5xl">flag</span>
                        </div>
                        <p className="text-slate-500 font-bold">{t('goals.noGoals') || 'No tienes metas activas aún. ¡Crea tu primera meta de ahorro!'}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: formData.color || '#ff8404' }}></div>

                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black tracking-tight">
                                {editingGoal ? (t('goals.edit') || 'Editar Objetivo') : (t('goals.create') || 'Nuevo Objetivo')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                type="text"
                                label="Nombre del objetivo"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Viaje a Japón, Fondo de Emergencia..."
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    type="number"
                                    label={`Meta (${currencySymbol})`}
                                    required
                                    value={formData.targetAmount}
                                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    label={`Ahorrado (${currencySymbol})`}
                                    value={formData.currentAmount}
                                    onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    type="date"
                                    label="Fecha Límite"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Color</label>
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[42px]">
                                        <input
                                            type="color"
                                            className="w-6 h-6 rounded-full overflow-hidden bg-transparent border-0 cursor-pointer p-0"
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        />
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{formData.color}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" style={{ backgroundColor: formData.color }}>
                                    {editingGoal ? 'Actualizar' : 'Crear Objetivo'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
