import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Sparkles, 
  MessageSquare, 
  Code, 
  Eye, 
  Download, 
  Share2,
  Zap,
  Palette,
  Smartphone,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Clock
} from 'lucide-react';

export function HowItWorks() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-400" />,
      title: "Describe Your Vision",
      description: "Simply tell Appia what you want to build. Be as detailed or as simple as you like.",
      example: "Create a modern portfolio website for a photographer with a dark theme and smooth animations"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "AI Works Its Magic",
      description: "Our advanced AI analyzes your request and generates the perfect code structure.",
      example: "Appia creates HTML, CSS, and JavaScript files tailored to your needs"
    },
    {
      icon: <Eye className="w-8 h-8 text-green-400" />,
      title: "See It Live",
      description: "Watch your website come to life in real-time with our live preview.",
      example: "Make adjustments instantly and see changes immediately"
    },
    {
      icon: <Download className="w-8 h-8 text-orange-400" />,
      title: "Deploy & Share",
      description: "Publish your website with one click and share it with the world.",
      example: "Get a live URL that you can share with anyone, anywhere"
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Lightning Fast",
      description: "Generate complete websites in seconds, not hours"
    },
    {
      icon: <Palette className="w-6 h-6 text-pink-400" />,
      title: "Beautiful Designs",
      description: "Modern, responsive designs that look professional"
    },
    {
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
      title: "Mobile Ready",
      description: "Every website is automatically optimized for all devices"
    },
    {
      icon: <Globe className="w-6 h-6 text-green-400" />,
      title: "Global Hosting",
      description: "Fast, reliable hosting included with every project"
    }
  ];

  const examples = [
    {
      title: "Portfolio Website",
      description: "Professional showcase for your work",
      image: "🎨",
      features: ["Responsive design", "Image galleries", "Contact forms"]
    },
    {
      title: "Business Landing",
      description: "Convert visitors into customers",
      image: "💼",
      features: ["Call-to-action buttons", "Service sections", "Testimonials"]
    },
    {
      title: "E-commerce Store",
      description: "Sell products online",
      image: "🛒",
      features: ["Product catalogs", "Shopping cart", "Payment integration"]
    },
    {
      title: "Blog Platform",
      description: "Share your thoughts and ideas",
      image: "📝",
      features: ["Article management", "Comments system", "SEO optimized"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-gray-900 font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold">Appia</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate('/')} className="text-gray-300 hover:text-white transition-colors">
                Home
              </button>
              <button onClick={() => navigate('/#features')} className="text-gray-300 hover:text-white transition-colors">
                Features
              </button>
              <button className="text-white font-medium">How it works</button>
              <button onClick={() => navigate('/#hosting')} className="text-gray-300 hover:text-white transition-colors">
                Hosting
              </button>
              <button onClick={() => navigate('/#faq')} className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </button>
              <button onClick={() => navigate('/usage')} className="text-gray-300 hover:text-white transition-colors">
                Usage
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">Welcome, {user?.firstName || 'User'}</span>
                  <button 
                    onClick={() => navigate('/builder')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Go to Builder
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => navigate('/builder')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            How Appia Works
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Transform your ideas into stunning websites in just 4 simple steps. 
            No coding knowledge required.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>2 minutes</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>No coding required</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Star className="w-4 h-4" />
              <span>Professional results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-400">0{index + 1}</div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-blue-200 italic">"{step.example}"</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Choose Appia?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built with cutting-edge AI technology to deliver professional results in minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">What Can You Build?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From simple landing pages to complex web applications, Appia can handle it all
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {examples.map((example, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl mb-4">{example.image}</div>
                <h3 className="text-xl font-semibold mb-2">{example.title}</h3>
                <p className="text-gray-300 mb-4">{example.description}</p>
                <ul className="space-y-2">
                  {example.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-6">Ready to Build Something Amazing?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already building with Appia. 
              Start your first project in under 2 minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/builder')}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Start Building Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/')}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>108k tokens included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-gray-900 font-bold">A</span>
              </div>
              <span className="text-xl font-bold">Appia</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => navigate('/usage')} className="hover:text-white transition-colors">Usage</button>
              <button onClick={() => navigate('/#hosting')} className="hover:text-white transition-colors">Hosting</button>
              <button onClick={() => navigate('/#faq')} className="hover:text-white transition-colors">FAQ</button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            <p>&copy; 2024 Appia. Built with AI, powered by creativity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

