"use client";

import React, { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// Define message types
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AIAssistant = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "You are WealthAI, an AI assistant specializing in cryptocurrency, blockchain technology, DeFi, and NFTs on the Solana blockchain. Provide concise, informative responses about current market trends, investment strategies, and blockchain technologies. Focus on facts and educational content. Keep responses under 150 words when possible."
    },
    {
      role: "assistant",
      content: "Hello! I'm your AI crypto analytics assistant. I can help you with market analysis, investment questions, and blockchain technology explanations. What would you like to know about crypto today?"
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Improved scroll behavior that only scrolls the chat container
  useEffect(() => {
    // Use a small timeout to ensure the DOM is updated
    const timer = setTimeout(() => {
      if (messagesEndRef.current && chatContainerRef.current) {
        // Scroll only the chat container, not the page
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  // Fallback responses for when API calls fail
  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("solana") && (lowerQuery.includes("price") || lowerQuery.includes("worth"))) {
      return "As of the latest data, Solana (SOL) is trading at approximately $150 with a market cap of around $73.5 billion. Please check a real-time price source for the most current information.";
    } 
    else if (lowerQuery.includes("nft") && (lowerQuery.includes("invest") || lowerQuery.includes("buy"))) {
      return "When investing in NFTs, look for projects with strong communities, utility beyond the artwork, and a solid team. Research thoroughly, only invest what you can afford to lose, and be aware that the NFT market can be highly volatile.";
    }
    else if ((lowerQuery.includes("defi") || lowerQuery.includes("yield")) && lowerQuery.includes("solana")) {
      return "DeFi yields on Solana currently range from 2-15% APY depending on the protocol and level of risk. Established platforms like Marinade Finance offer around 5-7% for liquid staking, while newer or riskier platforms might offer higher rates with increased risk.";
    }
    else {
      return "I'm sorry, but I'm currently operating with limited connection to my knowledge base. For this question, I'd recommend checking a specialized crypto website or asking again later when services are fully operational.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setLoading(true);
    setError("");
    setInput("");
    
    try {
      const response = await callOpenAI([...messages, userMessage]);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: "assistant", content: response }
      ]);
    } catch (err) {
      console.error("Error calling OpenAI:", err);
      setError("Failed to get a response from the AI assistant. Using fallback responses.");
      
      // Use fallback responses for common queries
      const fallbackResponse = getFallbackResponse(input);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: "assistant", content: fallbackResponse }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const callOpenAI = async (messageHistory: Message[]): Promise<string> => {
    try {
      // Call our server-side API route instead of OpenAI directly
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageHistory }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("API error:", error);
      throw error; // Re-throw the error to be handled by the parent function
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-2">AI Assistant</h2>
      <p className="text-gray-400 mb-6">Ask anything about crypto, blockchain, or DeFi</p>
      
      {error && <ErrorMessage message={error} suggestion="Try asking a different question or try again later." />}
      
      <div 
        ref={chatContainerRef}
        className="flex-grow bg-gray-800 rounded-lg p-4 mb-4 overflow-y-auto max-h-[500px] scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="space-y-4">
          {messages.slice(1).map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user" 
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-gray-700 text-gray-100 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 p-3 rounded-lg rounded-bl-none max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-0" /> {/* Invisible element for scrolling */}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask about Solana, DeFi, NFTs, or crypto markets..."
          className="flex-grow bg-gray-800 border border-gray-700 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 rounded-r-lg flex items-center justify-center disabled:opacity-75 disabled:hover:bg-violet-600"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
      
      <p className="text-xs text-gray-500 mt-2">
        Powered by OpenAI GPT. Some responses may use fallback data if API limits are reached.
      </p>
    </div>
  );
};

export default AIAssistant; 