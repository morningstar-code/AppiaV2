import React, { useState, useEffect } from 'react';

interface TokenAnalyticsProps {
  usageData: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    model: string;
    optimization?: {
      contextReduction: string;
      modelSelection: string;
      imageMethod: string;
    };
  };
}

export default function TokenAnalytics({ usageData }: TokenAnalyticsProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate savings
  const estimatedSavings = usageData.totalTokens > 0 ? 
    Math.round((usageData.totalTokens * 0.85)) : 0; // 85% reduction estimate
  
  const costSavings = estimatedSavings * 0.000015; // Rough cost per token

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Token Optimization</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Current Usage:</span>
          <span className="text-white font-medium">{usageData.totalTokens.toLocaleString()} tokens</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Estimated Savings:</span>
          <span className="text-green-400 font-medium">{estimatedSavings.toLocaleString()} tokens</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cost Savings:</span>
          <span className="text-green-400 font-medium">${costSavings.toFixed(4)}</span>
        </div>
        
        {showDetails && usageData.optimization && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Context: {usageData.optimization.contextReduction}</div>
              <div>Model: {usageData.optimization.modelSelection}</div>
              <div>Image: {usageData.optimization.imageMethod}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
