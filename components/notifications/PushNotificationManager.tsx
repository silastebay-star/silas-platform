
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

export function PushNotificationManager() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setNotificationPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === 'granted') {
      await saveToken()
    }
  }

  const saveToken = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const token = await registration.pushManager.getSubscription().then(sub => sub ? sub.endpoint : null);

      if (token) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('device_tokens')
            .eq('id', user.id)
            .single()

          if (profile) {
            const tokens = profile.device_tokens || []
            if (!tokens.includes(token)) {
              await supabase
                .from('profiles')
                .update({ device_tokens: [...tokens, token] })
                .eq('id', user.id)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting device token', error)
    }
  }

  if (notificationPermission === 'granted') {
    return null
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="mb-2">Enable push notifications to receive security alerts.</p>
      <Button onClick={requestPermission} disabled={notificationPermission !== 'default'}>
        {notificationPermission === 'denied' ? 'Permission denied' : 'Enable Notifications'}
      </Button>
    </div>
  )
}
