import { useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api/client';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    User,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Banknote,
    Layers,
    ShieldCheck,
    Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { showConfirm } from '../utils/swal';

export const Entities = () => {
    const { entities, fetchEntities, selectedEntity, switchEntity } = useEntity();
    const { currencySymbol } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    // Account Management State
    const [expandedEntityId, setExpandedEntityId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'BANK', currency: currencySymbol || 'EUR' });

    const { t } = useTranslation();

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newEntityName.trim()) return;

        setLoading(true);
        try {
            await api.post('/entities', { name: newEntityName, type: 'BUSINESS' });
            await fetchEntities();
            setNewEntityName('');
            setIsCreating(false);
            toast.success('Entidad creada con éxito');
        } catch (error) {
            console.error('Failed to create entity', error);
            toast.error('Error al crear la entidad');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        setLoading(true);
        try {
            await api.patch(`/entities/${id}`, { name: editName });
            await fetchEntities();
            setEditingId(null);
            toast.success('Nombre de entidad actualizado');
        } catch (error) {
            console.error('Failed to update entity', error);
            toast.error('Error al actualizar entidad');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: '¿Eliminar entidad?',
            text: t('entities.deleteConfirm') || 'Esta acción eliminará todas las cuentas y movimientos asociados a esta entidad.',
            confirmButtonText: t('common.delete') || 'Eliminar',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'warning',
            isDanger: true,
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            await api.delete(`/entities/${id}`);
            await fetchEntities();
            toast.success('Entidad eliminada');
        } catch (error) {
            console.error('Failed to delete entity', error);
            toast.error('Error al eliminar la entidad');
        } finally {
            setLoading(false);
        }
    };

    // Account Handlers
    const toggleAccounts = async (entityId) => {
        if (expandedEntityId === entityId) {
            setExpandedEntityId(null);
            setAccounts([]);
        } else {
            setExpandedEntityId(entityId);
            fetchAccounts(entityId);
        }
    };

    const fetchAccounts = async (entityId) => {
        try {
            const response = await api.get('/accounts', { params: { entityId } });
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
            toast.error('Error al cargar cuentas de la entidad');
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newAccount.name || !expandedEntityId) return;

        try {
            await api.post('/accounts', {
                ...newAccount,
                entityId: expandedEntityId
            });
            await fetchAccounts(expandedEntityId);
            setIsCreatingAccount(false);
            setNewAccount({ name: '', type: 'BANK', currency: currencySymbol || 'EUR' });
            toast.success('Cuenta añadida');
        } catch (error) {
            console.error('Failed to create account', error);
            toast.error('Error al crear la cuenta');
        }
    };

    const handleDeleteAccount = async (accountId) => {
        const confirmed = await showConfirm({
            title: '¿Eliminar cuenta bancaria?',
            text: 'Se desvincularán los saldos asociados a esta cuenta.',
            confirmButtonText: t('common.delete') || 'Eliminar',
            cancelButtonText: t('common.cancel') || 'Cancelar',
            icon: 'warning',
            isDanger: true,
        });
        if (!confirmed) return;

        try {
            await api.delete(`/accounts/${accountId}`);
            await fetchAccounts(expandedEntityId);
            toast.success('Cuenta eliminada');
        } catch (error) {
            console.error('Failed to delete account', error);
            toast.error('Error al eliminar la cuenta');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Page Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Layers className="w-6 h-6 text-primary" />
                        </div>
                        {t('entities.title') || 'Entidades y Cuentas'}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                        {t('entities.subtitle') || 'Gestiona tus entornos personales, empresas y cuentas bancarias asociadas'}
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="shadow-md shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('entities.create') || 'Nueva Entidad'}</span>
                </Button>
            </header>

            {/* Create Entity Card */}
            {isCreating && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary to-orange-500 absolute top-0 left-0"></div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>Crear Nueva Entidad Empresarial / Personal</span>
                    </h3>

                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label={t('entities.entityName') || 'Nombre de la Entidad'}
                                value={newEntityName}
                                onChange={(e) => setNewEntityName(e.target.value)}
                                placeholder="Ej: Mi Empresa SL, Actividad Freelance..."
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-2.5 w-full sm:w-auto">
                            <Button type="submit" loading={loading} className="flex-1 sm:flex-none">
                                <Save className="w-4 h-4" />
                                {t('common.save') || 'Guardar'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsCreating(false)}
                                className="flex-1 sm:flex-none"
                            >
                                {t('common.cancel') || 'Cancelar'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Entities List */}
            <div className="space-y-4">
                {entities.map(entity => {
                    const isSelected = selectedEntity?.id === entity.id;
                    const isExpanded = expandedEntityId === entity.id;

                    return (
                        <div
                            key={entity.id}
                            className={`bg-white rounded-2xl border transition-all overflow-hidden ${isSelected
                                ? 'border-primary ring-2 ring-primary/20 shadow-md'
                                : 'border-slate-200 shadow-sm hover:border-slate-300'
                                }`}
                        >
                            {/* Main Entity Row */}
                            <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                {editingId === entity.id ? (
                                    <div className="flex-1 flex items-center gap-3 w-full">
                                        <div className="flex-1">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleUpdate(entity.id)}
                                            className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="flex-1 cursor-pointer flex items-center gap-4 w-full"
                                            onClick={() => switchEntity(entity.id)}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isSelected
                                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {entity.type === 'PERSONAL' ? (
                                                    <User className="w-6 h-6" />
                                                ) : (
                                                    <Building2 className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-extrabold text-lg text-slate-800">
                                                        {entity.name}
                                                    </h3>
                                                    {entity.type === 'PERSONAL' && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                                                            {t('entities.personal') || 'Personal'}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            {t('entities.active') || 'Activa'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {entity.type === 'PERSONAL' ? 'Gestión de finanzas personales y ahorro' : 'Finanzas empresariales, facturación y cuentas'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Controls */}
                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <button
                                                onClick={() => toggleAccounts(entity.id)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${isExpanded
                                                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/50'
                                                    }`}
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                <span>Cuentas</span>
                                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEditingId(entity.id);
                                                    setEditName(entity.name);
                                                }}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
                                                title="Renombrar entidad"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            {entity.type !== 'PERSONAL' && (
                                                <button
                                                    onClick={() => handleDelete(entity.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                    title="Eliminar entidad"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sub-Accounts Collapsible Panel */}
                            {isExpanded && (
                                <div className="bg-slate-50 border-t border-slate-200 p-5 sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-primary" />
                                            Cuentas y Depósitos Bancarios / Efectivo
                                        </h4>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                                            className="text-xs py-1.5 px-3"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Añadir Cuenta</span>
                                        </Button>
                                    </div>

                                    {/* Add Account Inline Form */}
                                    {isCreatingAccount && (
                                        <form onSubmit={handleCreateAccount} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <Input
                                                    placeholder="Nombre: ej. BBVA Principal, Caja Chica"
                                                    value={newAccount.name}
                                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                                    required
                                                />
                                                <select
                                                    value={newAccount.type}
                                                    onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-[38px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="BANK">Bancaria (BANK)</option>
                                                    <option value="CASH">Efectivo / Caja (CASH)</option>
                                                    <option value="INVESTMENT">Inversión (INVESTMENT)</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <Button type="submit" className="flex-1 py-1.5 text-xs">
                                                        Guardar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => setIsCreatingAccount(false)}
                                                        className="py-1.5 text-xs"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    {/* Accounts Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {accounts.map(acc => (
                                            <div
                                                key={acc.id}
                                                className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between group shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        {acc.type === 'CASH' ? (
                                                            <Banknote className="w-4 h-4" />
                                                        ) : (
                                                            <CreditCard className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 truncate">
                                                            {acc.name}
                                                        </p>
                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                            {acc.type} • {currencySymbol}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAccount(acc.id)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Eliminar cuenta"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {accounts.length === 0 && !isCreatingAccount && (
                                            <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">
                                                No hay cuentas registradas en esta entidad.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
