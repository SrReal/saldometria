export const Card = ({ children, className = '' }) => {
    return (
        <div className={`glass-panel p-6 ${className}`}>
            {children}
        </div>
    );
};
