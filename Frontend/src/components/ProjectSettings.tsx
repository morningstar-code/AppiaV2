import { useState } from 'react';
import { X, Database, Settings, Shield, Server, Key, Users, Folder, Brain, Archive, CheckCircle } from 'lucide-react';
import { SupabaseSetup } from './SupabaseSetup';

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSettings({ isOpen, onClose }: ProjectSettingsProps) {
  const [activeTab, setActiveTab] = useState('database');
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showSupabaseSetup, setShowSupabaseSetup] = useState(false);

  if (!isOpen) return null;

  const projectSettings = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'domains', label: 'Domains & Hosting', icon: Server },
    { id: 'analytics', label: 'Analytics', icon: Brain },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'functions', label: 'Server Functions', icon: Server },
    { id: 'secrets', label: 'Secrets', icon: Key },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'storage', label: 'File Storage', icon: Folder },
    { id: 'knowledge', label: 'Knowledge', icon: Brain },
    { id: 'backups', label: 'Backups', icon: Archive },
  ];

  const personalSettings = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'subscription', label: 'Subscription & Tokens', icon: Key },
    { id: 'applications', label: 'Applications', icon: Server },
    { id: 'cloud', label: 'Cloud', icon: Brain },
    { id: 'knowledge', label: 'Knowledge', icon: Brain },
  ];

  const renderDomainsSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Domains & Hosting</h2>
      
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <Server className="w-8 h-8 text-blue-500" />
        </div>
        <p className="text-gray-400">
          Your project is not published yet, <strong>go back to your project</strong> and publish it from the top right of the screen to get a unique bolt.host URL you can share.
        </p>
      </div>
    </div>
  );

  const renderSubscriptionSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Subscription & Tokens</h2>
      
      <div className="space-y-6">
        {/* Token Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center mb-6">
            <p className="text-gray-400 mb-4">
              Your next token refill of <strong>1M tokens</strong> is due on <strong>November 1, 2025.</strong>
            </p>
            <div className="text-4xl font-bold text-white mb-2">75K</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">75K/1M monthly tokens</span>
                <span className="text-gray-400">Unused tokens expire October 31, 2025.</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{width: '7.5%'}}></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">656K extra tokens</span>
                <span className="text-gray-400">Never expiring.</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-gray-400">Daily limit: 300k/300k tokens</span>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Upgrade to Pro</h3>
              <div className="text-3xl font-bold text-white">$25 <span className="text-sm text-gray-400">per month</span></div>
              <div className="text-gray-400 text-sm">billed monthly</div>
              <div className="mt-4">
                <div className="text-white font-medium mb-2">10M / month</div>
                <div className="text-gray-400 text-sm">Your current plan: Free</div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Upgrade
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">Public and private projects</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">No daily token limit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">Start at 10M tokens per month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">No Appia branding on websites</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">100MB file upload limit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">Website hosting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">Up to 1M web requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">Custom domain support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationsSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Applications</h2>
      
      <div className="space-y-4">
        {/* Supabase */}
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">Supabase</div>
              <div className="text-gray-400 text-sm">Database</div>
              <div className="text-gray-400 text-sm">Integrate Supabase to enable authentication or sync your app with a robust and scalable database effortlessly.</div>
            </div>
          </div>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Connect
          </button>
        </div>

        {/* Netlify */}
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <div>
              <div className="text-white font-medium">Netlify</div>
              <div className="text-gray-400 text-sm">Hosting</div>
              <div className="text-gray-400 text-sm">Deploy your app seamlessly with your own Netlify account. Use custom domains, optimize performance, and take advantage of powerful deployment tools.</div>
            </div>
          </div>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Connect
          </button>
        </div>

        {/* Figma */}
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <div>
              <div className="text-white font-medium">Figma</div>
              <div className="text-gray-400 text-sm">Design</div>
              <div className="text-gray-400 text-sm">Integrate Figma to import your designs as code ready to be analyzed by Bolt.</div>
            </div>
          </div>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Connect
          </button>
        </div>

        {/* GitHub */}
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <div>
              <div className="text-white font-medium">GitHub</div>
              <div className="text-gray-400 text-sm">Code</div>
              <div className="text-gray-400 text-sm">To revoke the GitHub Authorization visit github.com/settings/apps/authorizations, look for the "Bolt (by StackBlitz)" application, and click "Revoke".</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <Database className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Database</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Ask Appia to start your database. Create tables, manage relationships, and configure your database schema directly from your project settings.
        </p>
        
        {!supabaseConnected ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowSupabaseSetup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Connect Supabase Project
            </button>
            <p className="text-sm text-gray-500">
              This will create a Supabase project and set up your database schema
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">Supabase Connected</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Your database is ready! You can now create tables and manage your data.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                View Tables
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                Create Table
              </button>
            </div>
          </div>
        )}
      </div>

      {supabaseConnected && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Connect to an existing database</h4>
            <p className="text-gray-400 text-sm mb-4">
              Connect a Supabase project to manage your data, set up authentication, and create backend functions.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Connect
            </button>
          </div>
          
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-amber-500 mt-0.5">⚠️</div>
              <div>
                <p className="text-amber-400 text-sm">
                  To connect or claim a project, you must first link your Supabase account in Personal Settings → Applications
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Project General Settings</h2>
      
      <div className="space-y-6">
        {/* Project Name */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-white font-medium mb-2">Project name</label>
            <input
              type="text"
              defaultValue="Calculator App Development"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Save
          </button>
        </div>

        {/* Project Agent */}
        <div>
          <label className="block text-white font-medium mb-3">Project Agent</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-600 border border-blue-600 rounded-lg p-3 cursor-pointer">
              <div className="text-white font-medium">Claude Agent</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer relative">
              <div className="text-gray-300 font-medium">Codex</div>
              <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">COMING SOON</span>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer">
              <div className="text-gray-300 font-medium">v1 Agent (legacy)</div>
            </div>
          </div>
        </div>

        {/* Context */}
        <div className="flex items-start justify-between">
          <div>
            <label className="block text-white font-medium mb-1">Context</label>
            <p className="text-gray-400 text-sm">Free up context. This is useful when a part of your app is completed and you want to work on a new one.</p>
          </div>
          <button className="text-blue-400 hover:text-blue-300 text-sm underline">
            Clear context
          </button>
        </div>

        {/* Project Visibility */}
        <div>
          <label className="block text-white font-medium mb-3">Project Visibility</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-600 border border-blue-600 rounded-lg p-4 cursor-pointer">
              <div className="text-white font-medium mb-1">Private</div>
              <div className="text-blue-200 text-sm">Only owner can access</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer">
              <div className="text-gray-300 font-medium mb-1">Secret</div>
              <div className="text-gray-400 text-sm">Accessible via shared URL</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer">
              <div className="text-gray-300 font-medium mb-1">Public</div>
              <div className="text-gray-400 text-sm">Everyone can view</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[80vh] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Project Settings</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-3">
                Project Settings
              </h4>
              <div className="space-y-1">
                {projectSettings.map((setting) => {
                  const Icon = setting.icon;
                  return (
                    <button
                      key={setting.id}
                      onClick={() => setActiveTab(setting.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === setting.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{setting.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-2 border-t border-gray-700">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-3">
                Personal Settings
              </h4>
              <div className="space-y-1">
                {personalSettings.map((setting) => {
                  const Icon = setting.icon;
                  return (
                    <button
                      key={setting.id}
                      onClick={() => setActiveTab(`personal-${setting.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === `personal-${setting.id}`
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{setting.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'advanced'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'domains' && renderDomainsSettings()}
            {activeTab === 'subscription' && renderSubscriptionSettings()}
            {activeTab === 'applications' && renderApplicationsSettings()}
            {activeTab === 'database' && renderDatabaseSettings()}
          </div>
        </div>
      </div>

      {/* Supabase Setup Modal */}
      <SupabaseSetup 
        isOpen={showSupabaseSetup}
        onClose={() => setShowSupabaseSetup(false)}
        onSetupComplete={(config) => {
          setSupabaseConnected(true);
          console.log('Supabase configured:', config);
        }}
      />
    </div>
  );
}
