export function getDefaultChatbotTemplate(company) {
  const name = company.name || 'AI Assistant';
  const logo = company.logo || '';
  const apiKey = company.apiKey || '';
  const slug = company.slug || '';
  const apiUrl = process.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

  const logoHtml = logo 
    ? `<img src="${logo}" alt="${name}" class="company-logo">`
    : `<div class="company-logo-placeholder">${name.charAt(0)}</div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Chat</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg: #050505;
            --card-bg: #111;
            --border: #333;
            --text: #fff;
            --text-muted: #888;
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.4);
            --font-ar: 'Cairo', sans-serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: var(--font-ar); }
        
        body {
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .chat-container {
            width: 100%; max-width: 600px; height: 100vh; display: flex; flex-direction: column;
            background: var(--card-bg);
            border-left: 1px solid var(--border); border-right: 1px solid var(--border);
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
            position: relative;
        }

        .header {
            padding: 20px 24px; border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(10, 10, 15, 0.4);
            backdrop-filter: blur(10px);
        }
        .header-left { display: flex; align-items: center; gap: 15px; }
        .company-logo, .company-logo-placeholder {
            width: 45px; height: 45px; border-radius: 14px; object-fit: cover;
            border: 2px solid var(--border);
        }
        .company-logo-placeholder {
            background: linear-gradient(135deg, var(--border), #222);
            display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 20px;
        }
        .header-info h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
        .status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #22c55e; }
        .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

        .messages-area {
            flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px;
            scroll-behavior: smooth;
        }
        .messages-area::-webkit-scrollbar { width: 5px; }
        .messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .message { display: flex; gap: 12px; max-width: 85%; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        /* In RTL: flex-start = Right (Visitor), flex-end = Left (Bot) */
        .message.ai { align-self: flex-end; flex-direction: row-reverse; }
        .message.user { align-self: flex-start; flex-direction: row; }

        .msg-avatar {
            width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-size: 14px;
        }
        .message.ai .msg-avatar { background: var(--text); color: var(--bg); }
        .message.user .msg-avatar { background: var(--border); color: var(--text); }

        .msg-bubble {
            padding: 14px 18px; border-radius: 18px; font-size: 15px; line-height: 1.6;
            position: relative; white-space: pre-wrap; word-break: break-word; text-align: right;
        }
        .message.ai .msg-bubble { 
            background: transparent; border: 1px solid var(--border); 
            border-bottom-left-radius: 4px; color: var(--text);
        }
        .message.user .msg-bubble { 
            background: var(--text); color: var(--bg);
            border-bottom-right-radius: 4px;
        }
        
        .message .msg-content {
            display: flex; flex-direction: column; gap: 4px; 
            width: fit-content; max-width: 100%;
        }
        .message.ai .msg-content { align-items: flex-start; }
        .message.user .msg-content { align-items: flex-end; }

        .input-area {
            padding: 20px 24px; background: var(--bg); border-top: 1px solid var(--border);
        }
        .input-wrapper {
            display: flex; gap: 12px; background: var(--card-bg); padding: 8px;
            border-radius: 16px; border: 1px solid var(--border); transition: all 0.3s;
        }
        .input-wrapper:focus-within { border-color: var(--text); box-shadow: 0 0 15px rgba(255, 255, 255, 0.1); }
        input {
            flex: 1; background: transparent; border: none; outline: none; color: var(--text);
            padding: 10px 15px; font-size: 15px;
        }
        .send-btn {
            width: 45px; height: 45px; border-radius: 12px; background: var(--text);
            border: none; color: var(--bg); cursor: pointer; transition: 0.2s;
            display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .send-btn i { transform: scaleX(-1); }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .welcome-box {
            text-align: center; margin: auto 0; padding: 40px 20px;
        }
        .welcome-icon {
            font-size: 50px; color: var(--text); margin-bottom: 20px;
        }
        .welcome-box h2 { font-size: 24px; margin-bottom: 10px; }
        .welcome-box p { color: var(--text-muted); font-size: 16px; }

        .autocomplete-menu {
            position: absolute; bottom: calc(100% + 10px); left: 0; width: 100%; maxWidth: 300px;
            background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.5); overflow: hidden;
            display: none; flex-direction: column; z-index: 10;
        }
        .autocomplete-item {
            padding: 12px 15px; border-bottom: 1px solid var(--border);
            cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 4px;
        }
        .autocomplete-item:hover { background: var(--primary); color: #fff; }
        .autocomplete-cmd { font-weight: 600; font-size: 14px; }
        .autocomplete-desc { font-size: 11px; opacity: 0.8; }

        /* Product Buttons */
        .ai-buttons-container {
            display: flex; flex-direction: column; gap: 6px;
            width: 100%; min-width: 150px; box-sizing: border-box; 
            align-items: stretch; margin-top: 8px;
        }
        
        .product-btn {
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 8px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
            width: 100%;
            display: block;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .product-btn:hover {
            border-color: var(--text);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
            background: var(--text);
            color: var(--bg);
        }
        .product-btn:active { transform: translateY(0); }

        @media (max-width: 480px) {
            .chat-container { border: none; height: 100vh; }
            .msg-bubble { font-size: 14px; }
        }
    </style>
</head>
<body>
<div class="chat-container">
    <div class="header">
        <div class="header-left">
            ${logoHtml}
            <div class="header-info">
                <h1>${name}</h1>
                <div class="status"><div class="status-dot"></div> متصل الآن</div>
            </div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted)">مدعوم بواسطة <a href="/" style="color: var(--text); text-decoration: none; font-weight: bold;">VOXIO</a></div>
    </div>

    <div class="messages-area" id="chat-box">
        <div class="welcome-box">
            <div class="welcome-icon"><i class="fas fa-robot"></i></div>
            <h2>أهلاً بك في ${name}</h2>
            <p>أنا مساعدك الذكي، كيف يمكنني خدمتك اليوم؟</p>
        </div>
    </div>

    <div class="input-area" style="position: relative;">
        <div class="autocomplete-menu" id="autocomplete-menu"></div>
        <div class="input-wrapper">
            <input type="text" id="user-input" placeholder="اكتب سؤالك أو اكتب / للأوامر..." autocomplete="off">
            <button id="send-btn" class="send-btn"><i class="fas fa-paper-plane"></i></button>
        </div>
    </div>
</div>

<script>
(function() {
    const box = document.getElementById('chat-box');
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    const autocompMenu = document.getElementById('autocomplete-menu');
    let sid = localStorage.getItem('voxio_sid');
    if (!sid) {
        sid = "sess_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('voxio_sid', sid);
    }
    let isProcessing = false;
    let webCommands = [];

    // Fetch Commands
    fetch('${apiUrl}/public/commands/${apiKey}')
        .then(r => r.json())
        .then(d => { if (d.success) webCommands = d.commands; })
        .catch(e => console.error(e));

    // Load History
    fetch('${apiUrl}/public/history?apiKey=${apiKey}&sessionId=' + sid)
        .then(r => r.json())
        .then(d => {
            if (d.success && d.history.length > 0) {
                const welcome = box.querySelector('.welcome-box');
                if (welcome) welcome.remove();
                d.history.forEach(m => append(m.sender, m.text));
            }
        })
        .catch(e => console.error(e));

    function append(role, text) {
        const welcome = box.querySelector('.welcome-box');
        if (welcome) welcome.remove();

        const div = document.createElement('div');
        div.className = 'message ' + role;
        // Escape HTML to prevent XSS but allow buttons later
        const safeText = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');
        
        let htmlContent = '<div class="msg-avatar"><i class="fas fa-' + (role === "ai" ? "robot" : "user") + '"></i></div>' +
                          '<div class="msg-content">' +
                            '<div class="msg-bubble" dir="auto">' + safeText + '</div>' +
                          '</div>';
        
        div.innerHTML = htmlContent;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        return div;
    }

    function appendButtons(buttons, parentRow) {
        if (!buttons || buttons.length === 0) return;
        const container = document.createElement('div');
        container.className = 'ai-buttons-container';
        
        buttons.forEach(function(btnText) {
            const btn = document.createElement('button');
            btn.className = 'product-btn';
            btn.textContent = btnText;
            btn.onclick = function() {
                input.value = btnText;
                send();
            };
            container.appendChild(btn);
        });
        
        if (parentRow) {
            const content = parentRow.querySelector('.msg-content');
            if (content) content.appendChild(container);
            else box.appendChild(container);
        } else {
            box.appendChild(container);
        }
        
        box.scrollTop = box.scrollHeight;
    }

    async function send() {
        autocompMenu.style.display = 'none';
        const text = input.value.trim();
        if (!text || isProcessing) return;

        isProcessing = true;
        input.disabled = true;
        btn.disabled = true;
        
        append('user', text);
        input.value = '';

        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'message ai';
        loadingDiv.innerHTML = '<div class="msg-avatar"><i class="fas fa-robot"></i></div><div class="msg-bubble" dir="auto"><i class="fas fa-spinner fa-spin"></i> يكتب...</div>';
        box.appendChild(loadingDiv);
        box.scrollTop = box.scrollHeight;

        try {
            const res = await fetch('${apiUrl}/public/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: '${apiKey}', prompt: text, sessionId: sid })
            });
            const data = await res.json();
            
            document.getElementById(loadingId)?.remove();
            
            if (res.ok) {
                const aiRow = append('ai', data.reply || "عذراً، حدث خطأ ما.");
                if (data.buttons && data.buttons.length > 0) {
                    appendButtons(data.buttons, aiRow);
                }
            } else {
                append('ai', data.error || "عذراً، حدث خطأ ما.");
            }
        } catch (e) {
            document.getElementById(loadingId)?.remove();
            append('ai', "⚠ خطأ في الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.");
        } finally {
            isProcessing = false;
            input.disabled = false;
            btn.disabled = false;
            input.focus();
        }
    }

    btn.addEventListener('click', send);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') send();
    });

    input.addEventListener('input', function(e) {
        const text = input.value;
        if (text.startsWith('/') && webCommands.length > 0) {
            const query = text.replace('/', '').toLowerCase();
            const matches = webCommands.filter(c => c.command.toLowerCase().includes(query));
            if (matches.length > 0) {
                autocompMenu.innerHTML = '';
                matches.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = '<span class="autocomplete-cmd">/' + c.command + '</span>' +
                                    '<span class="autocomplete-desc">' + c.description + '</span>';
                    div.onclick = function() {
                        input.value = '/' + c.command;
                        send();
                    };
                    autocompMenu.appendChild(div);
                });
                autocompMenu.style.display = 'flex';
            } else {
                autocompMenu.style.display = 'none';
            }
        } else {
            autocompMenu.style.display = 'none';
        }
    });

    // Close on click outside
    document.addEventListener('click', function(e) {
        if (!autocompMenu.contains(e.target) && e.target !== input) {
            autocompMenu.style.display = 'none';
        }
    });
})();
</script>
</body>
</html>`;
}
