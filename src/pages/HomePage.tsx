import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Heart, Lightbulb, Briefcase, Leaf } from 'lucide-react';
import { Button } from '@/core/components/Button';

const HomePage: React.FC = () => {
  const categories = [
    { name: 'Faith & Fellowship', icon: Heart, color: '#8B5CF6', description: 'Spiritual life and community bonds' },
    { name: 'Projects & Infrastructure', icon: Lightbulb, color: '#F59E0B', description: 'Building resilient infrastructure' },
    { name: 'Economy & Commerce', icon: Briefcase, color: '#10B981', description: 'Local business and entrepreneurship' },
    { name: 'Environment & Sustainability', icon: Leaf, color: '#059669', description: 'Protecting our natural environment' },
    { name: 'Community & Social', icon: Users, color: '#EF4444', description: 'Strengthening social connections' },
    { name: 'Wellbeing & Health', icon: Heart, color: '#EC4899', description: 'Promoting community health' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#4C764C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to SILAS
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Stoneclough Initiative for Local & Autonomous Systems
            </p>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-green-50">
              A faith-guided, data-informed platform that empowers communities to vote, build, restore, and thrive — 
              uniting local economy, environment, and wellbeing through transparent collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/map">
                <Button size="lg" className="bg-white text-[#4C764C] hover:bg-gray-100">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore Community Map
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#4C764C]">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Community Pillars
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            SILAS organizes community life around six core pillars, each representing 
            essential aspects of thriving local communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <IconComponent 
                      className="w-6 h-6" 
                      style={{ color: category.color }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for community collaboration and decision-making
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4C764C] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-gray-600">
                Visualize community activities, projects, and resources on an interactive map
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#4C764C] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Social Collaboration</h3>
              <p className="text-gray-600">
                Connect with neighbors, share ideas, and collaborate on community projects
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#4C764C] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Fund</h3>
              <p className="text-gray-600">
                Democratic funding for community projects through transparent voting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Community Together?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join Stoneclough residents in creating a more connected, sustainable, and thriving community.
          </p>
          <Link to="/map">
            <Button size="lg" className="bg-[#4C764C] hover:bg-[#3d5f3d]">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
