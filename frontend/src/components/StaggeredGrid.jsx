import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

export function StaggeredGrid({
    images = [],
    centerText = "TECH STACK",
    credits = {
        madeBy: { text: "@codrops", href: "https://x.com/codrops" },
        moreDemos: { text: "More demos", href: "https://tympanus.net/codrops/demos" }
    },
    className,
    showFooter = false,
    scroller
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const gridFullRef = useRef(null);
    const textRef = useRef(null);

    const splitText = (text) => {
        return text.split('').map((char, i) => (
            <span key={i} className="char inline-block" style={{ willChange: 'transform' }}>
                {char === ' ' ? '\u00A0' : char}
            </span>
        ));
    };

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded || !gridFullRef.current) return;

        const mainContent = document.querySelector('.main-content');
        const scrollerTarget = scroller || mainContent || window;

        const ctx = gsap.context(() => {
            // Header Text Animation
            if (textRef.current) {
                const chars = textRef.current.querySelectorAll('.char');
                gsap.fromTo(chars,
                    { yPercent: 200, autoAlpha: 0 },
                    {
                        yPercent: 0,
                        autoAlpha: 1,
                        ease: 'power3.out',
                        stagger: {
                            each: 0.04,
                            from: 'center'
                        },
                        scrollTrigger: {
                            trigger: textRef.current,
                            scroller: scrollerTarget,
                            start: 'top 95%',
                            end: 'center center',
                            scrub: 1,
                        }
                    }
                );
            }

            // Pyramidal Column Staggered Animation
            const gridFullItems = gridFullRef.current.querySelectorAll('.grid__item');
            const numColumns = 7;
            const columns = Array.from({ length: numColumns }, () => []);

            gridFullItems.forEach((item) => {
                const colAttr = item.getAttribute('data-col');
                const columnIndex = colAttr !== null ? parseInt(colAttr, 10) : 0;
                if (columns[columnIndex]) {
                    columns[columnIndex].push(item);
                }
            });

            columns.forEach((columnItems, columnIndex) => {
                if (!columnItems || columnItems.length === 0) return;

                // Center column is the peak of the wave
                const distanceFromCenter = Math.abs(columnIndex - 3);
                const pyramidBaseY = distanceFromCenter * 35;

                gsap.fromTo(columnItems,
                    { 
                        y: pyramidBaseY + 220, 
                        autoAlpha: 0,
                        scale: 0.9,
                    },
                    {
                        y: pyramidBaseY,
                        autoAlpha: 1,
                        scale: 1,
                        ease: 'power2.out',
                        stagger: 0.06,
                        scrollTrigger: {
                            trigger: gridFullRef.current,
                            scroller: scrollerTarget,
                            start: 'top 85%',
                            end: 'bottom 45%',
                            scrub: 1.2,
                        }
                    }
                );
            });
        }, gridFullRef);

        const refreshTimer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 150);

        return () => {
            clearTimeout(refreshTimer);
            ctx.revert();
        };
    }, [isLoaded, images, scroller]);

    const techItems = (images && images.length > 0) 
        ? images 
        : ["Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI", "Django", "PostgreSQL", "Supabase", "Docker", "Git", "PyTorch", "Tailwind", "C++"];

    return (
        <div
            className={cn("shadow relative overflow-hidden w-full bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8", className)}
            style={{ width: '100%', boxSizing: 'border-box' }}
        >
            {/* Header Text */}
            <section style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '12px', marginBottom: '32px' }}>
                <div 
                    ref={textRef} 
                    className="text font-alt uppercase flex content-center text-[clamp(2.2rem,5vw,4.5rem)] leading-none text-white tracking-widest font-black"
                >
                    {splitText(centerText)}
                </div>
            </section>

            {/* Structured 7-Column Grid */}
            <section style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <div 
                    ref={gridFullRef} 
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: '14px',
                        width: '100%',
                        maxWidth: '1100px',
                        boxSizing: 'border-box'
                    }}
                >
                    {techItems.map((item, i) => {
                        const colIdx = i % 7;
                        let label = typeof item === 'string' ? item : item.name || item.title || "Tech";
                        let customIconUrl = typeof item === 'string' 
                            ? `https://cdn.simpleicons.org/${item.toLowerCase().replace(/[^a-z0-9]/g, '')}`
                            : null;

                        return (
                            <figure 
                                key={`tech-${i}`} 
                                data-col={colIdx} 
                                className="grid__item group cursor-pointer"
                                style={{
                                    margin: 0,
                                    position: 'relative',
                                    zIndex: 10,
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* CLEAN TRANSLUCENT GLASS CARD */}
                                <div 
                                    className="grid__item-img"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        transition: 'background 0.3s ease, border-color 0.3s ease, transform 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }}
                                >
                                    {/* Content Container */}
                                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
                                        {customIconUrl && (
                                            <img 
                                                src={customIconUrl} 
                                                alt={label} 
                                                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}

                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ display: 'block', fontSize: '8px', fontWeight: '700', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                                                BUILD WITH
                                            </span>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#f3f4f6', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </figure>
                        );
                    })}
                </div>
            </section>

            {showFooter && (
                <footer style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '16px' }}>
                    <a href={credits.madeBy.href} style={{ color: 'inherit', textDecoration: 'none' }}>{credits.madeBy.text}</a>
                    <a href={credits.moreDemos.href} style={{ color: 'inherit', textDecoration: 'none' }}>{credits.moreDemos.text}</a>
                </footer>
            )}
        </div>
    );
}

export default StaggeredGrid;