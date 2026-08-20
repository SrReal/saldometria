import { useState, useEffect } from 'react';
import api from '../api/client';
import { useEntity } from '../context/EntityContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    Bell,
    BellOff,
    Check,
    X,
    AlertTriangle,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AlertManager = ({ entityId: propEntityId }) => {
    const { selectedEntity } = useEntity();
    const { formatCurrency, formatNumber, currencySymbol } = useAuth();
    const entityId = propEntityId || selectedEntity?.id;
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
            toast.success('Umbral de alerta guardado');
        } catch (error) {
            console.error('Error saving alert', error);
            toast.error('Error al guardar alerta');
        }
    };

    const toggleAlert = async (alertId, currentStatus) => {
        try {
            await api.patch(`/alerts/${alertId}`, { enabled: !currentStatus });
            fetchData();
            toast.success(!currentStatus ? 'Alerta activada' : 'Alerta desactivada');
        } catch (error) {
            console.error('Error toggling alert', error);
            toast.error('Error al cambiar estado de alerta');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-800">
                            Alertas de Saldo Mínimo por Cuenta
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Recibe avisos inmediatos cuando el saldo bancario o efectivo caiga por debajo de tu límite de seguridad
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map(account => {
                        const alertRule = alerts.find(a => a.accountId === account.id && a.type === 'LOW_BALANCE');
                        const isEditing = editingAccountId === account.id;

                        return (
                            <div
                                key={account.id}
                                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500/30 transition-all space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${alertRule?.enabled
                                            ? 'bg-amber-500/15 text-amber-600'
                                            : 'bg-slate-200 text-slate-400'
                                            }`}>
                                            {alertRule?.enabled ? (
                                                <Bell className="w-5 h-5" />
                                            ) : (
                                                <BellOff className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                                                {account.name}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                Saldo: {formatCurrency(account.balance)}
                                            </p>
                                        </div>
                                    </div>

                                    {alertRule && (
                                        <button
                                            onClick={() => toggleAlert(alertRule.id, alertRule.enabled)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${alertRule.enabled
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {alertRule.enabled ? 'Activa' : 'Inactiva'}
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white rounded-xl p-3 border border-slate-200">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                Umbral de saldo crítico
                                            </p>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={threshold}
                                                    onChange={e => setThreshold(e.target.value)}
                                                    className="w-full bg-slate-50 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                    autoFocus
                                                />
                                            ) : (
                                                <p className="text-xs font-extrabold text-slate-800">
                                                    {alertRule ? formatCurrency(alertRule.threshold) : 'No configurado'}
                                                </p>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleSaveThreshold(account.id)}
                                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingAccountId(null)}
                                                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingAccountId(account.id);
                                                    setThreshold(alertRule?.threshold || '');
                                                }}
                                                className="text-xs font-bold text-primary hover:text-orange-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                                            >
                                                Configurar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {accounts.length === 0 && (
                        <div className="col-span-full py-8 text-center text-xs text-slate-400">
                            No hay cuentas disponibles en la entidad activa para configurar alertas.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl text-xs text-slate-600 font-medium">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p>
                    Las alertas de presupuesto por categoría se configuran automáticamente desde la pestaña <span className="font-bold text-primary">Presupuestos</span> y se disparan al superar el 80% del límite fijado.
                </p>
            </div>
        </div>
    );
};
