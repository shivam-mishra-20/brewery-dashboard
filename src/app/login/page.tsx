'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Use the login function from AuthContext
      await login(email, password)
      // If successful, navigate to dashboard
      router.replace('/dashboard')
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
        {/* Blurred background image */}
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
        {/* Foreground content */}
        <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
          <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden">
            {/* Animated yellow circle */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary opacity-30 rounded-full blur-2xl animate-pulse z-0" />
            {/* Animated secondary circle */}
            <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-secondary opacity-20 rounded-full blur-2xl animate-bounce z-0" />
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex flex-col gap-6 animate-fade-in"
            >
              <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-2 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-center text-zinc-500 dark:text-zinc-300 mb-4">
                Sign in to your dashboard
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-3 rounded-xl text-white border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl text-white border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-secondary transition w-full pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.13 0 2.21.19 3.22.54"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.94 17.94L6.06 6.06"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className="text-red-500 text-center text-sm animate-shake">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 py-3 rounded-xl bg-gradient-to-br shadow-white/[.5] shadow-inner from-primary to-secondary text-zinc-900 font-semibold border-primary/[0.1] border  hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {/* <div className="text-center text-zinc-500 dark:text-zinc-300 text-sm mt-2">
                Don&apos;t have an account?{' '}
                <a
                  href="/signup"
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </a>
              </div> */}
            </form>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease-in-out infinite;
        }
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

export default LoginPage
