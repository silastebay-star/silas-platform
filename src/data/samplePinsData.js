// SILAS Sample Pins Data - Comprehensive colorful pins for all categories
import { SILAS_CATEGORY_FRAMEWORK } from '../config/categoryFramework.js';

// Real Stoneclough coordinates and boundaries
// Stoneclough is a village in Greater Manchester, England
const STONECLOUGH_CENTER = [-2.3769, 53.5526]; // Actual Stoneclough center
const STONECLOUGH_BOUNDS = {
  north: 53.5580,
  south: 53.5470,
  east: -2.3700,
  west: -2.3850
};

// Real Stoneclough locations for authentic pin placement
const STONECLOUGH_LOCATIONS = {
  // Main village center and key areas
  villageCenter: [-2.3769, 53.5526],
  churchArea: [-2.3775, 53.5535],
  schoolArea: [-2.3760, 53.5520],
  shopArea: [-2.3765, 53.5525],
  parkArea: [-2.3780, 53.5530],
  communityCenter: [-2.3770, 53.5528],
  libraryArea: [-2.3762, 53.5522],
  healthCenter: [-2.3773, 53.5524],

  // Residential areas
  northResidential: [-2.3755, 53.5540],
  southResidential: [-2.3785, 53.5515],
  eastResidential: [-2.3745, 53.5525],
  westResidential: [-2.3795, 53.5530],

  // Green spaces and community areas
  greenSpace1: [-2.3790, 53.5535],
  greenSpace2: [-2.3750, 53.5515],
  sportsGround: [-2.3785, 53.5540],
  allotments: [-2.3800, 53.5525],

  // Infrastructure locations
  energyProject: [-2.3775, 53.5545],
  recyclingCenter: [-2.3795, 53.5520],
  repairCafe: [-2.3765, 53.5535]
};

// Generate coordinates within Stoneclough boundaries
const getRandomStonecloughCoords = () => {
  const locations = Object.values(STONECLOUGH_LOCATIONS);
  return locations[Math.floor(Math.random() * locations.length)];
};

// Get specific location for pin type
const getLocationForPinType = (pinType, category) => {
  switch (pinType) {
    case 'Churches':
      return STONECLOUGH_LOCATIONS.churchArea;
    case 'Community Centers':
      return STONECLOUGH_LOCATIONS.communityCenter;
    case 'Libraries':
      return STONECLOUGH_LOCATIONS.libraryArea;
    case 'Health Clinics':
      return STONECLOUGH_LOCATIONS.healthCenter;
    case 'Local Shops':
    case 'Farmers Markets':
      return STONECLOUGH_LOCATIONS.shopArea;
    case 'Solar Installations':
      return STONECLOUGH_LOCATIONS.energyProject;
    case 'Community Gardens':
      return STONECLOUGH_LOCATIONS.allotments;
    case 'Repair Cafes':
      return STONECLOUGH_LOCATIONS.repairCafe;
    case 'Parks & Playgrounds':
    case 'Fitness Centers':
      return STONECLOUGH_LOCATIONS.parkArea;
    default:
      return getRandomStonecloughCoords();
  }
};

// Sample photos for different categories
const samplePhotos = {
  faith: [
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', caption: 'Sunday Service' },
    { url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=400', caption: 'Community Prayer' }
  ],
  commerce: [
    { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', caption: 'Local Market' },
    { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', caption: 'Fresh Produce' }
  ],
  works: [
    { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', caption: 'Solar Installation' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', caption: 'Community Garden' }
  ],
  circle: [
    { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400', caption: 'Community Event' },
    { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400', caption: 'Family Gathering' }
  ],
  mind: [
    { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', caption: 'Library Study' },
    { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400', caption: 'Workshop Session' }
  ],
  pulse: [
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', caption: 'Fitness Class' },
    { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', caption: 'Wellness Center' }
  ]
};

// Generate comprehensive sample pins with real Stoneclough locations
export const generateSamplePins = () => {
  const pins = [];
  let pinId = 1;

  // Faith & Fellowship Pins
  const faithPins = [
    {
      id: `pin_${pinId++}`,
      name: 'St. Mary\'s Parish Church',
      description: 'Historic parish church serving the Stoneclough community for over 150 years. Weekly services, community events, and spiritual guidance.',
      layer: 'faith',
      subcategory: 'parishLife',
      pinType: 'Churches',
      coordinates: getLocationForPinType('Churches', 'faith'),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Father Michael',
      priority: 'normal',
      tags: ['worship', 'community', 'historic', 'weekly-service'],
      reactions: { like: 24, love: 18, pray: 31 },
      comments: 12,
      metadata: {
        photos: samplePhotos.faith,
        accuracy: 5,
        quickPin: false,
        schedule: {
          isRecurring: true,
          frequency: 'weekly',
          times: ['Sunday 9:00 AM', 'Sunday 11:00 AM', 'Wednesday 7:00 PM']
        }
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Community Bible Study',
      description: 'Weekly Bible study group meeting every Wednesday evening. All denominations welcome. Currently studying the Gospel of Matthew.',
      layer: 'faith',
      subcategory: 'scriptureStudy',
      pinType: 'Study Circles',
      coordinates: STONECLOUGH_LOCATIONS.communityCenter,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Sarah Thompson',
      priority: 'normal',
      tags: ['bible-study', 'weekly', 'interfaith', 'matthew'],
      reactions: { like: 15, love: 8 },
      comments: 7,
      metadata: {
        photos: [samplePhotos.faith[1]],
        accuracy: 8,
        quickPin: false
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Community Food Bank',
      description: 'Local food bank providing emergency food assistance to families in need. Volunteers always welcome for sorting and distribution.',
      layer: 'faith',
      subcategory: 'outreach',
      pinType: 'Charity Efforts',
      coordinates: STONECLOUGH_LOCATIONS.communityCenter,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Community Volunteers',
      priority: 'high',
      tags: ['food-assistance', 'volunteers-needed', 'emergency-aid'],
      reactions: { like: 42, love: 28, support: 19 },
      comments: 18,
      metadata: {
        photos: samplePhotos.faith,
        accuracy: 3,
        quickPin: false
      }
    }
  ];

  // Commerce & Trade Pins
  const commercePins = [
    {
      id: `pin_${pinId++}`,
      name: 'Stoneclough Farmers Market',
      description: 'Weekly farmers market featuring local produce, artisan goods, and community vendors. Supporting local economy every Saturday.',
      layer: 'commerce',
      subcategory: 'marketplace',
      pinType: 'Farmers Markets',
      coordinates: getLocationForPinType('Farmers Markets', 'commerce'),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Market Coordinator',
      priority: 'normal',
      tags: ['farmers-market', 'local-produce', 'saturday', 'artisan'],
      reactions: { like: 67, love: 34 },
      comments: 23,
      metadata: {
        photos: samplePhotos.commerce,
        accuracy: 2,
        quickPin: false,
        businessHours: 'Saturday 8:00 AM - 2:00 PM'
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'The Village Bakery',
      description: 'Family-owned bakery serving fresh bread, pastries, and local specialties. Using traditional recipes passed down through generations.',
      layer: 'commerce',
      subcategory: 'localBusiness',
      pinType: 'Local Shops',
      coordinates: getLocationForPinType('Local Shops', 'commerce'),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Emma Baker',
      priority: 'normal',
      tags: ['bakery', 'fresh-bread', 'family-owned', 'traditional'],
      reactions: { like: 89, love: 56 },
      comments: 31,
      metadata: {
        photos: samplePhotos.commerce,
        accuracy: 1,
        quickPin: false,
        businessHours: 'Mon-Sat 6:00 AM - 6:00 PM'
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Local Craft Cooperative',
      description: 'Community-owned cooperative showcasing local artisans and craftspeople. Pottery, woodwork, textiles, and more.',
      layer: 'commerce',
      subcategory: 'cooperatives',
      pinType: 'Artisan Studios',
      coordinates: STONECLOUGH_LOCATIONS.shopArea,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Craft Collective',
      priority: 'normal',
      tags: ['crafts', 'cooperative', 'artisan', 'local-made'],
      reactions: { like: 45, love: 29 },
      comments: 16,
      metadata: {
        photos: samplePhotos.commerce,
        accuracy: 4,
        quickPin: false
      }
    }
  ];

  // Works & Infrastructure Pins
  const worksPins = [
    {
      id: `pin_${pinId++}`,
      name: 'Community Solar Project',
      description: 'Collaborative solar installation project for the community center. Phase 1 complete, Phase 2 starting next month. Volunteers needed!',
      layer: 'works',
      subcategory: 'energy',
      pinType: 'Solar Installations',
      coordinates: getLocationForPinType('Solar Installations', 'works'),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Green Energy Team',
      priority: 'high',
      tags: ['solar-power', 'renewable-energy', 'volunteers-needed', 'phase-2'],
      reactions: { like: 78, love: 45, support: 23 },
      comments: 34,
      metadata: {
        photos: samplePhotos.works,
        accuracy: 2,
        quickPin: false,
        projectStatus: 'Phase 1 Complete'
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Community Vegetable Garden',
      description: 'Shared community garden with individual plots available for residents. Organic growing methods, tool sharing, and seasonal workshops.',
      layer: 'works',
      subcategory: 'environment',
      pinType: 'Community Gardens',
      coordinates: getLocationForPinType('Community Gardens', 'works'),
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Garden Committee',
      priority: 'normal',
      tags: ['community-garden', 'organic', 'plot-rental', 'workshops'],
      reactions: { like: 92, love: 67 },
      comments: 28,
      metadata: {
        photos: samplePhotos.works,
        accuracy: 3,
        quickPin: false
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Repair Café',
      description: 'Monthly repair café where community members help fix household items, electronics, and clothing. Reduce waste, learn skills!',
      layer: 'works',
      subcategory: 'environment',
      pinType: 'Repair Cafes',
      coordinates: getLocationForPinType('Repair Cafes', 'works'),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Repair Volunteers',
      priority: 'normal',
      tags: ['repair-cafe', 'sustainability', 'skill-sharing', 'monthly'],
      reactions: { like: 54, love: 31 },
      comments: 19,
      metadata: {
        photos: samplePhotos.works,
        accuracy: 5,
        quickPin: false
      }
    }
  ];

  // Circle & Community Pins
  const circlePins = [
    {
      id: `pin_${pinId++}`,
      name: 'Stoneclough Community Center',
      description: 'Heart of our community! Meeting rooms, event space, and activity programs for all ages. Home to many local groups and events.',
      layer: 'circle',
      subcategory: 'socialEvents',
      pinType: 'Community Centers',
      coordinates: getLocationForPinType('Community Centers', 'circle'),
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Community Manager',
      priority: 'normal',
      tags: ['community-center', 'events', 'meetings', 'all-ages'],
      reactions: { like: 156, love: 89 },
      comments: 45,
      metadata: {
        photos: samplePhotos.circle,
        accuracy: 1,
        quickPin: false
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Annual Summer Festival',
      description: 'Our biggest community celebration! Live music, local food vendors, children\'s activities, and community awards. Save the date: July 15th!',
      layer: 'circle',
      subcategory: 'culturalLife',
      pinType: 'Community Centers',
      coordinates: STONECLOUGH_LOCATIONS.parkArea,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Festival Committee',
      priority: 'high',
      tags: ['summer-festival', 'music', 'food', 'family-friendly', 'july-15'],
      reactions: { like: 234, love: 178, excited: 89 },
      comments: 67,
      metadata: {
        photos: samplePhotos.circle,
        accuracy: 2,
        quickPin: false
      }
    }
  ];

  // Mind & Learning Pins
  const mindPins = [
    {
      id: `pin_${pinId++}`,
      name: 'Stoneclough Public Library',
      description: 'Community library with extensive book collection, computer access, study spaces, and regular educational programs for all ages.',
      layer: 'mind',
      subcategory: 'libraries',
      pinType: 'Libraries',
      coordinates: getLocationForPinType('Libraries', 'mind'),
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Head Librarian',
      priority: 'normal',
      tags: ['library', 'books', 'computers', 'study-space', 'programs'],
      reactions: { like: 123, love: 78 },
      comments: 34,
      metadata: {
        photos: samplePhotos.mind,
        accuracy: 1,
        quickPin: false
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Digital Skills Workshop',
      description: 'Weekly workshop helping community members learn computer skills, internet safety, and digital literacy. All skill levels welcome.',
      layer: 'mind',
      subcategory: 'workshops',
      pinType: 'Skill Workshops',
      coordinates: STONECLOUGH_LOCATIONS.libraryArea,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Tech Volunteers',
      priority: 'normal',
      tags: ['digital-skills', 'computer-training', 'weekly', 'all-levels'],
      reactions: { like: 67, love: 34 },
      comments: 22,
      metadata: {
        photos: samplePhotos.mind,
        accuracy: 3,
        quickPin: false
      }
    }
  ];

  // Pulse & Wellness Pins
  const pulsePins = [
    {
      id: `pin_${pinId++}`,
      name: 'Community Health Clinic',
      description: 'Local health clinic providing primary care, health screenings, and wellness programs. Serving the community with compassionate care.',
      layer: 'pulse',
      subcategory: 'healthcare',
      pinType: 'Health Clinics',
      coordinates: getLocationForPinType('Health Clinics', 'pulse'),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Dr. Sarah Wilson',
      priority: 'normal',
      tags: ['health-clinic', 'primary-care', 'screenings', 'wellness'],
      reactions: { like: 145, love: 89, grateful: 56 },
      comments: 41,
      metadata: {
        photos: samplePhotos.pulse,
        accuracy: 1,
        quickPin: false
      }
    },
    {
      id: `pin_${pinId++}`,
      name: 'Morning Yoga in the Park',
      description: 'Free community yoga sessions every Tuesday and Thursday morning. All levels welcome. Bring your own mat or borrow one of ours!',
      layer: 'pulse',
      subcategory: 'fitness',
      pinType: 'Fitness Centers',
      coordinates: getLocationForPinType('Fitness Centers', 'pulse'),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'Yoga Instructor Lisa',
      priority: 'normal',
      tags: ['yoga', 'free', 'morning', 'park', 'all-levels'],
      reactions: { like: 78, love: 45, namaste: 23 },
      comments: 19,
      metadata: {
        photos: samplePhotos.pulse,
        accuracy: 4,
        quickPin: false
      }
    }
  ];

  // Combine all pins
  return [
    ...faithPins,
    ...commercePins,
    ...worksPins,
    ...circlePins,
    ...mindPins,
    ...pulsePins
  ];
};

// Export the sample data
export const SAMPLE_PINS = generateSamplePins();

export default SAMPLE_PINS;
