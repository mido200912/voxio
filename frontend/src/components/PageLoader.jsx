import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './PageLoader.css';

const PageLoader = ({ text = 'جاري التحميل...' }) => {
    const { theme } = useTheme();
    
    return (
        <div className="page-loader-overlay">
            {/* Premium Background Elements */}
            <div className="loader-bg-glow"></div>
            <div className="floating-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="loader-content">
                <div className="loader-rings">
                    <div className="ring ring-outer"></div>
                    <div className="ring ring-middle"></div>
                    <div className="ring ring-inner"></div>
                    
                    {/* Centered Logo Container */}
                    <div className="logo-wrapper">
                        <img 
                            src={theme === 'dark' ? '/logodark.png' : '/logo.png'} 
                            alt="VOXIO" 
                            className="loader-logo" 
                        />
                        <div className="logo-glow"></div>
                    </div>
                </div>
                
                <div className="text-container">
                    <p className="loading-text">{text}</p>
                    <div className="loading-bar-wrapper">
                        <div className="loading-bar-progress"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
