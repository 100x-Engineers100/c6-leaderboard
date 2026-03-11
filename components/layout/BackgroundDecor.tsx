'use client'
import { motion } from 'framer-motion'

export function BackgroundDecor() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1,
            overflow: 'hidden',
        }}>
            {/* --- Planets --- */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    top: '15%',
                    right: '5%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(249,104,70,0.18) 0%, transparent 60%)',
                    filter: 'blur(40px)',
                }}
            />

            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '-5%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 70% 70%, rgba(249,104,70,0.12) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* --- Renaissance / Blueprint Style Corners --- */}
            {/* Top Left Corner Accent */}
            <div style={{
                position: 'absolute',
                top: 40,
                left: 40,
                width: 120,
                height: 120,
                opacity: 0.15,
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, border: '1px solid #F96846', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: 0, left: 40, width: 1, height: 10, background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 40, left: 0, width: 10, height: 1, background: '#F96846' }} />
            </div>

            {/* Bottom Right Corner Accent */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                width: 150,
                height: 150,
                opacity: 0.1,
                transform: 'rotate(180deg)',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: '#F96846' }} />
                <div style={{ position: 'absolute', top: 20, left: 20, width: 80, height: 80, border: '1px solid #F96846', borderRight: 'none', borderBottom: 'none', borderRadius: '4px' }} />
            </div>

            {/* --- Tech Labels --- */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '2%',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                color: '#F96846',
                opacity: 0.2,
                letterSpacing: '3px',
                transform: 'rotate(-90deg)',
            }}>
                COHORT 6
            </div>

            <div style={{
                position: 'absolute',
                bottom: '30%',
                right: '2%',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                color: '#F96846',
                opacity: 0.15,
                letterSpacing: '3px',
                transform: 'rotate(90deg)',
            }}>
                LEADERBOARD
            </div>

            {/* --- Grid / Abstract Lines --- */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                width: '1px',
                height: '60%',
                background: 'linear-gradient(to bottom, transparent, rgba(249,104,70,0.05), transparent)',
            }} />

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                width: '80%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(249,104,70,0.03), transparent)',
            }} />

            {/* Fine Circle Sketch */}
            <div style={{
                position: 'absolute',
                top: '60%',
                right: '15%',
                width: '400px',
                height: '400px',
                border: '1px solid rgba(249,104,70,0.03)',
                borderRadius: '50%',
            }} />
        </div>
    )
}
