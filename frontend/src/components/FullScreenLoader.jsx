import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export const FullScreenLoader = ({ message = 'Cargando...' }) => {
    // Using inline styles to guarantee visibility regardless of Tailwind config/JIT issues
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
    };

    return createPortal(
        <div style={overlayStyle}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-slate-700 animate-in fade-in zoom-in duration-300">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-medium text-slate-600 animate-pulse">{message}</p>
            </div>
        </div>,
        document.body
    );
};
