(function() {
    // 1. Get the API Key from the script tag
    const script = document.currentScript;
    const apiKey = script.getAttribute('data-api-key');
    const baseUrl = script.getAttribute('data-base-url') || 'https://voxio1.vercel.app';
    const primaryColor = script.getAttribute('data-primary-color') || '#6C63FF';
    const launcherColor = script.getAttribute('data-launcher-color') || primaryColor;

    if (!apiKey) {
        console.error('VOXIO Widget Error: data-api-key is missing from the script tag.');
        return;
    }

    // 2. Add FontAwesome
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(fa);

    // 3. Styles
    const style = document.createElement('style');
    style.id = 'voxio-external-widget-styles';
    style.innerHTML = `
        #voxio-widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            direction: rtl;
        }

        #voxio-widget-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc);
            color: #fff;
            box-shadow: 0 6px 20px ${primaryColor}55, 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
            border: none;
            outline: none;
            animation: voxio-pulse-ring 3s ease-in-out infinite;
        }

        #voxio-widget-button:hover {
            transform: scale(1.08);
            box-shadow: 0 10px 30px ${primaryColor}77, 0 4px 12px rgba(0,0,0,0.3);
        }

        #voxio-widget-button i { font-size: 26px; transition: transform 0.3s ease; }
        #voxio-widget-button.open i { transform: rotate(90deg); }

        @keyframes voxio-pulse-ring {
            0%, 100% { box-shadow: 0 6px 20px ${primaryColor}55, 0 0 0 0 ${primaryColor}33; }
            50% { box-shadow: 0 6px 20px ${primaryColor}55, 0 0 0 10px transparent; }
        }

        #voxio-widget-window {
            position: absolute;
            bottom: 76px;
            right: 0;
            width: 390px;
            height: 540px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 110px);
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.08);
            display: none;
            flex-direction: column;
            transform-origin: bottom right;
            transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease;
            opacity: 0;
            transform: scale(0.85) translateY(20px);
        }

        #voxio-widget-window.open {
            display: flex;
            opacity: 1;
            transform: scale(1) translateY(0);
        }

        #voxio-widget-window iframe {
            border: none;
            width: 100%;
            height: 100%;
        }

        /* Copilot Highlight Glow Effect */
        .voxio-copilot-highlight {
            outline: 3px solid ${primaryColor} !important;
            outline-offset: 4px !important;
            box-shadow: 0 0 0 4px ${primaryColor}33, 0 0 30px ${primaryColor}44 !important;
            transition: all 0.3s ease !important;
            position: relative !important;
        }
    `;
    document.head.appendChild(style);

    // 4. Container
    const container = document.createElement('div');
    container.id = 'voxio-widget-container';
    document.body.appendChild(container);

    // 5. Button
    const button = document.createElement('button');
    button.id = 'voxio-widget-button';
    button.setAttribute('aria-label', 'Open Chat');
    button.innerHTML = '<i class="fas fa-comment-dots"></i>';
    container.appendChild(button);

    // 6. Chat Window with iframe
    const win = document.createElement('div');
    win.id = 'voxio-widget-window';
    win.innerHTML = `<iframe src="${baseUrl}/widget/${apiKey}" title="VOXIO Chat" allow="microphone"></iframe>`;
    container.appendChild(win);

    // 7. Toggle
    let isOpen = false;
    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            win.style.display = 'flex';
            requestAnimationFrame(() => win.classList.add('open'));
            button.classList.add('open');
            button.innerHTML = '<i class="fas fa-xmark"></i>';
        } else {
            win.classList.remove('open');
            button.classList.remove('open');
            button.innerHTML = '<i class="fas fa-comment-dots"></i>';
            setTimeout(() => { if (!isOpen) win.style.display = 'none'; }, 350);
        }
    };

    // 8. Close on outside click
    document.addEventListener('mousedown', (e) => {
        if (isOpen && !container.contains(e.target)) {
            isOpen = false;
            win.classList.remove('open');
            button.classList.remove('open');
            button.innerHTML = '<i class="fas fa-comment-dots"></i>';
            setTimeout(() => { win.style.display = 'none'; }, 350);
        }
    });

    // 9. ─── AI COPILOT: Listen for postMessage from iframe ────────────────────
    window.addEventListener('message', (event) => {
        if (!event.data || typeof event.data.type !== 'string') return;
        if (!event.data.type.startsWith('VOXIO_')) return;

        const { type, target, selector } = event.data;

        if (type === 'VOXIO_NAVIGATE') {
            if (!target) return;
            if (target.startsWith('#')) {
                // Smooth scroll to section
                const el = document.querySelector(target);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else if (target.startsWith('/')) {
                // Navigate to page
                setTimeout(() => { window.location.href = target; }, 1000);
            } else {
                window.location.href = target;
            }
        }

        if (type === 'VOXIO_HIGHLIGHT') {
            if (!selector) return;
            const el = document.querySelector(selector);
            if (!el) return;

            // Scroll to it
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Apply neon glow highlight
            el.classList.add('voxio-copilot-highlight');

            // Remove after 4 seconds
            setTimeout(() => {
                el.classList.remove('voxio-copilot-highlight');
            }, 4000);
        }
    });

})();
