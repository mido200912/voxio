import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Initialize from localStorage, default to 'en'
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('voxio_lang');
        return savedLang ? savedLang : 'en';
    });

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('voxio_lang', language);
        
        // Update document direction and language code
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
        // Update font family
        document.body.style.fontFamily = language === 'ar' ? 'var(--font-ar)' : 'var(--font-en)';
    }, [language]);

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
