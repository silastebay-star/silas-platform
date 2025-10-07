export type CategoryKey =
  | 'community'
  | 'faith'
  | 'projects'
  | 'economy'
  | 'events'
  | 'data_ai'
  | 'issues'; // issues is an overlay

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
    key: 'community',
    label: 'Community & Groups',
    description: 'Groups, clubs and membership hubs',
    purpose: 'Build unity, belonging, and shared purpose. The foundation of the SILAS ecosystem — for churches, local clubs, volunteer groups, and civic organizations.',
    color: '#6B8E6B',
    accent: '#4C764C',
    icon: '👥',
    features: [
      'Group Pages (profiles, member lists, posts)',
      'Local Boards & Forums',
      'Join/Follow/Message',
      'Shared projects & announcements'
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
    key: 'events',
    label: 'Events & Experiences',
    description: 'Community events & booking',
    purpose: 'Celebrate local life and participation. Central calendar for community, culture, and civic gatherings.',
    color: '#8CBFA5',
    accent: '#7DAA95',
    icon: '📅',
    features: [
      'Interactive Map Calendar',
      'RSVP & ticketing via Stripe integration',
      'Event Pins (visible to all users)',
      'Media galleries and story recaps',
      'AI Event Assistant (auto-generate posts and posters)'
    ]
  },
  {
    key: 'data_ai',
    label: 'Data, AI & Insight',
    description: 'Dashboards, polls, civic analytics',
    purpose: 'Empower decision-making through data transparency. Transforms census data, polls, and platform analytics into actionable insight for governance and community strategy.',
    color: '#5E6E6E',
    accent: '#D1D5DB',
    icon: '📊',
    features: [
      'Community Dashboard (Census, fund, engagement)',
      'Polls & Surveys (feed back into AI)',
      'AI Civic Analyst (localized RAG agent trained on community data)',
      'Project outcomes visualization',
      'Public transparency report'
    ]
  },
  {
    key: 'issues',
    label: 'Issues & Response',
    description: 'Incidents and urgent reports (overlay)',
    purpose: 'Quick community alerts — disasters, repairs, safety. Special pins for emergency coordination.',
    color: '#C97340',
    accent: '#C4511F',
    icon: '⚠️',
    features: [
      '"Issue Pins" with location and photos',
      'Urgent broadcast messages',
      'Local authority communication bridge',
      'Escalation / Resolution tracking'
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
