/**
 * User Profile Component
 * Complete user profile management with real functionality
 */

'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, MapPin, Globe, Calendar, Mail, Edit, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/lib/auth/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { handleError } from '@/lib/error-handling'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfileProps {
  className?: string
}

export default function UserProfile({ className = "" }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user, updateProfile, uploadAvatar } = useAuth()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)

      await updateProfile({
        full_name: data.full_name,
        username: data.username,
        bio: data.bio,
        location: data.location,
        website: data.website
      })
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      handleError(error, 'UserProfile - onSubmit', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingAvatar(true)

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        handleError('File size must be less than 5MB', 'UserProfile - handleAvatarUpload', true)
        return
      }

      if (!file.type.startsWith('image/')) {
        handleError('Please select an image file', 'UserProfile - handleAvatarUpload', true)
        return
      }

      await uploadAvatar(file)
      toast.success('Avatar updated successfully!')
    } catch (error: any) {
      handleError(error, 'UserProfile - handleAvatarUpload', true)
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Please sign in to view your profile</p>
        </CardContent>
      </Card>
    )
  }

  const joinedDate = user.created_at ? new Date(user.created_at) : new Date()
  const userRole = user.role || 'user'

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">User Profile</CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {user.full_name?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {user.full_name || 'Anonymous User'}
            </h3>
            <p className="text-gray-600">@{user.username || 'no-username'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="" variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole}
              </Badge>
              <span className="text-sm text-gray-500">
                Joined {joinedDate.toLocaleDateString()}
              </span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        <Separator className="" />

        {/* Profile Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }: { field: any }) => (
                  <FormItem className="">
                    <FormLabel className="">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        placeholder="Enter your full name"
                      />
                    </FormControl>
                    <FormMessage className="" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }: { field: any }) => (
                  <FormItem className="">
                    <FormLabel className="">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        placeholder="Enter your username"
                      />
                    </FormControl>
                    <FormMessage className="" />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }: { field: any }) => (
                <FormItem className="">
                  <FormLabel className="">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage className="" />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }: { field: any }) => (
                  <FormItem className="">
                    <FormLabel className="">Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        placeholder="Your location"
                      />
                    </FormControl>
                    <FormMessage className="" />
                  </FormItem>
                )}
              />


            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }: { field: any }) => (
                <FormItem className="">
                  <FormLabel className="">Website</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!isEditing}
                      placeholder="https://your-website.com"
                    />
                  </FormControl>
                  <FormMessage className="" />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <Separator className="" />

        {/* Account Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Account Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Member since:</span>
              <span>{joinedDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Account type:</span>
              <Badge className="" variant="outline">{userRole}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
