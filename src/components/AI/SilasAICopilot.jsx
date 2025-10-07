// SILAS AI Copilot Component
// Local LLM + RAG system for contextual community assistance
// Builds on existing Supabase setup and pin system

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SILAS_BRANDING, getCategoryColor } from '@/styles/silasBranding.js';
import { supabase } from '@/lib/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';

const SilasAICopilot = ({ 
  currentPin = null, 
  currentCategory = null,
  isOpen = false,
  onToggle 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize AI copilot with welcome message
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hello! I'm SILAS, your community AI assistant. I can help you with information about pins, projects, and community activities in Stoneclough. ${currentPin ? `I see you're looking at "${currentPin.name}". ` : ''}How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized, currentPin]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced context building from existing data
  const buildContext = async (userMessage) => {
    let context = {
      currentPin: currentPin ? {
        name: currentPin.name,
        description: currentPin.description,
        category: currentPin.layer,
        location: currentPin.coordinates
      } : null,
      currentCategory: currentCategory,
      userQuery: userMessage
    };

    // Get related pins if we have a current pin
    if (currentPin) {
      try {
        const { data: relatedPins } = await supabase
          .from('pins')
          .select('name, description, layer')
          .eq('layer', currentPin.layer)
          .neq('id', currentPin.id)
          .limit(3);
        
        context.relatedPins = relatedPins;
      } catch (error) {
        console.error('Error fetching related pins:', error);
      }
    }

    // Get recent community activity
    try {
      const { data: recentActivity } = await supabase
        .from('pins')
        .select('name, description, layer, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      context.recentActivity = recentActivity;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }

    return context;
  };

  // Simulate AI response (replace with actual LLM integration)
  const generateAIResponse = async (userMessage, context) => {
    // This is where you'd integrate with your local LLM
    // For now, we'll simulate intelligent responses based on context
    
    const message = userMessage.toLowerCase();
    
    // Context-aware responses
    if (context.currentPin) {
      if (message.includes('tell me more') || message.includes('details')) {
        return `${context.currentPin.name} is a ${context.currentPin.category} pin in Stoneclough. ${context.currentPin.description} 

This is part of our ${context.currentPin.category} community pillar. ${context.relatedPins?.length > 0 ? `There are ${context.relatedPins.length} other similar pins nearby: ${context.relatedPins.map(p => p.name).join(', ')}.` : ''}

Would you like to know about community activities, how to get involved, or other ${context.currentPin.category} initiatives?`;
      }
      
      if (message.includes('how to') || message.includes('get involved')) {
        return `Great question! For ${context.currentPin.name}, you can get involved by:

• Visiting the location and participating in activities
• Connecting with other community members through the pin's social features
• Checking for upcoming events related to this ${context.currentPin.category} initiative
• Contributing to discussions and sharing your experiences

${context.currentPin.category === 'faith' ? 'This is a faith-based initiative, so you might also consider joining prayer groups or volunteer activities.' : ''}
${context.currentPin.category === 'works' ? 'This infrastructure project may need volunteers - check the pin details for volunteer opportunities.' : ''}

Would you like me to help you find specific ways to contribute?`;
      }
    }

    // Category-specific responses
    if (message.includes('faith') || context.currentCategory === 'faith') {
      return `Our Faith & Fellowship pillar strengthens spiritual life and community bonds in Stoneclough. We have churches, prayer groups, study circles, and community service initiatives. 

Key activities include:
• Weekly services and prayer meetings
• Bible study groups
• Community outreach and charity work
• Disaster relief and mutual aid

Would you like to know about specific faith communities or upcoming spiritual events?`;
    }

    if (message.includes('project') || message.includes('infrastructure') || context.currentCategory === 'projects') {
      return `Our Projects & Infrastructure pillar focuses on building resilient community infrastructure. Current initiatives include:

• Solar energy installations
• Community gardens and green spaces
• Repair cafes and sustainability projects
• Infrastructure maintenance and improvements

These projects often need volunteers and community input. Would you like to know about specific projects or how to get involved?`;
    }

    // General community responses
    if (message.includes('community') || message.includes('stoneclough')) {
      return `Stoneclough is a vibrant community with ${context.recentActivity?.length || 'many'} active initiatives across our 8 community pillars:

🔶 Faith & Fellowship - Spiritual life and community bonds
🔶 Projects & Infrastructure - Building resilient infrastructure  
🔶 Economy & Commerce - Local business and entrepreneurship
🔶 Environment & Sustainability - Protecting our natural environment
🔶 Community & Social - Strengthening social connections
🔶 Heritage & Culture - Preserving our history and traditions
🔶 Wellbeing & Health - Promoting community health
🔶 Governance & Civic - Democratic participation

Which area interests you most?`;
    }

    // Default helpful response
    return `I'm here to help you navigate Stoneclough's community resources and activities. I can provide information about:

• Community pins and their activities
• How to get involved in local initiatives  
• Upcoming events and opportunities
• Connections between different community projects
• Historical and cultural information about Stoneclough

What would you like to know more about?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build context from current state and database
      const context = await buildContext(inputMessage);
      
      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage, context);
      
      // Simulate thinking time for more natural feel
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
        style={{
          background: SILAS_BRANDING.colors.primary,
          color: 'white'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
        </div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-96 h-[600px] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: SILAS_BRANDING.components.panel.background,
          border: `2px solid ${SILAS_BRANDING.colors.primary}40`
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center justify-between text-white"
          style={{ background: SILAS_BRANDING.colors.primary }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">SILAS AI Copilot</h3>
              <p className="text-xs text-white/80">Community Assistant</p>
            </div>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && (
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: SILAS_BRANDING.colors.primary }} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" style={{ color: SILAS_BRANDING.colors.primary }} />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">SILAS is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask SILAS about the community..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{ background: SILAS_BRANDING.colors.primary }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SilasAICopilot;
