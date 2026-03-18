'use client'
import { motion } from 'framer-motion'

export function BackgroundDecor() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            overflow: 'hidden',
        }}>
            {/* Ambient glow -- top right */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: '15%',
                    right: '5%',
                    width: 'clamp(120px, 18vw, 300px)',
                    height: 'clamp(120px, 18vw, 300px)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(249,104,70,0.28) 0%, transparent 60%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* Ambient glow -- bottom left */}
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '-5%',
                    width: 'clamp(180px, 30vw, 500px)',
                    height: 'clamp(180px, 30vw, 500px)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 70% 70%, rgba(249,104,70,0.20) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* Top Left Corner Accent */}
            <div style={{
                position: 'absolute',
                top: 'clamp(16px, 2.5vw, 40px)',
                left: 'clamp(16px, 2.5vw, 40px)',
                width: 'clamp(55px, 7vw, 120px)',
                height: 'clamp(55px, 7vw, 120px)',
                opacity: 0.2,
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: '#F96846' }} />
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: '30%', height: '30%', border: '1px solid #F96846', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: 0, left: '40%', width: 1, height: '10%', background: '#F96846' }} />
                <div style={{ position: 'absolute', top: '40%', left: 0, width: '10%', height: 1, background: '#F96846' }} />
            </div>

            {/* Bottom Right Corner Accent */}
            <div style={{
                position: 'absolute',
                bottom: 'clamp(16px, 2.5vw, 40px)',
                right: 'clamp(16px, 2.5vw, 40px)',
                width: 'clamp(65px, 9vw, 150px)',
                height: 'clamp(65px, 9vw, 150px)',
                opacity: 0.15,
                transform: 'rotate(180deg)',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: '#F96846' }} />
                <div style={{ position: 'absolute', top: '13%', left: '13%', width: '53%', height: '53%', border: '1px solid #F96846', borderRight: 'none', borderBottom: 'none', borderRadius: '4px' }} />
            </div>

            {/* Tech label -- left edge */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '2%',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                color: '#F96846',
                opacity: 0.5,
                letterSpacing: '3px',
                transform: 'rotate(-90deg)',
            }}>
                COHORT 7
            </div>

            {/* Tech label -- right edge */}
            <div style={{
                position: 'absolute',
                bottom: '30%',
                right: '2%',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                color: '#F96846',
                opacity: 0.12,
                letterSpacing: '3px',
                transform: 'rotate(90deg)',
            }}>
                LEADERBOARD
            </div>

            {/* Decorative ring -- pushed to right edge, won't cross center */}
            <div style={{
                position: 'absolute',
                top: '55%',
                right: '-8%',
                width: 'clamp(160px, 25vw, 400px)',
                height: 'clamp(160px, 25vw, 400px)',
                border: '1px solid rgba(249,104,70,0.08)',
                borderRadius: '50%',
            }} />
        </div>
    )
}
