// SILAS Category Framework v3.0
// Unified 8-category system for comprehensive community intelligence platform

import { 
  Church, Hammer, Briefcase, Leaf, Users, BookOpen, Heart, Scale,
  Building, TreePine, ShoppingCart, Lightbulb, Activity, Camera,
  Music, Palette, GraduationCap, Stethoscope, MessageCircle, Zap
} from 'lucide-react';

export const SILAS_CATEGORY_FRAMEWORK_V3 = {
  // 🔶 1. Faith & Fellowship
  faith: {
    name: 'Faith & Fellowship',
    description: 'Strengthen spiritual life, local parishes, and moral resilience',
    tone: 'Hopeful, reflective, and community-oriented',
    color: '#8B5CF6',
    icon: Church,
    
    subcategories: {
      parishLife: { name: 'Parish Life', icon: Church, color: '#8B5CF6' },
      scriptureStudy: { name: 'Scripture Study', icon: BookOpen, color: '#A78BFA' },
      services: { name: 'Services & Worship', icon: Heart, color: '#C4B5FD' },
      outreach: { name: 'Outreach & Service', icon: Users, color: '#DDD6FE' },
      disastersAid: { name: 'Disasters & Aid', icon: Heart, color: '#EDE9FE' }
    },
    
    pinTypes: ['Churches', 'Prayer Groups', 'Study Circles', 'Service Events', 'Charity Efforts'],
    socialFeatures: {
      discussions: true,
      content: true,
      events: true,
      livestream: true
    }
  },

  // 🔶 2. Projects & Infrastructure
  projects: {
    name: 'Projects & Infrastructure',
    description: 'Build resilient infrastructure and sustainable community projects',
    tone: 'Practical, collaborative, and solution-oriented',
    color: '#F59E0B',
    icon: Hammer,
    
    subcategories: {
      construction: { name: 'Construction', icon: Building, color: '#F59E0B' },
      energy: { name: 'Energy Systems', icon: Zap, color: '#FBBF24' },
      transportation: { name: 'Transportation', icon: Activity, color: '#FCD34D' },
      utilities: { name: 'Utilities', icon: Hammer, color: '#FDE68A' },
      maintenance: { name: 'Maintenance & Repair', icon: Hammer, color: '#FEF3C7' }
    },
    
    pinTypes: ['Construction Sites', 'Solar Installations', 'Community Gardens', 'Repair Cafes', 'Infrastructure Projects'],
    socialFeatures: {
      discussions: true,
      collaboration: true,
      progress: true,
      volunteers: true
    }
  },

  // 🔶 3. Economy & Commerce
  economy: {
    name: 'Economy & Commerce',
    description: 'Foster local economy, entrepreneurship, and sustainable business',
    tone: 'Enterprising, collaborative, and growth-focused',
    color: '#10B981',
    icon: Briefcase,
    
    subcategories: {
      localBusiness: { name: 'Local Business', icon: Briefcase, color: '#10B981' },
      marketplace: { name: 'Marketplace', icon: ShoppingCart, color: '#34D399' },
      cooperatives: { name: 'Cooperatives', icon: Users, color: '#6EE7B7' },
      skillShare: { name: 'Skill Share', icon: Lightbulb, color: '#A7F3D0' },
      finance: { name: 'Local Finance', icon: Heart, color: '#D1FAE5' }
    },
    
    pinTypes: ['Local Shops', 'Farmers Markets', 'Artisan Studios', 'Service Providers', 'Co-working Spaces'],
    socialFeatures: {
      discussions: true,
      marketplace: true,
      networking: true,
      reviews: true
    }
  },

  // 🔶 4. Environment & Sustainability
  environment: {
    name: 'Environment & Sustainability',
    description: 'Protect and enhance our natural environment for future generations',
    tone: 'Caring, responsible, and forward-thinking',
    color: '#059669',
    icon: Leaf,
    
    subcategories: {
      conservation: { name: 'Conservation', icon: TreePine, color: '#059669' },
      renewable: { name: 'Renewable Energy', icon: Zap, color: '#047857' },
      waste: { name: 'Waste Management', icon: Activity, color: '#065F46' },
      biodiversity: { name: 'Biodiversity', icon: Leaf, color: '#064E3B' },
      climate: { name: 'Climate Action', icon: TreePine, color: '#022C22' }
    },
    
    pinTypes: ['Nature Reserves', 'Recycling Centers', 'Green Spaces', 'Environmental Projects', 'Wildlife Areas'],
    socialFeatures: {
      discussions: true,
      monitoring: true,
      action: true,
      education: true
    }
  },

  // 🔶 5. Community & Social
  community: {
    name: 'Community & Social',
    description: 'Strengthen social bonds and community connections',
    tone: 'Welcoming, inclusive, and celebratory',
    color: '#EF4444',
    icon: Users,
    
    subcategories: {
      socialEvents: { name: 'Social Events', icon: Users, color: '#EF4444' },
      culturalLife: { name: 'Cultural Life', icon: Palette, color: '#F87171' },
      sports: { name: 'Sports & Recreation', icon: Activity, color: '#FCA5A5' },
      youth: { name: 'Youth Programs', icon: Users, color: '#FECACA' },
      seniors: { name: 'Senior Services', icon: Heart, color: '#FEE2E2' }
    },
    
    pinTypes: ['Community Centers', 'Event Venues', 'Sports Facilities', 'Cultural Centers', 'Meeting Spaces'],
    socialFeatures: {
      discussions: true,
      events: true,
      groups: true,
      activities: true
    }
  },

  // 🔶 6. Heritage & Culture
  heritage: {
    name: 'Heritage & Culture',
    description: 'Preserve and celebrate local history and cultural traditions',
    tone: 'Respectful, educational, and preserving',
    color: '#7C3AED',
    icon: BookOpen,
    
    subcategories: {
      history: { name: 'Local History', icon: BookOpen, color: '#7C3AED' },
      monuments: { name: 'Monuments & Landmarks', icon: Building, color: '#8B5CF6' },
      traditions: { name: 'Cultural Traditions', icon: Palette, color: '#A78BFA' },
      arts: { name: 'Arts & Crafts', icon: Camera, color: '#C4B5FD' },
      stories: { name: 'Community Stories', icon: MessageCircle, color: '#DDD6FE' }
    },
    
    pinTypes: ['Historical Sites', 'Museums', 'Art Galleries', 'Cultural Centers', 'Heritage Trails'],
    socialFeatures: {
      discussions: true,
      stories: true,
      preservation: true,
      education: true
    }
  },

  // 🔶 7. Wellbeing & Health
  wellbeing: {
    name: 'Wellbeing & Health',
    description: 'Promote physical, mental, and social wellbeing for all community members',
    tone: 'Caring, supportive, and health-focused',
    color: '#EC4899',
    icon: Heart,
    
    subcategories: {
      healthcare: { name: 'Healthcare Services', icon: Heart, color: '#EC4899' },
      fitness: { name: 'Fitness & Exercise', icon: Activity, color: '#F472B6' },
      mental: { name: 'Mental Health', icon: Heart, color: '#F9A8D4' },
      nutrition: { name: 'Nutrition & Food', icon: Leaf, color: '#FBCFE8' },
      support: { name: 'Support Groups', icon: Users, color: '#FDF2F8' }
    },
    
    pinTypes: ['Health Clinics', 'Fitness Centers', 'Wellness Programs', 'Support Groups', 'Mental Health Services'],
    socialFeatures: {
      discussions: true,
      support: true,
      programs: true,
      resources: true
    }
  },

  // 🔶 8. Governance & Civic
  governance: {
    name: 'Governance & Civic',
    description: 'Democratic participation and transparent community decision-making',
    tone: 'Transparent, democratic, and accountable',
    color: '#3B82F6',
    icon: Scale,
    
    subcategories: {
      council: { name: 'Local Council', icon: Building, color: '#3B82F6' },
      voting: { name: 'Voting & Elections', icon: Scale, color: '#60A5FA' },
      planning: { name: 'Planning & Development', icon: Hammer, color: '#93C5FD' },
      transparency: { name: 'Transparency', icon: BookOpen, color: '#BFDBFE' },
      participation: { name: 'Civic Participation', icon: Users, color: '#DBEAFE' }
    },
    
    pinTypes: ['Council Offices', 'Polling Stations', 'Public Meetings', 'Planning Applications', 'Civic Centers'],
    socialFeatures: {
      discussions: true,
      voting: true,
      transparency: true,
      participation: true
    }
  }
};

// Utility functions for the framework
export const getCategoryBySlug = (slug) => {
  return SILAS_CATEGORY_FRAMEWORK_V3[slug] || null;
};

export const getAllCategories = () => {
  return Object.keys(SILAS_CATEGORY_FRAMEWORK_V3).map(key => ({
    slug: key,
    ...SILAS_CATEGORY_FRAMEWORK_V3[key]
  }));
};

export const getCategoryColor = (categorySlug) => {
  return SILAS_CATEGORY_FRAMEWORK_V3[categorySlug]?.color || '#4C764C';
};

export const getCategoryIcon = (categorySlug) => {
  return SILAS_CATEGORY_FRAMEWORK_V3[categorySlug]?.icon || Users;
};

// Export both for compatibility
export { SILAS_CATEGORY_FRAMEWORK_V3 as SILAS_CATEGORY_FRAMEWORK };
export default SILAS_CATEGORY_FRAMEWORK_V3;
