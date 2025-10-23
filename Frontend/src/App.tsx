import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import { Usage } from './pages/Usage';
import { HostingDocs } from './pages/HostingDocs';
import { Projects } from './pages/Projects';
import { AppProvider } from './context/AppContext';
import './index.css';

// Get the publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing Publishable Key");
}

function App() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AppProvider>
        <BrowserRouter>
          {isProduction && <Analytics />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/hosting" element={<HostingDocs />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ClerkProvider>
  );
}

export default App;
