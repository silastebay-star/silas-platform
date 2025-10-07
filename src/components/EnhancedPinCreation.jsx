import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Calendar, Users, Tag, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SILAS_BRANDING, getCategoryColor, getCategoryGradient } from '../styles/silasBranding.js';
import { SILAS_CATEGORY_FRAMEWORK } from '../config/categoryFramework.js';
import MobilePhotoUpload from './MobilePhotoUpload.jsx';

const EnhancedPinCreation = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  selectedCategory = 'faith'
}) => {
  const [pinData, setPinData] = useState({
    name: '',
    description: '',
    category: selectedCategory,
    subcategory: '',
    pinType: '',
    priority: 'normal',
    tags: [],
    photos: [],
    socialFeatures: {
      allowComments: true,
      allowReactions: true,
      allowSharing: true,
      moderationLevel: 'community'
    },
    schedule: {
      isRecurring: false,
      startDate: '',
      endDate: '',
      frequency: 'weekly'
    },
    integrations: {}
  });

  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState('');

  const categoryData = SILAS_CATEGORY_FRAMEWORK[pinData.category];
  const subcategories = categoryData?.subcategories || {};
  const pinTypes = categoryData?.pinTypes || [];
  const integrations = categoryData?.integrations || {};

  useEffect(() => {
    if (initialData) {
      setPinData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleCategoryChange = (category) => {
    setPinData(prev => ({
      ...prev,
      category,
      subcategory: '',
      pinType: '',
      integrations: {}
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !pinData.tags.includes(newTag.trim())) {
      setPinData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setPinData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePhotoUpload = (photos) => {
    setPinData(prev => ({
      ...prev,
      photos: photos
    }));
    setShowPhotoUpload(false);
  };

  const handleSubmit = () => {
    if (!pinData.name.trim() || !pinData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const enhancedPinData = {
      ...pinData,
      metadata: {
        framework: 'v2.0',
        categoryData: categoryData,
        subcategoryData: subcategories[pinData.subcategory],
        socialFeatures: pinData.socialFeatures,
        schedule: pinData.schedule,
        integrations: pinData.integrations,
        createdAt: new Date().toISOString()
      }
    };

    onSubmit(enhancedPinData);
    onClose();
  };

  if (!isOpen) return null;

  const categoryColor = getCategoryColor(pinData.category);
  const categoryGradient = getCategoryGradient(pinData.category);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div 
          className="w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden"
          style={{
            background: SILAS_BRANDING.components.panel.background,
            backdropFilter: SILAS_BRANDING.components.panel.backdrop,
            border: `2px solid ${categoryColor}40`,
            boxShadow: `0 25px 50px -12px ${categoryColor}25`,
            borderRadius: SILAS_BRANDING.components.panel.borderRadius
          }}
        >
          {/* Header */}
          <div 
            className="p-6 border-b"
            style={{
              background: categoryGradient,
              borderColor: `${categoryColor}30`
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: SILAS_BRANDING.typography.fontFamily.heading }}
                >
                  Create {categoryData?.name} Pin
                </h2>
                <p className="text-white/90 text-sm">
                  {categoryData?.description} • {categoryData?.tone}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 flex space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    currentStep >= step ? 'bg-white/40' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SILAS_BRANDING.colors.gray[800] }}>
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                        Pin Name *
                      </label>
                      <Input
                        value={pinData.name}
                        onChange={(e) => setPinData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive name for your pin"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                        Description *
                      </label>
                      <textarea
                        value={pinData.description}
                        onChange={(e) => setPinData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this pin represents and its purpose"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                        Category
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.keys(SILAS_CATEGORY_FRAMEWORK).map((categoryKey) => {
                          const category = SILAS_CATEGORY_FRAMEWORK[categoryKey];
                          const isSelected = pinData.category === categoryKey;
                          const IconComponent = category.icon;

                          return (
                            <button
                              key={categoryKey}
                              onClick={() => handleCategoryChange(categoryKey)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isSelected ? 'border-current' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{
                                background: isSelected ? `${category.color}20` : 'white',
                                color: isSelected ? category.color : SILAS_BRANDING.colors.gray[700]
                              }}
                            >
                              <IconComponent className="h-6 w-6 mx-auto mb-2" />
                              <div className="text-sm font-medium">{category.name.split(' & ')[0]}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Subcategory and Pin Type */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SILAS_BRANDING.colors.gray[800] }}>
                    Categorization & Features
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subcategory */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                        Subcategory
                      </label>
                      <select
                        value={pinData.subcategory}
                        onChange={(e) => setPinData(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select subcategory</option>
                        {Object.keys(subcategories).map((subKey) => (
                          <option key={subKey} value={subKey}>
                            {subcategories[subKey].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pin Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                        Pin Type
                      </label>
                      <select
                        value={pinData.pinType}
                        onChange={(e) => setPinData(prev => ({ ...prev, pinType: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select pin type</option>
                        {pinTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                      Priority Level
                    </label>
                    <div className="flex space-x-3">
                      {['normal', 'high', 'urgent'].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setPinData(prev => ({ ...prev, priority }))}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            pinData.priority === priority 
                              ? 'border-current bg-current text-white' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            borderColor: pinData.priority === priority ? categoryColor : undefined,
                            backgroundColor: pinData.priority === priority ? categoryColor : undefined
                          }}
                        >
                          {priority === 'urgent' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
                          {priority === 'high' && <Star className="h-4 w-4 inline mr-1" />}
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                      Tags
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTag} style={{ background: categoryGradient }}>
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pinData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                          style={{ 
                            background: `${categoryColor}20`,
                            color: categoryColor
                          }}
                        >
                          <span>{tag}</span>
                          <button onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Social Features & Media */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SILAS_BRANDING.colors.gray[800] }}>
                    Social Features & Media
                  </h3>

                  {/* Photos */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                      Photos
                    </label>
                    <Button
                      onClick={() => setShowPhotoUpload(true)}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Add Photos {pinData.photos.length > 0 && `(${pinData.photos.length})`}</span>
                    </Button>
                    
                    {pinData.photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {pinData.photos.slice(0, 4).map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden">
                            <img 
                              src={photo.url} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social Settings */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                      Social Interaction Settings
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'allowComments', label: 'Allow Comments' },
                        { key: 'allowReactions', label: 'Allow Reactions (Like, Love, etc.)' },
                        { key: 'allowSharing', label: 'Allow Sharing' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={pinData.socialFeatures[key]}
                            onChange={(e) => setPinData(prev => ({
                              ...prev,
                              socialFeatures: {
                                ...prev.socialFeatures,
                                [key]: e.target.checked
                              }
                            }))}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm" style={{ color: SILAS_BRANDING.colors.gray[700] }}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="p-6 border-t flex justify-between"
            style={{ borderColor: SILAS_BRANDING.colors.gray[200] }}
          >
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <Button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  variant="outline"
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  style={{ background: categoryGradient }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  style={{ background: categoryGradient }}
                >
                  Create Pin
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <MobilePhotoUpload
        isOpen={showPhotoUpload}
        onCancel={() => setShowPhotoUpload(false)}
        onPhotoUpload={handlePhotoUpload}
        maxPhotos={5}
        existingPhotos={pinData.photos}
      />
    </>
  );
};

export default EnhancedPinCreation;
