import { useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api/client';
import { useTranslation } from 'react-i18next';

export const Entities = () => {
    const { entities, fetchEntities, selectedEntity, switchEntity } = useEntity();
    const [isCreating, setIsCreating] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    // Account Management State
    const [expandedEntityId, setExpandedEntityId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'BANK', currency: 'EUR' });

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
        } catch (error) {
            console.error('Failed to create entity', error);
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
        } catch (error) {
            console.error('Failed to update entity', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('entities.deleteConfirm'))) return;
        setLoading(true);
        try {
            await api.delete(`/entities/${id}`);
            await fetchEntities();
        } catch (error) {
            console.error('Failed to delete entity', error);
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
            setNewAccount({ name: '', type: 'BANK', currency: 'EUR' });
        } catch (error) {
            console.error('Failed to create account', error);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!window.confirm(t('entities.deleteConfirm'))) return;
        try {
            await api.delete(`/accounts/${accountId}`);
            await fetchAccounts(expandedEntityId);
        } catch (error) {
            console.error('Failed to delete account', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-primary text-4xl">corporate_fare</span>
                        {t('entities.title')}
                    </h2>
                    <p className="text-slate-500 font-bold dark:text-slate-400 mt-1">{t('entities.subtitle')}</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <span className="material-icons-round text-lg">add</span>
                    {t('entities.newEntity')}
                </Button>
            </header>

            {isCreating && (
                <Card className="p-8 border-none shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                    <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label={t('entities.entityName')}
                                value={newEntityName}
                                onChange={(e) => setNewEntityName(e.target.value)}
                                placeholder="e.g. My Startup Inc."
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button type="submit" loading={loading} className="flex-1">
                                <span className="material-icons-round">save</span>
                                {t('common.save')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                                className="flex-1"
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid gap-6">
                {entities.map(entity => {
                    const isSelected = selectedEntity?.id === entity.id;
                    const isExpanded = expandedEntityId === entity.id;

                    return (
                        <div key={entity.id} className="relative group">
                            <Card className={`p-0 overflow-hidden transition-all duration-300 border-none shadow-sm ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'}`}>
                                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    {editingId === entity.id ? (
                                        <div className="flex-1 flex items-center gap-4 w-full">
                                            <div className="flex-1">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdate(entity.id)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all">
                                                    <span className="material-icons-round">check</span>
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:scale-110 transition-all">
                                                    <span className="material-icons-round">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="flex-1 cursor-pointer flex items-center gap-4 w-full"
                                                onClick={() => switchEntity(entity.id)}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary transition-colors'}`}>
                                                    {entity.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-3">
                                                        {entity.name}
                                                        {entity.type === 'PERSONAL' && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-200/50">{t('entities.personal')}</span>
                                                        )}
                                                        {isSelected && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-200/50">{t('entities.active')}</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {String(entity.id).slice(0, 8)}...</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <button
                                                    onClick={() => toggleAccounts(entity.id)}
                                                    className={`h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${isExpanded ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-slate-900/50 text-slate-500 hover:text-primary dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                                                >
                                                    <span className="material-icons-round text-lg">account_balance</span>
                                                    {t('entities.accounts')}
                                                    <span className="material-icons-round text-base transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                                                </button>

                                                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1"></div>

                                                <button
                                                    onClick={() => {
                                                        setEditingId(entity.id);
                                                        setEditName(entity.name);
                                                    }}
                                                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
                                                    title="Editar"
                                                >
                                                    <span className="material-icons-round text-xl">edit</span>
                                                </button>

                                                {entity.type !== 'PERSONAL' && (
                                                    <button
                                                        onClick={() => handleDelete(entity.id)}
                                                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all shadow-sm"
                                                        title="Eliminar"
                                                    >
                                                        <span className="material-icons-round text-xl">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Accounts Section */}
                                {isExpanded && (
                                    <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-icons-round text-base">manage_accounts</span>
                                                    {t('entities.manageAccounts')}
                                                </h4>
                                                <button
                                                    onClick={() => setIsCreatingAccount(true)}
                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-orange-400 transition-colors"
                                                >
                                                    <span className="material-icons-round text-lg">add_circle</span>
                                                    {t('entities.addAccount')}
                                                </button>
                                            </div>

                                            {isCreatingAccount && (
                                                <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                                                    <form onSubmit={handleCreateAccount} className="flex flex-col md:flex-row gap-6 items-end">
                                                        <div className="flex-1 w-full">
                                                            <Input
                                                                label={t('entities.accountName')}
                                                                value={newAccount.name}
                                                                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                                                placeholder="e.g. Main Checking"
                                                                autoFocus
                                                                required
                                                            />
                                                        </div>
                                                        <div className="w-full md:w-48">
                                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider mb-1.5 block">{t('entities.accountType')}</label>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all dark:text-white font-medium shadow-sm appearance-none h-11"
                                                                    value={newAccount.type}
                                                                    onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                                                >
                                                                    <option value="BANK">Bank</option>
                                                                    <option value="CASH">Cash</option>
                                                                    <option value="CREDIT">Credit</option>
                                                                </select>
                                                                <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 w-full md:w-auto">
                                                            <Button type="submit" size="sm" className="h-11 px-6">Guardar</Button>
                                                            <Button type="button" variant="ghost" className="h-11 px-6" onClick={() => setIsCreatingAccount(false)}>{t('common.cancel')}</Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {accounts.map(acc => (
                                                    <div key={acc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 group/acc hover:border-primary/20 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.type === 'CASH' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                                                <span className="material-icons-round text-xl">
                                                                    {acc.type === 'CASH' ? 'payments' : 'credit_card'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-sm text-slate-700 dark:text-slate-200">{acc.name}</div>
                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{acc.type} • {acc.currency}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteAccount(acc.id);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover/acc:opacity-100"
                                                        >
                                                            <span className="material-icons-round text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                ))}
                                                {accounts.length === 0 && !isCreatingAccount && (
                                                    <div className="col-span-full py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                                        No accounts found. Create one to get started.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
