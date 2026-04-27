import React from 'react';
import './PageLoader.css';

const PageLoader = ({ text = 'جاري التحميل...' }) => {
    return (
        <div className="page-loader-overlay">
            <div className="loader-container">
                <div className="outer-ring"></div>
                <div className="inner-ring"></div>
                <img src="/logo.png" alt="VOXIO" className="loader-logo" />
            </div>
            <p className="loading-text">{text}</p>
        </div>
    );
};

export default PageLoader;
