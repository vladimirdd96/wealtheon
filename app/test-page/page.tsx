"use client";

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setApiData(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      console.error('API test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <button 
        onClick={testApi}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {apiData && (
        <div className="bg-gray-100 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 