import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './PageLoader.css';

const PageLoader = ({ text = 'جاري التحميل...' }) => {
    const { theme } = useTheme();
    
    return (
        <div className="page-loader-overlay">
            <div className="loader-content">
                <div className="loader-mark" aria-hidden="true">
                    <img
                        src={theme === 'dark' ? '/logodark.png' : '/logo.png'}
                        alt=""
                        className="loader-logo"
                    />
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
