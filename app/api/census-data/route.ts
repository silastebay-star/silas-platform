import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 })
  }

  
  const supabase = createSupabaseServerClient()

  // Perform a PostGIS query to find census data for the given point
  const { data: censusData, error } = await supabase.rpc('get_census_data_for_point', {
    point_lat: parseFloat(lat),
    point_lng: parseFloat(lng),
  })

  if (error) {
    handleServerError(error, `Error fetching census data for lat: ${lat}, lng: ${lng}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!censusData || censusData.length === 0) {
    return NextResponse.json({ message: 'No census data found for this location' }, { status: 404 })
  }

  return NextResponse.json(censusData, { status: 200 })
}