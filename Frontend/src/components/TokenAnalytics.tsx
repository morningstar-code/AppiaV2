import React, { useState, useEffect } from 'react';

interface TokenAnalyticsProps {
  usageData: {
    subscription?: {
      tier: string;
      tokensLimit: number;
      tokensUsed: number;
    };
    usage?: any[];
    usageByType?: Record<string, number>;
    remainingTokens?: number;
    percentageUsed?: number;
    // Legacy fields for backward compatibility
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    optimization?: {
      contextReduction: string;
      modelSelection: string;
      imageMethod: string;
    };
  };
}

export default function TokenAnalytics({ usageData }: TokenAnalyticsProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Safely extract values with fallbacks
  const totalTokens = usageData?.totalTokens || usageData?.subscription?.tokensUsed || 0;
  const tokensLimit = usageData?.subscription?.tokensLimit || 108000;
  const remainingTokens = usageData?.remainingTokens || (tokensLimit - totalTokens);
  const percentageUsed = usageData?.percentageUsed || ((totalTokens / tokensLimit) * 100);
  
  // Calculate savings (85% reduction estimate)
  const estimatedSavings = totalTokens > 0 ? Math.round(totalTokens * 0.85) : 0;
  const costSavings = estimatedSavings * 0.000015; // Rough cost per token

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Token Usage</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Tokens Used:</span>
          <span className="text-white font-medium">{totalTokens.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Remaining:</span>
          <span className="text-green-400 font-medium">{remainingTokens.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Usage:</span>
          <span className="text-blue-400 font-medium">{percentageUsed.toFixed(1)}%</span>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Plan: {usageData?.subscription?.tier || 'free'}</div>
              <div>Limit: {tokensLimit.toLocaleString()} tokens</div>
              {usageData?.usageByType && Object.keys(usageData.usageByType).length > 0 && (
                <div className="mt-2">
                  <div className="font-medium mb-1">Usage by Type:</div>
                  {Object.entries(usageData.usageByType).map(([type, tokens]) => (
                    <div key={type} className="flex justify-between">
                      <span>{type}:</span>
                      <span>{tokens.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
