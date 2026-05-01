import { useEffect } from 'react';

const ExternalWidget = () => {
    useEffect(() => {
        // Create script element
        const script = document.createElement('script');
        script.src = "https://aithor1.vercel.app/widget.js";
        script.setAttribute('data-api-key', "fe22aaf150819d660081b15d5209a650414f620ab929511a");
        script.setAttribute('data-primary-color', "#6C63FF");
        script.setAttribute('data-launcher-color', "#1e293b");
        script.async = true;
        script.id = "voxio-external-widget";

        // Append to body
        document.body.appendChild(script);

        // Cleanup on unmount
        return () => {
            const existingScript = document.getElementById('voxio-external-widget');
            if (existingScript) {
                existingScript.remove();
            }
            
            // Aggressively remove any elements created by the widget script
            const widgetSelectors = [
                '#voxio-widget-container',
                '.vx-widget-container',
                '.vx-launcher',
                '.vx-window',
                '#voxio-external-widget-styles'
            ];
            
            widgetSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Also search for any remaining vx- prefixed IDs or classes if the script uses them
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.id?.startsWith('vx-') || [...el.classList].some(cls => cls.startsWith('vx-'))) {
                    el.remove();
                }
            });
        };
    }, []);

    return null; // This component doesn't render anything itself
};

export default ExternalWidget;
