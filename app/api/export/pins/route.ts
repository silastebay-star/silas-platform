import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request) {
  
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: pins, error } = await supabase
      .from('pins')
      .select('id, title, description, lat, lng, categories, created_at, updated_at')
      .eq('author_id', user.id) // Only allow users to export their own pins

    if (error) {
      handleServerError(error, 'Failed to fetch pins for export')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pins || pins.length === 0) {
      return NextResponse.json({ message: 'No pins found to export' }, { status: 404 })
    }

    const csv = Papa.unparse(pins)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pins_export.csv"',
      },
    })
  } catch (error: any) {
    handleServerError(error, 'Error exporting pins')
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
