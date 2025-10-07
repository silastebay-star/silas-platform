// Sample pins data for SILAS platform
export const SAMPLE_PINS = [
  {
    id: '1',
    name: 'St. Bartholomew\'s Church',
    description: 'Historic parish church serving the Stoneclough community for over 150 years. Sunday services, community events, and spiritual guidance.',
    layer: 'Faith',
    category: { id: 'faith', name: 'Faith & Fellowship', color: '#8B5CF6' },
    coordinates: { latitude: 53.5530, longitude: -2.3765 },
    address: { formatted: 'Church Lane, Stoneclough' },
    priority: 'high',
    tags: ['church', 'community', 'worship', 'heritage'],
    photos: [
      {
        id: 'photo1',
        url: 'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400',
        caption: 'St. Bartholomew\'s Church exterior',
        alt_text: 'Historic stone church building'
      }
    ],
    created_at: '2024-01-15T10:00:00Z',
    creator: { id: 'user1', display_name: 'Rev. Sarah Mitchell', avatar_url: null },
    social_counts: { likes: 24, comments: 8, shares: 3 },
    is_verified: true,
    status: 'active'
  },
  {
    id: '2',
    name: 'Stoneclough Community Garden',
    description: 'Organic community garden where residents grow vegetables, herbs, and flowers together. Open to all skill levels.',
    layer: 'Circle',
    category: { id: 'community', name: 'Community & Social', color: '#EF4444' },
    coordinates: { latitude: 53.5525, longitude: -2.3770 },
    address: { formatted: 'Green Lane, Stoneclough' },
    priority: 'normal',
    tags: ['gardening', 'organic', 'community', 'environment'],
    photos: [
      {
        id: 'photo2',
        url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        caption: 'Community garden in full bloom',
        alt_text: 'Vegetable garden with raised beds'
      }
    ],
    created_at: '2024-01-20T14:30:00Z',
    creator: { id: 'user2', display_name: 'Emma Thompson', avatar_url: null },
    social_counts: { likes: 18, comments: 12, shares: 5 },
    is_verified: false,
    status: 'active'
  },
  {
    id: '3',
    name: 'The Village Bakery',
    description: 'Family-run bakery serving fresh bread, pastries, and local specialties. Supporting local economy since 1987.',
    layer: 'Commerce',
    category: { id: 'economy', name: 'Economy & Commerce', color: '#10B981' },
    coordinates: { latitude: 53.5528, longitude: -2.3772 },
    address: { formatted: 'High Street, Stoneclough' },
    priority: 'normal',
    tags: ['bakery', 'local business', 'food', 'family'],
    photos: [
      {
        id: 'photo3',
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        caption: 'Fresh bread and pastries',
        alt_text: 'Bakery display with fresh bread'
      }
    ],
    created_at: '2024-01-18T09:15:00Z',
    creator: { id: 'user3', display_name: 'James Baker', avatar_url: null },
    social_counts: { likes: 31, comments: 6, shares: 8 },
    is_verified: true,
    status: 'active'
  },
  {
    id: '4',
    name: 'New Playground Project',
    description: 'Community-funded playground renovation project. Modern equipment, safety surfaces, and accessible design for all children.',
    layer: 'Works',
    category: { id: 'projects', name: 'Projects & Infrastructure', color: '#F59E0B' },
    coordinates: { latitude: 53.5522, longitude: -2.3768 },
    address: { formatted: 'Recreation Ground, Stoneclough' },
    priority: 'high',
    tags: ['playground', 'children', 'safety', 'community project'],
    photos: [
      {
        id: 'photo4',
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
        caption: 'New playground equipment',
        alt_text: 'Modern playground with colorful equipment'
      }
    ],
    created_at: '2024-01-22T16:45:00Z',
    creator: { id: 'user4', display_name: 'Council Planning', avatar_url: null },
    social_counts: { likes: 42, comments: 15, shares: 12 },
    is_verified: true,
    status: 'active',
    fund_eligible: true,
    fund_requested_amount: 25000
  },
  {
    id: '5',
    name: 'Stoneclough Primary School',
    description: 'Outstanding primary school serving children aged 4-11. Excellent OFSTED rating and strong community links.',
    layer: 'Mind',
    category: { id: 'education', name: 'Mind & Learning', color: '#3B82F6' },
    coordinates: { latitude: 53.5535, longitude: -2.3775 },
    address: { formatted: 'School Road, Stoneclough' },
    priority: 'high',
    tags: ['education', 'primary school', 'children', 'learning'],
    photos: [
      {
        id: 'photo5',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400',
        caption: 'School building and playground',
        alt_text: 'Modern primary school building'
      }
    ],
    created_at: '2024-01-10T11:20:00Z',
    creator: { id: 'user5', display_name: 'Head Teacher', avatar_url: null },
    social_counts: { likes: 28, comments: 9, shares: 4 },
    is_verified: true,
    status: 'active'
  },
  {
    id: '6',
    name: 'Village Health Centre',
    description: 'Local GP practice and health services. Appointments, health checks, and community wellness programs.',
    layer: 'Pulse',
    category: { id: 'wellbeing', name: 'Wellbeing & Health', color: '#EC4899' },
    coordinates: { latitude: 53.5520, longitude: -2.3763 },
    address: { formatted: 'Health Centre Way, Stoneclough' },
    priority: 'high',
    tags: ['healthcare', 'GP', 'wellness', 'medical'],
    photos: [
      {
        id: 'photo6',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400',
        caption: 'Modern health centre',
        alt_text: 'Healthcare facility exterior'
      }
    ],
    created_at: '2024-01-12T13:00:00Z',
    creator: { id: 'user6', display_name: 'Dr. Patricia Wilson', avatar_url: null },
    social_counts: { likes: 35, comments: 7, shares: 6 },
    is_verified: true,
    status: 'active'
  },
  {
    id: '7',
    name: 'River Irwell Cleanup',
    description: 'Monthly volunteer cleanup of the River Irwell. Help protect local wildlife and improve water quality.',
    layer: 'Circle',
    category: { id: 'environment', name: 'Environment & Sustainability', color: '#059669' },
    coordinates: { latitude: 53.5515, longitude: -2.3780 },
    address: { formatted: 'River Path, Stoneclough' },
    priority: 'normal',
    tags: ['environment', 'cleanup', 'river', 'volunteers'],
    photos: [
      {
        id: 'photo7',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        caption: 'River cleanup volunteers',
        alt_text: 'Volunteers cleaning riverbank'
      }
    ],
    created_at: '2024-01-25T08:30:00Z',
    creator: { id: 'user7', display_name: 'Green Stoneclough', avatar_url: null },
    social_counts: { likes: 22, comments: 11, shares: 9 },
    is_verified: false,
    status: 'active'
  },
  {
    id: '8',
    name: 'Village Hall Renovation',
    description: 'Historic village hall undergoing major renovation. New heating, accessibility improvements, and modern facilities.',
    layer: 'Works',
    category: { id: 'projects', name: 'Projects & Infrastructure', color: '#F59E0B' },
    coordinates: { latitude: 53.5532, longitude: -2.3758 },
    address: { formatted: 'Village Hall, Main Street, Stoneclough' },
    priority: 'high',
    tags: ['renovation', 'heritage', 'community space', 'accessibility'],
    photos: [
      {
        id: 'photo8',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
        caption: 'Village hall renovation work',
        alt_text: 'Building renovation in progress'
      }
    ],
    created_at: '2024-01-08T15:45:00Z',
    creator: { id: 'user8', display_name: 'Village Committee', avatar_url: null },
    social_counts: { likes: 38, comments: 18, shares: 7 },
    is_verified: true,
    status: 'active',
    fund_eligible: true,
    fund_requested_amount: 45000
  }
];

export default SAMPLE_PINS;
