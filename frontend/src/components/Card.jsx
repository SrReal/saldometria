export const Card = ({ children, className }) => {
    // Si se pasan clases personalizadas, usarlas; si no, usar las por defecto
    const defaultClasses = 'bg-card-light p-6 rounded-2xl border border-slate-200 shadow-sm transition-colors';

    return (
        <div className={className || defaultClasses}>
            {children}
        </div>
    );
};
