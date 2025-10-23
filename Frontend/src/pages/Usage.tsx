import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  Calendar,
  Check,
  X,
  Home
} from 'lucide-react';

interface Subscription {
  tier: string;
  tokensLimit: number;
  tokensUsed: number;
  resetDate: string;
  status: string;
}

interface UsageData {
  subscription: Subscription;
  usageByType: Record<string, number>;
  remainingTokens: number;
  percentageUsed: number;
}

const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: '$0',
    tokens: 10000,
    features: ['10,000 tokens/month', 'Basic AI models', 'Community support']
  },
  pro: {
    name: 'Pro',
    price: '$19',
    tokens: 100000,
    features: ['100,000 tokens/month', 'Advanced AI models', 'Priority support', 'No watermark']
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    tokens: Infinity,
    features: ['Unlimited tokens', 'Custom AI models', '24/7 support', 'SLA guarantee', 'Custom integrations']
  }
};

export function Usage() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }

    fetchUsageData();
  }, [isSignedIn, user]);

  const fetchUsageData = async () => {
    if (!user?.id) return;

    try {
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/usage?userId=${user.id}`);
      
      if (!response.ok) throw new Error('Failed to fetch usage data');
      
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/appia-logo.png" 
              alt="Appia Logo" 
              className="w-8 h-8 object-contain" 
            />
            <h1 className="text-2xl font-bold text-white">Usage & Subscriptions</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Current Usage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg border border-gray-800 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Current Plan: {usageData?.subscription.tier.toUpperCase()}</h2>
              <p className="text-gray-400">
                Resets on {usageData && formatDate(usageData.subscription.resetDate)}
              </p>
            </div>
            <Zap className="w-12 h-12 text-blue-500" />
          </div>

          {/* Usage Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Tokens Used</span>
              <span className="text-white font-semibold">
                {usageData?.subscription.tokensUsed.toLocaleString()} / {usageData?.subscription.tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (usageData?.percentageUsed || 0) > 90
                    ? 'bg-red-500'
                    : (usageData?.percentageUsed || 0) > 70
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(usageData?.percentageUsed || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Usage by Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {usageData?.usageByType?.generate || 0}
              </div>
              <div className="text-sm text-gray-400">Generations</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <CreditCard className="w-6 h-6 text-green-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {usageData?.usageByType?.chat || 0}
              </div>
              <div className="text-sm text-gray-400">Chat Messages</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <Calendar className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {usageData?.remainingTokens.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <h2 className="text-3xl font-bold text-white mb-8">Upgrade Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(TIER_FEATURES).map(([tier, details], index) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-900 rounded-lg border-2 p-8 ${
                usageData?.subscription.tier === tier
                  ? 'border-blue-500'
                  : 'border-gray-800'
              }`}
            >
              {usageData?.subscription.tier === tier && (
                <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  CURRENT PLAN
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{details.name}</h3>
              <div className="text-4xl font-bold text-white mb-2">
                {details.price}
                <span className="text-lg text-gray-400 font-normal">/month</span>
              </div>
              <p className="text-gray-400 mb-6">
                {details.tokens === Infinity ? 'Unlimited' : details.tokens.toLocaleString()} tokens/month
              </p>

              <ul className="space-y-3 mb-8">
                {details.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  usageData?.subscription.tier === tier
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={usageData?.subscription.tier === tier}
              >
                {usageData?.subscription.tier === tier ? 'Current Plan' : `Upgrade to ${details.name}`}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Warning if near limit */}
        {usageData && usageData.percentageUsed > 80 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6"
          >
            <div className="flex items-center gap-3">
              <X className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-500">You're running low on tokens!</h3>
                <p className="text-gray-300 mt-1">
                  You've used {usageData.percentageUsed.toFixed(0)}% of your monthly allocation. 
                  Consider upgrading to avoid interruptions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


