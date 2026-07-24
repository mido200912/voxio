import axios from 'axios';

// 🔒 Control 11: Outbound Network Isolation (SSRF Protection)
axios.interceptors.request.use((config) => {
    try {
        if (config.url && config.url.startsWith('http')) {
            const urlObj = new URL(config.url);
            const hostname = urlObj.hostname;
            
            // Block list for internal IPs and cloud metadata
            const blockedHosts = [
                '169.254.169.254', 
                '127.0.0.1',       
                '0.0.0.0',
                'localhost'
            ];
            
            // Basic check - in production you'd want DNS resolution to block resolved internal IPs
            if (blockedHosts.includes(hostname) || hostname.endsWith('.internal')) {
                throw new Error(`SSRF Prevention: Blocked outbound request to internal host: ${hostname}`);
            }
        }
    } catch (err) {
        if (err.message.includes('SSRF')) throw err;
    }
    return config;
});

export default axios;
