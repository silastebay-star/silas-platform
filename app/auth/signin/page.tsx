/**
 * Sign In Page
 * User authentication page with sign in form
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SignInForm, { DemoCredentials } from '@/components/auth/SignInForm'
import { Button } from '@/components/ui/button'
import { useGuestOnly } from '@/lib/auth/auth-context'

export default function SignInPage() {
  const { loading } = useGuestOnly('/')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to SILAS
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="w-16 h-16 bg-silas-green rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to continue building your community
            </p>
          </div>

          {/* Sign In Form */}
          <SignInForm />

          {/* Demo Credentials (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <DemoCredentials />
          )}

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-silas-green hover:underline font-medium">
                Create one now
              </Link>
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-gray-700">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/help" className="hover:text-gray-700">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-gray-500">
        <p>
          © 2024 SILAS Platform. Building stronger communities through local engagement.
        </p>
      </div>
    </div>
  )
}
