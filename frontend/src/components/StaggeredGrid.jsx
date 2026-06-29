import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import imagesLoaded from 'imagesloaded'
import { getTechIconUrl } from '../utils/techIcons'
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa'
import './StaggeredGrid.css'

gsap.registerPlugin(ScrollTrigger)

const cn = (...classes) => classes.filter(Boolean).join(' ')

export function StaggeredGrid({
    techStack = [],
    centerText = "Halcyon",
    role = "",
    socials = {},
    className,
    scroller
}) {
    const [isLoaded, setIsLoaded] = useState(false)
    const gridFullRef = useRef(null)
    const textRef = useRef(null)

    // Bento Grid State
    const [activeBento, setActiveBento] = useState(0)

    const splitText = (text) => {
        return text.split('').map((char, i) => (
            <span key={i} className="char inline-block" style={{ willChange: 'transform' }}>
                {char === ' ' ? '\u00A0' : char}
            </span>
        ))
    }

    useEffect(() => {
        let isMounted = true
        const handleLoad = () => {
            if (!isMounted) return
            document.body.classList.remove('loading')
            setIsLoaded(true)
        }

        // Wait for background images to load
        const imgElements = document.querySelectorAll('.grid__item-img')
        let imgLoad = null
        if (imgElements.length > 0) {
            imgLoad = imagesLoaded(imgElements, { background: true }, handleLoad)
        } else {
            setIsLoaded(true)
        }

        return () => {
            isMounted = false
            if (imgLoad) imgLoad.off('always', handleLoad)
        }
    }, [techStack])

    useEffect(() => {
        if (!isLoaded) return

        // Animate Text Element
        if (textRef.current) {
            const chars = textRef.current.querySelectorAll('.char')
            gsap.timeline({
                scrollTrigger: {
                    trigger: textRef.current,
                    scroller: scroller || undefined,
                    start: 'top bottom',
                    end: 'center center-=25%',
                    scrub: 1,
                }
            })
                .from(chars, {
                    ease: 'sine.out',
                    yPercent: 300,
                    autoAlpha: 0,
                    stagger: {
                        each: 0.05,
                        from: 'center'
                    }
                })
        }

        // Animate Full Grid
        if (gridFullRef.current) {
            const gridFullItems = gridFullRef.current.querySelectorAll('.grid__item')
            const computedStyle = getComputedStyle(gridFullRef.current)
            const numColumns = computedStyle.getPropertyValue('grid-template-columns').split(' ').length || 7
            const middleColumnIndex = Math.floor(numColumns / 2)

            const columns = Array.from({ length: numColumns }, () => [])
            gridFullItems.forEach((item) => {
                const colAttr = item.getAttribute('data-col')
                const columnIndex = colAttr !== null ? parseInt(colAttr, 10) : 0
                if (columns[columnIndex]) {
                    columns[columnIndex].push(item)
                }
            })

            columns.forEach((columnItems, columnIndex) => {
                const delayFactor = Math.abs(columnIndex - middleColumnIndex) * 0.2

                gsap.timeline({
                    scrollTrigger: {
                        trigger: gridFullRef.current,
                        scroller: scroller || undefined,
                        start: 'top bottom',
                        end: 'center center',
                        scrub: 1.5,
                    }
                })
                    .from(columnItems, {
                        yPercent: 450,
                        autoAlpha: 0,
                        delay: delayFactor,
                        ease: 'sine.out',
                    })
                    .from(columnItems.map(item => item.querySelector('.grid__item-img')), {
                        transformOrigin: '50% 0%',
                        ease: 'sine.out',
                    }, 0)
            })

            // Specific animation for Bento Container
            const bentoContainer = gridFullRef.current.querySelector('.bento-container')

            if (bentoContainer) {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: gridFullRef.current,
                        scroller: scroller || undefined,
                        start: 'top top+=15%',
                        end: 'bottom center',
                        scrub: 1,
                        invalidateOnRefresh: true,
                    }
                })

                tl.to(bentoContainer, {
                    y: window.innerHeight * 0.1,
                    scale: 1.5,
                    zIndex: 1000,
                    ease: 'power2.out',
                    duration: 1,
                    force3D: true
                }, 0)
            }

            // Refresh ScrollTrigger to recalculate trigger points
            ScrollTrigger.refresh()
        }
    }, [isLoaded, scroller])

    // If techStack is empty, use some defaults
    const activeTechs = techStack.length > 0 ? techStack : ["React", "Python", "Git", "Docker", "Node.js"]

    // Map techs to the 21 grid items (excluding the bento slot)
    const mixedGridItems = Array.from({ length: 21 }, (_, i) => activeTechs[i % activeTechs.length])
    mixedGridItems[16] = 'BENTO_GROUP'

    // Extract bento items: LinkedIn, GitHub, Gmail
    const bentoItems = [
        {
            id: 'linkedin',
            title: 'LinkedIn',
            value: socials?.linkedin,
            href: socials?.linkedin,
            icon: <FaLinkedin size={36} style={{ color: '#0077b5' }} />
        },
        {
            id: 'github',
            title: 'GitHub',
            value: socials?.github,
            href: socials?.github,
            icon: <FaGithub size={36} style={{ color: '#ffffff' }} />
        },
        {
            id: 'gmail',
            title: 'Gmail',
            value: socials?.gmail,
            href: socials?.gmail ? `mailto:${socials.gmail}` : '',
            icon: <FaEnvelope size={36} style={{ color: '#ea4335' }} />
        }
    ]

    const handleBentoClick = (item) => {
        if (item.value) {
            window.open(item.href, '_blank')
        }
    }

    return (
        <div className={cn("staggered-grid-container", className)}>
            <section className="staggered-grid-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '30px', padding: '0 40px' }}>
                        {/* Left Gradient Line */}
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15))' }} />
                        
                        {/* Big Name Text */}
                        <div ref={textRef} className="staggered-grid-title" style={{ whiteSpace: 'nowrap' }}>
                            {splitText(centerText)}
                        </div>

                        {/* Right Gradient Line */}
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255, 255, 255, 0.15))' }} />
                    </div>
                    {/* Role subheading below the name */}
                    {role && (
                        <div className="header-role-subheading">
                            {role}
                        </div>
                    )}
                </div>
            </section>

            <section className="staggered-grid-section">
                <div ref={gridFullRef} className="grid--full">
                    <div className="grid-overlay" />
                    {mixedGridItems.map((item, i) => {
                        if (item === 'BENTO_GROUP') {
                            return (
                                <div key="bento-group" data-col={2} className="bento-container">
                                    {bentoItems.map((bentoItem, index) => {
                                        const isActive = activeBento === index
                                        const hasValue = !!bentoItem.value

                                        return (
                                            <div
                                                key={bentoItem.id}
                                                className={cn("bento-card", isActive ? "active" : "inactive")}
                                                style={{ 
                                                    width: isActive ? "60%" : "20%",
                                                    cursor: hasValue ? "pointer" : "default"
                                                }}
                                                onMouseEnter={() => setActiveBento(index)}
                                                onClick={() => handleBentoClick(bentoItem)}
                                            >
                                                {/* Border Overlay */}
                                                <div className="bento-border-overlay" />

                                                {/* Content Container */}
                                                <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
                                                    {/* Active State Content */}
                                                    <div className="bento-active-content">
                                                        <div className="bento-image-wrapper">
                                                            {bentoItem.icon}
                                                            <div className="bento-gradient-shadow" />
                                                        </div>

                                                        {/* Footer Row */}
                                                        <div className="bento-footer">
                                                            <h3 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: '800' }}>{bentoItem.title}</span>
                                                                <span style={{ fontSize: '9px', fontWeight: '500', color: hasValue ? '#a1a1aa' : '#ef4444' }}>
                                                                    {hasValue ? bentoItem.value : 'Not Connected'}
                                                                </span>
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Inactive State - Icon - Centered */}
                                                <div className="bento-inactive-content">
                                                    {bentoItem.icon}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }

                        if (i === 17 || i === 18) return null

                        // Render regular grid items
                        const techName = item
                        const iconUrl = getTechIconUrl(techName)

                        return (
                            <figure key={`img-${i}`} data-col={i % 7} className="grid__item">
                                <div className="grid__item-img">
                                    {/* Gradient Overlay for Hover */}
                                    <div className="grid__item-hover-overlay" />

                                    {/* Content Container */}
                                    <div className="grid__item-content">
                                        {/* Tech Icon with drop-shadow filter to prevent background merge */}
                                        <img 
                                            src={iconUrl} 
                                            alt={techName}
                                            style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.45)) brightness(1.15)' }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent && !parent.querySelector('.fallback-icon-text')) {
                                                    const span = document.createElement('span');
                                                    span.className = 'fallback-icon-text';
                                                    span.style.fontSize = '10px';
                                                    span.style.fontWeight = 'bold';
                                                    span.style.fontFamily = 'monospace';
                                                    span.style.color = '#ec4899';
                                                    span.innerText = techName.slice(0, 2).toUpperCase();
                                                    parent.appendChild(span);
                                                }
                                            }}
                                        />

                                        {/* Text Reveal */}
                                        <div className="grid__item-text-reveal">
                                            <span className="grid__item-title">{techName}</span>
                                        </div>
                                    </div>
                                </div>
                            </figure>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

export default StaggeredGrid
