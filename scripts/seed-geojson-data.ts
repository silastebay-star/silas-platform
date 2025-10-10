/**
 * Seed script for GeoJSON integration data
 * Populates census data, community boundaries, and points of interest
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample census data for Stoneclough area
const sampleCensusData = [
  {
    name: 'Stoneclough Central',
    code: 'E00000001',
    population: 2847,
    households: 1203,
    median_age: 42.3,
    median_income: 28500,
    unemployment_rate: 4.2,
    education_level: {
      no_qualifications: 18.5,
      level_1_qualifications: 12.3,
      level_2_qualifications: 16.8,
      apprenticeship: 8.4,
      level_3_qualifications: 15.2,
      level_4_qualifications_and_above: 28.8,
      other_qualifications: 0.0
    },
    housing: {
      owned_outright: 32.1,
      owned_with_mortgage: 38.7,
      shared_ownership: 2.1,
      social_rented: 12.4,
      private_rented: 14.2,
      rent_free: 0.5
    },
    transport: {
      work_from_home: 18.3,
      underground_metro: 0.0,
      train: 8.7,
      bus: 12.4,
      taxi: 0.8,
      motorcycle: 1.2,
      car_driver: 52.1,
      car_passenger: 3.2,
      bicycle: 2.1,
      on_foot: 1.2,
      other: 0.0
    },
    // Approximate polygon for Stoneclough Central
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-2.385, 53.548],
        [-2.375, 53.548],
        [-2.375, 53.555],
        [-2.385, 53.555],
        [-2.385, 53.548]
      ]]
    }
  },
  {
    name: 'Stoneclough North',
    code: 'E00000002',
    population: 1923,
    households: 834,
    median_age: 38.7,
    median_income: 31200,
    unemployment_rate: 3.8,
    education_level: {
      no_qualifications: 15.2,
      level_1_qualifications: 11.8,
      level_2_qualifications: 18.3,
      apprenticeship: 9.7,
      level_3_qualifications: 16.4,
      level_4_qualifications_and_above: 28.6,
      other_qualifications: 0.0
    },
    housing: {
      owned_outright: 28.4,
      owned_with_mortgage: 42.1,
      shared_ownership: 3.2,
      social_rented: 8.7,
      private_rented: 16.8,
      rent_free: 0.8
    },
    transport: {
      work_from_home: 22.1,
      underground_metro: 0.0,
      train: 11.3,
      bus: 9.8,
      taxi: 0.6,
      motorcycle: 1.8,
      car_driver: 48.7,
      car_passenger: 2.9,
      bicycle: 2.3,
      on_foot: 0.5,
      other: 0.0
    },
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-2.385, 53.555],
        [-2.375, 53.555],
        [-2.375, 53.562],
        [-2.385, 53.562],
        [-2.385, 53.555]
      ]]
    }
  }
]

// Sample community boundaries
const sampleBoundaries = [
  {
    name: 'Stoneclough Parish',
    type: 'parish',
    description: 'Historic parish boundary for Stoneclough village',
    population: 4770,
    area_hectares: 285.7,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-2.390, 53.545],
        [-2.370, 53.545],
        [-2.370, 53.565],
        [-2.390, 53.565],
        [-2.390, 53.545]
      ]]
    },
    metadata: {
      established: '1894',
      council: 'Stoneclough Parish Council'
    }
  },
  {
    name: 'Radcliffe Ward',
    type: 'ward',
    description: 'Electoral ward containing Stoneclough',
    population: 12450,
    area_hectares: 1247.3,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-2.400, 53.540],
        [-2.360, 53.540],
        [-2.360, 53.570],
        [-2.400, 53.570],
        [-2.400, 53.540]
      ]]
    },
    metadata: {
      council: 'Bury Metropolitan Borough Council',
      councillors: 3
    }
  }
]

// Sample points of interest
const samplePointsOfInterest = [
  {
    name: 'Stoneclough Primary School',
    category: 'education',
    description: 'Local primary school serving the community',
    address: 'School Lane, Stoneclough',
    geom: {
      type: 'Point',
      coordinates: [-2.378, 53.552]
    },
    metadata: {
      capacity: 420,
      age_range: '4-11',
      ofsted_rating: 'Good'
    }
  },
  {
    name: 'Stoneclough Medical Centre',
    category: 'healthcare',
    description: 'GP surgery and medical services',
    address: 'High Street, Stoneclough',
    phone: '01617654321',
    geom: {
      type: 'Point',
      coordinates: [-2.380, 53.550]
    },
    metadata: {
      services: ['GP', 'Nurse', 'Pharmacy'],
      nhs_code: 'P12345'
    }
  },
  {
    name: 'Stoneclough Community Centre',
    category: 'community',
    description: 'Village hall and community meeting space',
    address: 'Church Street, Stoneclough',
    geom: {
      type: 'Point',
      coordinates: [-2.382, 53.551]
    },
    metadata: {
      capacity: 150,
      facilities: ['Main hall', 'Kitchen', 'Meeting rooms'],
      booking_contact: 'stonecloughcc@email.com'
    }
  },
  {
    name: 'The Red Lion',
    category: 'hospitality',
    description: 'Traditional village pub',
    address: 'Manchester Road, Stoneclough',
    website: 'https://redlionstoneclough.co.uk',
    geom: {
      type: 'Point',
      coordinates: [-2.379, 53.549]
    },
    metadata: {
      type: 'pub',
      food_served: true,
      garden: true
    }
  },
  {
    name: 'Stoneclough Recreation Ground',
    category: 'recreation',
    description: 'Public park and sports facilities',
    address: 'Recreation Road, Stoneclough',
    geom: {
      type: 'Point',
      coordinates: [-2.376, 53.553]
    },
    metadata: {
      facilities: ['Football pitch', 'Playground', 'Tennis court'],
      area_hectares: 4.2
    }
  }
]

// Sample geographic layers
const sampleGeographicLayers = [
  {
    name: 'Transport Network',
    description: 'Bus routes and transport infrastructure',
    type: 'transport',
    data_source: 'Transport for Greater Manchester',
    visible: true,
    opacity: 0.8,
    color_scheme: 'blues',
    geom: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-2.390, 53.548],
              [-2.370, 53.552]
            ]
          },
          properties: {
            route: '524',
            operator: 'First Greater Manchester',
            frequency: '30 minutes'
          }
        }
      ]
    },
    metadata: {
      last_updated: '2024-01-15',
      source_url: 'https://tfgm.com'
    }
  }
]

async function seedGeoJSONData() {
  console.log('🌍 Starting GeoJSON data seeding...')

  try {
    // Seed census data
    console.log('📊 Seeding census data...')
    const { error: censusError } = await supabase
      .from('census_data')
      .upsert(sampleCensusData, { onConflict: 'code' })

    if (censusError) {
      console.error('Error seeding census data:', censusError)
    } else {
      console.log(`✅ Seeded ${sampleCensusData.length} census areas`)
    }

    // Seed community boundaries
    console.log('🗺️ Seeding community boundaries...')
    const { error: boundariesError } = await supabase
      .from('community_boundaries')
      .upsert(sampleBoundaries)

    if (boundariesError) {
      console.error('Error seeding boundaries:', boundariesError)
    } else {
      console.log(`✅ Seeded ${sampleBoundaries.length} community boundaries`)
    }

    // Seed points of interest
    console.log('📍 Seeding points of interest...')
    const { error: poiError } = await supabase
      .from('points_of_interest')
      .upsert(samplePointsOfInterest)

    if (poiError) {
      console.error('Error seeding POI:', poiError)
    } else {
      console.log(`✅ Seeded ${samplePointsOfInterest.length} points of interest`)
    }

    // Seed geographic layers
    console.log('🗂️ Seeding geographic layers...')
    const { error: layersError } = await supabase
      .from('geographic_layers')
      .upsert(sampleGeographicLayers)

    if (layersError) {
      console.error('Error seeding layers:', layersError)
    } else {
      console.log(`✅ Seeded ${sampleGeographicLayers.length} geographic layers`)
    }

    console.log('🎉 GeoJSON data seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seeder
if (require.main === module) {
  seedGeoJSONData()
}

export default seedGeoJSONData
