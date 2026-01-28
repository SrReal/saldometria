export const Input = ({ label, ...props }) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm text-gray-400 font-medium">{label}</label>}
            <input className="glass-input" {...props} />
        </div>
    );
};
