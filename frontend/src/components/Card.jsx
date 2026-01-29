export const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors ${className}`}>
            {children}
        </div>
    );
};
