'use client';

import { useState } from 'react';

export default function LoadingImage({ 
    src, 
    alt, 
    className = "", 
    containerClassName = "", 
    loaderWrapperClassName = "absolute inset-0 bg-slate-700/20 flex items-center justify-center",
    spinnerClassName = "w-5 h-5 rounded-full border-2 border-slate-600 border-t-slate-400 animate-spin",
    fallback,
    children 
}) {
    const [loadedSrc, setLoadedSrc] = useState(null);
    const [error, setError] = useState(false);
    
    const isLoaded = loadedSrc === src && !error;
    
    // Default SVG fallback for app icons (App Store style)
    const defaultFallback = (
        <svg className="w-full h-full" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="1" transform="translate(24) rotate(90)" fill="#2ca9bc" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="13.11" y1="7" x2="7.56" y2="17" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M10.89,7l5.55,10M7,15H17" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
    );
    
    const isFallbackString = typeof fallback === 'string';
    const displayFallback = fallback || defaultFallback;
    const displaySrc = error && isFallbackString ? fallback : src;

    return (
        <div className={`relative ${containerClassName}`}>
            {!isLoaded && !error && src && (
                <div className={loaderWrapperClassName}>
                    <div className={spinnerClassName} />
                </div>
            )}
            
            {(error && !isFallbackString) ? (
                <div className={`${className} flex items-center justify-center overflow-hidden transition-opacity duration-300 opacity-100 bg-slate-800/50`}>
                    {displayFallback}
                </div>
            ) : (
                <img 
                    src={displaySrc} 
                    alt={alt} 
                    className={`${className} transition-opacity duration-300 ${isLoaded || error || !src ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoadedSrc(src)}
                    onError={() => {
                        if (!error) setError(true);
                    }}
                />
            )}
            {children}
        </div>
    );
}
