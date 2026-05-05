import { useEffect } from 'react';

export const useSEO = ({ title, description, keywords, schema }) => {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
    }

    // 2. Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // 3. Update Meta Keywords
    if (keywords) {
      let metaKey = document.querySelector('meta[name="keywords"]');
      if (!metaKey) {
        metaKey = document.createElement('meta');
        metaKey.setAttribute('name', 'keywords');
        document.head.appendChild(metaKey);
      }
      metaKey.setAttribute('content', keywords);
    }

    // 4. Update JSON-LD Schema
    if (schema) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    }

    // Cleanup (Optional: revert to default if needed when unmounting, but usually SPA just overwrites it on next route)
    return () => {
      // Removing schema to avoid duplicates on route change
      const script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [title, description, keywords, schema]);
};
