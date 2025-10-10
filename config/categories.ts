export type CategoryKey =
  | 'groups'
  | 'projects'
  | 'culture'
  | 'economy'
  | 'environment'
  | 'safety'
  | 'faith'
  | 'data_ai'
  | 'issues'
  | 'infrastructure'
  | 'education'
  | 'governance'
  | 'housing';

export interface Category {
  key: CategoryKey;
  label: string;
  description: string;
  color: string;
  accent: string;
  icon: string;
  purpose: string;
  features: string[];
}

export const CATEGORIES: Category[] = [
  {
    key: 'groups',
    label: 'Groups & Collectives',
    description: 'Open community collectives for action.',
    purpose: 'Organize into open collectives to launch projects, add pins, and host events. The engine of community action.',
    color: '#6B8E6B',
    accent: '#4C764C',
    icon: '👥',
    features: [
      'Group Pages (profiles, member lists, posts)',
      'Public membership lists',
      'Transparent polls for group decisions',
      'Activity dashboards and goal tracking'
    ]
  },
  {
    key: 'housing',
    label: 'Housing & Community Life',
    description: 'Resident welfare and neighborhood support.',
    purpose: 'Support shared housing projects, co-ops, neighborhood watch, and resident welfare.',
    color: '#F97316',
    accent: '#EA580C',
    icon: '🏠',
    features: [
      'Resident Registry',
      'Neighborhood Feeds by street/block',
      'Geo-notified Security Alerts',
      'Shared Community Calendar'
    ]
  },
  {
    key: 'projects',
    label: 'Projects & Initiatives',
    description: 'Local action & volunteer projects',
    purpose: 'Execute and track local efforts. Where users turn ideas into action — cleanups, infrastructure, education, outreach.',
    color: '#4C764C',
    accent: '#5D8B5D',
    icon: '🔨',
    features: [
      'Project Pins (linked areas, progress tracker)',
      'Funding applications & Doer profiles',
      'Progress dashboards (community impact)',
      'Volunteer management tools',
      'AI Task Planner (auto-generate project milestones)'
    ]
  },
  {
    key: 'culture',
    label: 'Arts & Culture',
    description: 'Creative expression and cultural identity.',
    purpose: 'Preserve and amplify cultural identity and creative expression.',
    color: '#A855F7',
    accent: '#9333EA',
    icon: '🎨',
    features: [
      'Event Calendar with RSVP',
      'Story Maps for historical overlays',
      'Cultural project voting',
      'Local artist network',
      'Public media archive'
    ]
  },
  {
    key: 'economy',
    label: 'Economy & Commerce',
    description: 'Local businesses, marketplaces',
    purpose: 'Strengthen local enterprise and self-sufficiency. Empower entrepreneurs and microbusinesses through visibility, collaboration, and community funding.',
    color: '#4C6F76',
    accent: '#3F5E61',
    icon: '💼',
    features: [
      'Local Business Directory',
      'Entrepreneur Pins (funding requests, goals)',
      'Marketplace / Service Exchange',
      'Micro-funding requests (Community Fund integration)',
      'AI Business Mentor (basic RAG agent for growth support)'
    ]
  },
  {
    key: 'environment',
    label: 'Environment & Wildlife',
    description: 'Environmental protection & wildlife conservation',
    purpose: 'Protect and enhance our natural environment. Monitor local ecosystems, coordinate conservation efforts, and promote sustainable practices.',
    color: '#059669',
    accent: '#047857',
    icon: '🌿',
    features: [
      'Wildlife Monitoring & Reporting',
      'Environmental Impact Tracking',
      'Conservation Project Coordination',
      'Pollution & Hazard Reporting',
      'AI Environmental Analyst (ecosystem health insights)'
    ]
  },
  {
    key: 'safety',
    label: 'Safety & Response',
    description: 'Emergency response & community safety',
    purpose: 'Ensure community safety and emergency preparedness. Coordinate rapid response to incidents, maintain safety infrastructure, and build resilient communities.',
    color: '#DC2626',
    accent: '#B91C1C',
    icon: '🚨',
    features: [
      'Emergency Alert System',
      'Incident Reporting & Tracking',
      'Emergency Services Coordination',
      'Safety Infrastructure Monitoring',
      'AI Risk Assessment (predictive safety analytics)'
    ]
  },
  {
    key: 'faith',
    label: 'Faith & Reflection',
    description: 'Services, chaplaincy, reflections',
    purpose: 'Provide a moral and cultural framework — open to all but grounded in biblical wisdom expressed in universal language. Focuses on inner life, reflection, meaning, and collective direction.',
    color: '#3A5D3A',
    accent: '#2F5C2F',
    icon: '🙏',
    features: [
      'Reflection Cards / Daily Wisdom',
      'Service Schedules (for local parishes)',
      'Scripture-inspired essays (secular tone)',
      'Chaplaincy & Well-being support directory',
      'AI Reflection Assistant (secular but biblically aligned tone)'
    ]
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure & Planning',
    description: 'Track, propose, and discuss infrastructure projects.',
    purpose: 'Empower citizens to track, propose, and discuss local infrastructure improvements.',
    color: '#64748B',
    accent: '#475569',
    icon: '🔧',
    features: [
      'Proposal Voting',
      'Funding Requests',
      'Progress Tracker',
      'Public Comments',
      'Census Integration'
    ]
  },
  {
    key: 'education',
    label: 'Education & Skills',
    description: 'Community learning and development.',
    purpose: 'Enable collaboration between schools, students, and community education initiatives.',
    color: '#3B82F6',
    accent: '#2563EB',
    icon: '🎓',
    features: [
      'Learning Hub',
      'Mentorship Network',
      'Skill Badge System',
      'Project API for school data'
    ]
  },
  {
    key: 'governance',
    label: 'Governance & Democracy',
    description: 'Transparent decision-making for the community.',
    purpose: 'Provide transparent, decentralized decision-making at every level.',
    color: '#4F46E5',
    accent: '#4338CA',
    icon: '⚖️',
    features: [
      'Voting Engine',
      'Proposal Lifecycle Management',
      'Transparency Ledger',
      'Decision Dashboard'
    ]
  },
  {
    key: 'data_ai',
    label: 'Data, AI & Insight',
    description: 'Dashboards, polls, civic analytics',
    purpose: 'Empower decision-making through data transparency. Transforms census data, polls, and platform analytics into actionable insight for governance and community strategy.',
    color: '#5E6E6E',
    accent: '#4B5563',
    icon: '📊',
    features: [
      'Community Dashboard (Census, fund, engagement)',
      'Polls & Surveys (feed back into AI)',
      'AI Civic Analyst (localized RAG agent trained on community data)',
      'Project outcomes visualization',
      'Public transparency report'
    ]
  }
];

export const getCategoryByKey = (key: CategoryKey): Category | undefined => {
  return CATEGORIES.find(cat => cat.key === key);
};

export const getCategoryColor = (key: CategoryKey): string => {
  const category = getCategoryByKey(key);
  return category?.color || '#6B7280';
};

export const getCategoryAccent = (key: CategoryKey): string => {
  const category = getCategoryByKey(key);
  return category?.accent || '#4B5563';
};
