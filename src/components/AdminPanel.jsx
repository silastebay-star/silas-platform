import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, MapPin, Users, Eye, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseHelpers } from '../lib/supabase.js';

const AdminPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingPins: [],
    issueFlags: [],
    stats: {
      totalPins: 0,
      pendingApproval: 0,
      activeIssues: 0,
      resolvedToday: 0,
      recentActivity: 0
    }
  });

  // Load real data when panel opens
  useEffect(() => {
    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [stats, proposals, issues] = await Promise.all([
        supabaseHelpers.getAdminStats(),
        supabaseHelpers.getPinProposals('pending'),
        supabaseHelpers.getIssueFlags()
      ]);

      setData({
        pendingPins: proposals.map(p => ({
          id: p.id,
          name: p.payload?.name || 'Unnamed Pin',
          author: p.proposer_id || 'Anonymous',
          priority: p.payload?.priority || 'normal',
          created: formatTimeAgo(p.created_at),
          category: p.payload?.category || 'Unknown',
          rawData: p
        })),
        issueFlags: issues.map(i => ({
          id: i.id,
          pin: i.pins?.name || 'Unknown Pin',
          severity: i.severity,
          status: i.status,
          reported: formatTimeAgo(i.created_at),
          reporter: i.reported_by || 'Anonymous',
          rawData: i
        })),
        stats
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const handleApprovePin = async (pinId) => {
    try {
      await supabaseHelpers.approvePinProposal(pinId);
      await loadAdminData(); // Refresh data
      alert('Pin approved and published to the community!');
    } catch (error) {
      console.error('Error approving pin:', error);
      alert('Error approving pin. Please try again.');
    }
  };

  const handleRejectPin = async (pinId) => {
    try {
      await supabaseHelpers.rejectPinProposal(pinId);
      await loadAdminData(); // Refresh data
      alert('Pin rejected and removed from queue.');
    } catch (error) {
      console.error('Error rejecting pin:', error);
      alert('Error rejecting pin. Please try again.');
    }
  };

  const handleUpdateIssue = async (issueId, newStatus) => {
    try {
      await supabaseHelpers.updateIssueStatus(issueId, newStatus);
      await loadAdminData(); // Refresh data
      alert(`Issue status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Error updating issue. Please try again.');
    }
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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-600">Loading admin data...</div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{data.stats.totalPins}</div>
                        <div className="text-sm text-blue-800">Total Pins</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{data.stats.pendingApproval}</div>
                        <div className="text-sm text-orange-800">Pending Approval</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{data.stats.activeIssues}</div>
                        <div className="text-sm text-red-800">Active Issues</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Recent Activity</h3>
                      <div className="space-y-2 text-sm">
                        <div>• {data.stats.resolvedToday} issues resolved today</div>
                        <div>• {data.stats.recentActivity} activities in the last 24 hours</div>
                        <div>• {data.stats.pendingApproval} pins awaiting approval</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'pins' && (
              <div className="space-y-4">
                <h3 className="font-medium">Pins Pending Approval</h3>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : data.pendingPins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pins pending approval
                  </div>
                ) : (
                  data.pendingPins.map((pin) => (
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
                  ))
                )}
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-4">
                <h3 className="font-medium">Issue Reports</h3>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : data.issueFlags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No issue reports
                  </div>
                ) : (
                  data.issueFlags.map((issue) => (
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
                  ))
                )}
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
