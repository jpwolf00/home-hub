'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SystemHealthBar from './SystemHealthBar'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/server', label: 'Servers' },
    { href: '/kanban', label: 'Kanban' },
  ]

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a0 01-1 1 1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Home Hub</h1>
          <p className="text-xs text-white/50">Always on</p>
        </div>
      </div>

      {/* System Health Bar - Desktop */}
      <div className="hidden md:block">
        <SystemHealthBar />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href
                ? 'bg-sky-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors md:hidden"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 right-4 bg-slate-800 rounded-lg shadow-xl border border-white/10 p-2 md:hidden z-50">
          <div className="px-3 py-2 border-b border-white/10 mb-2">
            <SystemHealthBar />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm ${
                pathname === link.href
                  ? 'bg-sky-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
