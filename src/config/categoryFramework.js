// SILAS Category Framework v3.0
// Unified 8-category system for comprehensive community intelligence
// Building on existing Supabase setup and pin system

import {
  Church, Heart, BookOpen, Users, Briefcase, ShoppingCart,
  Hammer, Zap, TreePine, MessageCircle, GraduationCap, Lightbulb,
  Activity, Leaf, Palette, Music, Camera, Scale, Building, Recycle,
  Stethoscope
} from 'lucide-react';

export const SILAS_CATEGORY_FRAMEWORK = {
  // 🔶 1. Faith & Fellowship
  faith: {
    name: 'Faith & Fellowship',
    description: 'Strengthen spiritual life, local parishes, and moral resilience',
    tone: 'Hopeful, reflective, and community-oriented',
    color: '#8B5CF6',
    icon: Church,
    
    subcategories: {
      parishLife: {
        name: 'Parish Life',
        description: 'Local church activities and community worship',
        icon: Church,
        color: '#8B5CF6'
      },
      scriptureStudy: {
        name: 'Scripture Study',
        description: 'Bible study groups and theological discussions',
        icon: BookOpen,
        color: '#A78BFA'
      },
      services: {
        name: 'Services',
        description: 'Worship services, ceremonies, and spiritual events',
        icon: Heart,
        color: '#7C3AED'
      },
      outreach: {
        name: 'Outreach',
        description: 'Community service and charitable activities',
        icon: Users,
        color: '#9333EA'
      },
      disastersAid: {
        name: 'Disasters & Aid',
        description: 'Emergency response and disaster relief efforts',
        icon: Heart,
        color: '#C084FC'
      }
    },

    pinTypes: [
      'Churches', 'Prayer Groups', 'Study Circles', 'Service Events', 
      'Charity Efforts', 'Food Banks', 'Homeless Shelters', 'Community Kitchens'
    ],

    socialFeatures: {
      discussions: ['Scripture Discussions', 'Sermon Reflections', 'Prayer Requests'],
      content: ['Sermon Uploads', 'Livestreams', 'Daily Devotionals'],
      events: ['Service Schedules', 'Study Groups', 'Outreach Events'],
      polls: ['Scripture-based Polls', 'Community Needs Assessment']
    },

    integrations: {
      parishAccounts: 'Special privileges for verified parish leaders',
      sermonSchedule: 'Automated service time management',
      prayerWall: 'Community prayer request system',
      scriptureOfDay: 'Daily scripture sharing feature'
    }
  },

  // 🔶 2. Projects & Infrastructure
  projects: {
    name: 'Projects & Infrastructure',
    description: 'Build resilient infrastructure and sustainable community projects',
    tone: 'Practical, collaborative, and solution-oriented',
    color: '#10B981',
    icon: Briefcase,
    
    subcategories: {
      localBusiness: {
        name: 'Local Business',
        description: 'Small businesses and local entrepreneurs',
        icon: Briefcase,
        color: '#10B981'
      },
      marketplace: {
        name: 'Marketplace',
        description: 'Buy, sell, and trade local goods and services',
        icon: ShoppingCart,
        color: '#34D399'
      },
      cooperatives: {
        name: 'Cooperatives',
        description: 'Community-owned businesses and shared resources',
        icon: Users,
        color: '#059669'
      },
      skillShare: {
        name: 'Skill Share',
        description: 'Professional services and skill exchange',
        icon: Lightbulb,
        color: '#6EE7B7'
      },
      localCurrency: {
        name: 'Local Currency',
        description: 'Community currency and alternative exchange systems',
        icon: Heart,
        color: '#047857'
      }
    },

    pinTypes: [
      'Local Shops', 'Farmers Markets', 'Artisan Studios', 'Service Providers',
      'Co-working Spaces', 'Business Incubators', 'Trade Schools', 'Credit Unions'
    ],

    socialFeatures: {
      discussions: ['Business Networking', 'Market Trends', 'Success Stories'],
      content: ['Product Showcases', 'Business Tips', 'Local Deals'],
      events: ['Networking Events', 'Trade Shows', 'Business Workshops'],
      reviews: ['Business Reviews', 'Service Ratings', 'Recommendations']
    },

    integrations: {
      businessDirectory: 'Comprehensive local business listings',
      localDeals: 'Special offers and community discounts',
      skillExchange: 'Professional skill sharing platform',
      marketCalendar: 'Local market and event scheduling'
    }
  },

  // 🔶 3. Works & Infrastructure
  works: {
    name: 'Works & Infrastructure',
    description: 'Build resilient infrastructure and sustainable community projects',
    tone: 'Practical, collaborative, and solution-oriented',
    color: '#F59E0B',
    icon: Hammer,
    
    subcategories: {
      construction: {
        name: 'Construction',
        description: 'Building projects and infrastructure development',
        icon: Hammer,
        color: '#F59E0B'
      },
      energy: {
        name: 'Energy',
        description: 'Renewable energy and power infrastructure',
        icon: Zap,
        color: '#FBBF24'
      },
      environment: {
        name: 'Environment',
        description: 'Environmental projects and sustainability initiatives',
        icon: TreePine,
        color: '#D97706'
      },
      transportation: {
        name: 'Transportation',
        description: 'Community transport and mobility solutions',
        icon: Users,
        color: '#F97316'
      },
      utilities: {
        name: 'Utilities',
        description: 'Water, waste, and essential service infrastructure',
        icon: Zap,
        color: '#EA580C'
      }
    },

    pinTypes: [
      'Construction Sites', 'Solar Installations', 'Community Gardens', 'Repair Cafes',
      'Tool Libraries', 'Maker Spaces', 'Recycling Centers', 'Water Projects'
    ],

    socialFeatures: {
      discussions: ['Project Planning', 'Technical Solutions', 'Resource Sharing'],
      content: ['Progress Updates', 'How-to Guides', 'Project Documentation'],
      events: ['Work Days', 'Skill Workshops', 'Planning Meetings'],
      collaboration: ['Volunteer Coordination', 'Resource Pooling', 'Skill Matching']
    },

    integrations: {
      projectManagement: 'Collaborative project planning tools',
      resourceSharing: 'Community tool and material sharing',
      volunteerCoordination: 'Organized volunteer management',
      progressTracking: 'Visual project progress monitoring'
    }
  },

  // 🔶 4. Circle & Community
  circle: {
    name: 'Circle & Community',
    description: 'Strengthen social bonds, cultural life, and community connections',
    tone: 'Warm, inclusive, and celebratory',
    color: '#EF4444',
    icon: Users,
    
    subcategories: {
      socialEvents: {
        name: 'Social Events',
        description: 'Community gatherings and social activities',
        icon: Users,
        color: '#EF4444'
      },
      culturalLife: {
        name: 'Cultural Life',
        description: 'Arts, music, and cultural celebrations',
        icon: Palette,
        color: '#F87171'
      },
      sports: {
        name: 'Sports & Recreation',
        description: 'Athletic activities and recreational pursuits',
        icon: Activity,
        color: '#DC2626'
      },
      familyLife: {
        name: 'Family Life',
        description: 'Family-oriented activities and childcare',
        icon: Heart,
        color: '#FCA5A5'
      },
      elderCare: {
        name: 'Elder Care',
        description: 'Support and activities for senior community members',
        icon: Heart,
        color: '#B91C1C'
      }
    },

    pinTypes: [
      'Community Centers', 'Parks & Playgrounds', 'Sports Facilities', 'Art Studios',
      'Music Venues', 'Libraries', 'Senior Centers', 'Youth Programs'
    ],

    socialFeatures: {
      discussions: ['Event Planning', 'Community News', 'Interest Groups'],
      content: ['Event Photos', 'Community Stories', 'Cultural Showcases'],
      events: ['Social Gatherings', 'Cultural Events', 'Sports Leagues'],
      groups: ['Interest Groups', 'Age-based Communities', 'Activity Clubs']
    },

    integrations: {
      eventCalendar: 'Community-wide event coordination',
      groupManagement: 'Interest group organization tools',
      photoSharing: 'Community photo and memory sharing',
      volunteerMatching: 'Event volunteer coordination'
    }
  },

  // 🔶 5. Mind & Learning
  mind: {
    name: 'Mind & Learning',
    description: 'Cultivate knowledge, education, and intellectual growth',
    tone: 'Curious, supportive, and growth-minded',
    color: '#3B82F6',
    icon: GraduationCap,
    
    subcategories: {
      education: {
        name: 'Education',
        description: 'Formal and informal learning opportunities',
        icon: GraduationCap,
        color: '#3B82F6'
      },
      libraries: {
        name: 'Libraries & Resources',
        description: 'Knowledge repositories and learning materials',
        icon: BookOpen,
        color: '#60A5FA'
      },
      workshops: {
        name: 'Workshops & Skills',
        description: 'Practical skill development and training',
        icon: Lightbulb,
        color: '#2563EB'
      },
      research: {
        name: 'Research & Innovation',
        description: 'Community research and innovation projects',
        icon: Lightbulb,
        color: '#1D4ED8'
      },
      mentorship: {
        name: 'Mentorship',
        description: 'Knowledge sharing and guidance programs',
        icon: Users,
        color: '#93C5FD'
      }
    },

    pinTypes: [
      'Schools', 'Libraries', 'Maker Spaces', 'Research Centers',
      'Study Groups', 'Tutoring Centers', 'Innovation Labs', 'Skill Workshops'
    ],

    socialFeatures: {
      discussions: ['Academic Discussions', 'Research Collaboration', 'Study Groups'],
      content: ['Educational Resources', 'Research Papers', 'Tutorial Videos'],
      events: ['Workshops', 'Lectures', 'Study Sessions'],
      mentorship: ['Mentor Matching', 'Skill Sharing', 'Career Guidance']
    },

    integrations: {
      learningPaths: 'Structured educational progression',
      resourceLibrary: 'Comprehensive learning material database',
      mentorMatching: 'Automated mentor-mentee pairing',
      skillTracking: 'Personal skill development monitoring'
    }
  },

  // 🔶 6. Pulse & Wellness
  pulse: {
    name: 'Pulse & Wellness',
    description: 'Promote health, wellbeing, and community resilience',
    tone: 'Caring, holistic, and health-focused',
    color: '#EC4899',
    icon: Activity,
    
    subcategories: {
      healthcare: {
        name: 'Healthcare',
        description: 'Medical services and health facilities',
        icon: Stethoscope,
        color: '#EC4899'
      },
      mentalHealth: {
        name: 'Mental Health',
        description: 'Mental wellness and emotional support',
        icon: Heart,
        color: '#F472B6'
      },
      fitness: {
        name: 'Fitness & Activity',
        description: 'Physical fitness and active lifestyle',
        icon: Activity,
        color: '#DB2777'
      },
      nutrition: {
        name: 'Nutrition',
        description: 'Healthy eating and food security',
        icon: Leaf,
        color: '#F9A8D4'
      },
      wellness: {
        name: 'Holistic Wellness',
        description: 'Alternative health and wellness practices',
        icon: Leaf,
        color: '#BE185D'
      }
    },

    pinTypes: [
      'Health Clinics', 'Fitness Centers', 'Wellness Centers', 'Community Kitchens',
      'Mental Health Support', 'Therapy Groups', 'Meditation Centers', 'Healing Gardens'
    ],

    socialFeatures: {
      discussions: ['Health Tips', 'Wellness Journey', 'Support Groups'],
      content: ['Wellness Resources', 'Healthy Recipes', 'Exercise Videos'],
      events: ['Fitness Classes', 'Health Screenings', 'Wellness Workshops'],
      support: ['Peer Support Groups', 'Health Challenges', 'Wellness Tracking']
    },

    integrations: {
      healthTracking: 'Community health monitoring tools',
      wellnessPrograms: 'Structured wellness program management',
      supportGroups: 'Peer support group coordination',
      resourceDirectory: 'Health and wellness resource database'
    }
  },

  // 🔶 7. Heritage & Culture
  heritage: {
    name: 'Heritage & Culture',
    description: 'Preserve and celebrate local history and cultural traditions',
    tone: 'Respectful, educational, and preserving',
    color: '#7C3AED',
    icon: BookOpen,

    subcategories: {
      history: {
        name: 'Local History',
        description: 'Historical sites and community heritage',
        icon: BookOpen,
        color: '#7C3AED'
      },
      monuments: {
        name: 'Monuments & Landmarks',
        description: 'Historic buildings and landmarks',
        icon: Building,
        color: '#8B5CF6'
      },
      traditions: {
        name: 'Cultural Traditions',
        description: 'Local customs and cultural practices',
        icon: Palette,
        color: '#A78BFA'
      },
      arts: {
        name: 'Arts & Crafts',
        description: 'Local arts, crafts, and creative expression',
        icon: Camera,
        color: '#C4B5FD'
      },
      stories: {
        name: 'Community Stories',
        description: 'Oral history and community narratives',
        icon: MessageCircle,
        color: '#DDD6FE'
      }
    },

    pinTypes: [
      'Historical Sites', 'Museums', 'Art Galleries', 'Cultural Centers',
      'Heritage Trails', 'Monuments', 'Archives', 'Community Stories'
    ],

    socialFeatures: {
      discussions: ['Historical Research', 'Cultural Exchange', 'Heritage Preservation'],
      content: ['Historical Documents', 'Cultural Artifacts', 'Story Collections'],
      events: ['Heritage Tours', 'Cultural Festivals', 'History Talks'],
      preservation: ['Documentation Projects', 'Restoration Efforts', 'Archive Building']
    },

    integrations: {
      archiveSystem: 'Digital heritage archive management',
      storyCollection: 'Community story gathering and preservation',
      heritageTrails: 'Interactive heritage trail mapping',
      culturalCalendar: 'Cultural events and celebrations tracking'
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
      council: {
        name: 'Local Council',
        description: 'Local government and council activities',
        icon: Building,
        color: '#3B82F6'
      },
      voting: {
        name: 'Voting & Elections',
        description: 'Democratic processes and elections',
        icon: Scale,
        color: '#60A5FA'
      },
      planning: {
        name: 'Planning & Development',
        description: 'Community planning and development projects',
        icon: Hammer,
        color: '#93C5FD'
      },
      transparency: {
        name: 'Transparency',
        description: 'Open government and public information',
        icon: BookOpen,
        color: '#BFDBFE'
      },
      participation: {
        name: 'Civic Participation',
        description: 'Community engagement and citizen involvement',
        icon: Users,
        color: '#DBEAFE'
      }
    },

    pinTypes: [
      'Council Offices', 'Polling Stations', 'Public Meetings', 'Planning Applications',
      'Civic Centers', 'Public Consultations', 'Community Forums', 'Transparency Boards'
    ],

    socialFeatures: {
      discussions: ['Policy Discussions', 'Community Issues', 'Democratic Participation'],
      content: ['Council Minutes', 'Planning Documents', 'Public Information'],
      events: ['Council Meetings', 'Public Consultations', 'Civic Events'],
      voting: ['Community Polls', 'Decision Making', 'Priority Setting']
    },

    integrations: {
      votingSystem: 'Community voting and polling platform',
      transparencyPortal: 'Public information and document access',
      participationTracking: 'Civic engagement monitoring',
      decisionMaking: 'Community decision-making tools'
    }
  }
};

// Utility functions for the framework
export const getCategoryByName = (name) => {
  return Object.values(SILAS_CATEGORY_FRAMEWORK).find(cat => cat.name === name);
};

export const getSubcategoryByPath = (categoryKey, subcategoryKey) => {
  return SILAS_CATEGORY_FRAMEWORK[categoryKey]?.subcategories[subcategoryKey];
};

export const getAllPinTypes = () => {
  return Object.values(SILAS_CATEGORY_FRAMEWORK)
    .flatMap(category => category.pinTypes);
};

export const getCategoryIntegrations = (categoryKey) => {
  return SILAS_CATEGORY_FRAMEWORK[categoryKey]?.integrations || {};
};

export default SILAS_CATEGORY_FRAMEWORK;
