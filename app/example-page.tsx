/**
 * Example Page using the new Unified Layout System
 * Demonstrates how to use all the new navigation and layout components
 */

'use client'

import { useState } from 'react'
import { MapPin, Users, Calendar, TrendingUp, Plus, Filter, Search } from 'lucide-react'
import UnifiedLayout, { DashboardLayout, ContentLayout, MapLayout } from '@/components/layout/UnifiedLayout'
import { PageSection } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// Example Dashboard Page
export function ExampleDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: MapPin },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Overview', href: '/dashboard/overview' }
  ]
  
  const pageActions = (
    <>
      <Button variant="outline" size="sm" className="">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button variant="default" size="sm" className="">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>
    </>
  )
  
  return (
    <DashboardLayout
      pageTitle="Community Dashboard"
      pageSubtitle="Overview of community activity and projects"
      pageDescription="Track community engagement, project progress, and member activity across Stoneclough."
      pageBadge="Beta"
      pageActions={pageActions}
      breadcrumbItems={breadcrumbItems}
      onAddPin={() => console.log('Add pin clicked')}
      onOpenChat={() => console.log('Open chat clicked')}
    >
      {/* Stats Overview */}
      <PageSection
        title="Quick Stats"
        description="Key metrics for community engagement"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+18 new this week</p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">3 upcoming</p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="">
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>
      
      {/* Recent Activity */}
      <PageSection
        title="Recent Activity"
        description="Latest updates from the community"
        headerActions={
          <Button variant="outline" size="sm" className="">
            View All
          </Button>
        }
      >
        <div className="space-y-4">
          {[
            { action: 'New pin added', location: 'High Street', time: '5 minutes ago', type: 'pin' },
            { action: 'Event scheduled', location: 'Community Garden', time: '1 hour ago', type: 'event' },
            { action: 'Project funded', location: 'Town Hall Meeting', time: '2 hours ago', type: 'funding' },
            { action: 'Comment posted', location: 'Local Business Support', time: '3 hours ago', type: 'comment' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'pin' ? 'bg-silas-green' :
                  activity.type === 'event' ? 'bg-blue-500' :
                  activity.type === 'funding' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.location}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </PageSection>
    </DashboardLayout>
  )
}

// Example Content Page
export function ExampleContentPage() {
  return (
    <ContentLayout
      pageTitle="Community Guidelines"
      pageSubtitle="How to participate in the SILAS community"
      pageDescription="Learn about our community values, guidelines, and best practices for contributing to local projects."
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Community', href: '/community' },
        { label: 'Guidelines', href: '/community/guidelines' }
      ]}
    >
      <PageSection title="Community Values">
        <div className="prose max-w-none">
          <p>
            The SILAS community is built on principles of transparency, collaboration, and local empowerment. 
            We believe in the power of community-driven initiatives to create positive change.
          </p>
          
          <h3>Our Core Values</h3>
          <ul>
            <li><strong>Transparency:</strong> All community decisions and funding are made openly</li>
            <li><strong>Inclusion:</strong> Everyone has a voice in shaping our community</li>
            <li><strong>Sustainability:</strong> We prioritize long-term community benefit</li>
            <li><strong>Collaboration:</strong> We work together to achieve common goals</li>
          </ul>
        </div>
      </PageSection>
      
      <PageSection 
        title="Participation Guidelines"
        collapsible={true}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Adding Community Pins</h4>
            <p className="text-blue-800 text-sm">
              When adding pins to the community map, ensure they represent genuine community needs or opportunities.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Funding Proposals</h4>
            <p className="text-green-800 text-sm">
              All funding proposals should include clear objectives, timelines, and community benefit assessments.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Community Events</h4>
            <p className="text-yellow-800 text-sm">
              Events should be inclusive, accessible, and aligned with community values and needs.
            </p>
          </div>
        </div>
      </PageSection>
    </ContentLayout>
  )
}

// Example Map Page
export function ExampleMapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <MapLayout
      onAddPin={() => console.log('Add pin to map')}
      onOpenChat={() => console.log('Open map chat')}
    >
      {/* Map would go here */}
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-silas-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Map</h2>
          <p className="text-gray-600 mb-4">Interactive map component would be rendered here</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="default" size="sm" className="">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MapLayout>
  )
}

// Example of using the base UnifiedLayout with custom configuration
export function ExampleCustomPage() {
  return (
    <UnifiedLayout
      pageTitle="Custom Layout Example"
      pageSubtitle="Demonstrating flexible layout options"
      showFloatingNav={true}
      showSidebar={true}
      showFloatingWidgets={true}
      showBreadcrumbs={true}
      contentMaxWidth="xl"
      contentPadding="lg"
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Examples', href: '/examples' },
        { label: 'Custom Layout', href: '/examples/custom' }
      ]}
      pageActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="">Secondary</Button>
          <Button variant="default" size="sm" className="">Primary Action</Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="">
            <CardHeader className="">
              <CardTitle className="">Feature Showcase</CardTitle>
            </CardHeader>
            <CardContent className="">
              <p className="text-gray-600">
                This layout demonstrates the flexibility of the unified layout system with:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="">✓</Badge>
                  Floating navigation with search
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="">✓</Badge>
                  Enhanced sidebar with history
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="">✓</Badge>
                  Contextual floating widgets
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="">✓</Badge>
                  Keyboard shortcuts
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="">✓</Badge>
                  Breadcrumb navigation
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="">
            <CardHeader className="">
              <CardTitle className="">Navigation State</CardTitle>
            </CardHeader>
            <CardContent className="">
              <p className="text-gray-600 mb-4">
                The navigation state is managed centrally with persistence:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current View:</span>
                  <Badge variant="default" className="">Custom</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Layout Mode:</span>
                  <Badge variant="outline" className="">Floating</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Sidebar State:</span>
                  <Badge variant="secondary" className="">Expanded</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  )
}
