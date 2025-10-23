import React from 'react';
import { useUser } from '@clerk/clerk-react';

interface SubscriptionInfoProps {
  usageData?: any;
}

export function SubscriptionInfo({ usageData }: SubscriptionInfoProps) {
  const { user } = useUser();

  if (!user || !usageData) {
    return (
      <div className="border-t border-gray-800 p-4 flex-shrink-0">
        <div className="text-xs text-gray-500 mb-2">
          Loading usage...
        </div>
        <div className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
          Switch to Pro for 33x more usage
        </div>
      </div>
    );
  }

  const subscription = usageData.subscription || {
    tier: 'free',
    tokensLimit: 10000,
    tokensUsed: 0
  };

  const remainingTokens = subscription.tokensLimit - subscription.tokensUsed;
  const percentageUsed = (subscription.tokensUsed / subscription.tokensLimit) * 100;

  return (
    <div className="border-t border-gray-800 p-4 flex-shrink-0">
      <div className="text-xs text-gray-500 mb-2">
        {remainingTokens.toLocaleString()} monthly tokens remaining
      </div>
      <div className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
        Switch to Pro for 33x more usage
      </div>
      
      {/* Progress bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Plan info */}
      <div className="mt-2 text-xs text-gray-400">
        Plan: {subscription.tier} • {subscription.tokensUsed.toLocaleString()}/{subscription.tokensLimit.toLocaleString()} tokens used
      </div>
    </div>
  );
}
