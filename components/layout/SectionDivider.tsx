'use client'
import { motion } from 'framer-motion'
import { useRef } from 'react'

export function SectionDivider() {
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={containerRef}
            style={{
                height: '240px',
                width: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                pointerEvents: 'none',
            }}
        >
            {/* Central Glowing Line */}
            <div style={{
                width: '1px',
                height: '120px',
                background: 'linear-gradient(to bottom, transparent, #F96846, transparent)',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 0 20px rgba(249,104,70,0.6)',
            }} />

            {/* Pulsing Core */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#F96846',
                    boxShadow: '0 0 30px 10px rgba(249,104,70,0.4)',
                    zIndex: 3,
                }}
            />

            {/* Decorative Ornaments */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '300px',
                height: '300px',
                zIndex: 1,
            }}>
                {/* Subtle Ring */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '200px',
                    height: '200px',
                    border: '1px solid rgba(249,104,70,0.05)',
                    borderRadius: '50%',
                }} />

                {/* Particle Accent 1 */}
                <motion.div
                    animate={{
                        y: [-10, 10, -10],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '40%',
                        width: '2px',
                        height: '2px',
                        backgroundColor: '#F96846',
                        borderRadius: '50%',
                    }}
                />

                {/* Particle Accent 2 */}
                <motion.div
                    animate={{
                        y: [10, -10, 10],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    style={{
                        position: 'absolute',
                        bottom: '25%',
                        right: '35%',
                        width: '3px',
                        height: '3px',
                        backgroundColor: '#F96846',
                        borderRadius: '50%',
                    }}
                />
            </div>

            {/* Tech Grid Bridge (Subtle) */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundImage: 'radial-gradient(circle, rgba(249,104,70,0.03) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                zIndex: 0,
            }} />

            {/* Labels */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 'calc(50% + 20px)',
                transform: 'translateY(-50%)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                letterSpacing: '2px',
                color: 'rgba(249,104,70,0.3)',
                textTransform: 'uppercase',
                zIndex: 4,
            }}>
                Translink v1.0
            </div>
        </div>
    )
}
