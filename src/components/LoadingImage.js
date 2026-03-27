'use client';

import { useState } from 'react';

export default function LoadingImage({ 
    src, 
    alt, 
    className = "", 
    containerClassName = "", 
    loaderWrapperClassName = "absolute inset-0 bg-blue-500/10 flex items-center justify-center",
    spinnerClassName = "w-4 h-4 rounded-full border-2 border-blue-500/40 border-t-blue-400 animate-spin",
    fallback = "/icons/digital-currency.png",
    children 
}) {
    const [loadedSrc, setLoadedSrc] = useState(null);
    const [error, setError] = useState(false);
    
    const isLoaded = loadedSrc === src && !error;
    const isFallbackString = typeof fallback === 'string';
    const displaySrc = error && isFallbackString ? fallback : src;

    return (
        <div className={`relative ${containerClassName}`}>
            {!isLoaded && !error && src && (
                <div className={loaderWrapperClassName}>
                    <div className={spinnerClassName} />
                </div>
            )}
            
            {(error && !isFallbackString) ? (
                <div className={`${className} flex items-center justify-center overflow-hidden transition-opacity duration-300 opacity-100`}>
                    {fallback}
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
