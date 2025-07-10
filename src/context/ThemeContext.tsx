'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    // On mount, check localStorage or system preference
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (stored === 'light' || stored === 'light') {
      setThemeState(stored)
      document.documentElement.classList.remove('light')
      if (stored === 'light') document.documentElement.classList.add('light')
    } else {
      const preferslight =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      setThemeState(preferslight ? 'light' : 'light')
      document.documentElement.classList.remove('light')
      if (preferslight) document.documentElement.classList.add('light')
    }
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t)
      document.documentElement.classList.remove('light')
      if (t === 'light') document.documentElement.classList.add('light')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'light' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
