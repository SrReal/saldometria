import { useState } from 'react';
import { useEntity } from '../context/EntityContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Trash2, Edit2, Check, X, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [newAccount, setNewAccount] = useState({ name: '', type: 'BANK', currency: 'USD' });

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
            setNewAccount({ name: '', type: 'BANK', currency: 'USD' });
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
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold">{t('entities.title')}</h2>
                    <p className="text-gray-400">{t('entities.subtitle')}</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> {t('entities.newEntity')}
                </Button>
            </div>

            {isCreating && (
                <Card className="mb-6 border-blue-500/50">
                    <form onSubmit={handleCreate} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Input
                                label={t('entities.entityName')}
                                value={newEntityName}
                                onChange={(e) => setNewEntityName(e.target.value)}
                                placeholder="e.g. My Startup Inc."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" loading={loading} className="gap-2">
                                <Check className="w-4 h-4" /> {t('common.save')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                {entities.map(entity => (
                    <div key={entity.id} className="relative">
                        <Card className={`transition-all ${selectedEntity?.id === entity.id ? 'border-primary bg-primary-glow/10' : 'hover:bg-white/5'}`}>
                            <div className="flex items-center justify-between">
                                {editingId === entity.id ? (
                                    <div className="flex-1 flex items-center gap-4">
                                        <input
                                            className="glass-input"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        <Button onClick={() => handleUpdate(entity.id)} loading={loading} className="p-2">
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" onClick={() => setEditingId(null)} className="p-2">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => switchEntity(entity.id)}
                                        >
                                            <h3 className="font-semibold text-lg flex items-center gap-3">
                                                {entity.name}
                                                {entity.type === 'PERSONAL' && (
                                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{t('entities.personal')}</span>
                                                )}
                                                {selectedEntity?.id === entity.id && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">{t('entities.active')}</span>
                                                )}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => toggleAccounts(entity.id)}
                                                className={`gap-2 text-sm ${expandedEntityId === entity.id ? 'text-primary' : 'text-gray-400'}`}
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                {t('entities.accounts')}
                                                {expandedEntityId === entity.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </Button>
                                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingId(entity.id);
                                                    setEditName(entity.name);
                                                }}
                                                className="p-2 hover:text-blue-400"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            {entity.type !== 'PERSONAL' && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleDelete(entity.id)}
                                                    className="p-2 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Accounts Section */}
                            {expandedEntityId === entity.id && (
                                <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('entities.manageAccounts')}</h4>
                                        <Button size="sm" onClick={() => setIsCreatingAccount(true)} className="gap-2 text-xs">
                                            <Plus className="w-3 h-3" /> {t('entities.addAccount')}
                                        </Button>
                                    </div>

                                    {isCreatingAccount && (
                                        <div className="mb-4 p-4 bg-black/20 rounded-lg border border-white/5">
                                            <form onSubmit={handleCreateAccount} className="flex gap-3 items-end">
                                                <div className="flex-1">
                                                    <Input
                                                        label={t('entities.accountName')}
                                                        value={newAccount.name}
                                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                                        placeholder="e.g. Main Checking"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('entities.accountType')}</label>
                                                    <select
                                                        className="glass-input"
                                                        value={newAccount.type}
                                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                                    >
                                                        <option value="BANK" className="bg-slate-900">Bank</option>
                                                        <option value="CASH" className="bg-slate-900">Cash</option>
                                                        <option value="CREDIT" className="bg-slate-900">Credit</option>
                                                    </select>
                                                </div>
                                                <Button type="submit" size="sm" className="mb-[2px]">{t('common.save')}</Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingAccount(false)} className="mb-[2px]">{t('common.cancel')}</Button>
                                            </form>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {accounts.map(acc => (
                                            <div key={acc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${acc.type === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{acc.name}</div>
                                                        <div className="text-xs text-gray-500">{acc.type} • {acc.currency}</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteAccount(acc.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {accounts.length === 0 && !isCreatingAccount && (
                                            <div className="col-span-2 text-center py-4 text-sm text-gray-500 italic">
                                                No accounts found. Create one to get started.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};
