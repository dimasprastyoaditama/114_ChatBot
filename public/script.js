const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let messageHistory = [
    { role: 'assistant', content: 'Halo! Ada yang bisa saya bantu?' }
];

function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'user' ? 'user' : 'ai');
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    messageHistory.push({ role: 'user', content: text });
    userInput.value = '';

    const aiMessageDiv = appendMessage('ai', '');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageHistory })
        });

        if (!response.ok) {
            throw new Error('Gagal terhubung ke server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponseText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        aiResponseText += parsed;
                        aiMessageDiv.textContent = aiResponseText;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    } catch (e) {
                        // Abaikan error parsing parsial
                    }
                }
            }
        }

        messageHistory.push({ role: 'assistant', content: aiResponseText });

    } catch (error) {
        console.error(error);
        aiMessageDiv.textContent = 'Terjadi kesalahan pada koneksi.';
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});