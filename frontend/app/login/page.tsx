'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authAPI.login(username, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות. אנא נסה שנית.')
      setIsLoading(false)
    }
  }

  const floatingIcons = [
    { emoji: '📚', x: '3%',  delay: '-8s',  duration: '30s', size: '2.6rem', opacity: 0.35 },
    { emoji: '✏️', x: '10%', delay: '-20s', duration: '34s', size: '2.2rem', opacity: 0.3  },
    { emoji: '🎓', x: '18%', delay: '-5s',  duration: '32s', size: '2.9rem', opacity: 0.32 },
    { emoji: '💡', x: '26%', delay: '-15s', duration: '36s', size: '2.4rem', opacity: 0.28 },
    { emoji: '⭐', x: '34%', delay: '-2s',  duration: '28s', size: '2.1rem', opacity: 0.3  },
    { emoji: '📝', x: '42%', delay: '-18s', duration: '33s', size: '2.6rem', opacity: 0.28 },
    { emoji: '🔬', x: '50%', delay: '-10s', duration: '31s', size: '2.3rem', opacity: 0.3  },
    { emoji: '🧠', x: '58%', delay: '-25s', duration: '35s', size: '2.8rem', opacity: 0.28 },
    { emoji: '📖', x: '66%', delay: '-7s',  duration: '30s', size: '2.5rem', opacity: 0.3  },
    { emoji: '🏆', x: '74%', delay: '-13s', duration: '33s', size: '2.2rem', opacity: 0.28 },
    { emoji: '🔭', x: '82%', delay: '-3s',  duration: '36s', size: '2.7rem', opacity: 0.3  },
    { emoji: '📐', x: '90%', delay: '-22s', duration: '32s', size: '2.4rem', opacity: 0.28 },
  ]

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center"
      style={{ background: 'linear-gradient(180deg, #d6e8f7 0%, #c8dff2 100%)' }}
    >
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg);  opacity: 0; }
          5%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateY(-55vh) rotate(12deg); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-input:focus {
          outline: none;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
          background: #fff !important;
        }
      `}</style>

      {/* Floating study icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingIcons.map((icon, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: '-60px', left: icon.x,
            fontSize: icon.size, opacity: icon.opacity,
            animation: `floatUp ${icon.duration} linear ${icon.delay} infinite`,
          }}>
            {icon.emoji}
          </div>
        ))}
      </div>

      {/* ── DESK ILLUSTRATION — full background SVG ── */}
      <svg
        viewBox="0 0 1000 560"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '63%', height: 'auto',
          pointerEvents: 'none', zIndex: 1,
        }}
      >
        {/* Wall background shade */}
        <rect x="0" y="0" width="1000" height="380" fill="none" />

        {/* Clock on wall */}
        <circle cx="480" cy="90" r="58" fill="#1e3a8a" />
        <circle cx="480" cy="90" r="50" fill="#2563eb" />
        <circle cx="480" cy="90" r="44" fill="#1d4ed8" />
        {/* Clock face */}
        <circle cx="480" cy="90" r="5" fill="white" />
        {/* Hour hand */}
        <line x1="480" y1="90" x2="480" y2="58" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1="480" y1="90" x2="506" y2="102" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Clock ticks */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180
          const x1 = parseFloat((480 + 38 * Math.cos(rad)).toFixed(4))
          const y1 = parseFloat((90  + 38 * Math.sin(rad)).toFixed(4))
          const x2 = parseFloat((480 + 43 * Math.cos(rad)).toFixed(4))
          const y2 = parseFloat((90  + 43 * Math.sin(rad)).toFixed(4))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={i % 3 === 0 ? 2.5 : 1.5} opacity="0.7" />
        })}

        {/* Calendar on wall */}
        <rect x="95" y="40" width="150" height="130" rx="10" fill="#1e3a8a" />
        <rect x="95" y="40" width="150" height="40"  rx="10" fill="#2563eb" />
        <rect x="95" y="65" width="150" height="15"  fill="#2563eb" />
        {/* Calendar rings */}
        <circle cx="135" cy="40" r="6" fill="#1e3a8a" />
        <circle cx="215" cy="40" r="6" fill="#1e3a8a" />
        {/* Calendar grid */}
        {[0,1,2,3,4,5,6].map(col =>
          [0,1,2,3].map(row => {
            const isX = col === 0 && row === 0
            const cx = 110 + col * 20
            const cy = 95  + row * 18
            return (
              <g key={`${col}-${row}`}>
                <rect x={cx-7} y={cy-6} width="14" height="12" rx="2"
                  fill={isX ? '#ef4444' : '#1e40af'} opacity={isX ? 0.9 : 0.7} />
                {isX && <>
                  <line x1={cx-4} y1={cy-3} x2={cx+4} y2={cy+3} stroke="white" strokeWidth="1.5" />
                  <line x1={cx+4} y1={cy-3} x2={cx-4} y2={cy+3} stroke="white" strokeWidth="1.5" />
                </>}
              </g>
            )
          })
        )}

        {/* ── DESK SURFACE ── */}
        <rect x="60" y="355" width="860" height="22" rx="5" fill="#1e3a8a" />
        {/* Desk front edge shadow */}
        <rect x="60" y="371" width="860" height="8" rx="3" fill="#1e40af" opacity="0.5" />

        {/* ── DESK LEGS (A-frame style) ── */}
        {/* Left A-frame */}
        <line x1="130" y1="377" x2="90"  y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="220" y1="377" x2="260" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="100" y1="470" x2="250" y2="470" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" />
        {/* Right A-frame */}
        <line x1="730" y1="377" x2="690" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="820" y1="377" x2="860" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="700" y1="470" x2="850" y2="470" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" />

        {/* ── CHAIR ── */}
        {/* Chair base / legs */}
        <ellipse cx="195" cy="510" rx="80" ry="12" fill="#1e3a8a" opacity="0.3" />
        <line x1="195" y1="440" x2="195" y2="500" stroke="#1e3a8a" strokeWidth="12" strokeLinecap="round" />
        {/* Caster arms */}
        <line x1="195" y1="498" x2="130" y2="510" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="260" y2="510" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="155" y2="520" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="235" y2="520" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="195" y2="516" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        {/* Caster wheels */}
        <circle cx="130" cy="511" r="6" fill="#0f172a" />
        <circle cx="260" cy="511" r="6" fill="#0f172a" />
        <circle cx="155" cy="521" r="6" fill="#0f172a" />
        <circle cx="235" cy="521" r="6" fill="#0f172a" />
        <circle cx="195" cy="517" r="6" fill="#0f172a" />
        {/* Seat */}
        <rect x="120" y="415" width="155" height="35" rx="12" fill="#2563eb" />
        <rect x="122" y="417" width="151" height="18" rx="10" fill="#3b82f6" opacity="0.5" />
        {/* Armrests */}
        <rect x="108" y="380" width="18" height="50" rx="6" fill="#1d4ed8" />
        <rect x="269" y="380" width="18" height="50" rx="6" fill="#1d4ed8" />
        {/* Armrest pads */}
        <rect x="105" y="375" width="24" height="10" rx="4" fill="#1e3a8a" />
        <rect x="266" y="375" width="24" height="10" rx="4" fill="#1e3a8a" />
        {/* Chair back */}
        <rect x="128" y="270" width="140" height="155" rx="16" fill="#2563eb" />
        <rect x="135" y="278" width="126" height="139" rx="12" fill="#3b82f6" opacity="0.35" />
        {/* Back vertical lines */}
        <line x1="165" y1="285" x2="165" y2="415" stroke="#1d4ed8" strokeWidth="2" opacity="0.5" />
        <line x1="198" y1="285" x2="198" y2="415" stroke="#1d4ed8" strokeWidth="2" opacity="0.5" />
        <line x1="231" y1="285" x2="231" y2="415" stroke="#1d4ed8" strokeWidth="2" opacity="0.5" />
        {/* Headrest */}
        <rect x="148" y="252" width="100" height="30" rx="12" fill="#1d4ed8" />

        {/* ── MONITOR ── */}
        {/* Monitor stand */}
        <rect x="448" y="305" width="20" height="52" rx="4" fill="#334155" />
        <rect x="418" y="352" width="80" height="8"  rx="3" fill="#1e293b" />
        {/* Monitor body */}
        <rect x="320" y="155" width="240" height="158" rx="12" fill="#0f172a" />
        <rect x="328" y="163" width="224" height="140" rx="8"  fill="#1e3a8a" />
        {/* Screen glow */}
        <rect x="328" y="163" width="224" height="140" rx="8" fill="url(#screenGrad)" />
        <defs>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Screen content - code lines */}
        <rect x="345" y="180" width="90"  height="7" rx="3" fill="#60a5fa" opacity="0.9" />
        <rect x="345" y="194" width="130" height="5" rx="2" fill="#93c5fd" opacity="0.5" />
        <rect x="345" y="205" width="100" height="5" rx="2" fill="#93c5fd" opacity="0.4" />
        <rect x="355" y="216" width="80"  height="5" rx="2" fill="#34d399" opacity="0.5" />
        <rect x="355" y="227" width="110" height="5" rx="2" fill="#93c5fd" opacity="0.4" />
        <rect x="345" y="238" width="70"  height="5" rx="2" fill="#f87171" opacity="0.5" />
        <rect x="345" y="249" width="120" height="5" rx="2" fill="#93c5fd" opacity="0.4" />
        <rect x="345" y="260" width="85"  height="5" rx="2" fill="#60a5fa" opacity="0.6" />
        {/* Cursor */}
        <rect x="448" y="180" width="3"   height="10" rx="1" fill="white" opacity="0.9" />
        {/* Monitor camera dot */}
        <circle cx="440" cy="167" r="3" fill="#334155" />

        {/* ── KEYBOARD ── */}
        <rect x="350" y="358" width="180" height="14" rx="4" fill="#334155" />
        <rect x="353" y="360" width="174" height="8"  rx="3" fill="#475569" opacity="0.6" />
        {[0,1,2,3,4,5,6,7,8,9].map(i =>
          <rect key={i} x={358 + i * 17} y={362} width="12" height="4" rx="1" fill="#1e293b" />
        )}

        {/* ── LAMP ── */}
        {/* Lamp base */}
        <ellipse cx="640" cy="357" rx="36" ry="8" fill="#1e3a8a" />
        {/* Lamp pole */}
        <line x1="640" y1="349" x2="640" y2="220" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Lamp arm bend */}
        <path d="M640 220 Q660 190 690 175" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Lamp head */}
        <ellipse cx="700" cy="172" rx="42" ry="18" fill="#1e3a8a" />
        <path d="M665 172 Q700 210 735 172" fill="#1d4ed8" />
        {/* Light cone */}
        <path d="M665 178 Q640 310 720 320 Q760 315 735 178" fill="#fbbf24" opacity="0.06" />

        {/* ── COFFEE MUG ── */}
        <rect x="736" y="318" width="42" height="38" rx="7" fill="#1e293b" />
        <rect x="738" y="320" width="38" height="14" rx="4" fill="#2563eb" opacity="0.4" />
        <path d="M778 330 Q794 330 794 342 Q794 354 778 354" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        {/* Steam */}
        <path d="M748 314 Q752 304 748 294" fill="none" stroke="#94a3b8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        <path d="M758 314 Q762 302 758 292" fill="none" stroke="#94a3b8" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
        <path d="M768 314 Q772 305 768 296" fill="none" stroke="#94a3b8" strokeWidth="2.5" opacity="0.45" strokeLinecap="round" />

        {/* ── BOOKS stack ── */}
        <rect x="560" y="320" width="70" height="14" rx="3" fill="#1e40af" />
        <rect x="563" y="306" width="62" height="14" rx="3" fill="#2563eb" />
        <rect x="566" y="293" width="55" height="13" rx="3" fill="#1d4ed8" />
        <rect x="569" y="281" width="48" height="12" rx="3" fill="#3b82f6" />
        <line x1="570" y1="281" x2="570" y2="293" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />
        <line x1="573" y1="293" x2="573" y2="306" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />
        <line x1="576" y1="306" x2="576" y2="320" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" />

        {/* Floor shadow */}
        <ellipse cx="460" cy="530" rx="440" ry="18" fill="#1e3a8a" opacity="0.12" />
      </svg>

      {/* ── LOGIN CARD ── positioned right side */}
      <div className="relative z-10" style={{ marginRight: '2%', marginLeft: 'auto', width: '30%', minWidth: '380px' }}>
        <div
          style={{
            width: '100%',
            background: 'white',
            borderRadius: '20px',
            padding: '3.5rem 2.5rem 3.25rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
            animation: 'fadeSlideUp 0.5s ease-out both',
          }}
        >
          {/* Logo at top */}
          <div className="flex justify-center mb-5">
            <Logo size="md" variant="dark" />
          </div>

          {/* Divider after logo */}
          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '1.25rem' }} />

          {/* Error */}
          {error && (
            <div style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.75rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Welcome */}
          <div className="text-center mb-5">
            <h1 style={{ fontSize: '1.9rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em', marginBottom: '0.25rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
              ברוכים הבאים
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>התחבר כדי לגשת לפלטפורמת הלימוד</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
            {/* Username */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', pointerEvents: 'none',
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="שם משתמש"
                required
                autoComplete="username"
                className="login-input"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.9rem 2.8rem 0.9rem 1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a', fontSize: '0.95rem',
                  transition: 'all 0.2s', direction: 'rtl',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', pointerEvents: 'none',
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                required
                autoComplete="current-password"
                className="login-input"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.9rem 2.8rem 0.9rem 1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a', fontSize: '0.95rem',
                  transition: 'all 0.2s', direction: 'rtl',
                }}
              />
            </div>

            {/* Forgot */}
            <div style={{ textAlign: 'right' }}>
              <a href="/forgot-password" style={{ color: '#3b82f6', fontSize: '0.82rem' }} className="hover:underline">
                שכחתי סיסמה
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '0.95rem',
                borderRadius: '10px',
                background: isLoading ? '#94a3b8' : '#2563eb',
                color: 'white', fontWeight: '700', fontSize: '0.95rem',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  מתחבר...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  התחבר לחשבון
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '1rem 0' }}>
            <div style={{ borderTop: '1px solid #e2e8f0', width: '100%' }} />
            <span style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: 'white', padding: '0 0.75rem', color: '#94a3b8', fontSize: '0.8rem',
            }}>או</span>
          </div>

          {/* Register */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>אין לך חשבון? </span>
            <a href="/register" style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.85rem' }} className="hover:underline">
              הרשמה עכשיו
            </a>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#cbd5e1', fontSize: '0.72rem' }}>
            אוניברסיטת בן-גוריון בנגב
          </div>
        </div>
      </div>
    </div>
  )
}
