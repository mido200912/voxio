const SECRET_SALT = 'voxio_secure_v1_';

const encrypt = (text) => {
    if (!text) return text;
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return SECRET_SALT + encoded.split('').reverse().join('');
};

const decrypt = (scrambled) => {
    if (!scrambled) return null;
    if (!scrambled.startsWith(SECRET_SALT)) return scrambled;
    try {
        const encoded = scrambled.replace(SECRET_SALT, '').split('').reverse().join('');
        return decodeURIComponent(escape(atob(encoded)));
    } catch (e) {
        return scrambled;
    }
};

export const secureStorage = {
    setItem: (key, value) => {
        if (value === null || value === undefined || value === 'null' || value === 'undefined') {
            localStorage.removeItem(key);
            return;
        }
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, encrypt(stringValue));
    },
    getItem: (key) => {
        try {
            const scrambled = localStorage.getItem(key);
            if (!scrambled || scrambled === 'null' || scrambled === 'undefined' || scrambled === '[object Object]') return null;
            
            let decrypted = decrypt(scrambled);
            if (!decrypted || decrypted === 'null' || decrypted === 'undefined' || decrypted === '[object Object]') return null;
            
            if ((decrypted.startsWith('{') && decrypted.endsWith('}')) || (decrypted.startsWith('[') && decrypted.endsWith(']'))) {
                return JSON.parse(decrypted);
            }
            return decrypted;
        } catch (e) {
            return null;
        }
    },
    removeItem: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
};
