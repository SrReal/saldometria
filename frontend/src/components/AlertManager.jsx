import { useState, useEffect } from 'react';
import api from '../api/client';
import { Card } from './Card';
import { useTranslation } from 'react-i18next';

export const AlertManager = ({ entityId }) => {
    const { t } = useTranslation();
    const [accounts, setAccounts] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [threshold, setThreshold] = useState('');

    useEffect(() => {
        if (entityId) {
            fetchData();
        }
    }, [entityId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, alertRes] = await Promise.all([
                api.get(`/accounts?entityId=${entityId}`),
                api.get(`/alerts?entityId=${entityId}`)
            ]);
            setAccounts(accRes.data);
            setAlerts(alertRes.data);
        } catch (error) {
            console.error('Error fetching alert data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveThreshold = async (accountId) => {
        try {
            const existing = alerts.find(a => a.accountId === accountId && a.type === 'LOW_BALANCE');

            if (existing) {
                await api.patch(`/alerts/${existing.id}`, { threshold, enabled: true });
            } else {
                await api.post('/alerts', {
                    entityId,
                    type: 'LOW_BALANCE',
                    threshold,
                    accountId,
                    enabled: true
                });
            }

            setEditingAccountId(null);
            setThreshold('');
            fetchData();
        } catch (error) {
            console.error('Error saving alert', error);
        }
    };

    const toggleAlert = async (alertId, currentStatus) => {
        try {
            await api.patch(`/alerts/${alertId}`, { enabled: !currentStatus });
            fetchData();
        } catch (error) {
            console.error('Error toggling alert', error);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black flex items-center gap-3 text-amber-500 uppercase tracking-tight">
                <span className="material-icons-round">notifications_active</span>
                Configuración de Alertas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map(account => {
                    const alertRule = alerts.find(a => a.accountId === account.id && a.type === 'LOW_BALANCE');
                    const isEditing = editingAccountId === account.id;

                    return (
                        <Card key={account.id} className="p-6 border-none shadow-sm hover:translate-y-[-2px] transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${alertRule?.enabled ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <span className="material-icons-round text-2xl">
                                            {alertRule?.enabled ? 'notifications_active' : 'notifications_off'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white leading-tight">{account.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saldo: {account.balance} {account.currency}</p>
                                    </div>
                                </div>
                                {alertRule && (
                                    <button
                                        onClick={() => toggleAlert(alertRule.id, alertRule.enabled)}
                                        className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${alertRule.enabled ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        {alertRule.enabled ? 'Activa' : 'Inactiva'}
                                    </button>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-transparent group-hover:border-amber-500/10 transition-all">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest flex items-center gap-1.5 font-black">
                                            <span className="material-icons-round text-base">settings</span>
                                            Umbral de saldo bajo
                                        </p>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={threshold}
                                                onChange={e => setThreshold(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5 text-sm font-black focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {alertRule ? `${alertRule.threshold} ${account.currency}` : 'No configurado'}
                                            </p>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSaveThreshold(account.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all">
                                                <span className="material-icons-round text-lg">check</span>
                                            </button>
                                            <button onClick={() => setEditingAccountId(null)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:scale-110 active:scale-95 transition-all">
                                                <span className="material-icons-round text-lg">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingAccountId(account.id);
                                                setThreshold(alertRule?.threshold || '');
                                            }}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-orange-400 transition-colors"
                                        >
                                            Configurar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <span className="material-icons-round text-primary">info</span>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    Las alertas de presupuesto se configuran automáticamente desde la sección de <span className="text-primary">Presupuestos</span> (vía umbral porcentual).
                </p>
            </div>
        </div>
    );
};
