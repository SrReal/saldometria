export const Input = ({ label, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 flex-1 w-full">
            {label && <label className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">{label}</label>}
            <input
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-slate-400 font-medium ${className}`}
                {...props}
            />
        </div>
    );
};
