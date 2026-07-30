import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTechIconUrl } from '../utils/techIcons';

gsap.registerPlugin(ScrollTrigger);

export function StaggeredGrid({ items = [], centerText = "MY TECH STACK", scroller }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const gridFullRef = useRef(null);
  const textRef = useRef(null);

  const techList = items.length > 0 
    ? items 
    : ["Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI", "Django", "PostgreSQL", "Supabase", "Docker", "Git", "PyTorch", "Tailwind", "C++"];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !gridFullRef.current) return;

    const mainContent = document.querySelector('.main-content');
    const scrollerTarget = scroller || mainContent || window;

    const ctx = gsap.context(() => {
      // Header Text Wave Animation
      if (textRef.current) {
        const chars = textRef.current.querySelectorAll('.char');
        gsap.fromTo(chars,
          { yPercent: 150, autoAlpha: 0 },
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

      // 7-Column Pyramidal Staggered Animation
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

        // Peak wave displacement for center column
        const distanceFromCenter = Math.abs(columnIndex - 3);
        const pyramidBaseY = distanceFromCenter * 35;

        gsap.fromTo(columnItems,
          { 
            y: pyramidBaseY + 180, 
            autoAlpha: 0,
            scale: 0.85,
          },
          {
            y: pyramidBaseY,
            autoAlpha: 1,
            scale: 1,
            ease: 'power2.out',
            stagger: 0.08,
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
  }, [isLoaded, items, scroller]);

  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char" style={{ display: 'inline-block', willChange: 'transform, opacity' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'rgba(12, 10, 18, 0.65)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '28px',
      padding: '40px 24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Wave Text */}
      <div ref={textRef} style={{
        margin: 0,
        fontSize: '24px',
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
        textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
        display: 'flex',
        overflow: 'hidden',
        lineHeight: 1
      }}>
        {splitText(centerText)}
      </div>

      {/* 7-Column Pyramid Staggered Grid */}
      <div 
        ref={gridFullRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '14px',
          width: '100%',
          maxWidth: '960px',
          boxSizing: 'border-box'
        }}
      >
        {techList.map((tech, idx) => {
          const colIdx = idx % 7;
          const iconUrl = getTechIconUrl(tech);

          return (
            <div
              key={`${tech}-${idx}`}
              data-col={colIdx}
              className="grid__item"
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                boxSizing: 'border-box',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img 
                src={iconUrl} 
                alt={tech}
                style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-box')) {
                    const box = document.createElement('div');
                    box.className = 'fallback-box';
                    box.style.width = '32px';
                    box.style.height = '32px';
                    box.style.borderRadius = '8px';
                    box.style.background = 'rgba(168, 85, 247, 0.2)';
                    box.style.border = '1px solid rgba(168, 85, 247, 0.4)';
                    box.style.display = 'flex';
                    box.style.alignItems = 'center';
                    box.style.justifyContent = 'center';
                    box.style.fontSize = '10px';
                    box.style.fontWeight = 'bold';
                    box.style.color = '#c084fc';
                    box.style.fontFamily = 'monospace';
                    box.innerText = tech.slice(0, 2).toUpperCase();
                    parent.insertBefore(box, parent.firstChild);
                  }
                }}
              />

              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'block',
                  fontSize: '8px',
                  fontWeight: '700',
                  color: '#ec4899',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'monospace'
                }}>
                  BUILD WITH
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#f3f4f6',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '85px'
                }}>
                  {tech}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StaggeredGrid;