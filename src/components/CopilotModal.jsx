// src/components/CopilotModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { X, Lightbulb, Send } from 'lucide-react';

const COPILOT_API_URL = 'http://localhost:3001/api/copilot';

export function CopilotModal({ pin, onClose }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  const handleQuery = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    setHistory(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    const assistantMessage = { role: 'assistant', content: '' };
    setHistory(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(COPILOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, community_id: pin.community_id })
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Ollama streaming sends back JSON objects for each chunk
        try {
            const parsed = JSON.parse(chunk);
            if (parsed.response) {
                setHistory(prev => prev.map((msg, index) => 
                    index === prev.length - 1 
                        ? { ...msg, content: msg.content + parsed.response } 
                        : msg
                ));
            }
        } catch (e) {
            // If parsing fails, it might be a non-JSON string or malformed
            console.warn("Could not parse stream chunk as JSON:", chunk);
        }
      }

    } catch (error) {
      console.error("Copilot fetch error:", error);
      setHistory(prev => prev.map((msg, index) => 
        index === prev.length - 1 
            ? { ...msg, content: `Sorry, I encountered an error: ${error.message}` } 
            : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <Card className="w-[600px] h-[70vh] flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Lightbulb size={20} />
              Ask SILAS about: {pin.name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && history[history.length - 1]?.role === 'assistant' && (
                <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 text-gray-800">
                        Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 p-4 border-t">
            <Input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Ask a follow-up question..." 
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              disabled={isLoading}
            />
            <Button onClick={handleQuery} disabled={isLoading}>
              <Send size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}