import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    type = 'button',
    ...props
}) => {
    const variants = {
        primary: 'bg-primary hover:bg-[#e67600] text-white shadow-md shadow-primary/20',
        secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
        outline: 'bg-transparent border border-primary text-primary hover:bg-primary/5',
        danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
    };

    const baseStyles = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : null}
            {children}
        </button>
    );
};
