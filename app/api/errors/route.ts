import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const errorReport = await request.json()
    console.error('[Frontend Error Report]', errorReport)
    // In a real application, you would send this to a monitoring service like Sentry
    return NextResponse.json({ message: 'Error reported successfully' }, { status: 200 })
  } catch (error) {
    console.error('Failed to parse error report:', error)
    return NextResponse.json({ message: 'Failed to parse error report' }, { status: 400 })
  }
}
