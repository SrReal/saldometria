import { Loader2 } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', loading = false, ...props }) => {
    const variants = {
        primary: 'bg-primary hover:bg-orange-600 text-white shadow-lg shadow-primary/20',
        secondary: 'bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm',
        ghost: 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
    };

    return (
        <button
            className={className === '' ? `px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant] || variants.primary}` : className}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : children}
        </button>
    );
};
