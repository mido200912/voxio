import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/Toast';
import './App.css';

import PublicLayout from './layouts/PublicLayout';

// ⚡ Lazy-load heavy pages — only downloaded when the user navigates to them
// This reduces the initial JS bundle by ~60%
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/Home'));
const AiTraining = lazy(() => import('./pages/dashboard/AiTraining'));
const Integrations = lazy(() => import('./pages/dashboard/Integrations'));
const TelegramTab = lazy(() => import('./pages/dashboard/TelegramTab'));
const WebsiteTab = lazy(() => import('./pages/dashboard/WebsiteTab'));
const WhatsappTab = lazy(() => import('./pages/dashboard/WhatsappTab'));
const InstagramTab = lazy(() => import('./pages/dashboard/InstagramTab'));
const ModelTest = lazy(() => import('./pages/dashboard/ModelTest'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const WidgetTab = lazy(() => import('./pages/dashboard/WidgetTab'));
const ChatbotEditor = lazy(() => import('./pages/dashboard/ChatbotEditor'));
const OnboardingProfile = lazy(() => import('./pages/onboarding/Profile'));
const OnboardingKnowledge = lazy(() => import('./pages/onboarding/Knowledge'));
const OnboardingConnect = lazy(() => import('./pages/onboarding/Connect'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Blog = lazy(() => import('./pages/Blog'));
const DocsLayout = lazy(() => import('./pages/docs/DocsLayout'));
const DocsOverview = lazy(() => import('./pages/docs/DocsOverview'));
const ShopifyIntegration = lazy(() => import('./pages/docs/ShopifyIntegration'));
const MetaIntegration = lazy(() => import('./pages/docs/MetaIntegration'));
const TelegramIntegration = lazy(() => import('./pages/docs/TelegramIntegration'));
const WidgetIntegration = lazy(() => import('./pages/docs/WidgetIntegration'));
const Support = lazy(() => import('./pages/Support'));
const AgentsExplorer = lazy(() => import('./pages/AgentsExplorer'));
const ChatWidget = lazy(() => import('./pages/ChatWidget'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Minimal loading fallback — near-zero CLS
const PageFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', opacity: 0.4
  }}>
    <div style={{
      width: 32, height: 32, border: '3px solid var(--color-border)',
      borderTopColor: 'var(--color-text)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
  </div>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
            <div className="app">
              <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public Routes with Widget */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/docs" element={<DocsLayout />}>
                    <Route index element={<DocsOverview />} />
                    <Route path="shopify" element={<ShopifyIntegration />} />
                    <Route path="meta" element={<MetaIntegration />} />
                    <Route path="telegram" element={<TelegramIntegration />} />
                    <Route path="widget" element={<WidgetIntegration />} />
                  </Route>
                  <Route path="/support" element={<Support />} />
                </Route>

                {/* Auth Routes (No Widget) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/onboarding/profile" element={<OnboardingProfile />} />
                <Route path="/onboarding/knowledge" element={<OnboardingKnowledge />} />
                <Route path="/onboarding/connect" element={<OnboardingConnect />} />
                
                <Route path="/agents" element={<AgentsExplorer />} />
                <Route path="/agents/:apiKey" element={<AgentsExplorer />} />
                <Route path="/widget/:apiKey" element={<ChatWidget />} />
                <Route path="/chat/:slug" element={<ChatPage />} />
                {/* Dashboard routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardHome />} />
                  <Route path="ai-training" element={<AiTraining />} />
                  <Route path="model-test" element={<ModelTest />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="telegram" element={<TelegramTab />} />
                  <Route path="website-chat" element={<WebsiteTab />} />
                  <Route path="whatsapp" element={<WhatsappTab />} />
                  <Route path="instagram" element={<InstagramTab />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="widget" element={<WidgetTab />} />
                  <Route path="chatbot-editor" element={<ChatbotEditor />} />
                </Route>
              </Routes>
              </Suspense>
            </div>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
