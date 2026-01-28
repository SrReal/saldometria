export const Button = ({ children, variant = 'primary', className = '', loading = false, ...props }) => {
    const baseClass = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-ghost';

    return (
        <button className={`${baseClass} ${variantClass} ${className}`} disabled={loading} {...props}>
            {loading ? '...' : children}
        </button>
    );
};
