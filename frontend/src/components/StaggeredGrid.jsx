import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getTechIconUrl } from '../utils/techIcons';

export function StaggeredGrid({
    items = [],
    centerText = "TECH STACK",
    className = ""
}) {
    const gridRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate Center Header Text
            if (textRef.current) {
                const chars = textRef.current.querySelectorAll('.char');
                gsap.fromTo(chars,
                    { y: 30, opacity: 0, scale: 0.8 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.8,
                        ease: 'back.out(1.7)',
                        stagger: 0.04
                    }
                );
            }

            // Animate Staggered Grid Items
            if (gridRef.current) {
                const gridItems = gridRef.current.querySelectorAll('.grid-item');
                gsap.fromTo(gridItems,
                    { y: 50, opacity: 0, scale: 0.85 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.7,
                        ease: 'power3.out',
                        stagger: {
                            amount: 0.6,
                            grid: [Math.ceil(gridItems.length / 5), 5],
                            from: 'center'
                        }
                    }
                );
            }
        });

        return () => ctx.revert();
    }, [items]);

    const splitText = (text) => {
        return text.split('').map((char, i) => (
            <span key={i} className="char inline-block" style={{ willChange: 'transform, opacity' }}>
                {char === ' ' ? '\u00A0' : char}
            </span>
        ));
    };

    const techList = items.length > 0 ? items : ["React", "Python", "JavaScript", "TypeScript", "FastAPI", "PostgreSQL", "Docker"];

    return (
        <div className={`relative w-full max-w-5xl mx-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl overflow-hidden ${className}`}>
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Header Text */}
            <div className="flex justify-center mb-8">
                <h3 
                    ref={textRef} 
                    className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                    {splitText(centerText)}
                </h3>
            </div>

            {/* Staggered Grid */}
            <div 
                ref={gridRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center"
            >
                {techList.map((tech, idx) => {
                    const iconUrl = getTechIconUrl(tech);
                    return (
                        <div
                            key={`${tech}-${idx}`}
                            className="grid-item group relative w-full aspect-square max-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:bg-white/[0.08] hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] cursor-pointer"
                        >
                            {/* Glowing backdrop on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Tech Icon */}
                            <img 
                                src={iconUrl} 
                                alt={tech} 
                                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent && !parent.querySelector('.fallback-badge')) {
                                        const badge = document.createElement('div');
                                        badge.className = 'fallback-badge w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center font-bold text-xs text-purple-300 font-mono';
                                        badge.innerText = tech.slice(0, 2).toUpperCase();
                                        parent.insertBefore(badge, parent.firstChild);
                                    }
                                }}
                            />

                            {/* Tech Name */}
                            <span className="text-xs font-semibold text-zinc-200 group-hover:text-white tracking-wide text-center truncate max-w-full">
                                {tech}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StaggeredGrid;