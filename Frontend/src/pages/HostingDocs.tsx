import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Database, Settings, Shield, Server, Key, Users, Folder, Brain, Archive, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export function HostingDocs() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-semibold text-white">Appia</h1>
          </Link>
          <div className="h-6 border-r border-gray-700"></div>
          <h2 className="text-gray-300">Hosting Documentation</h2>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Appia
          </Link>
        </div>

        {/* Main Content */}
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-4">Appia Cloud Hosting</h1>
          <p className="text-xl text-gray-300 mb-8">
            Appia offers built-in hosting so you can publish your project without touching a server or setting up a third-party account.
          </p>

          {/* What is hosting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-500" />
              What is hosting?
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                Hosting simply means putting your project on the internet so other people can visit it as a website. When you "publish" a project, Appia takes the files you've created and makes them available at a live web address anyone can open in their browser.
              </p>
              <p className="text-gray-300">
                Appia hosting lets you publish your project to a live URL in seconds, with a free <code className="bg-gray-700 px-2 py-1 rounded text-blue-400">.appia.host</code> domain included. No third-party account is required: Appia handles everything.
              </p>
            </div>
          </section>

          {/* Who can use */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              Who can use Appia hosting?
            </h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300">
                All Appia users, both Free and Pro, can publish their projects to a <code className="bg-gray-700 px-2 py-1 rounded text-blue-400">.appia.host</code> domain, although custom domains are only available for Pro users.
              </p>
            </div>
          </section>

          {/* How to publish */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-500" />
              Publish your project with Appia hosting
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                Every project created in Appia is eligible for free <code className="bg-gray-700 px-2 py-1 rounded text-blue-400">appia.host</code> hosting. No setup required! To publish your project, follow the steps below:
              </p>
              <ol className="text-gray-300 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Click <strong className="text-white">Publish</strong> in the top-right corner of your screen.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Click the second <strong className="text-white">Publish</strong> button that appears.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Wait about a minute for Appia to deploy your site.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Click the link that appears in the chat window to open your site in a new browser tab.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <span>(Optional) Attach a custom domain if you're on a Pro plan.</span>
                </li>
              </ol>
            </div>
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <p className="text-blue-200">
                <strong>Note:</strong> Publishing your site using the <strong>Publish</strong> button does not use tokens, whereas prompting Appia to publish your site may.
              </p>
            </div>
          </section>

          {/* Hosting plans */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Key className="w-8 h-8 text-orange-500" />
              Appia hosting plans
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4">Free</h3>
                <ul className="text-gray-300 space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Up to 10 GB bandwidth per month
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    333,333 requests per month
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Free .appia.host domain
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Made in Appia badge
                  </li>
                </ul>
                <p className="text-gray-400 text-sm">
                  Typically supports around 10,000–15,000 monthly visits, depending on the size and complexity of your site.
                </p>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-800">
                <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
                <ul className="text-gray-300 space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Up to 30 GB bandwidth per month
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    1 million requests per month
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Custom domain support
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    SEO Boost (pre-rendering)
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    No Made in Appia badge
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Pay-as-you-go scaling
                  </li>
                </ul>
                <p className="text-gray-400 text-sm">
                  Better suited for production sites, landing pages, or growing products. Can often support 100,000+ visits per month.
                </p>
              </div>
            </div>
          </section>

          {/* Analytics */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Brain className="w-8 h-8 text-pink-500" />
              Analytics
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                Projects published to Appia Hosting on a paid plan include built-in analytics to let you view traffic to your published site. To view your analytics, click the <strong className="text-white">gear icon</strong> in the top center of your screen, then click <strong className="text-white">Analytics</strong>.
              </p>
              <p className="text-gray-300 mb-4">
                You can track unique visitors, pageviews, top pages, and bandwidth usage. You can also see top traffic sources, visitor locations, and a list of top "not found" (404) pages, which helps you know when people are trying to visit pages that don't exist.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  <strong>Note:</strong> Analytics data currently includes visits and actions from web crawlers and bots. At this time, there is no built-in way to separate crawler traffic from visits by real users.
                </p>
              </div>
            </div>
          </section>

          {/* SEO Boost */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-500" />
              SEO Boost
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                SEO Boost creates a ready-to-go HTML version of each page ahead of time. When search engines visit your site, they get the full page instantly, making it easier to index your site and show it in search results.
              </p>
              <p className="text-gray-300 mb-4">
                SEO boost means your pages will load faster for visitors and be easier for search engines to understand.
              </p>
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <p className="text-blue-200">
                  <strong>Note:</strong> SEO Boost is only available on projects with a connected custom domain and requires a Pro plan.
                </p>
              </div>
            </div>
          </section>

          {/* GitHub Integration */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Integration
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                Connect your GitHub account to Appia for seamless version control and deployment. Click the GitHub icon in the top-right corner of your screen to get started.
              </p>
              <p className="text-gray-300 mb-4">
                GitHub integration allows you to:
              </p>
              <ul className="text-gray-300 space-y-2 mb-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Automatically sync your projects to GitHub repositories
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Deploy directly from GitHub branches
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Manage version control with familiar Git workflows
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Collaborate with team members using GitHub features
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Archive className="w-8 h-8 text-cyan-500" />
              Hosting FAQs and troubleshooting
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-3">How can I unpublish a project?</h3>
                <p className="text-gray-300">
                  To unpublish a project that you've deployed to Appia hosting, go to your project settings, click <strong className="text-white">Domains & Hosting</strong>, and click the red <strong className="text-white">Unpublish</strong> text.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-3">What happens if I hit my hosting limits?</h3>
                <p className="text-gray-300">
                  Your site will stop displaying publicly until your usage resets at the start of your billing cycle. If you're on a paid plan, you can adjust your spending limit to accommodate more traffic.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-3">How do I remove the Made in Appia badge from my site?</h3>
                <p className="text-gray-300">
                  Upgrading from a Free plan to any Pro plan will remove the <strong className="text-white">Made in Appia</strong> badge from your preview window and published projects.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-3">Is website prerendering supported?</h3>
                <p className="text-gray-300">
                  Yes - we call it SEO Boosting. It's off by default; you can switch it on by following the instructions in the <strong className="text-white">SEO Boost</strong> section above.
                </p>
              </div>
            </div>
          </section>

          {/* Get Started */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 text-center border border-blue-800">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-gray-300 mb-6">
                Start building and publishing your projects with Appia's integrated hosting platform.
              </p>
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                <Globe className="w-5 h-5" />
                Start Building
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


