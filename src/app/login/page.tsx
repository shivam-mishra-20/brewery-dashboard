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
      <div className="min-h-screen flex items-center justify-center font-serif">
        {/* Blurred background image */}
        <div
          className="absolute inset-0 bg-blend-multiply backdrop-blur-xl bg-[#0B3D2E] w-full h-full z-0 bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/bg-image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        {/* Foreground content */}
        <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
          <div className="bg-[#23272F]/90 rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden border border-[#FFC600]/20 font-serif">
            {/* Animated yellow circle */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#FFC600] opacity-30 rounded-full blur-2xl animate-pulse z-0" />
            {/* Animated secondary circle */}
            <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-[#FFD700] opacity-20 rounded-full blur-2xl animate-bounce z-0" />
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex flex-col gap-6 animate-fade-in font-serif"
            >
              <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight font-serif">
                Welcome Back to
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFC600] via-[#FFD700] to-[#FFC600] font-serif">
                  The Brewery
                </span>
              </h1>
              <p className="text-center text-[#FFD700] mb-4 font-serif">
                Sign in to your dashboard
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-3 rounded-xl text-white border border-[#FFC600]/30 bg-[#18382D] focus:outline-none focus:ring-2 focus:ring-[#FFC600] transition font-serif"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl text-white border border-[#FFC600]/30 bg-[#18382D] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition w-full pr-12 font-serif"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFC600] hover:text-[#FFD700] focus:outline-none"
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
                <div className="text-red-500 text-center text-sm animate-shake font-serif">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 py-3 rounded-xl bg-gradient-to-br shadow-white/[.5] shadow-inner from-[#FFC600] to-[#FFD700] text-[#23272F] font-semibold border-[#FFC600]/20 border hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFC600] focus:ring-offset-2 font-serif"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {/* Sign up link */}
              <div className="text-center mt-4 font-serif text-white text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-[#FFD700] underline hover:text-[#FFC600] transition"
                  onClick={() => router.push('/signup')}
                >
                  Sign Up
                </button>
              </div>
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
