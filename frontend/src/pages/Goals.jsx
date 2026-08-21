import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEntity } from '../context/EntityContext';
import api from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { toast } from 'react-hot-toast';
import { showConfirm } from '../utils/swal';
import {
    Target,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Flag,
    X,
    Coins,
    CheckCircle2
} from 'lucide-react';

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
            toast.error('Error al cargar los objetivos');
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
                toast.success('Objetivo actualizado correctamente');
            } else {
                await api.post('/goals', payload);
                toast.success('Objetivo creado correctamente');
            }
            setShowModal(false);
            setEditingGoal(null);
            fetchGoals();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar el objetivo');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: t('common.deleteConfirm') || '¿Eliminar objetivo?',
            text: 'Se eliminará el seguimiento y ahorro acumulado para esta meta.',
            confirmButtonText: t('common.delete') || 'Eliminar',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'warning',
            isDanger: true,
        });
        if (!confirmed) return;

        try {
            await api.delete(`/goals/${id}`);
            toast.success('Objetivo eliminado');
            fetchGoals();
        } catch {
            toast.error('Error al eliminar el objetivo');
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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {loading && <FullScreenLoader />}

            {/* Page Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        {t('goals.title') || 'Objetivos de Ahorro'}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                        {t('goals.subtitle') || 'Define metas financieras, colchones y haz seguimiento de tu progreso'}
                    </p>
                </div>
                <Button onClick={() => openModal()} className="shadow-md shadow-primary/20">
                    <Plus className="w-4 h-4" />
                    <span>{t('goals.newGoal') || 'Nuevo Objetivo'}</span>
                </Button>
            </header>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const target = Number(goal.targetAmount) || 1;
                    const current = Number(goal.currentAmount) || 0;
                    const progress = Math.min((current / target) * 100, 100);
                    const isCompleted = progress >= 100;

                    return (
                        <div
                            key={goal.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 relative group overflow-hidden"
                        >
                            {/* Top decorative color strip */}
                            <div
                                className="absolute top-0 left-0 w-full h-1"
                                style={{ backgroundColor: goal.color || '#ff8404' }}
                            ></div>

                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200">
                                <button
                                    onClick={() => openModal(goal)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Header Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border"
                                    style={{
                                        backgroundColor: `${goal.color || '#ff8404'}18`,
                                        borderColor: `${goal.color || '#ff8404'}35`,
                                        color: goal.color || '#ff8404'
                                    }}
                                >
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <h3 className="font-extrabold text-lg text-slate-800 truncate">
                                        {goal.name}
                                    </h3>
                                    {goal.deadline ? (
                                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>
                                                Meta: {new Date(goal.deadline).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-medium text-slate-400">Sin fecha límite</span>
                                    )}
                                </div>
                            </div>

                            {/* Progress & Amounts */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ahorrado</span>
                                    <span className="font-extrabold text-xl text-slate-800">
                                        {formatCurrency(goal.currentAmount)}
                                    </span>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${progress}%`, backgroundColor: goal.color || '#ff8404' }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="flex items-center gap-1" style={{ color: goal.color || '#ff8404' }}>
                                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        {progress.toFixed(0)}% completado
                                    </span>
                                    <span className="text-slate-400 font-medium">
                                        Objetivo: {formatCurrency(goal.targetAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {goals.length === 0 && !loading && (
                    <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <Flag className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            {t('goals.noGoals') || 'No tienes metas de ahorro creadas'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                            Establece objetivos como un fondo de emergencia, vacaciones o compra de equipamiento para reservar saldo en tus previsiones.
                        </p>
                        <Button onClick={() => openModal()}>
                            <Plus className="w-4 h-4" />
                            {t('goals.newGoal') || 'Crear Primer Objetivo'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Goal Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md relative overflow-hidden">
                        <div className="h-1.5 w-full" style={{ backgroundColor: formData.color || '#ff8404' }}></div>

                        <div className="p-6 sm:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    {editingGoal ? (t('goals.edit') || 'Editar Objetivo') : (t('goals.create') || 'Nuevo Objetivo')}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    type="text"
                                    label="Nombre del objetivo"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Fondo de Emergencia, Vacaciones..."
                                />

                                <div className="grid grid-cols-2 gap-4">
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

                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <Input
                                        type="date"
                                        label="Fecha Límite"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                                            Color
                                        </label>
                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                            <input
                                                type="color"
                                                className="w-7 h-7 rounded-lg overflow-hidden bg-transparent border-0 cursor-pointer p-0"
                                                value={formData.color}
                                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                            />
                                            <span className="text-xs font-mono font-bold text-slate-600">
                                                {formData.color}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        style={{ backgroundColor: formData.color || '#ff8404' }}
                                    >
                                        {editingGoal ? 'Guardar Cambios' : 'Crear Objetivo'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
