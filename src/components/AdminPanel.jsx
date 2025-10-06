import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, MapPin, Users, Eye, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mockData, setMockData] = useState({
    pendingPins: [
      { id: 1, name: 'New Community Garden', author: 'Sarah M.', priority: 'high', created: '2 hours ago', category: 'Works' },
      { id: 2, name: 'Urgent Road Issue', author: 'John D.', priority: 'urgent', created: '30 minutes ago', category: 'Infrastructure' },
      { id: 3, name: 'Local Business Opening', author: 'Mary K.', priority: 'normal', created: '1 day ago', category: 'Commerce' }
    ],
    issueFlags: [
      { id: 1, pin: 'Broken Street Light', severity: 1, status: 'open', reported: '1 hour ago', reporter: 'Anonymous' },
      { id: 2, pin: 'Pothole on Main St', severity: 2, status: 'in_progress', reported: '3 hours ago', reporter: 'Local Resident' },
      { id: 3, pin: 'Graffiti Report', severity: 3, status: 'resolved', reported: '1 day ago', reporter: 'Community Watch' }
    ],
    stats: {
      totalPins: 127,
      pendingApproval: 3,
      activeIssues: 2,
      resolvedToday: 5,
      communityMembers: 89
    }
  });

  const handleApprovePin = (pinId) => {
    setMockData(prev => ({
      ...prev,
      pendingPins: prev.pendingPins.filter(pin => pin.id !== pinId),
      stats: { ...prev.stats, pendingApproval: prev.stats.pendingApproval - 1 }
    }));
    alert('Pin approved and published to the community!');
  };

  const handleRejectPin = (pinId) => {
    setMockData(prev => ({
      ...prev,
      pendingPins: prev.pendingPins.filter(pin => pin.id !== pinId),
      stats: { ...prev.stats, pendingApproval: prev.stats.pendingApproval - 1 }
    }));
    alert('Pin rejected and removed from queue.');
  };

  const handleUpdateIssue = (issueId, newStatus) => {
    setMockData(prev => ({
      ...prev,
      issueFlags: prev.issueFlags.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    }));
    alert(`Issue status updated to: ${newStatus}`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-orange-600 bg-orange-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-4 bg-white overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Community Admin Panel</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Shield },
                { id: 'pins', label: 'Pin Approvals', icon: MapPin },
                { id: 'issues', label: 'Issue Management', icon: AlertTriangle },
                { id: 'users', label: 'Community', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{mockData.stats.totalPins}</div>
                    <div className="text-sm text-blue-800">Total Pins</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{mockData.stats.pendingApproval}</div>
                    <div className="text-sm text-orange-800">Pending Approval</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{mockData.stats.activeIssues}</div>
                    <div className="text-sm text-red-800">Active Issues</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div>• {mockData.stats.resolvedToday} issues resolved today</div>
                    <div>• {mockData.stats.communityMembers} active community members</div>
                    <div>• 3 new pins submitted in the last 24 hours</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pins' && (
              <div className="space-y-4">
                <h3 className="font-medium">Pins Pending Approval</h3>
                {mockData.pendingPins.map((pin) => (
                  <div key={pin.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{pin.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(pin.priority)}`}>
                            {pin.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          By {pin.author} • {pin.created} • {pin.category}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alert(`Viewing details for: ${pin.name}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprovePin(pin.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectPin(pin.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {mockData.pendingPins.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pins pending approval
                  </div>
                )}
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-4">
                <h3 className="font-medium">Issue Reports</h3>
                {mockData.issueFlags.map((issue) => (
                  <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{issue.pin}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(issue.severity)}`}>
                            Severity {issue.severity}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            issue.status === 'resolved' ? 'bg-green-50 text-green-600' :
                            issue.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Reported by {issue.reporter} • {issue.reported}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {issue.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateIssue(issue.id, 'in_progress')}
                          >
                            Start Work
                          </Button>
                        )}
                        {issue.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateIssue(issue.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="font-medium">Community Management</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div>Community management features</div>
                    <div className="text-sm">Coming soon: User roles, permissions, and moderation tools</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
