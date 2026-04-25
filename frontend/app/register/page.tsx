'use client'

import React, { useState } from 'react'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    department: '',
    departmentNumber: '',
    yearOfStudy: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const yearOptions = [
    { value: '1', label: 'שנה א\'' },
    { value: '2', label: 'שנה ב\'' },
    { value: '3', label: 'שנה ג\'' },
    { value: '4', label: 'שנה ד\'' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateEmail = (email: string): boolean => email.endsWith('@post.bgu.ac.il')

  const validateForm = (): boolean => {
    if (!formData.email || !formData.username || !formData.fullName || !formData.password || !formData.department || !formData.departmentNumber || !formData.yearOfStudy) {
      setError('נא למלא את כל השדות החובה')
      return false
    }
    if (!validateEmail(formData.email)) {
      setError('יש להשתמש במייל אוניברסיטאי: @post.bgu.ac.il')
      return false
    }
    if (formData.password.length < 6) {
      setError('הסיסמה צריכה להכיל לפחות 6 תווים')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return false
    }
    const deptNum = parseInt(formData.departmentNumber)
    if (isNaN(deptNum) || deptNum < 1) {
      setError('מספר מחלקה חייב להיות מספר חיובי')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        department: formData.department,
        department_number: parseInt(formData.departmentNumber),
        year_in_degree: parseInt(formData.yearOfStudy),
      })
      console.log('Registration successful')
      setSuccess(true)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('שגיאה ברישום. אנא נסה שנית.')
      }
      setIsLoading(false)
    }
  }

  const floatingIcons = [
    { emoji: '📚', x: '3%',  delay: '-8s',  duration: '30s', size: '2.6rem', opacity: 0.3  },
    { emoji: '✏️', x: '10%', delay: '-20s', duration: '34s', size: '2.2rem', opacity: 0.26 },
    { emoji: '🎓', x: '18%', delay: '-5s',  duration: '32s', size: '2.9rem', opacity: 0.28 },
    { emoji: '💡', x: '26%', delay: '-15s', duration: '36s', size: '2.4rem', opacity: 0.25 },
    { emoji: '⭐', x: '34%', delay: '-2s',  duration: '28s', size: '2.1rem', opacity: 0.27 },
    { emoji: '📝', x: '42%', delay: '-18s', duration: '33s', size: '2.6rem', opacity: 0.25 },
    { emoji: '🔬', x: '50%', delay: '-10s', duration: '31s', size: '2.3rem', opacity: 0.27 },
    { emoji: '🧠', x: '58%', delay: '-25s', duration: '35s', size: '2.8rem', opacity: 0.25 },
    { emoji: '📖', x: '66%', delay: '-7s',  duration: '30s', size: '2.5rem', opacity: 0.27 },
    { emoji: '🏆', x: '74%', delay: '-13s', duration: '33s', size: '2.2rem', opacity: 0.25 },
    { emoji: '🔭', x: '82%', delay: '-3s',  duration: '36s', size: '2.7rem', opacity: 0.27 },
    { emoji: '📐', x: '90%', delay: '-22s', duration: '32s', size: '2.4rem', opacity: 0.25 },
    { emoji: '🎯', x: '7%',  delay: '-16s', duration: '31s', size: '2.3rem', opacity: 0.26 },
    { emoji: '📊', x: '55%', delay: '-11s', duration: '34s', size: '2.5rem', opacity: 0.25 },
    { emoji: '🔑', x: '78%', delay: '-19s', duration: '30s', size: '2.2rem', opacity: 0.26 },
    { emoji: '🧪', x: '95%', delay: '-6s',  duration: '33s', size: '2.4rem', opacity: 0.25 },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    direction: 'rtl',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.35rem',
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
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
        .reg-input::placeholder { color: #94a3b8; }
        .reg-input:focus {
          outline: none;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
          background: #fff !important;
        }
        .reg-select:focus {
          outline: none;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
          background: #fff !important;
        }
      `}</style>

      {/* Floating icons */}
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

      {/* Desk illustration — bottom left background */}
      <svg
        viewBox="0 0 1000 560"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'fixed', bottom: 0, left: 0,
          width: '55%', height: 'auto',
          pointerEvents: 'none', zIndex: 1, opacity: 0.7,
        }}
      >
        <circle cx="480" cy="90" r="58" fill="#1e3a8a" />
        <circle cx="480" cy="90" r="50" fill="#2563eb" />
        <circle cx="480" cy="90" r="44" fill="#1d4ed8" />
        <circle cx="480" cy="90" r="5" fill="white" />
        <line x1="480" y1="90" x2="480" y2="58" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="480" y1="90" x2="506" y2="102" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180
          return <line key={i} x1={480 + 38*Math.cos(rad)} y1={90 + 38*Math.sin(rad)} x2={480 + 43*Math.cos(rad)} y2={90 + 43*Math.sin(rad)} stroke="white" strokeWidth={i%3===0?2.5:1.5} opacity="0.7" />
        })}
        <rect x="95" y="40" width="150" height="130" rx="10" fill="#1e3a8a" />
        <rect x="95" y="40" width="150" height="40"  rx="10" fill="#2563eb" />
        <rect x="95" y="65" width="150" height="15"  fill="#2563eb" />
        <circle cx="135" cy="40" r="6" fill="#1e3a8a" />
        <circle cx="215" cy="40" r="6" fill="#1e3a8a" />
        {[0,1,2,3,4,5,6].map(col => [0,1,2,3].map(row => {
          const isX = col===0&&row===0
          const cx2 = 110+col*20, cy2 = 95+row*18
          return <g key={`${col}-${row}`}>
            <rect x={cx2-7} y={cy2-6} width="14" height="12" rx="2" fill={isX?'#ef4444':'#1e40af'} opacity={isX?0.9:0.7} />
            {isX && <><line x1={cx2-4} y1={cy2-3} x2={cx2+4} y2={cy2+3} stroke="white" strokeWidth="1.5" /><line x1={cx2+4} y1={cy2-3} x2={cx2-4} y2={cy2+3} stroke="white" strokeWidth="1.5" /></>}
          </g>
        }))}
        <rect x="60" y="355" width="860" height="22" rx="5" fill="#1e3a8a" />
        <rect x="60" y="371" width="860" height="8" rx="3" fill="#1e40af" opacity="0.5" />
        <line x1="130" y1="377" x2="90"  y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="220" y1="377" x2="260" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="100" y1="470" x2="250" y2="470" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" />
        <line x1="730" y1="377" x2="690" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="820" y1="377" x2="860" y2="510" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="700" y1="470" x2="850" y2="470" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" />
        <ellipse cx="195" cy="510" rx="80" ry="12" fill="#1e3a8a" opacity="0.3" />
        <line x1="195" y1="440" x2="195" y2="500" stroke="#1e3a8a" strokeWidth="12" strokeLinecap="round" />
        <line x1="195" y1="498" x2="130" y2="510" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="260" y2="510" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="155" y2="520" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="235" y2="520" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <line x1="195" y1="498" x2="195" y2="516" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
        <circle cx="130" cy="511" r="6" fill="#0f172a" /><circle cx="260" cy="511" r="6" fill="#0f172a" />
        <circle cx="155" cy="521" r="6" fill="#0f172a" /><circle cx="235" cy="521" r="6" fill="#0f172a" />
        <circle cx="195" cy="517" r="6" fill="#0f172a" />
        <rect x="120" y="415" width="155" height="35" rx="12" fill="#2563eb" />
        <rect x="108" y="380" width="18" height="50" rx="6" fill="#1d4ed8" />
        <rect x="269" y="380" width="18" height="50" rx="6" fill="#1d4ed8" />
        <rect x="128" y="270" width="140" height="155" rx="16" fill="#2563eb" />
        <rect x="148" y="252" width="100" height="30" rx="12" fill="#1d4ed8" />
        <rect x="448" y="305" width="20" height="52" rx="4" fill="#334155" />
        <rect x="418" y="352" width="80" height="8" rx="3" fill="#1e293b" />
        <rect x="320" y="155" width="240" height="158" rx="12" fill="#0f172a" />
        <rect x="328" y="163" width="224" height="140" rx="8" fill="#1e3a8a" />
        <defs>
          <linearGradient id="sg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="328" y="163" width="224" height="140" rx="8" fill="url(#sg2)" />
        <rect x="345" y="180" width="90"  height="7" rx="3" fill="#60a5fa" opacity="0.9" />
        <rect x="345" y="194" width="130" height="5" rx="2" fill="#93c5fd" opacity="0.5" />
        <rect x="345" y="205" width="100" height="5" rx="2" fill="#93c5fd" opacity="0.4" />
        <rect x="355" y="216" width="80"  height="5" rx="2" fill="#34d399" opacity="0.5" />
        <rect x="345" y="238" width="70"  height="5" rx="2" fill="#f87171" opacity="0.5" />
        <line x1="640" y1="349" x2="640" y2="220" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d="M640 220 Q660 190 690 175" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <ellipse cx="700" cy="172" rx="42" ry="18" fill="#1e3a8a" />
        <path d="M665 172 Q700 210 735 172" fill="#1d4ed8" />
        <ellipse cx="640" cy="357" rx="36" ry="8" fill="#1e3a8a" />
        <rect x="736" y="318" width="42" height="38" rx="7" fill="#1e293b" />
        <rect x="560" y="320" width="70" height="14" rx="3" fill="#1e40af" />
        <rect x="563" y="306" width="62" height="14" rx="3" fill="#2563eb" />
        <rect x="566" y="293" width="55" height="13" rx="3" fill="#1d4ed8" />
        <ellipse cx="460" cy="530" rx="440" ry="18" fill="#1e3a8a" opacity="0.12" />
      </svg>

      {/* ── REGISTER CARD ── centered, scrollable */}
      <div
        className="relative z-10 flex items-center justify-center min-h-screen py-8 px-4"
        style={{ paddingRight: '4%' }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            marginLeft: 'auto',
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem 3rem 2.25rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
            animation: 'fadeSlideUp 0.5s ease-out both',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Logo size="md" variant="dark" />
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '1.25rem' }} />

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
              יצירת משתמש חדש
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>הצטרף לפלטפורמת שיתוף הלימודים</p>
          </div>

          {/* Success */}
          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
            }}>
              <p style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.25rem' }}>הרישום בוצע בהצלחה!</p>
              <p style={{ color: '#166534', fontSize: '0.85rem' }}>נשלח אליך מייל לכתובת שהזנת עם קישור לאימות.</p>
              <p style={{ color: '#166534', fontSize: '0.85rem', fontWeight: '500' }}>אנא בדוק את תיבת הדואר שלך ולחץ על הקישור כדי לאמת את החשבון.</p>
              <p style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: '0.5rem' }}>לא קיבלת מייל? בדוק את תיקיית הספאם.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '0.75rem 1rem',
              color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Email */}
            <div>
              <label htmlFor="email" style={labelStyle}>
                אימייל אוניברסיטאי <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input id="email" name="email" type="email" value={formData.email}
                onChange={handleChange} placeholder="example@post.bgu.ac.il"
                required autoComplete="email" className="reg-input" style={inputStyle} />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                יש להשתמש במייל האוניברסיטאי שלך (@post.bgu.ac.il)
              </p>
            </div>

            {/* Full Name + Username — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="fullName" style={labelStyle}>
                  שם מלא <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="fullName" name="fullName" type="text" value={formData.fullName}
                  onChange={handleChange} placeholder="שמך המלא"
                  required autoComplete="name" className="reg-input" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="username" style={labelStyle}>
                  שם משתמש <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="username" name="username" type="text" value={formData.username}
                  onChange={handleChange} placeholder="3-50 תווים"
                  required minLength={3} maxLength={50} autoComplete="username"
                  className="reg-input" style={inputStyle} />
              </div>
            </div>

            {/* Password + Confirm — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="password" style={labelStyle}>
                  סיסמה <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="password" name="password" type="password" value={formData.password}
                  onChange={handleChange} placeholder="לפחות 6 תווים"
                  required minLength={6} autoComplete="new-password"
                  className="reg-input" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="confirmPassword" style={labelStyle}>
                  אימות סיסמה <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="הזן שנית"
                  required minLength={6} autoComplete="new-password"
                  className="reg-input" style={inputStyle} />
              </div>
            </div>

            {/* Department + Number — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="department" style={labelStyle}>
                  תואר לימוד <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="department" name="department" type="text" value={formData.department}
                  onChange={handleChange} placeholder="מדעי המחשב, הנדסה..."
                  required className="reg-input" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="departmentNumber" style={labelStyle}>
                  מס׳ מחלקה <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="departmentNumber" name="departmentNumber" type="number" min="1"
                  value={formData.departmentNumber} onChange={handleChange}
                  placeholder="401" required className="reg-input" style={inputStyle} />
              </div>
            </div>

            {/* Year of study */}
            <div>
              <label htmlFor="yearOfStudy" style={labelStyle}>
                שנת לימוד <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select id="yearOfStudy" name="yearOfStudy" value={formData.yearOfStudy}
                onChange={handleChange} required className="reg-select"
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">בחר שנת לימוד</option>
                {yearOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || success}
              style={{
                width: '100%', padding: '0.85rem',
                borderRadius: '10px',
                background: isLoading || success ? '#94a3b8' : '#2563eb',
                color: 'white', fontWeight: '700', fontSize: '0.95rem',
                border: 'none', cursor: isLoading || success ? 'not-allowed' : 'pointer',
                boxShadow: isLoading || success ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                transition: 'all 0.2s', marginTop: '0.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!isLoading && !success) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!isLoading && !success) { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  מבצע רישום...
                </>
              ) : 'הירשם'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '1rem 0' }}>
            <div style={{ borderTop: '1px solid #e2e8f0' }} />
            <span style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: 'white', padding: '0 0.75rem', color: '#94a3b8', fontSize: '0.8rem',
            }}>כבר יש לך משתמש?</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="/login" style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.88rem' }} className="hover:underline">
              התחבר כאן
            </a>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.75rem', color: '#cbd5e1', fontSize: '0.72rem' }}>
            אוניברסיטת בן-גוריון בנגב
          </div>
        </div>
      </div>
    </div>
  )
}
