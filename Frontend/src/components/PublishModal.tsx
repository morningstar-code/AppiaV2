import React, { useState, useEffect } from 'react';
import { X, Globe, Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (options: PublishOptions) => void;
  isPublished: boolean;
  publishedUrl?: string;
}

interface PublishOptions {
  domain: string;
  customDomain?: string;
  seoBoost: boolean;
}

export function PublishModal({ isOpen, onClose, onPublish, isPublished, publishedUrl }: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [domain, setDomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [seoBoost, setSeoBoost] = useState(false);
  const [publishStep, setPublishStep] = useState<'setup' | 'publishing' | 'complete'>('setup');

  useEffect(() => {
    if (isPublished && publishedUrl) {
      setPublishStep('complete');
      setDomain(publishedUrl);
    }
  }, [isPublished, publishedUrl]);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStep('publishing');
    
    try {
      await onPublish({
        domain: domain || generateRandomDomain(),
        customDomain: customDomain || undefined,
        seoBoost
      });
      
      setTimeout(() => {
        setPublishStep('complete');
        setIsPublishing(false);
      }, 2000);
    } catch (error) {
      console.error('Publish error:', error);
      setIsPublishing(false);
      setPublishStep('setup');
    }
  };

  const generateRandomDomain = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${randomId}.appia.host`;
  };

  const handleChangeDomain = () => {
    setPublishStep('setup');
  };

  const handleUnpublish = async () => {
    // TODO: Implement unpublish functionality
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {publishStep === 'setup' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Publish your project</h2>
            
            <div className="space-y-6">
              {/* Domain Setup */}
              <div>
                <label className="block text-white font-medium mb-2">Domain</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder={generateRandomDomain()}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Free .appia.host domain included
                </p>
              </div>

              {/* Custom Domain (Pro only) */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Custom Domain
                  <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">PRO</span>
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="your-domain.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Available with Pro plan
                </p>
              </div>

              {/* SEO Boost (Pro only) */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="seoBoost"
                  checked={seoBoost}
                  onChange={(e) => setSeoBoost(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="seoBoost" className="block text-white font-medium">
                    SEO Boost
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">PRO</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Pre-render pages for better SEO and faster loading
                  </p>
                </div>
              </div>

              {/* Publishing Button */}
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {publishStep === 'publishing' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Publishing your project</h2>
            <p className="text-gray-400 mb-6">
              This usually takes about a minute...
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Building project files</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Deploying to Appia hosting</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border border-gray-600 rounded-full"></div>
                <span>Setting up domain</span>
              </div>
            </div>
          </div>
        )}

        {publishStep === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Project published!</h2>
            <p className="text-gray-400 mb-6">
              Your project is now live and accessible to everyone.
            </p>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="text-white font-medium">Live URL</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`https://${domain}`}
                  readOnly
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
                <button
                  onClick={() => window.open(`https://${domain}`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangeDomain}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Change Domain
              </button>
              <button
                onClick={handleUnpublish}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Unpublish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

