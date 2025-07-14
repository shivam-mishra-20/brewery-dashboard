'use client'

import { useRouter } from 'next/navigation'
import React, { Suspense, useState } from 'react'

// This is the main page component
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoadingFallback />}>
      <SignupForm />
    </Suspense>
  )
}

// Loading fallback component
function SignupLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Client component with useSearchParams safely inside
function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')
      setSuccess('Account created! Redirecting...')
      localStorage.setItem('token', data.token)
      setTimeout(() => router.replace('/dashboard'), 1200)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Foreground content */}
        <div
          className="absolute inset-0 bg-blend-multiply  bg-[#000000a5] w-full h-full z-0 bg-center bg-cover"
          style={{
            backgroundImage:
              "url('https://plus.unsplash.com/premium_vector-1739541763086-14483f8e5865?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
          <div className="rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/30 dark:border-zinc-800/40">
            {/* Animated yellow circle */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary opacity-30 rounded-full blur-2xl animate-pulse z-0" />
            {/* Animated secondary circle */}
            <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-secondary opacity-20 rounded-full blur-2xl animate-bounce z-0" />
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex flex-col gap-6 animate-fade-in"
            >
              <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-2 tracking-tight">
                Create Account
              </h1>
              <p className="text-center text-zinc-500 dark:text-zinc-300 mb-4">
                Sign up to manage your cafe dashboard
              </p>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-4 py-3 rounded-xl border  text-white border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-3 rounded-xl border  text-white border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-4 py-3 rounded-xl border  text-white border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-secondary transition"
              />
              {error && (
                <div className="text-red-500 text-center text-sm animate-shake">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-600 text-center text-sm animate-fade-in">
                  {success}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 py-3 rounded-xl bg-gradient-to-br shadow-white/[.5] shadow-inner from-primary to-secondary text-zinc-900 font-semibold border-primary/[0.1] border  hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
              <div className="text-center text-zinc-500 dark:text-zinc-300 text-sm mt-2">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Log in
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-fade-in {
          animation: fade-in 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(2px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-4px);
          }
          40%,
          60% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </>
  )
}
