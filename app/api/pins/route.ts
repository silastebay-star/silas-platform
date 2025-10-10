import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)

  // Get filter parameters from the request URL
  const category = searchParams.get('category')
  const bbox = searchParams.get('bbox')

  let query = supabase.from('pins').select('*')

  if (category) {
    query = query.filter('categories', 'cs', `{${category}}`)
  }

  if (bbox) {
    const [minX, minY, maxX, maxY] = bbox.split(',').map(parseFloat)
    query = query.filter('geom', 'stw', `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`)
  }

  const { data, error } = await query

  

      if (error) {

  

        return NextResponse.json({ error: error.message }, { status: 500 })

  

      }

  

    

  

      const pins = data.map(pin => {

  

        const [lng, lat] = pin.geom.replace('POINT(', '').replace(')', '').split(' ').map(parseFloat)

  

        return { ...pin, lat, lng }

  

      })

  

    

  

      return NextResponse.json(pins)

  

    }

  

    

  

    export async function POST(request: Request) {

    const supabase = createSupabaseServerClient()

    const { title, description, categories, lat, lng } = await request.json()

  

    const { data: { user } } = await supabase.auth.getUser()

  

    if (!user) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    }

  

    const { data, error } = await supabase

      .from('pins')

      .insert([

        {

          title,

          description,

          categories,

          geom: `POINT(${lng} ${lat})`,

          author_id: user.id,

        },

      ])

      .select()

  

    if (error) {

      return NextResponse.json({ error: error.message }, { status: 500 })

    }

  

    return NextResponse.json(data)

  }

  