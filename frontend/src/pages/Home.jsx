import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Integrations from '../components/Integrations';
import Pricing from '../components/Pricing';
import Contact from '../components/Contact';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import VOXIOChatWidget from '../components/VOXIOChatWidget';

const Home = () => {
    return (
        <div className="home-page">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Integrations />
                <Pricing />
                <Contact />
            </main>
            <Footer />
            <VOXIOChatWidget />
        </div>
    );
};

export default Home;
