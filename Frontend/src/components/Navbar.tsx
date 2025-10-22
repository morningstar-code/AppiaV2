import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';

interface NavbarProps {
  scrollY: number;
}

export function Navbar({ scrollY }: NavbarProps) {
  const navigator = useNavigate();
  const { isSignedIn, user } = useUser();
  
  return (
    <motion.nav
      initial={{ filter: 'blur(10px)' }}
      animate={{ filter: 'blur(0px)' }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed z-20 flex items-center justify-between py-6 md:p-6 transition-all duration-300 w-full',
        scrollY > 50
          ? 'backdrop-blur-lg bg-gray-950/70 shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="w-full flex items-center justify-between md:px-8 px-3 left-0 right-0">
        <div className="flex items-center space-x-2">
          <div
            onClick={() => navigator('/')}
            className="flex items-center space-x-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg=="
                alt="AppiaV2 Logo"
                className="w-6 h-6 relative z-10"
              />
            </div>
            <span className="text-2xl font-bold text-white">AppiaV2</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Features
          </a>
          <a
            href="#howitworks"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            FAQ
          </a>
          
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
                />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <button className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-800">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
