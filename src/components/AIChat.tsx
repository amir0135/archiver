import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  X
} from 'lucide-react';
import { OpenAIClient } from '@azure/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQueries = [
  {
    title: "Large, unused files",
    query: "Can you find large files that haven't been accessed in the last 3 months?"
  },
  {
    title: "Project-specific files",
    query: "Show me all files related to the marketing project"
  },
  {
    title: "Team access files",
    query: "Which files are shared with the design team?"
  },
  {
    title: "File organization",
    query: "Suggest improvements for my current file organization"
  },
  {
    title: "Redundant work",
    query: "Can you identify any redundant or duplicate work across files?"
  },
  {
    title: "Duplicate docs",
    query: "Find all duplicate Google Docs in my drive"
  }
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    endpoint: '',
    key: '',
    deploymentId: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [client, setClient] = useState<OpenAIClient | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeClient = () => {
    if (!config.endpoint || !config.key || !config.deploymentId) return;
    
    try {
      const newClient = new OpenAIClient(
        config.endpoint,
        { key: config.key }
      );
      setClient(newClient);
      setIsConfigured(true);
      setShowConfig(false);
      
      // Save config to localStorage
      localStorage.setItem('aiConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  };

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setIsConfigured(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !client || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await client.getChatCompletions(
        config.deploymentId,
        [
          { role: 'system', content: 'You are a helpful AI assistant for file management.' },
          ...messages,
          userMessage
        ]
      );

      if (response.choices[0]?.message) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: response.choices[0].message.content || 'No response'
          }
        ]);
      }
    } catch (error) {
      console.error('Error getting completion:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
  };

  return (
    <div className="flex flex-col h-full">
      {showConfig ? (
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          <h4 className="font-medium text-gray-900">Azure OpenAI Configuration</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Endpoint</label>
              <input
                type="text"
                value={config.endpoint}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="https://your-resource.openai.azure.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={config.key}
                onChange={(e) => setConfig(prev => ({ ...prev, key: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Your API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deployment ID</label>
              <input
                type="text"
                value={config.deploymentId}
                onChange={(e) => setConfig(prev => ({ ...prev, deploymentId: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="your-deployment"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={initializeClient}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Configuration
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isConfigured && messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Configure Azure OpenAI to start chatting</p>
                <button
                  onClick={() => setShowConfig(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Configure now
                </button>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          {messages.length === 0 && (
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested questions:</h4>
              <div className="space-y-2">
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuery(query.query)}
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {query.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 text-gray-400 hover:text-gray-600 mr-2"
                title="Configure AI"
              >
                <Bot className="h-5 w-5" />
              </button>
              <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isConfigured || isLoading}
                />
                <button
                  type="submit"
                  disabled={!isConfigured || isLoading}
                  className="p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}