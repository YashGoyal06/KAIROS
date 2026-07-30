import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getTechIconUrl } from '../utils/techIcons';

export function StaggeredGrid({ items = [], centerText = "MY TECH STACK" }) {
  const gridRef = useRef(null);
  const textRef = useRef(null);

  const techList = items.length > 0 
    ? items 
    : ["Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI", "PostgreSQL", "Docker"];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Header Text
      if (textRef.current) {
        const chars = textRef.current.querySelectorAll('.char');
        gsap.fromTo(chars,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.03
          }
        );
      }

      // Animate Staggered Grid Cards
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.tech-card-item');
        gsap.fromTo(cards,
          { y: 40, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            stagger: {
              each: 0.05,
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
      <span key={i} className="char" style={{ display: 'inline-block', willChange: 'transform, opacity' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '960px',
      margin: '0 auto',
      backgroundColor: 'rgba(18, 16, 25, 0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '32px 24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px'
    }}>
      {/* Title */}
      <h3 ref={textRef} style={{
        margin: 0,
        fontSize: '22px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
        textShadow: '0 0 15px rgba(192, 132, 252, 0.4)'
      }}>
        {splitText(centerText)}
      </h3>

      {/* Grid Container */}
      <div 
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '16px',
          width: '100%',
          justifyItems: 'center'
        }}
      >
        {techList.map((tech, idx) => {
          const iconUrl = getTechIconUrl(tech);
          return (
            <div
              key={`${tech}-${idx}`}
              className="tech-card-item"
              style={{
                width: '100%',
                maxWidth: '120px',
                aspectRatio: '1 / 1',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px',
                boxSizing: 'border-box',
                transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.4)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(192, 132, 252, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img 
                src={iconUrl} 
                alt={tech}
                style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-box')) {
                    const box = document.createElement('div');
                    box.className = 'fallback-box';
                    box.style.width = '36px';
                    box.style.height = '36px';
                    box.style.borderRadius = '8px';
                    box.style.background = 'rgba(192, 132, 252, 0.15)';
                    box.style.border = '1px solid rgba(192, 132, 252, 0.3)';
                    box.style.display = 'flex';
                    box.style.alignItems = 'center';
                    box.style.justifyContent = 'center';
                    box.style.fontSize = '11px';
                    box.style.fontWeight = 'bold';
                    box.style.color = '#c084fc';
                    box.style.fontFamily = 'monospace';
                    box.innerText = tech.slice(0, 2).toUpperCase();
                    parent.insertBefore(box, parent.firstChild);
                  }
                }}
              />
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#e4e4e7',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '90px'
              }}>
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