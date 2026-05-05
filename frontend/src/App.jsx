import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import OnboardingProfile from './pages/onboarding/Profile';
import OnboardingKnowledge from './pages/onboarding/Knowledge';
import OnboardingConnect from './pages/onboarding/Connect';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/Home';
import AiTraining from './pages/dashboard/AiTraining';
import Integrations from './pages/dashboard/Integrations';
import TelegramTab from './pages/dashboard/TelegramTab';
import WebsiteTab from './pages/dashboard/WebsiteTab';
import WhatsappTab from './pages/dashboard/WhatsappTab';
import InstagramTab from './pages/dashboard/InstagramTab';
import ModelTest from './pages/dashboard/ModelTest';
import Settings from './pages/dashboard/Settings';
import WidgetTab from './pages/dashboard/WidgetTab';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import DocsLayout from './pages/docs/DocsLayout';
import DocsOverview from './pages/docs/DocsOverview';
import ShopifyIntegration from './pages/docs/ShopifyIntegration';
import MetaIntegration from './pages/docs/MetaIntegration';
import TelegramIntegration from './pages/docs/TelegramIntegration';
import WidgetIntegration from './pages/docs/WidgetIntegration';
import Support from './pages/Support';
import AgentsExplorer, { AgentChat } from './pages/AgentsExplorer';
import ChatWidget from './pages/ChatWidget';
import ChatbotEditor from './pages/dashboard/ChatbotEditor';
import ChatPage from './pages/ChatPage';
import ToastProvider from './components/Toast';
import './App.css';

import PublicLayout from './layouts/PublicLayout';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
            <div className="app">
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
                <Route path="/agents/:apiKey" element={<AgentChat />} />
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
            </div>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
