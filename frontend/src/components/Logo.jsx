import React from 'react';

export const Logo = ({ size = 'md', showText = true, className = '' }) => {
    const sizeMap = {
        sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-5 h-5', text: 'text-lg' },
        md: { box: 'w-10 h-10 rounded-xl', icon: 'w-6 h-6', text: 'text-xl' },
        lg: { box: 'w-12 h-12 rounded-xl', icon: 'w-7 h-7', text: 'text-2xl' },
        xl: { box: 'w-16 h-16 rounded-2xl', icon: 'w-10 h-10', text: 'text-3xl' }
    };

    const currentSize = sizeMap[size] || sizeMap.md;

    return (
        <div className={`flex items-center gap-3 select-none ${className}`}>
            {/* High-Contrast Vibrant Brand Icon Box */}
            <div
                className={`${currentSize.box} flex items-center justify-center shadow-md shadow-orange-500/25 flex-shrink-0 transition-transform duration-200 hover:scale-105`}
                style={{
                    background: 'linear-gradient(135deg, #ff9800 0%, #ff8404 50%, #f97316 100%)'
                }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${currentSize.icon} text-white`}
                >
                    {/* Metric Growth Bars */}
                    <rect x="3.5" y="13" width="3" height="7" rx="1.5" fill="#ffffff" fillOpacity="0.95" />
                    <rect x="8.5" y="9" width="3" height="11" rx="1.5" fill="#ffffff" fillOpacity="0.95" />
                    <rect x="13.5" y="5" width="3" height="15" rx="1.5" fill="#ffffff" fillOpacity="0.95" />

                    {/* Trend Line with Growth Arrow / Node */}
                    <path
                        d="M5 11 L10 7 L15 3.5 L20.5 7.5"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Accent Target Spark / Dot */}
                    <circle cx="20.5" cy="7.5" r="2" fill="#ffffff" />
                    <circle cx="20.5" cy="7.5" r="0.9" fill="#ff8404" />
                </svg>
            </div>

            {/* Brand Typography */}
            {showText && (
                <span className={`font-black tracking-tight text-slate-800 ${currentSize.text}`}>
                    Saldo<span className="text-[#ff8404]">Metria</span>
                </span>
            )}
        </div>
    );
};
