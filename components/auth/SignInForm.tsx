/**
 * Sign In Form Component
 * Complete login form with validation and error handling
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth/auth-context'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type SignInFormData = z.infer<typeof signInSchema>

interface SignInFormProps {
  onSuccess?: () => void
  className?: string
}

export default function SignInForm({ onSuccess, className = "" }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading, resendVerification } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      clearErrors()
      await signIn(data)
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Email not confirmed')) {
          setError('root', { 
            message: 'Please verify your email address before signing in.',
            type: 'verification'
          })
        } else if (error.message.includes('Invalid login credentials')) {
          setError('root', { message: 'Invalid email or password. Please try again.' })
        } else {
          setError('root', { message: error.message })
        }
      }
    }
  }

  const handleResendVerification = async () => {
    try {
      await resendVerification()
    } catch (error) {
      console.error('Failed to resend verification:', error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-silas-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        </div>
        <CardTitle className="">Welcome Back</CardTitle>
        <CardDescription className="">
          Sign in to your SILAS account to continue building your community
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root && (
            <Alert variant="destructive" className="">
              <AlertDescription className="flex items-center justify-between">
                <span>{errors.root.message}</span>
                {errors.root.type === 'verification' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    className="ml-2"
                  >
                    Resend Email
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                {...register('email')}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-silas-green hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                {...register('password')}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            variant="default"
            size="default"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-silas-green hover:underline font-medium">
              Create one now
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

// Demo credentials component for development
export function DemoCredentials() {
  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="">
        <CardTitle className="text-sm">Demo Credentials</CardTitle>
        <CardDescription className="text-xs">
          Use these credentials for testing (development only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs">
          <strong>Admin:</strong> admin@silas.local / password123
        </div>
        <div className="text-xs">
          <strong>Moderator:</strong> moderator@silas.local / password123
        </div>
        <div className="text-xs">
          <strong>User:</strong> user@silas.local / password123
        </div>
      </CardContent>
    </Card>
  )
}
