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
  Home,
  Activity,
  DollarSign,
  Clock,
  Filter,
  BarChart3,
  MessageSquare,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

interface Subscription {
  tier: string;
  tokensLimit: number;
  tokensUsed: number;
  resetDate: string;
  status: string;
}

interface UsageLog {
  id: string;
  actionType: string;
  tokensUsed: number;
  createdAt: string;
  metadata?: {
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
  };
}

interface UsageData {
  subscription: Subscription;
  usageByType: Record<string, number>;
  remainingTokens: number;
  percentageUsed: number;
  recentUsage?: UsageLog[];
  dailyUsage?: { date: string; tokens: number }[];
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
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [filterType, setFilterType] = useState<string>('all');

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
      const API_URL = import.meta.env.PROD ? '/api' : 'https://appia-v2-hzeehz63w-diegos-projects-d88486d0.vercel.app/api';
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

        {/* Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gray-900 rounded-lg border border-gray-800 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Usage Over Time</h2>
            </div>
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as '7d' | '30d' | '90d')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Simple bar chart visualization */}
          <div className="space-y-3">
            {usageData?.dailyUsage && usageData.dailyUsage.length > 0 ? (
              usageData.dailyUsage.slice(0, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90).map((day, index) => {
                const maxTokens = Math.max(...(usageData.dailyUsage?.map(d => d.tokens) || [1]));
                const percentage = (day.tokens / maxTokens) * 100;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-3 text-xs text-white font-medium">
                        {day.tokens.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No usage data available yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gray-900 rounded-lg border border-gray-800 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Activity</option>
                <option value="chat_generation">Chat Generation</option>
                <option value="image_upload">Image Upload</option>
                <option value="save_project">Save Project</option>
              </select>
            </div>
          </div>

          {/* Activity Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Model</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {usageData?.recentUsage && usageData.recentUsage.length > 0 ? (
                  usageData.recentUsage
                    .filter(log => filterType === 'all' || log.actionType === filterType)
                    .slice(0, 20)
                    .map((log) => (
                      <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {new Date(log.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {log.actionType === 'chat_generation' ? (
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                            ) : log.actionType === 'image_upload' ? (
                              <ImageIcon className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-green-400" />
                            )}
                            <span className="text-white capitalize">
                              {log.actionType.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400">
                          <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                            {log.metadata?.model || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-right">
                          <span className="text-white font-medium">
                            {log.tokensUsed.toLocaleString()}
                          </span>
                          {log.metadata?.inputTokens && log.metadata?.outputTokens && (
                            <div className="text-xs text-gray-500 mt-1">
                              {log.metadata.inputTokens} in / {log.metadata.outputTokens} out
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity logs yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Optimization Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Token Optimization Tips</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Use Claude Haiku for simple tasks</h3>
                  <p className="text-sm text-gray-400">
                    Haiku uses 60-70% fewer tokens than Sonnet for basic modifications and edits.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Optimize image sizes</h3>
                  <p className="text-sm text-gray-400">
                    Images consume 2-3x more tokens. Compress images before uploading.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Be specific in prompts</h3>
                  <p className="text-sm text-gray-400">
                    Clear, focused prompts reduce back-and-forth iterations and save tokens.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Batch your requests</h3>
                  <p className="text-sm text-gray-400">
                    Combine multiple small changes into one prompt to use tokens efficiently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


