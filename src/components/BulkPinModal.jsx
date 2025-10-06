import React, { useState } from 'react';
import { X, MapPin, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const BulkPinModal = ({ isOpen, onClose, centerPosition, onConfirm }) => {
  const [bulkData, setBulkData] = useState({
    rows: 3,
    cols: 3,
    spacing: 50, // meters
    category: 'Economy',
    titleTemplate: 'Pin {n}',
    description: '',
    priority: 'normal'
  });

  const handleConfirm = () => {
    if (!centerPosition) {
      alert('Center position is required');
      return;
    }

    const totalPins = bulkData.rows * bulkData.cols;
    const coordinates = [];

    // Generate grid coordinates with proper spacing calculation
    // Convert meters to approximate degrees (rough approximation for UK)
    const metersToLat = bulkData.spacing / 111000; // 1 degree lat ≈ 111km
    const metersToLng = bulkData.spacing / (111000 * Math.cos(centerPosition.lat * Math.PI / 180));

    const startLat = centerPosition.lat - ((bulkData.rows - 1) * metersToLat) / 2;
    const startLng = centerPosition.lng - ((bulkData.cols - 1) * metersToLng) / 2;

    for (let row = 0; row < bulkData.rows; row++) {
      for (let col = 0; col < bulkData.cols; col++) {
        const pinNumber = row * bulkData.cols + col + 1;
        coordinates.push({
          lat: startLat + (row * metersToLat),
          lng: startLng + (col * metersToLng),
          title: bulkData.titleTemplate.replace('{n}', pinNumber),
          description: bulkData.description || `Bulk created pin ${pinNumber}`,
          category: bulkData.category,
          priority: bulkData.priority
        });
      }
    }

    onConfirm(coordinates);
  };

  if (!isOpen) return null;

  const totalPins = bulkData.rows * bulkData.cols;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Grid3X3 className="h-5 w-5" />
              <span>Create Multiple Pins</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Grid Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rows</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={bulkData.rows}
                onChange={(e) => setBulkData(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Columns</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={bulkData.cols}
                onChange={(e) => setBulkData(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          {/* Spacing */}
          <div>
            <label className="block text-sm font-medium mb-1">Spacing (meters)</label>
            <Input
              type="number"
              min="10"
              max="500"
              value={bulkData.spacing}
              onChange={(e) => setBulkData(prev => ({ ...prev, spacing: parseInt(e.target.value) || 50 }))}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={bulkData.category}
              onChange={(e) => setBulkData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Economy">Economy</option>
              <option value="Community">Community</option>
              <option value="Environment">Environment</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Culture">Culture</option>
            </select>
          </div>

          {/* Title Template */}
          <div>
            <label className="block text-sm font-medium mb-1">Title Template</label>
            <Input
              value={bulkData.titleTemplate}
              onChange={(e) => setBulkData(prev => ({ ...prev, titleTemplate: e.target.value }))}
              placeholder="Use {n} for numbering"
            />
            <div className="text-xs text-gray-500 mt-1">
              Will create {totalPins} pins
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={bulkData.description}
              onChange={(e) => setBulkData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description for all pins"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={bulkData.priority}
              onChange={(e) => setBulkData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-700">
              <strong>Preview:</strong> Creating {totalPins} pins in a {bulkData.rows}×{bulkData.cols} grid
              with {bulkData.spacing}m spacing
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <MapPin className="h-4 w-4 mr-2" />
              Create {totalPins} Pins
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkPinModal;
