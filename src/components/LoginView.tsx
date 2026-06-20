import React, { useState, useEffect, useRef } from 'react';
import { Shield, Bike, Scale, Send, Check, MapPin, Navigation, ArrowRight, Smartphone, Mail, Heart, Accessibility, ShieldAlert, User, RefreshCw, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Driver } from '../types';
import { ZipRideRepository } from '../services/dbInterface';
import { SessionResetService } from '../services/SessionResetService';

// ==========================================
// DETAILED SEMI-REALISTIC SVG GRAPHICS
// ==========================================

const SemiRealisticBikeRiderSvg = ({
  wheelsSpinning,
  hasPassenger,
  headlightGlow,
  helmetOff,
  riderAction,
  visitingMirrors,
  nodState,
  suspensionCompression,
  engineIdle
}: {
  wheelsSpinning: boolean;
  hasPassenger: boolean;
  headlightGlow: boolean;
  helmetOff: boolean;
  riderAction: 'riding' | 'adjusting-gloves' | 'holding-phone' | 'dropping-phone';
  visitingMirrors: boolean;
  nodState: boolean;
  suspensionCompression: boolean;
  engineIdle: boolean;
}) => {
  return (
    <svg viewBox="0 0 200 120" className="w-52 h-32 md:w-64 md:h-40 text-[#00C896] fill-current drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
      <defs>
        {/* Headlight beam gradient */}
        <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.85" />
          <stop offset="30%" stopColor="#FDE047" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#FDE047" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
        </linearGradient>
        {/* Tyre gradient */}
        <radialGradient id="tyreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
        {/* Metallic body gradient */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Rear Wheel (Axle at x=45, y=90) */}
      <g transform="translate(45, 90)">
        <circle cx="0" cy="0" r="18" fill="url(#tyreGrad)" stroke="#020617" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="13" fill="#0F172A" />
        {/* Spokes (Rotating group) */}
        <motion.g
          animate={wheelsSpinning ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: wheelsSpinning ? 0.35 : 0, ease: "linear" }}
        >
          <circle cx="0" cy="0" r="10" stroke="#00C896" strokeWidth="1" fill="none" strokeDasharray="2 3" />
          <line x1="-13" y1="0" x2="13" y2="0" stroke="#64748B" strokeWidth="1.5" />
          <line x1="0" y1="-13" x2="0" y2="13" stroke="#64748B" strokeWidth="1.5" />
          <line x1="-9" y1="-9" x2="9" y2="9" stroke="#64748B" strokeWidth="1" />
          <line x1="-9" y1="9" x2="9" y2="-9" stroke="#64748B" strokeWidth="1" />
        </motion.g>
        <circle cx="0" cy="0" r="7" fill="none" stroke="#94A3B8" strokeWidth="1.2" opacity="0.8" />
        <path d="M -8 -8 L -14 -4 L -11 2 Z" fill="#334155" />
      </g>

      {/* Front Wheel (Axle at x=155, y=90) */}
      <g transform="translate(155, 90)">
        <circle cx="0" cy="0" r="18" fill="url(#tyreGrad)" stroke="#020617" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="13" fill="#0F172A" />
        {/* Spokes (Rotating group) */}
        <motion.g
          animate={wheelsSpinning ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: wheelsSpinning ? 0.35 : 0, ease: "linear" }}
        >
          <circle cx="0" cy="0" r="10" stroke="#00C896" strokeWidth="1" fill="none" strokeDasharray="2 3" />
          <line x1="-13" y1="0" x2="13" y2="0" stroke="#64748B" strokeWidth="1.5" />
          <line x1="0" y1="-13" x2="0" y2="13" stroke="#64748B" strokeWidth="1.5" />
          <line x1="-9" y1="-9" x2="9" y2="9" stroke="#64748B" strokeWidth="1" />
          <line x1="-9" y1="9" x2="9" y2="-9" stroke="#64748B" strokeWidth="1" />
        </motion.g>
        <circle cx="0" cy="0" r="8" fill="none" stroke="#94A3B8" strokeWidth="1.2" opacity="0.8" />
        <path d="M 8 -8 L 14 -4 L 11 2 Z" fill="#334155" />
      </g>

      {/* Dynamic Motion group for suspension compression and engine idling vibrations */}
      <motion.g
        animate={{ 
          y: suspensionCompression 
            ? [0, 5, -2, 0.8, 0] 
            : engineIdle 
              ? [0, -0.65, 0] 
              : 0 
        }}
        transition={
          suspensionCompression 
            ? { duration: 0.5, ease: "easeInOut" } 
            : engineIdle 
              ? { repeat: Infinity, duration: 0.08, ease: "linear" } 
              : { duration: 0.2 }
        }
      >
        {/* Front Fork sliders */}
        <line x1="155" y1="90" x2="144" y2="62" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
        {/* swingarm */}
        <path d="M 45 90 L 85 83 M 45 90 L 68 76" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Engine gearbox block */}
        <rect x="80" y="70" width="30" height="20" rx="4" fill="url(#metalGrad)" stroke="#1E293B" strokeWidth="1.5" />
        <path d="M 92 70 L 98 58 M 96 70 L 102 58 M 100 70 L 106 58" stroke="#334155" strokeWidth="2" />
        <line x1="82" y1="80" x2="108" y2="80" stroke="#0F172A" strokeWidth="1.5" />

        {/* Exhaust pipe chrome */}
        <path d="M 94 88 C 94 98, 120 98, 130 92 M 100 85 L 60 92" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Front fork tubes (upper) */}
        <line x1="147" y1="70" x2="135" y2="40" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
        {/* Fuel Tank (Metallic Green ZipRide) */}
        <path d="M 100 60 C 100 50, 130 50, 130 58 C 130 63, 110 66, 100 60 Z" fill="#059669" stroke="#047857" strokeWidth="1.5" />
        <path d="M 103 57 C 103 53, 122 53, 124 57" stroke="#A7F3D0" strokeWidth="1" fill="none" />
        <text x="107.5" y="60.5" fill="#FFFFFF" fontSize="5.2" fontWeight="900" fontFamily="monospace">ZipRide</text>

        {/* Seats */}
        <path d="M 72 65 C 75 60, 95 60, 102 65 C 95 67, 78 67, 72 65 Z" fill="#0F172A" />
        <path d="M 58 62 C 60 58, 72 58, 75 63 C 70 65, 63 65, 58 62 Z" fill="#1E293B" />

        {/* Tailpiece */}
        <path d="M 58 62 L 48 70 L 52 74" stroke="#334155" strokeWidth="2.5" fill="none" />
        <circle cx="48" cy="69" r="2.5" fill="#EF4444" className={engineIdle ? 'animate-pulse' : ''} />

        {/* Front cowl & Headlight cover */}
        <path d="M 130 58 L 138 48 L 140 54 L 133 62 Z" fill="#1E293B" stroke="#059669" strokeWidth="1" />
        <circle cx="138" cy="51" r="2.5" fill="#E2E8F0" />

        {/* Glowing Headlight beam */}
        {headlightGlow && (
          <motion.path
            d="M 139 50 L 340 10 L 340 82 Z"
            fill="url(#headlightBeam)"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.65, scaleX: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ originX: "139px", originY: "50px" }}
          />
        )}

        {/* Handlebars */}
        <line x1="135" y1="40" x2="128" y2="34" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="126" cy="31" r="2.5" fill="#334155" />
        <line x1="130" y1="36" x2="127" y2="33" stroke="#334155" strokeWidth="1" />

        {/* Passenger Footrest indicator */}
        {hasPassenger ? (
          <line x1="72" y1="78" x2="78" y2="78" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <line x1="72" y1="78" x2="74" y2="76" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* RIDER (Driver) */}
        <g transform="translate(14, 0)">
          {/* Leg & Boots */}
          <path d="M 82 64 L 98 78 L 92 92 L 87 92 Z" fill="#1E293B" stroke="#020617" strokeWidth="1.2" />
          {/* Boots */}
          <path d="M 92 92 L 98 92 L 98 95 L 90 95 Z" fill="#0F172A" stroke="#020617" strokeWidth="0.8" />
          <path d="M 98 92 L 100 95 L 97 95 Z" fill="#78350F" /> {/* Brown sole accent */}

          {/* Torso & Green ZipRide Jacket with Reflective Safety Strips */}
          <path d="M 82 64 L 96 38 L 105 38 L 94 66 Z" fill="#059669" stroke="#047857" strokeWidth="1.2" />
          <path d="M 94.5 38.5 L 97.5 35 L 101.5 35 L 99 38.5 Z" fill="#1E293B" /> {/* Collar */}
          <path d="M 86 58 L 98 42 M 84 62 L 95 46" stroke="#F1F5F9" strokeWidth="1.8" strokeDasharray="3 3" />

          {/* Arm and Hands (Interactive based on riderAction) */}
          {riderAction === 'riding' && (
            <g>
              <path d="M 100 41 L 114 52 L 121 45 L 105 40 Z" fill="#1E293B" />
              <line x1="104" y1="44" x2="114" y2="52" stroke="#E2E8F0" strokeWidth="1.5" />
              <circle cx="120" cy="46" r="3" fill="#d29062" stroke="#854d0e" strokeWidth="0.5" />
            </g>
          )}

          {riderAction === 'adjusting-gloves' && (
            <g>
              <path d="M 100 41 Q 112 50 102 54" stroke="#1E293B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <circle cx="102" cy="54" r="3.5" fill="#d29062" />
              <path d="M 94 42 Q 88 50 98 52" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}

          {riderAction === 'holding-phone' && (
            <g>
              <path d="M 100 41 Q 92 48 94 36" stroke="#1E293B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              {/* Phone case */}
              <rect x="91.5" y="26.5" width="4.5" height="8.5" rx="1" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              {/* Glowing screen */}
              <rect x="92" y="27" width="3.5" height="7.5" rx="0.5" fill="#00C896" />
              {/* Phone Screen Glow */}
              <circle cx="93.8" cy="30.8" r="8" fill="#00C896" opacity="0.35" className="animate-pulse" />
              <circle cx="93.8" cy="30.8" r="4.5" fill="#00C896" opacity="0.2" className="animate-ping" style={{ animationDuration: '1.8s' }} />
              <circle cx="94" cy="36" r="2.5" fill="#d29062" />
            </g>
          )}

          {riderAction === 'dropping-phone' && (
            <g>
              <path d="M 100 41 Q 106 52 100 62" stroke="#1E293B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="62" r="3" fill="#d29062" />
            </g>
          )}

          {/* Rider Head & Helmet */}
          <motion.g
            animate={{ 
              rotate: visitingMirrors 
                ? [0, -15, 0, 15, 0] 
                : nodState 
                  ? [0, 12, 0, 12, 0] 
                  : (riderAction === 'holding-phone' ? 12 : 0),
              y: nodState ? [0, 2.5, 0] : (riderAction === 'holding-phone' ? 1.5 : 0)
            }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{ originX: "99px", originY: "33px" }}
          >
            {/* Neck */}
            <rect x="98.5" y="30.5" width="3" height="4.5" fill="#d29062" />
            
            {helmetOff ? (
              <g>
                {/* Face & Head */}
                <path d="M 96 23 C 96 19, 104 19, 104 23 C 104 27, 101.5 31, 98 31 C 97 31, 96 27, 96 23 Z" fill="#d29062" />
                {/* Hair */}
                <path d="M 95.5 22 C 95.5 18, 102 17, 104.5 20 C 105.5 22, 101 24, 99 24 C 97 24, 95.5 23.5, 95.5 22 Z" fill="#1A1A1A" />
                {/* Eye */}
                <circle cx="101" cy="24.5" r="0.75" fill="#1A1A1A" />
                {/* Eyebrow */}
                <line x1="99.5" y1="23.2" x2="102.5" y2="23.2" stroke="#1A1A1A" strokeWidth="0.5" />
                {/* Lips */}
                <line x1="100" y1="28" x2="102" y2="28" stroke="#b85c5c" strokeWidth="0.8" />
              </g>
            ) : (
              <g>
                {/* Commuter Helmet */}
                <circle cx="100" cy="25.5" r="7.2" fill="#1E293B" stroke="#059669" strokeWidth="1.2" />
                {/* Visor window with face visible behind */}
                <path d="M 100.5 22 C 105.5 22, 106.5 26.5, 102 29.5 C 99.5 29.5, 99 26, 100.5 22 Z" fill="#334155" opacity="0.8" />
                <circle cx="101.5" cy="25.5" r="2.2" fill="#d29062" />
                <circle cx="102.2" cy="25" r="0.5" fill="#1A1A1A" />
                {/* Visor shine */}
                <path d="M 102 23 C 104 24.5, 104 26, 102 27.5" stroke="#E2E8F0" strokeWidth="0.6" fill="none" opacity="0.6" />
                {/* Strap */}
                <line x1="98" y1="31" x2="101" y2="33" stroke="#020617" strokeWidth="1.2" />
              </g>
            )}
          </motion.g>

          {/* Held Helmet on rider's lap if helmetOff is true */}
          {helmetOff && (
            <g transform="translate(80, 52)">
              <circle cx="0" cy="0" r="6" fill="#1E293B" stroke="#059669" strokeWidth="1" />
              <path d="M 0 -3 C 3.5 -3, 4 0, 1.5 2.5 C -0.5 2.5, -1.5 0, 0 -3 Z" fill="#334155" opacity="0.85" />
              <line x1="-3" y1="4" x2="2" y2="5" stroke="#1E293B" strokeWidth="1" />
            </g>
          )}
        </g>

        {/* PASSENGER (Mounted on back seat) */}
        {hasPassenger && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8, x: -15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Leg */}
            <path d="M 68 64 L 80 80 L 76 93 L 70 93 Z" fill="#334155" stroke="#020617" strokeWidth="1.2" />
            <path d="M 76 93 L 80 93 L 80 95 L 72 95 Z" fill="#0F172A" />
            {/* Torso - denim jacket */}
            <path d="M 68 64 L 80 40 L 88 40 L 80 66 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
            <line x1="72" y1="56" x2="82" y2="44" stroke="#94A3B8" strokeWidth="1.2" />
            {/* Arm holding driver shoulder */}
            <path d="M 80 44 Q 92 48 94 48" stroke="#475569" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <circle cx="94" cy="48" r="2.2" fill="#d29062" />
            {/* Neck */}
            <line x1="81" y1="39" x2="82" y2="34" stroke="#d29062" strokeWidth="3" />
            {/* Red Commuter Helmet */}
            <circle cx="83" cy="27" r="7.2" fill="#E11D48" stroke="#9F1239" strokeWidth="1.2" />
            {/* Visor */}
            <path d="M 83.5 23.5 C 87.5 23.5, 88.5 27, 84.5 29 Z" fill="#1E293B" opacity="0.85" />
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
};

const WalkingPassengerSvg = ({ progress }: { progress: number }) => {
  const leg1Angle = Math.sin(progress * 12) * 22;
  const leg2Angle = -Math.sin(progress * 12) * 22;
  const armAngle = Math.sin(progress * 12) * 25;

  return (
    <svg viewBox="0 0 60 100" className="w-14 h-24 md:w-16 md:h-28 text-slate-800 fill-current drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]">
      <g transform="translate(30, 60)">
        {/* Leg 1 */}
        <g transform={`rotate(${leg1Angle}, 0, 0)`}>
          <line x1="0" y1="0" x2="-6" y2="28" stroke="#334155" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M -6 28 L 0 30 L -2 33 L -10 32 Z" fill="#020617" />
        </g>
        {/* Leg 2 */}
        <g transform={`rotate(${leg2Angle}, 0, 0)`}>
          <line x1="0" y1="0" x2="6" y2="28" stroke="#334155" strokeWidth="5.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 6 28 L 12 30 L 10 33 L 2 32 Z" fill="#020617" opacity="0.85" />
        </g>
      </g>

      {/* Torso - casual shirt/jacket */}
      <path d="M 22 28 L 38 28 L 36 60 L 24 60 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <line x1="30" y1="28" x2="30" y2="60" stroke="#64748b" strokeWidth="1.5" />

      {/* Arms */}
      <g transform="translate(30, 32)">
        <g transform={`rotate(${armAngle}, 0, 0)`}>
          <line x1="0" y1="0" x2="-8" y2="18" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <circle cx="-8" cy="18" r="2.5" fill="#d29062" />
        </g>
        <g transform={`rotate(${-armAngle}, 0, 0)`}>
          <line x1="0" y1="0" x2="8" y2="18" stroke="#475569" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          <circle cx="8" cy="18" r="2.5" fill="#d29062" opacity="0.85" />
        </g>
      </g>

      {/* Head & Helmet */}
      <g transform="translate(30, 20)">
        <line x1="0" y1="0" x2="0" y2="-4" stroke="#d29062" strokeWidth="3" />
        <circle cx="0" cy="-10" r="7.5" fill="#E11D48" stroke="#9F1239" strokeWidth="1.2" />
        <path d="M 0 -14 C 4 -14, 5 -10, 2 -8 Z" fill="#020617" />
        {/* Visor */}
        <path d="M 1.5 -13.5 Q 4 -11.5 2.5 -9.5" stroke="#E2E8F0" strokeWidth="0.8" fill="none" />
      </g>
    </svg>
  );
};

// ==========================================
// HIGH-PERFORMANCE CANVAS HOLOGRAM PORTAL
// ==========================================

interface HologramCanvasProps {
  active: boolean;
  phoneX: number;
  phoneY: number;
  phase: string;
}

const HologramCanvas = ({ active, phoneX, phoneY, phase }: HologramCanvasProps) => {
  return null;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles system
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      color: string;
      wobbleSpeed: number;
      wobbleRange: number;
      angle: number;
      isExplosion?: boolean;
      speedX?: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 65;

    // Laser scanning rings
    interface Ring {
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      opacity: number;
    }
    const rings: Ring[] = [];

    // floating items
    interface FloatItem {
      x: number;
      y: number;
      symbol: string;
      label: string;
      pulse: number;
    }
    
    const floatItems: FloatItem[] = [
      { x: phoneX + 110, y: phoneY - 140, symbol: '📍', label: 'Safety Geofence', pulse: 0 },
      { x: phoneX - 120, y: phoneY - 210, symbol: '🤖', label: 'ZipRide AI Assist', pulse: Math.PI / 3 },
      { x: phoneX + 180, y: phoneY - 240, symbol: '🗺️', label: 'Live Telemetry', pulse: Math.PI / 1.5 },
      { x: phoneX - 190, y: phoneY - 120, symbol: '🛡️', label: 'OTP Cryptography', pulse: Math.PI }
    ];

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: phoneX + (Math.random() - 0.5) * 80,
        y: phoneY - Math.random() * (phoneY - 120),
        size: Math.random() * 2.2 + 1,
        speedY: Math.random() * 1.6 + 0.6,
        opacity: Math.random() * 0.75 + 0.25,
        color: Math.random() > 0.45 ? '#00C896' : '#38BDF8',
        wobbleSpeed: Math.random() * 0.04 + 0.015,
        wobbleRange: Math.random() * 24 + 6,
        angle: Math.random() * Math.PI * 2
      });
    }

    let beamHeightScale = 0;
    let ringTimer = 0;
    let dissolveTriggered = false;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Handle Success Dissolve Explosion
      if (phase === 'success-dissolve' || phase === 'passenger-walk' || phase === 'passenger-mount' || phase === 'riding-off') {
        if (!dissolveTriggered) {
          dissolveTriggered = true;
          // Spawn burst particles
          for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            particles.push({
              x: phoneX,
              y: phoneY - 220,
              size: Math.random() * 3.5 + 1.5,
              speedY: Math.sin(angle) * speed,
              speedX: Math.cos(angle) * speed,
              opacity: 1,
              color: Math.random() > 0.4 ? '#00C896' : '#38BDF8',
              wobbleSpeed: 0,
              wobbleRange: 0,
              angle: 0,
              isExplosion: true
            });
          }
        }
      }

      if (phase === 'success-dissolve') {
        beamHeightScale = Math.max(0, beamHeightScale - 0.05); // shrink beam
      } else if (beamHeightScale < 1) {
        beamHeightScale += 0.045; // expand beam
      }

      const beamTop = phoneY - (phoneY - 60) * beamHeightScale;

      // Draw Volumetric Cone Gradient
      if (beamHeightScale > 0.05) {
        const beamGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX, beamTop);
        beamGrad.addColorStop(0, 'rgba(0, 200, 150, 0.45)');
        beamGrad.addColorStop(0.35, 'rgba(0, 200, 150, 0.22)');
        beamGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.12)');
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(phoneX - 30, phoneY);
        ctx.lineTo(phoneX + 30, phoneY);
        ctx.lineTo(phoneX + 180, beamTop);
        ctx.lineTo(phoneX - 180, beamTop);
        ctx.closePath();
        ctx.fill();

        // volumetric light sweeps
        ctx.strokeStyle = 'rgba(0, 200, 150, 0.06)';
        ctx.lineWidth = 1;
        for (let i = -140; i <= 140; i += 35) {
          ctx.beginPath();
          ctx.moveTo(phoneX, phoneY);
          ctx.lineTo(phoneX + i, beamTop);
          ctx.stroke();
        }
      }

      // Draw scan rings (only when not dissolving)
      if (!dissolveTriggered) {
        ringTimer++;
        if (ringTimer % 55 === 0) {
          rings.push({
            y: phoneY,
            radius: 8,
            maxRadius: 170,
            speed: 2.4,
            opacity: 0.8
          });
        }

        for (let i = rings.length - 1; i >= 0; i--) {
          const ring = rings[i];
          ring.radius += ring.speed;
          const progress = ring.radius / ring.maxRadius;
          const ringY = phoneY - progress * (phoneY - beamTop);
          ring.opacity = (1 - progress) * 0.8;

          if (ring.radius >= ring.maxRadius) {
            rings.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(0, 200, 150, ${ring.opacity})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(phoneX, ringY, ring.radius, ring.radius * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Outer secondary ring
          ctx.strokeStyle = `rgba(56, 189, 248, ${ring.opacity * 0.35})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(phoneX, ringY, ring.radius * 1.15, ring.radius * 1.15 * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.isExplosion) {
          p.x += p.speedX || 0;
          p.y += p.speedY;
          p.opacity -= 0.025;
          if (p.opacity <= 0) {
            particles.splice(i, 1);
            continue;
          }
        } else {
          p.y -= p.speedY;
          p.angle += p.wobbleSpeed;
          const currentX = p.x + Math.sin(p.angle) * p.wobbleRange * 0.16;

          const topFade = Math.min(1, (p.y - beamTop) / 100);
          const currentOpacity = p.opacity * topFade;

          if (p.y < beamTop || dissolveTriggered) {
            if (dissolveTriggered) {
              p.opacity -= 0.04;
              if (p.opacity <= 0) {
                particles.splice(i, 1);
                continue;
              }
            } else {
              p.y = phoneY;
              p.x = phoneX + (Math.random() - 0.5) * 80;
            }
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, currentOpacity);
        }

        // Draw particle core
        ctx.beginPath();
        ctx.arc(p.isExplosion ? p.x : p.x + Math.sin(p.angle) * p.wobbleRange * 0.16, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw radial glow tail
        const glowX = p.isExplosion ? p.x : p.x + Math.sin(p.angle) * p.wobbleRange * 0.16;
        const glowGrad = ctx.createRadialGradient(glowX, p.y, 0, glowX, p.y, p.size * 3.5);
        glowGrad.addColorStop(0, p.color === '#00C896' ? 'rgba(0, 200, 150, 0.45)' : 'rgba(56, 189, 248, 0.45)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(glowX, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Render Floating Sci-Fi HUD symbols (only if not dissolving)
      if (!dissolveTriggered && beamHeightScale > 0.4) {
        floatItems.forEach((item) => {
          item.pulse += 0.025;
          const bounce = Math.sin(item.pulse) * 5;
          const currentY = item.y + bounce;

          // HUD thread lines
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.085)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(phoneX, phoneY - 10);
          ctx.quadraticCurveTo((phoneX + item.x) / 2, (phoneY + currentY) / 2 - 35, item.x, currentY);
          ctx.stroke();

          // Capsule box
          ctx.fillStyle = 'rgba(1, 8, 20, 0.72)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const capWidth = 110;
          const capHeight = 32;
          ctx.roundRect(item.x - capWidth / 2, currentY - capHeight / 2, capWidth, capHeight, 8);
          ctx.fill();
          ctx.stroke();

          // Capsule text and indicators
          ctx.font = '14px sans-serif';
          ctx.fillText(item.symbol, item.x - capWidth / 2 + 8, currentY + 5);

          ctx.fillStyle = '#E2E8F0';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(item.label, item.x - capWidth / 2 + 28, currentY - 2);

          ctx.fillStyle = '#00C896';
          ctx.font = 'normal 7px sans-serif';
          ctx.fillText('ONLINE // COMPLIANT', item.x - capWidth / 2 + 28, currentY + 7);
        });
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, phoneX, phoneY, phase]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-15"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// ==========================================
// SCROLLING CITYSCAPE WITH DYNAMIC EFFECTS
// ==========================================

interface CityscapeBackgroundProps {
  phase: 'initial' | 'arriving' | 'helmet-off' | 'phone-out' | 'phone-drop' | 'hologram-active' | 'success-dissolve' | 'passenger-walk' | 'passenger-mount' | 'riding-off';
}

const CityscapeBackground = ({ phase }: CityscapeBackgroundProps) => {
  const isMoving = phase === 'arriving' || phase === 'riding-off';
  const speedScale = phase === 'riding-off' ? 3.5 : phase === 'arriving' ? 1.0 : 0;
  
  const getX = (layer: 'sky' | 'back' | 'mid' | 'fore') => {
    switch (layer) {
      case 'sky': return isMoving ? (phase === 'riding-off' ? -120 : -20) : -20;
      case 'back': return isMoving ? (phase === 'riding-off' ? -280 : -45) : -45;
      case 'mid': return isMoving ? (phase === 'riding-off' ? -620 : -95) : -95;
      case 'fore': return isMoving ? (phase === 'riding-off' ? -1100 : -180) : -180;
    }
  };

  const getTransition = () => {
    if (phase === 'riding-off') {
      return { duration: 1.1, ease: "easeIn" as const };
    }
    if (phase === 'arriving') {
      return { duration: 2.0, ease: "easeOut" as const };
    }
    return { duration: 0.5 };
  };

  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full object-cover z-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#1C2541" />
        </linearGradient>
        <linearGradient id="lampLightCone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <rect width="200" height="120" fill="url(#skyGrad)" />
      
      {/* Dynamic sky / stars */}
      <motion.g 
        opacity="0.5"
        animate={{ x: getX('sky') }}
        transition={getTransition()}
      >
        <circle cx="20" cy="18" r="0.6" fill="#fff" className="animate-pulse" />
        <circle cx="60" cy="22" r="0.8" fill="#fff" />
        <circle cx="100" cy="12" r="0.5" fill="#fff" className="animate-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="140" cy="26" r="0.8" fill="#fff" />
        <circle cx="180" cy="16" r="0.6" fill="#fff" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        {/* Soft Moon */}
        <circle cx="170" cy="25" r="7.5" fill="#F1F5F9" opacity="0.35" />
        <circle cx="168" cy="23" r="7.5" fill="#1C2541" />
      </motion.g>

      {/* City Skyline Layer 1 (Back) */}
      <motion.g
        animate={{ x: getX('back') }}
        transition={getTransition()}
        style={{ filter: phase === 'riding-off' ? 'blur(1.5px)' : 'none' }}
      >
        <path d="M -50 120 L -50 65 L 12 62 L 20 66 L 35 55 L 48 70 L 60 58 L 75 50 L 88 68 L 120 58 L 150 65 L 180 55 L 200 68 L 250 120 Z" fill="#0B132B" opacity="0.4" />
      </motion.g>

      {/* Skyline Layer 2 (Mid) */}
      <motion.g
        animate={{ x: getX('mid') }}
        transition={getTransition()}
        style={{ filter: phase === 'riding-off' ? 'blur(3px)' : 'none' }}
      >
        <path d="M -50 120 L -50 74 L 15 68 L 28 76 L 38 65 L 50 75 L 65 62 L 78 72 L 90 60 L 115 68 L 135 60 L 155 72 L 185 64 L 210 70 L 250 120 Z" fill="#1C2541" opacity="0.68" />
        {/* Blinking Windows */}
        <g fill="#FDE047" opacity="0.35">
          <rect x="15" y="78" width="1.5" height="2" />
          <rect x="35" y="72" width="1.5" height="2" className="animate-pulse" />
          <rect x="75" y="68" width="1.5" height="2" />
          <rect x="110" y="70" width="1.5" height="2" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
          <rect x="155" y="75" width="1.5" height="2" />
        </g>
      </motion.g>

      {/* Skyline Layer 3 (Fore) */}
      <motion.g
        animate={{ x: getX('fore') }}
        transition={getTransition()}
        style={{ filter: phase === 'riding-off' ? 'blur(4.5px)' : 'none' }}
      >
        {/* Foreground hills / trees */}
        <path d="M -50 120 L -50 84 Q 25 80 70 85 T 160 82 T 250 85 L 250 120 Z" fill="#0F172A" />
        
        {/* detailed Streetlights casting yellow glow */}
        <g>
          {[20, 80, 140, 200, 260].map((posX, idx) => (
            <g key={idx} transform={`translate(${posX}, 50)`}>
              {/* Metal pole */}
              <path d="M 0 52 L 0 5 C 0 -12, 12 -12, 15 -8" fill="none" stroke="#475569" strokeWidth="1.2" />
              {/* Lamp head */}
              <path d="M 13 -9 L 17 -6 L 14 -3 Z" fill="#1E293B" />
              {/* Radial light glow cone */}
              <polygon points="15,-6 -8,52 38,52" fill="url(#lampLightCone)" />
              <circle cx="15" cy="-6" r="1.5" fill="#FEF08A" />
            </g>
          ))}
        </g>
      </motion.g>

      {/* The Asphalt City Road */}
      <rect x="0" y="102" width="200" height="18" fill="#090D1A" />
      
      {/* Curb edge at top of road (grey and yellow stones) */}
      <g opacity="0.85">
        <rect x="0" y="101.5" width="200" height="1.2" fill="#475569" />
        {/* Alternating curb tiles */}
        {[...Array(20)].map((_, i) => (
          <rect key={i} x={i * 10} y="100.8" width="5" height="1.2" fill="#EAB308" />
        ))}
      </g>

      {/* Dynamic Road markings */}
      {isMoving ? (
        <motion.line 
          x1="0" y1="110" x2="200" y2="110" 
          stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="8 8" opacity="0.5"
          animate={{ strokeDashoffset: [0, -48] }}
          transition={{ repeat: Infinity, duration: 0.45 / (speedScale || 1), ease: "linear" }}
        />
      ) : (
        <line x1="0" y1="110" x2="200" y2="110" stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="8 8" opacity="0.5" />
      )}
    </svg>
  );
};

// ==========================================
// RADAR PROGRESS DIAL
// ==========================================

const ProgressHud = ({ progress }: { progress: number }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ width: 120, height: 120 }}>
      <motion.div
        className="absolute rounded-full border border-[#00C896]/20 bg-[#00C896]/5"
        initial={{ width: 60, height: 60, opacity: 0.6 }}
        animate={{ width: 125, height: 125, opacity: 0 }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full border border-[#00C896]/35"
        initial={{ width: 60, height: 60, opacity: 0.8 }}
        animate={{ width: 95, height: 95, opacity: 0 }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut", delay: 1.1 }}
      />

      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#00C896" strokeWidth="2" className="opacity-15" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#00C896"
          strokeWidth="3"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.4 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute top-[60%] flex flex-col items-center">
        <span className="text-[9px] font-mono font-black text-[#00C896] tracking-widest uppercase bg-[#010617]/90 px-1.5 py-0.5 rounded border border-[#00C896]/20 shadow-[0_0_8px_rgba(0,200,150,0.25)]">
          SYNC: {progress}%
        </span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN CONTROLLER
// ==========================================

interface LoginViewProps {
  onLoginSuccess: (emailOrName: string, role: 'rider' | 'driver', phone: string) => void;
  isLoggedIn: boolean;
  currentUser: string | null;
  onLogout: () => void;
  drivers: Driver[];
}

export default function LoginView({ 
  onLoginSuccess, 
  isLoggedIn, 
  currentUser, 
  onLogout,
  drivers 
}: LoginViewProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Auto' | 'Cab'>('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('TN-09-XX-8822');
  const [showingOTP, setShowingOTP] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('zipride_saved_accounts');
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
      }
    }
  }, []);

  const handleSavedAccountSelect = (acc: any) => {
    setFullName(acc.name);
    setRole(acc.role);
    if (acc.phone) {
      const cleanPhone = acc.phone.replace('+91 ', '').replace('+91', '').trim();
      setPhoneNumber(cleanPhone);
    }
    if (acc.email) {
      setEmailAddress(acc.email);
    }
    if (acc.password) {
      setPassword(acc.password);
    }
    if (acc.loginMethod) {
      setLoginMethod(acc.loginMethod);
    } else {
      setLoginMethod(acc.phone ? 'mobile' : 'email');
    }
  };
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [showingAgreement, setShowingAgreement] = useState(false);
  const [activeModalPolicy, setActiveModalPolicy] = useState<'fare' | 'ride' | 'user' | null>(null);
  const [showingLocationSetup, setShowingLocationSetup] = useState(false);
  const [latitude, setLatitude] = useState('13.0827');
  const [longitude, setLongitude] = useState('80.2707');
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'mobile' | 'google'>('mobile');

  // Profile wizard states
  const [showingProfileWizard, setShowingProfileWizard] = useState(false);
  const [age, setAge] = useState(26);
  const [gender, setGender] = useState('Male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('None');
  const [asthma, setAsthma] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [medications, setMedications] = useState('None');
  const [preferredHospital, setPreferredHospital] = useState('');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState<string[]>([]);

  // Advanced Animation State Machine
  // 'initial' | 'arriving' | 'helmet-off' | 'phone-out' | 'phone-drop' | 'hologram-active' | 'success-dissolve' | 'passenger-walk' | 'passenger-mount' | 'riding-off'
  const [phase, setPhase] = useState<'initial' | 'arriving' | 'helmet-off' | 'phone-out' | 'phone-drop' | 'hologram-active' | 'success-dissolve' | 'passenger-walk' | 'passenger-mount' | 'riding-off'>(() => {
    const skip = localStorage.getItem("skipZipRideIntro") === "true";
    return skip ? 'hologram-active' : 'initial';
  });

  const [suspensionCompression, setSuspensionCompression] = useState(false);
  const [visitingMirrors, setVisitingMirrors] = useState(false);
  const [nodState, setNodState] = useState(false);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  
  const [phoneImpactCoords, setPhoneImpactCoords] = useState({ x: 0, y: 0 });
  const [passengerWalkProgress, setPassengerWalkProgress] = useState(0);
  const [riderIdleState, setRiderIdleState] = useState<'checking-phone' | 'checking-surroundings' | 'adjusting-gloves'>('checking-phone');

  const [isMobile, setIsMobile] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; role: 'rider' | 'driver'; phone: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');

  const landingPadRef = useRef<HTMLDivElement>(null);

  // Responsive layout checker
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Idle animations cycle timer
  useEffect(() => {
    if (phase !== 'hologram-active') return;
    
    const interval = setInterval(() => {
      setRiderIdleState(prev => {
        if (prev === 'checking-phone') {
          return Math.random() > 0.5 ? 'checking-surroundings' : 'adjusting-gloves';
        } else if (prev === 'checking-surroundings') {
          return Math.random() > 0.5 ? 'checking-phone' : 'adjusting-gloves';
        } else {
          return Math.random() > 0.5 ? 'checking-phone' : 'checking-surroundings';
        }
      });
    }, 4500);
    
    return () => clearInterval(interval);
  }, [phase]);

  // Sync window changes with phone impact target
  const updateImpactCoords = () => {
    if (landingPadRef.current) {
      const rect = landingPadRef.current.getBoundingClientRect();
      setPhoneImpactCoords({ x: rect.left + rect.width / 2, y: rect.top });
    }
  };

  useEffect(() => {
    if (phase === 'hologram-active') {
      const t = setTimeout(updateImpactCoords, 100);
      window.addEventListener('resize', updateImpactCoords);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', updateImpactCoords);
      };
    }
  }, [phase]);

  // Orchestrate Phase transitions
  useEffect(() => {
    if (phase === 'initial') {
      setPhase('arriving');
    }
  }, [phase]);

  const handleArrivalComplete = () => {
    if (phase === 'arriving') {
      setSuspensionCompression(true);
      setTimeout(() => {
        setSuspensionCompression(false);
        setPhase('helmet-off');
      }, 550);
    }
  };

  useEffect(() => {
    if (phase === 'helmet-off') {
      const t = setTimeout(() => {
        setPhase('phone-out');
      }, 1500);
      return () => clearTimeout(t);
    } else if (phase === 'phone-out') {
      const t = setTimeout(() => {
        setPhase('hologram-active');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Passenger walk ticker
  useEffect(() => {
    if (phase === 'passenger-walk') {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 0.02;
        setPassengerWalkProgress(currentProgress);
        if (currentProgress >= 1.0) {
          clearInterval(interval);
          setPhase('passenger-mount');
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Mount sequence mirror check & nodding
  useEffect(() => {
    if (phase === 'passenger-mount') {
      setVisitingMirrors(true);
      const t1 = setTimeout(() => {
        setVisitingMirrors(false);
        setNodState(true);
      }, 1400);

      const t2 = setTimeout(() => {
        setNodState(false);
        setPhase('riding-off');
      }, 2600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [phase]);

  // Ride-off complete redirect handler
  const handleRideOffComplete = () => {
    if (phase === 'riding-off') {
      setShowFlashOverlay(true);
      setTimeout(() => {
        if (successData) {
          onLoginSuccess(successData.name, successData.role, successData.phone);
        } else {
          onLoginSuccess(fullName, role, phoneNumber);
        }
      }, 400);
    }
  };

  // Fallback timeout for riding-off phase to prevent getting stuck
  useEffect(() => {
    if (phase === 'riding-off') {
      const fallbackTimer = setTimeout(() => {
        console.warn("Departure animation fallback triggered after 5 seconds");
        handleRideOffComplete();
      }, 5000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [phase, handleRideOffComplete]);

  // Sync skip preference storage changes
  const [skipPreference, setSkipPreference] = useState(() => {
    return localStorage.getItem("skipZipRideIntro") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const skipped = localStorage.getItem("skipZipRideIntro") === "true";
      setSkipPreference(skipped);
      if (skipped) {
        setPhase('hologram-active');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getProgress = () => {
    let score = 0;
    if (fullName.trim()) score += 25;
    if (role === 'rider') {
      if (loginMethod === 'email') {
        if (emailAddress.trim()) score += 25;
        if (emailAddress.includes('@')) score += 10;
      } else if (loginMethod === 'mobile') {
        if (phoneNumber.trim().length >= 8) score += 35;
      }
      if (loginMethod !== 'google' && password.trim() && password !== '••••••••') score += 25;
      if (loginMethod === 'google') score += 25;
    } else {
      if (phoneNumber.trim().length >= 8) score += 25;
      if (vehicleNumber.trim()) score += 25;
      if (vehicleType) score += 10;
    }
    const currentProgress = Math.min(100, score);
    const stepBonus = showingOTP ? 15 : showingAgreement ? 30 : showingProfileWizard || showingLocationSetup ? 45 : 0;
    return Math.min(100, currentProgress + stepBonus);
  };

  const triggerSuccessTransition = (name: string, userRole: 'rider' | 'driver', phone: string) => {
    const isSkipped = localStorage.getItem("skipZipRideIntro") === "true";
    if (isSkipped) {
      onLoginSuccess(name, userRole, phone);
    } else {
      setSuccessData({ name, role: userRole, phone });
      setPhase('success-dissolve');
      setTimeout(() => {
        setPhase('passenger-walk');
      }, 1200);
    }
  };

  const setPreset = (lat: string, lng: string) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleDriverSelect = (driverId: string) => {
    if (!driverId) return;
    const d = drivers.find(drv => drv.id === driverId);
    if (d) {
      setFullName(d.name);
      const cleanPhone = d.phone.replace('+91 ', '').replace('+91', '').trim();
      setPhoneNumber(cleanPhone);
      setVehicleType(d.vehicleType);
      setVehicleNumber(d.vehicle);
      setLatitude(d.location.lat.toString());
      setLongitude(d.location.lng.toString());
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorText('Please enter your name.');
      return;
    }
    if (loginMethod === 'mobile' || role === 'driver') {
      if (!phoneNumber.trim() || phoneNumber.length < 8) {
        setErrorText('Please enter a valid phone number.');
        return;
      }
    } else if (loginMethod === 'email') {
      if (!emailAddress.includes('@')) {
        setErrorText('Please enter a valid email address.');
        return;
      }
    }
    setErrorText('');
    
    setIsSubmitting(true);
    setSubmitStatusText('Initiating secure SMS tunnel...');
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOTP(code);
      setShowingOTP(true);
      setIsSubmitting(false);
    }, 800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOTP.trim()) {
      setErrorText('Please enter the verification code.');
      return;
    }
    setIsSubmitting(true);
    setSubmitStatusText('Verifying cryptographic token...');
    setTimeout(() => {
      if (enteredOTP === generatedOTP || enteredOTP === '1234') {
        setErrorText('');
        setShowingOTP(false);
        if (role === 'rider') {
          const isFirstTime = !localStorage.getItem('zipride_user_profile');
          if (isFirstTime) {
            setShowingAgreement(true);
          } else {
            const finalPhone = loginMethod === 'mobile' ? phoneNumber : '9876543210';
            const formattedPhone = finalPhone.startsWith('+91') ? finalPhone : `+91 ${finalPhone}`;
            
            try {
              const saved = localStorage.getItem('zipride_saved_accounts');
              let accounts: any[] = saved ? JSON.parse(saved) : [];
              const exists = accounts.some(acc => acc.phone === formattedPhone && acc.role === 'rider');
              if (!exists) {
                accounts.push({
                  name: fullName,
                  phone: formattedPhone,
                  email: emailAddress || `${fullName.toLowerCase().replace(/\s+/g, '')}@zipride.com`,
                  role: 'rider',
                  password: password,
                  loginMethod: loginMethod
                });
                localStorage.setItem('zipride_saved_accounts', JSON.stringify(accounts));
              }
            } catch (e) {
              console.error(e);
            }

            triggerSuccessTransition(fullName, 'rider', formattedPhone);
          }
        } else {
          setShowingLocationSetup(true);
        }
      } else {
        setErrorText(`Incorrect OTP. Please enter the generated OTP code: ${generatedOTP}`);
      }
      setIsSubmitting(false);
    }, 800);
  };

  const handleAcceptAgreement = () => {
    setShowingAgreement(false);
    if (role === 'driver') {
      setShowingLocationSetup(true);
    } else {
      setShowingProfileWizard(true);
    }
  };

  const handleFinishWizard = () => {
    const finalPhone = loginMethod === 'mobile' ? phoneNumber : '9876543210';
    const formattedPhone = finalPhone.startsWith('+91') ? finalPhone : `+91 ${finalPhone}`;

    const profileData = {
      fullName,
      age,
      gender,
      phone: formattedPhone,
      email: loginMethod === 'email' ? emailAddress : `${fullName.toLowerCase().replace(/\s+/g, '')}@zipride.com`,
      address: 'Indiranagar, Bengaluru, Karnataka',
      emergencyContactName: guardianName || 'Police Control Room',
      emergencyContactPhone: guardianPhone || '112',
      guardianName,
      guardianRelationship,
      guardianPhone,
      guardianEmail,
      bloodGroup,
      allergies,
      asthma,
      diabetes,
      medicalConditions: [asthma ? 'Asthma' : '', diabetes ? 'Diabetes' : ''].filter(Boolean),
      medications,
      preferredHospital,
      accessibilityRequirements
    };

    setIsSubmitting(true);
    setSubmitStatusText('Configuring safety metadata...');
    setTimeout(() => {
      ZipRideRepository.saveProfile(profileData);
      
      try {
        const saved = localStorage.getItem('zipride_saved_accounts');
        let accounts: any[] = saved ? JSON.parse(saved) : [];
        const exists = accounts.some(acc => acc.phone === formattedPhone && acc.role === 'rider');
        if (!exists) {
          accounts.push({
            name: fullName,
            phone: formattedPhone,
            email: profileData.email,
            role: 'rider',
            password: password,
            loginMethod: loginMethod
          });
          localStorage.setItem('zipride_saved_accounts', JSON.stringify(accounts));
        }
      } catch (e) {
        console.error(e);
      }

      setShowingProfileWizard(false);
      setIsSubmitting(false);
      triggerSuccessTransition(fullName, 'rider', formattedPhone);
    }, 800);
  };

  const detectLocation = () => {
    setIsDetecting(true);
    setErrorText('');
    if (!navigator.geolocation) {
      setErrorText('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsDetecting(false);
      },
      (error) => {
        setErrorText(`GPS error: ${error.message}. Please input coordinates manually.`);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleConfirmLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setErrorText('Please enter a valid latitude (-90 to 90).');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setErrorText('Please enter a valid longitude (-180 to 180).');
      return;
    }

    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`;
    const finalVehicleNum = vehicleNumber.trim() || `TN09-XX-${Math.floor(1000 + Math.random() * 9000)}`;

    setIsSubmitting(true);
    setSubmitStatusText('Syncing geofence compliance...');
    try {
      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          phone: formattedPhone,
          location: { lat: latNum, lng: lngNum },
          vehicleType: vehicleType,
          vehicleNumber: finalVehicleNum
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register driver profile on the server.');
      }

      try {
        const saved = localStorage.getItem('zipride_saved_accounts');
        let accounts: any[] = saved ? JSON.parse(saved) : [];
        const exists = accounts.some(acc => acc.phone === formattedPhone && acc.role === 'driver');
        if (!exists) {
          accounts.push({
            name: fullName,
            phone: formattedPhone,
            email: `${fullName.toLowerCase().replace(/\s+/g, '')}@zipride.com`,
            role: 'driver',
            password: password,
            loginMethod: 'mobile'
          });
          localStorage.setItem('zipride_saved_accounts', JSON.stringify(accounts));
        }
      } catch (e) {
        console.error(e);
      }

      triggerSuccessTransition(fullName, 'driver', formattedPhone);
      setShowingLocationSetup(false);
    } catch (err: any) {
      setErrorText(err.message || 'An error occurred during location registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAnimation = () => {
    localStorage.setItem("skipZipRideIntro", "true");
    setSkipPreference(true);
    if (phase === 'riding-off' || phase === 'success-dissolve' || phase === 'passenger-walk' || phase === 'passenger-mount') {
      if (successData) {
        onLoginSuccess(successData.name, successData.role, successData.phone);
      } else {
        onLoginSuccess(fullName, role, phoneNumber);
      }
    } else {
      setPhase('hologram-active');
    }
  };

  const areCredentialsComplete = () => {
    if (!fullName.trim()) return false;
    if (role === 'rider') {
      if (loginMethod === 'email') {
        if (!emailAddress.trim() || !emailAddress.includes('@')) return false;
      } else if (loginMethod === 'mobile') {
        if (phoneNumber.trim().length < 8) return false;
      }
      if (loginMethod !== 'google' && (!password.trim() || password === '••••••••')) return false;
    } else {
      if (phoneNumber.trim().length < 8) return false;
      if (!vehicleNumber.trim()) return false;
    }
    return true;
  };

  const credsComplete = areCredentialsComplete();

  // Animation layout mappings
  const isParkedState = phase !== 'arriving' && phase !== 'riding-off' && phase !== 'initial';
  const showHologramPortal = phase === 'hologram-active';

  const bikeLeftTarget = isMobile ? "12%" : "25%";
  
  // Passenger walk positions
  const passengerWalkStart = isMobile ? 88 : 82; 
  const passengerWalkEnd = isMobile ? 22 : 33.5; 
  const passengerCurrentLeft = passengerWalkStart - (passengerWalkStart - passengerWalkEnd) * passengerWalkProgress;

  // Deriving SVGs state variables
  const wheelsSpinning = phase === 'arriving' || phase === 'riding-off';
  const hasPassengerMounted = phase === 'riding-off' || phase === 'passenger-mount';
  const headlightGlow = credsComplete || phase === 'riding-off' || phase === 'success-dissolve' || phase === 'passenger-walk' || phase === 'passenger-mount';
  const helmetOff = phase !== 'arriving' && phase !== 'initial';
  
  const riderAction = phase === 'riding-off' || phase === 'passenger-mount'
    ? 'riding'
    : phase === 'arriving' || phase === 'initial'
      ? 'adjusting-gloves'
      : phase === 'phone-out'
        ? 'holding-phone'
        : phase === 'hologram-active'
          ? (riderIdleState === 'checking-phone' ? 'holding-phone' : riderIdleState === 'adjusting-gloves' ? 'adjusting-gloves' : 'riding')
          : 'riding';

  const riderVisitingMirrors = visitingMirrors || (phase === 'hologram-active' && riderIdleState === 'checking-surroundings');

  return (
    <motion.div
      animate={phase === 'riding-off' && showFlashOverlay ? { opacity: 0.9 } : { opacity: 1 }}
      className="dark w-screen h-screen relative bg-[#010618] overflow-hidden select-none"
    >
      <CityscapeBackground phase={phase} />

      {/* Screen smooth dark transition overlay */}
      {showFlashOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65 }}
          className="absolute inset-0 bg-[#090D1A] z-[999] pointer-events-none"
        />
      )}

      {/* Futuristic Holographic Portal Canvas */}
      <HologramCanvas
        active={showHologramPortal || phase === 'success-dissolve' || phase === 'passenger-walk' || phase === 'passenger-mount' || phase === 'riding-off'}
        phoneX={phoneImpactCoords.x}
        phoneY={phoneImpactCoords.y}
        phase={phase}
      />

      {/* Skip Intro Button */}
      {!skipPreference && (
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={handleSkipAnimation}
            className="px-4 py-2 bg-theme-input-bg/75 hover:bg-slate-900/90 text-white hover:text-[#00C896] font-bold rounded-full text-[11px] tracking-wider border border-theme-border/80 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-[#00C896]/30"
          >
            <span>Skip Intro →</span>
          </button>
        </div>
      )}

      {/* Brand Header */}
      {phase !== 'success-dissolve' && phase !== 'passenger-walk' && phase !== 'passenger-mount' && phase !== 'riding-off' && (
        <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00C896] flex items-center justify-center shadow-[0_0_15px_rgba(0,200,150,0.35)]">
            <Bike className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-theme-text-primary uppercase font-mono">ZipRide Hub</span>
        </div>
      )}

      {/* Successful route guide path */}
      {phase === 'riding-off' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d={isMobile ? "M 20 90 Q 50 82, 70 90 T 100 90" : "M 32 90 Q 56 80, 75 90 T 100 90"}
            fill="none"
            stroke="#00C896"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
      )}

      {/* Animated Rider entering or exiting */}
      <motion.div
        className="absolute bottom-[8%] md:bottom-[12%] z-10"
        initial={{ left: "-35%" }}
        animate={
          phase === 'riding-off'
            ? { left: "115%", rotate: 4 }
            : { left: bikeLeftTarget, rotate: 0 }
        }
        transition={
          phase === 'riding-off'
            ? { duration: 1.1, ease: "easeIn" }
            : { duration: 2.0, ease: "easeOut" }
        }
        onAnimationComplete={() => {
          if (phase === 'arriving') {
            handleArrivalComplete();
          } else if (phase === 'riding-off') {
            handleRideOffComplete();
          }
        }}
      >
        <SemiRealisticBikeRiderSvg 
          wheelsSpinning={wheelsSpinning} 
          hasPassenger={hasPassengerMounted} 
          headlightGlow={headlightGlow}
          helmetOff={helmetOff}
          riderAction={riderAction}
          visitingMirrors={riderVisitingMirrors}
          nodState={nodState}
          suspensionCompression={suspensionCompression}
          engineIdle={(phase === 'hologram-active' && credsComplete) || phase === 'passenger-walk' || phase === 'passenger-mount'}
        />
      </motion.div>

      {/* Walking Passenger on success */}
      {phase === 'passenger-walk' && (
        <div
          className="absolute bottom-[8%] md:bottom-[12%] z-20"
          style={{ left: `${passengerCurrentLeft}%` }}
        >
          <WalkingPassengerSvg progress={passengerWalkProgress} />
        </div>
      )}

      {/* Left side Hero HUD text */}
      {isParkedState && phase === 'hologram-active' && (
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute left-[6%] top-[18%] z-10 space-y-5 max-w-lg hidden md:block"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-theme-text-primary">
            Every rupee, <span className="text-[#00C896]">explained.</span><br />
            Every route, <span className="text-[#00C896]">verified.</span>
          </h1>
          <p className="text-theme-text-secondary text-sm leading-relaxed max-w-md">
            No surge pricing, OTP for pickup and drop, live telemetry, route deviation alerts and automated refunds for unsafe driving.
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              "Transparent fare breakdown before you book",
              "Geofenced safety alerts in real time",
              "AI dispute resolution with evidence"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-theme-text-primary">
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#00C896]" strokeWidth={3} />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RIGHT PANEL: Premium Login Form Card (Expands from Phone UI) */}
      <AnimatePresence>
        {isParkedState && (phase === 'hologram-active' || phase === 'success-dissolve' || phase === 'passenger-walk' || phase === 'passenger-mount') && (
          <motion.div 
            initial={{ 
              opacity: 0, 
              scale: 0.05, 
              x: isMobile ? "-20vw" : "-30vw",
              y: isMobile ? "15vh" : "10vh"
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.05, 
              x: isMobile ? "-20vw" : "-30vw",
              y: isMobile ? "15vh" : "10vh"
            }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-20 w-[calc(100%-2rem)] md:w-full md:max-w-md left-4 right-4 md:left-auto md:right-[8%] top-1/2 -translate-y-1/2 bg-theme-card/85 backdrop-blur-md border border-theme-border/80 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-y-auto"
          >
            {/* Secure Loading State Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-theme-card/95 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-4 rounded-3xl">
                <div className="relative w-16 h-16">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-theme-border border-t-[#00C896]"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
                  />
                  <div className="absolute inset-2 bg-emerald-955/20 rounded-full flex items-center justify-center border border-[#00C896]/30">
                    <Shield className="w-5 h-5 text-[#00C896]" />
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-bold text-theme-text-primary tracking-wide uppercase font-mono animate-pulse">
                    {submitStatusText || "Securing Connection..."}
                  </p>
                  <p className="text-[10px] text-theme-text-secondary font-semibold font-mono">
                    Securing session cryptographic tunnel...
                  </p>
                </div>
              </div>
            )}

            {/* ACTIVE SESSION STATE */}
            {isLoggedIn && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-emerald-955/20 text-[#00C896] rounded-3xl flex items-center justify-center border border-[#00C896]/30">
                  <Check className="w-8 h-8 text-[#00C896]" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-text-primary">Operational Session Active</h3>
                  <p className="text-xs text-theme-text-secondary font-mono mt-1">Authorized User: {currentUser}</p>
                </div>
                <div className="bg-theme-input-bg/30 rounded-2xl p-4 border border-theme-border/40 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Authorization Node:</span>
                    <span className="font-mono font-bold text-[#00C896]">FAIR_COMPLIANCE_APPROVED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Account Type:</span>
                    <span className="font-mono text-theme-text-primary font-bold">
                      {localStorage.getItem('zipride_role') === 'driver' ? 'Driver Console Mode' : 'Rider Account Mode'}
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={onLogout}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  id="auth-logout-btn"
                  className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 font-bold rounded-xl text-sm border border-rose-500/20 transition cursor-pointer"
                >
                  Revoke Access (Log Out)
                </motion.button>
              </div>
            )}

            {/* DRIVER LOCATION SETUP VIEW */}
            {!isLoggedIn && showingLocationSetup && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-955/20 rounded-2xl flex items-center justify-center border border-[#00C896]/30">
                    <MapPin className="w-6 h-6 text-[#00C896]" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-text-primary tracking-tight">Set Location</h2>
                  <p className="text-theme-text-secondary text-xs font-semibold">Set coordinates to start receiving dispatches</p>
                </div>

                <form onSubmit={handleConfirmLocation} className="space-y-5">
                  {errorText && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs py-2.5 px-4 rounded-xl border border-rose-500/20 font-semibold text-center">
                      {errorText}
                    </div>
                  )}

                  <motion.button
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetecting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                    <span>{isDetecting ? 'Detecting GPS Location...' : 'Use Browser Geolocation'}</span>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Latitude</label>
                      <motion.input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="13.0827"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                        className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/20 transition-all rounded-xl text-sm transition outline-none font-mono text-theme-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Longitude</label>
                      <motion.input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="80.2707"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                        className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/20 transition-all rounded-xl text-sm transition outline-none font-mono text-theme-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-2 uppercase">Preset Coordinates (Quick Test)</span>
                    <div className="flex flex-wrap gap-2">
                      {['Chennai', 'Coimbatore', 'Mumbai'].map((city) => {
                        const latLngs: Record<string, [string, string]> = {
                          Chennai: ['13.0827', '80.2707'],
                          Coimbatore: ['11.0168', '76.9558'],
                          Mumbai: ['19.0760', '72.8777']
                        };
                        return (
                          <motion.button
                            key={city}
                            type="button"
                            onClick={() => setPreset(latLngs[city][0], latLngs[city][1])}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-semibold text-theme-text-secondary cursor-pointer border border-theme-border"
                          >
                            {city}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-[#00C896] hover:bg-[#00b384] text-slate-950 font-black rounded-xl text-[14px] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Check className="w-4.5 h-4.5" strokeWidth={3} />
                    <span>Confirm & Go Online</span>
                  </motion.button>
                </form>
              </div>
            )}

            {/* OTP VERIFICATION VIEW */}
            {!isLoggedIn && showingOTP && !showingLocationSetup && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-955/20 rounded-2xl flex items-center justify-center border border-[#00C896]/30">
                    <Shield className="w-6 h-6 text-[#00C896]" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-text-primary tracking-tight">Verify Code</h2>
                  <p className="text-theme-text-secondary text-xs font-semibold">Enter SMS security verification code</p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  {errorText && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs py-2.5 px-4 rounded-xl border border-rose-500/20 font-semibold text-center">
                      {errorText}
                    </div>
                  )}

                  <div className="bg-emerald-955/10 border border-[#00C896]/30 rounded-2xl p-4 text-center">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-theme-text-secondary block mb-1 font-bold">SMS Gateway Simulator</span>
                    <span className="text-[13px] text-theme-text-primary font-bold block">
                      OTP Verification Code:{" "}
                      <motion.button
                        type="button"
                        onClick={() => setEnteredOTP(generatedOTP)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="font-mono text-xs text-indigo-455 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 transition-colors cursor-pointer inline-block mx-1 font-extrabold focus:outline-none"
                      >
                        {generatedOTP}
                      </motion.button>
                    </span>
                    <span className="text-[10px] text-theme-text-secondary block mt-1">(Click the code block to auto-populate)</span>
                  </div>

                  <div>
                    <motion.input
                      type="text"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={enteredOTP}
                      onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      whileFocus={{ scale: 1.02, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                      className="w-full text-center tracking-[1em] font-mono text-2xl px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/20 transition-all rounded-xl outline-none text-theme-text-primary"
                      id="auth-otp-input"
                      autoFocus
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    id="auth-otp-submit-btn"
                    className="w-full py-3.5 bg-[#00C896] hover:bg-[#00b384] text-slate-950 font-black rounded-xl text-[14px] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Check className="w-4.5 h-4.5" strokeWidth={3} />
                    <span>Verify & Continue</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowingOTP(false);
                      setErrorText('');
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-center text-xs text-theme-text-secondary hover:text-theme-text-primary font-bold cursor-pointer transition py-1"
                  >
                    ← Back to login details
                  </motion.button>
                </form>
              </div>
            )}

            {/* RIDER FAIRNESS AGREEMENT VIEW */}
            {!isLoggedIn && showingAgreement && !showingOTP && !showingLocationSetup && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-[#00C896]/30">
                    <Scale className="w-6 h-6 text-[#00C896]" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-text-primary tracking-tight">Fairness Agreement</h3>
                  <p className="text-xs text-theme-text-secondary">Please review and accept before continuing</p>
                </div>

                <div className="bg-theme-input-bg border border-theme-border/80 p-5 rounded-2xl space-y-4 shadow-sm">
                  {[
                    "I will treat my driver with respect and dignity.",
                    "I will pay the locked fare digitally — no cash, no haggling.",
                    "I will not request unsafe maneuvers or speeding.",
                    "I understand fares are transparent and never surge.",
                    "Disputes will be raised through the in-app dispute flow only."
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-left">
                      <div className="w-5 h-5 rounded-full bg-emerald-55 dark:bg-[#00C896]/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200 dark:border-[#00C896]/20">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00C896]" strokeWidth={3.5} />
                      </div>
                      <span className="text-[13.5px] text-theme-text-primary font-bold leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[11px] text-theme-text-secondary font-semibold">
                  Review the complete{' '}
                  <button 
                    type="button"
                    onClick={() => setActiveModalPolicy('ride')} 
                    className="text-emerald-600 dark:text-[#00C896] hover:underline font-bold cursor-pointer"
                  >
                    Ride Policy
                  </button>{' '}
                  and{' '}
                  <button 
                    type="button"
                    onClick={() => setActiveModalPolicy('user')} 
                    className="text-emerald-600 dark:text-[#00C896] hover:underline font-bold cursor-pointer"
                  >
                    User Agreement
                  </button>.
                </div>

                <motion.button
                  onClick={handleAcceptAgreement}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-[#00C896] hover:bg-[#00b384] text-slate-950 font-black rounded-xl text-[14px] flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-400/10"
                >
                  <Check className="w-4.5 h-4.5" strokeWidth={3} />
                  <span>I Accept & Agree</span>
                </motion.button>
              </div>
            )}

            {/* RIDER PROFILE WIZARD VIEW */}
            {!isLoggedIn && showingProfileWizard && !showingAgreement && !showingOTP && !showingLocationSetup && (
              <div className="space-y-6 relative max-h-[60vh] overflow-y-auto pr-1">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-indigo-950/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <User className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-text-primary tracking-tight">Rider Safety & Preferences Wizard</h3>
                  <p className="text-xs text-theme-text-secondary">Configure safety modes and medical details for emergency pre-arrival alerts</p>
                </div>

                <div className="space-y-4 text-xs text-theme-text-secondary">
                  {/* Age & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Age</label>
                      <motion.input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(parseInt(e.target.value) || 26)}
                        whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                        className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Gender</label>
                      <motion.select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                        className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1 cursor-pointer"
                      >
                        <option value="Male" className="bg-theme-input-bg text-theme-text-primary">Male</option>
                        <option value="Female" className="bg-theme-input-bg text-theme-text-primary">Female</option>
                        <option value="Other" className="bg-theme-input-bg text-theme-text-primary">Other</option>
                      </motion.select>
                    </div>
                  </div>

                  {/* Guardian Details */}
                  <div className="border-t border-theme-border/80 pt-3 space-y-3">
                    <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-455" /> Guardian / Emergency Contact
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Guardian Name</label>
                        <motion.input 
                          type="text" 
                          value={guardianName} 
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="Name"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Guardian Relationship</label>
                        <motion.input 
                          type="text" 
                          value={guardianRelationship} 
                          onChange={(e) => setGuardianRelationship(e.target.value)}
                          placeholder="Spouse, Parent"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Guardian Phone</label>
                        <motion.input 
                          type="text" 
                          value={guardianPhone} 
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="+91 9444102938"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1 font-mono" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Details */}
                  <div className="border-t border-theme-border/80 pt-3 space-y-3">
                    <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-rose-500 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Emergency Medical Card
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Blood Group</label>
                        <motion.input 
                          type="text" 
                          value={bloodGroup} 
                          onChange={(e) => setBloodGroup(e.target.value)}
                          placeholder="O+"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Preferred Hospital</label>
                        <motion.input 
                          type="text" 
                          value={preferredHospital} 
                          onChange={(e) => setPreferredHospital(e.target.value)}
                          placeholder="Apollo Hospital"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Allergies</label>
                        <motion.input 
                          type="text" 
                          value={allergies} 
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="Penicillin, Nuts, None"
                          whileFocus={{ scale: 1.02, boxShadow: "0 0 12px rgba(99,102,241,0.25)" }}
                          className="w-full bg-theme-input-bg/40 border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all font-semibold mt-1" 
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-4 mt-2 bg-theme-input-bg/30 p-2.5 rounded-xl border border-theme-border/50">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <motion.input
                            type="checkbox"
                            checked={asthma}
                            onChange={(e) => setAsthma(e.target.checked)}
                            className="rounded text-rose-500 focus:ring-rose-500 bg-theme-input-bg border-theme-border w-4 h-4 cursor-pointer"
                          />
                          <span className="font-semibold text-theme-text-primary">Asthma</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <motion.input
                            type="checkbox"
                            checked={diabetes}
                            onChange={(e) => setDiabetes(e.target.checked)}
                            className="rounded text-rose-500 focus:ring-rose-500 bg-theme-input-bg border-theme-border w-4 h-4 cursor-pointer"
                          />
                          <span className="font-semibold text-theme-text-primary">Diabetes</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Accessibility Preferences */}
                  <div className="border-t border-theme-border/80 pt-3 space-y-3">
                    <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-violet-400 flex items-center gap-1">
                      <Accessibility className="w-3.5 h-3.5 text-violet-400" /> Accessibility Support
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'Senior Citizen', label: 'Senior Citizen (Large text & high contrast UI)' },
                        { id: 'Child', label: 'Child Mode (Guardian monitoring & pickup code)' },
                        { id: 'Wheelchair User', label: 'Wheelchair User (Prioritize accessible vehicles)' },
                        { id: 'Visually Impaired', label: 'Visually Impaired (Voice guidance & synthesis)' },
                        { id: 'Hearing Impaired', label: 'Hearing Impaired (Visual alerts & flashing notifications)' }
                      ].map(option => {
                        const isChecked = accessibilityRequirements.includes(option.id);
                        return (
                          <label key={option.id} className="flex items-center gap-2 p-2 bg-theme-input-bg/30 rounded-lg cursor-pointer hover:bg-theme-hover-bg border border-theme-border/50">
                            <motion.input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setAccessibilityRequirements(prev => 
                                  prev.includes(option.id) ? prev.filter(x => x !== option.id) : [...prev, option.id]
                                );
                              }}
                              className="rounded text-indigo-500 focus:ring-indigo-500 bg-theme-input-bg border-theme-border w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-theme-text-secondary">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleFinishWizard}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-[#00C896] hover:bg-[#00b384] text-slate-950 font-black rounded-xl text-[14px] flex items-center justify-center gap-2 transition cursor-pointer shadow-sm mt-4"
                >
                  <Check className="w-4.5 h-4.5" strokeWidth={3} />
                  <span>Complete Secure Setup</span>
                </motion.button>
              </div>
            )}

            {/* MAIN LOGIN VIEW */}
            {!isLoggedIn && !showingOTP && !showingAgreement && !showingLocationSetup && !showingProfileWizard && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-theme-text-primary tracking-tight">Welcome to ZipRide</h2>
                  <p className="text-theme-text-secondary text-xs font-semibold">Sign in to initialize secure operations.</p>
                </div>

                {/* Segmented Toggle Role Selector */}
                <div className="flex bg-theme-input-bg/60 p-1 rounded-2xl border border-theme-border/60">
                  <motion.button
                    type="button"
                    onClick={() => setRole('rider')}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                      role === 'rider'
                        ? 'bg-[#00C896] text-slate-950 shadow-md shadow-[#00C896]/15'
                        : 'text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                  >
                    I'm a Rider
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setRole('driver')}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                      role === 'driver'
                        ? 'bg-[#00C896] text-slate-950 shadow-md shadow-[#00C896]/15'
                        : 'text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                  >
                    I'm a Driver
                  </motion.button>
                </div>

                {/* Previously Logged In Accounts Selector */}
                {savedAccounts.filter(acc => acc.role === role).length > 0 && (
                  <div className="bg-theme-input-bg/30 border border-theme-border/60 p-3.5 rounded-2xl space-y-2">
                    <label className="block text-[9px] font-bold tracking-wider text-theme-text-secondary uppercase">
                      Previously Logged In Accounts
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {savedAccounts
                        .filter(acc => acc.role === role)
                        .map((acc, idx) => (
                          <motion.button
                            key={idx}
                            type="button"
                            onClick={() => handleSavedAccountSelect(acc)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-card hover:border-[#00C896] text-theme-text-primary text-[11px] font-bold cursor-pointer transition duration-150"
                          >
                            <User className="w-3.5 h-3.5 text-[#00C896] shrink-0" />
                            <span>{acc.name}</span>
                          </motion.button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Login Method Tabs */}
                {role === 'rider' && (
                  <div className="flex border-b border-theme-border/80">
                    {[
                      { id: 'email', label: 'Email', icon: Mail },
                      { id: 'mobile', label: 'Mobile', icon: Smartphone },
                      { id: 'google', label: 'Google', icon: () => <span className="font-mono font-extrabold text-xs">G</span> }
                    ].map((tab) => {
                      const isSel = loginMethod === tab.id;
                      const Icon = tab.icon;
                      return (
                        <motion.button
                          key={tab.id}
                          type="button"
                          onClick={() => setLoginMethod(tab.id as any)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSel ? 'border-[#00C896] text-[#00C896]' : 'border-transparent text-theme-text-secondary hover:text-theme-text-secondary'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Form container */}
                <form onSubmit={handleSendOTP} className="space-y-4">
                  {errorText && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs py-2.5 px-4 rounded-xl border border-rose-500/20 font-semibold text-center animate-shake">
                      {errorText}
                    </div>
                  )}

                  {/* Driver preset Autofill dropdown */}
                  {role === 'driver' && drivers && drivers.length > 0 && (
                    <div className="bg-theme-input-bg/30 border border-theme-border p-3 rounded-2xl space-y-1.5">
                      <label className="block text-[9px] font-bold tracking-wider text-theme-text-secondary uppercase">Autofill Preset Driver</label>
                      <motion.select
                        onChange={(e) => handleDriverSelect(e.target.value)}
                        defaultValue=""
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 10px rgba(0,200,150,0.15)" }}
                        className="w-full bg-theme-input-bg border border-theme-border px-3 py-2 rounded-xl text-xs outline-none text-theme-text-secondary font-semibold cursor-pointer"
                      >
                        <option value="" className="bg-theme-input-bg">Select a registered driver...</option>
                        {drivers.map(drv => (
                          <option key={drv.id} value={drv.id} className="bg-theme-input-bg">{drv.name} ({drv.vehicleType})</option>
                        ))}
                      </motion.select>
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Full Name</label>
                      <motion.input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                        className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 text-theme-text-primary placeholder-theme-text-secondary rounded-xl text-sm transition outline-none font-semibold"
                        id="auth-fullName-input"
                      />
                    </div>

                    {/* Email inputs */}
                    {role === 'rider' && loginMethod === 'email' && (
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Email Address</label>
                        <motion.input
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="arul@zipride.com"
                          whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                          className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 text-theme-text-primary placeholder-theme-text-secondary rounded-xl text-sm transition outline-none font-semibold font-mono"
                        />
                      </div>
                    )}

                    {/* Mobile Phone Input */}
                    {(role === 'driver' || loginMethod === 'mobile') && (
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Mobile Number</label>
                        <div className="relative flex">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold border-r border-theme-border pr-3 font-mono">
                            +91
                          </span>
                          <motion.input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="9876543210"
                            whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                            className="w-full pl-16 pr-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 text-theme-text-primary placeholder-theme-text-secondary rounded-xl text-sm transition outline-none font-mono font-bold tracking-wide"
                            id="auth-phoneNumber-input"
                          />
                        </div>
                      </div>
                    )}

                    {/* Google account helper */}
                    {role === 'rider' && loginMethod === 'google' && (
                      <div className="bg-theme-input-bg/30 border border-theme-border/40 p-4 rounded-xl text-center text-xs text-theme-text-secondary font-semibold">
                        Authentication will verify using your device's primary Google account.
                      </div>
                    )}

                    {/* Vehicle details (Driver Only) */}
                    {role === 'driver' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Vehicle Type</label>
                          <motion.select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value as any)}
                            whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                            className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 rounded-xl text-sm outline-none text-theme-text-primary font-semibold cursor-pointer"
                          >
                            <option value="Bike" className="bg-theme-input-bg">Bike</option>
                            <option value="Auto" className="bg-theme-input-bg">Auto</option>
                            <option value="Cab" className="bg-theme-input-bg">Cab</option>
                          </motion.select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Vehicle Number</label>
                          <motion.input
                            type="text"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                            placeholder="e.g. TN-09-AB-1234"
                            whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                            className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 text-theme-text-primary placeholder-theme-text-secondary rounded-xl text-sm outline-none font-mono font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Password Input */}
                    {loginMethod !== 'google' && (
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider text-theme-text-secondary mb-1.5 uppercase">Password</label>
                        <motion.input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          whileFocus={{ scale: 1.01, boxShadow: "0 0 15px rgba(0, 200, 150, 0.25)" }}
                          className="w-full px-4 py-3 bg-theme-input-bg/40 border border-theme-border focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/15 focus:bg-theme-input-bg/40 text-theme-text-primary placeholder-theme-text-secondary rounded-xl text-sm transition outline-none font-semibold font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Transforming Ride themed button */}
                  {credsComplete ? (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 200, 150, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      id="auth-login-submit-btn"
                      className="w-full py-4 bg-gradient-to-r from-[#00C896] to-emerald-500 hover:from-[#00b384] hover:to-emerald-600 text-slate-950 font-black rounded-2xl text-[14px] flex items-center justify-center gap-2 tracking-widest transition shadow-lg cursor-pointer mt-6 uppercase border border-[#00C896]/30 font-bold"
                    >
                      <span>START YOUR RIDE 🏍️</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      id="auth-login-submit-btn"
                      className="w-full py-4 bg-slate-900 border border-theme-border text-slate-500 font-bold rounded-2xl text-[14px] flex items-center justify-center gap-2 tracking-wide transition shadow-sm cursor-pointer mt-6 animate-pulse"
                    >
                      <span>LOGIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </form>

                <div className="pt-4 border-t border-theme-border flex flex-col gap-2">
                  <motion.button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/admin/reset-demo', { method: 'POST' });
                      } catch (e) {
                        console.error("Database reset failed:", e);
                      }
                      SessionResetService.resetLocalData();
                      window.location.reload();
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-theme-input-bg/60 hover:bg-slate-900 text-theme-text-secondary font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-theme-border"
                  >
                    <span>Start Fresh Demo</span>
                  </motion.button>
                </div>

                 <div className="text-center text-[10.5px] text-theme-text-secondary pt-3 mt-3 border-t border-theme-border/60">
                  By logging in, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModalPolicy('fare')}
                    className="text-emerald-600 dark:text-[#00C896] hover:underline font-bold cursor-pointer"
                  >
                    Fare Policy
                  </button>,{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModalPolicy('ride')}
                    className="text-emerald-600 dark:text-[#00C896] hover:underline font-bold cursor-pointer"
                  >
                    Ride Policy
                  </button>, and{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModalPolicy('user')}
                    className="text-emerald-600 dark:text-[#00C896] hover:underline font-bold cursor-pointer"
                  >
                    User Agreement
                  </button>.
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-5 mt-5 border-t border-theme-border font-sans">
                  <Shield className="w-4 h-4 text-[#00C896]" />
                  <span className="font-semibold">Secured by ZipRide Cryptography Gate</span>
                </div>
              </div>
            )}

            {/* POLICY MODAL OVERLAY */}
            <AnimatePresence>
              {activeModalPolicy && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setActiveModalPolicy(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-theme-border pb-3">
                      <div className="flex items-center gap-2">
                        {activeModalPolicy === 'fare' && <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-[#00C896]" />}
                        {activeModalPolicy === 'ride' && <Shield className="w-5 h-5 text-emerald-600 dark:text-[#00C896]" />}
                        {activeModalPolicy === 'user' && <Scale className="w-5 h-5 text-indigo-500" />}
                        <h3 className="text-base font-bold text-theme-text-primary uppercase tracking-wide">
                          {activeModalPolicy === 'fare' && 'Fare Policy Summary'}
                          {activeModalPolicy === 'ride' && 'Ride Safety Policy'}
                          {activeModalPolicy === 'user' && 'User Agreement'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveModalPolicy(null)}
                        className="p-1 rounded-lg hover:bg-theme-input-bg text-theme-text-secondary hover:text-theme-text-primary transition cursor-pointer font-bold text-xs"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-theme-text-secondary">
                      {activeModalPolicy === 'fare' && (
                        <div className="space-y-3">
                          <p className="text-theme-text-primary font-bold">
                            ZipRide offers transparent pricing pre-calculated on verified environmental variables. Surge pricing is strictly capped.
                          </p>
                          <div className="space-y-2 font-semibold">
                            <div className="flex justify-between border-b border-theme-border pb-1 text-theme-text-primary">
                              <span>Base Dispatch Fare</span>
                              <span>₹20.00</span>
                            </div>
                            <div className="flex justify-between border-b border-theme-border pb-1 text-theme-text-primary">
                              <span>Distance Charge</span>
                              <span>₹12.00 / km</span>
                            </div>
                            <div className="flex justify-between border-b border-theme-border pb-1 text-theme-text-primary">
                              <span>Commute Duration Cost</span>
                              <span>₹1.50 / min</span>
                            </div>
                          </div>
                          <p>
                            Surcharges are automatically adjusted based on dynamic weather parameters (+₹10 to +₹50 base fee) and traffic multipliers (1.1x to 1.5x max coefficient). Safe driving refunds are applied instantly for G-force stops and speeding.
                          </p>
                        </div>
                      )}

                      {activeModalPolicy === 'ride' && (
                        <div className="space-y-3">
                          <p className="text-theme-text-primary font-bold">
                            Safety is our core objective. Both riders and pilots must adhere to safety compliance rules.
                          </p>
                          <ul className="list-disc pl-4 space-y-2 font-medium">
                            <li><strong className="text-theme-text-primary">OTP Verification:</strong> Verify pilot registration details and vehicle plate number before giving the security OTP.</li>
                            <li><strong className="text-theme-text-primary">Maneuver Rules:</strong> Do not request speeding or dangerous driving stunts. Pilots are legally instructed to reject illegal requests.</li>
                            <li><strong className="text-theme-text-primary">Live Monitoring:</strong> Active route coordinates are tracked. Deviations alert safety desks immediately.</li>
                            <li><strong className="text-theme-text-primary">Emergency Support:</strong> Tap the SOS icon to alert PCR control rooms and emergency medical networks.</li>
                          </ul>
                        </div>
                      )}

                      {activeModalPolicy === 'user' && (
                        <div className="space-y-3">
                          <p className="text-theme-text-primary font-bold">
                            Your account access is conditioned on compliance with our code of conduct:
                          </p>
                          <ul className="list-decimal pl-4 space-y-2 font-medium font-semibold">
                            <li><strong className="text-theme-text-primary">Respect & Safety:</strong> Verbal abuse or aggressive behaviour towards pilots results in permanent ban.</li>
                            <li><strong className="text-theme-text-primary">Digital-Only Settlement:</strong> Fares must be paid digitally. Cash negotiations or driver tip extortion are strictly prohibited.</li>
                            <li><strong className="text-theme-text-primary">Resolution Flow:</strong> Dispute coordinates and fares only through the in-app dispute panel. Offline side settlements are invalid.</li>
                            <li><strong className="text-theme-text-primary">Telemetry Authorization:</strong> ZipRide is authorized to log telemetry coordinates during active trips for safety and compliance.</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveModalPolicy(null)}
                      className="w-full py-2.5 bg-[#00C896] hover:bg-[#00b384] text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                    >
                      Acknowledge & Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
