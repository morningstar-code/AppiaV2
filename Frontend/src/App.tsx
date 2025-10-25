import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { Analytics } from '@vercel/analytics/react'; // Temporarily disabled to stop 404 errors
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Home } from './pages/Home';
import { NewBuilder } from './pages/NewBuilder';
import { BoltBuilder } from './pages/BoltBuilder';
import { Usage } from './pages/Usage';
import { HostingDocs } from './pages/HostingDocs';
import { Projects } from './pages/Projects';
import { HowItWorks } from './pages/HowItWorks';
import { AppProvider } from './context/AppContext';
import './index.css';

// Get the publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // If no Clerk key, show warning but continue
  const hasClerkKey = typeof clerkPublishableKey === 'string' && clerkPublishableKey.length > 0;
  if (!hasClerkKey) {
    console.warn('Clerk disabled (no key provided).');
  }

  const routes = (
    <AppProvider>
      <BrowserRouter>
        {/* {isProduction && <Analytics />} Temporarily disabled to stop 404 errors */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<BoltBuilder />} />
          <Route path="/builder-old" element={<NewBuilder />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/usage" element={<Usage />} />
          <Route path="/hosting" element={<HostingDocs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
  
  // Only wrap with Clerk if key is available
  if (hasClerkKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {routes}
      </ClerkProvider>
    );
  }
  
  return routes;
}

export default App;
