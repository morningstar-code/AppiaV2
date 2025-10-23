import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';

export function Home() {
  const { prompt, setPrompt } = useAppContext();
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  const handleGenerate = () => {
    if (!isSignedIn) {
      // Show sign in modal or redirect to auth
      return;
    }
    if (prompt.trim()) {
      navigate('/builder');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen relative">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                  <span className="text-gray-900 font-bold text-lg">A</span>
                </div>
                <span className="text-white text-xl font-semibold">Appia</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it works</a>
              <a href="#hosting" className="text-gray-300 hover:text-white transition-colors">Hosting</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
              <a href="#usage" className="text-gray-300 hover:text-white transition-colors">Usage</a>
            </nav>

            {/* Authentication Section */}
            <div className="flex items-center space-x-3">
              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300 text-sm">
                    Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="My Projects"
                        labelIcon={<span>📁</span>}
                        onClick={() => window.open('/projects', '_blank')}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <SignInButton mode="modal">
                    <button className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-800">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Transform Ideas into Websites
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Simply describe what you want to build, and watch as Appia creates your website in seconds. No coding required.
          </p>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isSignedIn ? "Describe the website you want to build..." : "Sign in to start building..."}
                disabled={!isSignedIn}
                className={`w-full h-32 px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg ${!isSignedIn ? 'cursor-not-allowed opacity-50' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>
            
            {/* Generate Button */}
            {isSignedIn ? (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-medium text-lg transition-colors flex items-center mx-auto"
              >
                Generate Website
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <div className="mt-6 flex flex-col items-center space-y-3">
                <p className="text-gray-400 text-sm">Sign in to start building</p>
                <div className="flex items-center space-x-3">
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            )}
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm">
              ✨ AI-Powered
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm">
              🚀 Instant Results
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm">
              🎨 Beautiful Designs
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm">
              📱 Responsive
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-full text-gray-300 text-sm">
              🌐 Hosting Included
            </div>
          </div>

          {/* Info Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400">
            <a href="#learn-more" className="hover:text-white transition-colors">
              Learn more about Appia →
            </a>
            <a href="#examples" className="hover:text-white transition-colors">
              See examples →
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center mr-2">
                <span className="text-gray-900 font-bold text-sm">A</span>
              </div>
              <span className="text-gray-400 text-sm">Appia © 2024</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
