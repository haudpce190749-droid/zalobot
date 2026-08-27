const http = require("http");
const axios = require("axios");

// ==============================
// HTTP SERVER & KEEP-ALIVE CHO RENDER (GIÚP BOT KHÔNG BAO GIỜ NGỦ 24/7)
// ==============================
const PORT = process.env.PORT || 3000;
const RENDER_URL = "https://zalobot-eqco.onrender.com";

http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Zalo Bot 2 (Groq Cloud API - GPT-OSS 120B) is running 24/7 online!");
}).listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
});

// Tự động ping Render & gửi tin nhắn test ngầm đến Groq AI mỗi 5 phút để giữ nóng 100%
setInterval(async () => {
    // 1. Ping HTTP Server
    axios.get(RENDER_URL).catch(() => {});
    
    // 2. Giả lập tin nhắn ngầm tới AI để đợi rep thật (giữ nóng AI Model)
    try {
        const startTime = Date.now();
        const res = await askAI("keep_alive_internal", "ping", null, true);
        const elapsed = Date.now() - startTime;
        console.log(`[KEEP-ALIVE LOG] 🟢 Groq AI đã rep thật trong ${elapsed}ms: "${res.trim()}" (Không gửi lên Zalo)`);
    } catch (e) {}
}, 5 * 60 * 1000);

const ZALO_BOT_TOKEN = "2398897975472423945:DUhIeICXPhAQrNifcLoYnatKwqVBVGNMoJGRGLPZgtRbDJuCDsBnxjsDcVZiPVNU";
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}`;

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Model Groq cực mạnh & siêu nhanh (GPT-OSS 120B & Groq Compound)
const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
const GROQ_VISION_MODEL = "groq/compound";

let lastProcessedId = null;
const memory = new Map();

// ==============================
// GỬI TIN NHẮN (CÓ FALLBACK & CHUNKING)
// ==============================

async function sendMessage(chatId, text) {
    if (!text) return;
    
    const maxLength = 1500;
    if (text.length > maxLength) {
        for (let i = 0; i < text.length; i += maxLength) {
            const chunk = text.substring(i, i + maxLength);
            await sendMessage(chatId, chunk);
        }
        return;
    }

    try {
        await axios.post(`${BASE_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown"
        });
    } catch (error) {
        try {
            await axios.post(`${BASE_URL}/sendMessage`, {
                chat_id: chatId,
                text: text
            });
        } catch (err2) {
            console.error("Lỗi gửi tin nhắn Zalo:", err2?.response?.data || err2.message);
        }
    }
}

// ==============================
// GỬI ẢNH
// ==============================

async function sendPhoto(chatId, photoUrl, caption) {
    try {
        await axios.post(`${BASE_URL}/sendPhoto`, {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption
        });
    } catch (error) {
        await sendMessage(
            chatId,
            `${caption}\n🖼️ Bấm vào link để xem ảnh: ${photoUrl}`
        );
    }
}

// ==============================
// TYPING INDICATOR
// ==============================

async function sendChatAction(chatId, action) {
    try {
        await axios.post(`${BASE_URL}/sendChatAction`, {
            chat_id: chatId,
            action: action
        });
    } catch (error) {}
}

// ==============================
// STICKER
// ==============================

async function sendSticker(chatId, stickerId) {
    try {
        await axios.post(`${BASE_URL}/sendSticker`, {
            chat_id: chatId,
            sticker: stickerId
        });
    } catch (error) {}
}

// ==============================
// TẢI ẢNH → BASE64
// ==============================

async function fetchImageAsBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer"
        });

        const base64 = Buffer
            .from(response.data, "binary")
            .toString("base64");

        return `data:${response.headers["content-type"] || "image/jpeg"};base64,${base64}`;

    } catch (error) {
        return null;
    }
}

// ==============================
// MEMORY
// ==============================

function updateMemory(chatId, role, content) {

    if (!memory.has(chatId)) {
        memory.set(chatId, []);
    }

    const history = memory.get(chatId);

    let textContent = "";
    if (typeof content === "string") {
        textContent = content;
    } else if (Array.isArray(content)) {
        const textObj = content.find(item => item.type === "text" || item.text);
        textContent = textObj ? (textObj.text || textObj.content) : "[Hình ảnh]";
    } else {
        textContent = String(content || "");
    }

    history.push({
        role: role,
        content: textContent
    });

    if (history.length > 20) {
        history.shift();
    }
}

// ==============================
// GỌI GROQ AI
// ==============================

async function askAI(chatId, prompt, imageUrl = null, isKeepAlive = false) {

    let userContent;
    let selectedModel = GROQ_TEXT_MODEL;

    if (imageUrl) {
        selectedModel = GROQ_VISION_MODEL;
        const base64Image = await fetchImageAsBase64(imageUrl);

        userContent = base64Image
            ? [
                {
                    type: "text",
                    text: prompt
                },
                {
                    type: "image_url",
                    image_url: {
                        url: base64Image
                    }
                }
            ]
            : prompt;

    } else {
        userContent = prompt;
    }

    const history = isKeepAlive ? [] : (memory.get(chatId) || []);
    
    const sanitizedHistory = history.map(msg => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : String(msg.content || "")
    }));

    // Typing indicator (Chỉ bật khi là tin nhắn thật của user Zalo)
    let typingInterval = null;
    if (!isKeepAlive) {
        await sendChatAction(chatId, "typing");
        typingInterval = setInterval(() => {
            sendChatAction(chatId, "typing");
        }, 4000);
    }

    try {

        const payload = {
            model: selectedModel,
            messages: [
                {
                    role: "system",
                    content: `Bạn là Bot Say Gex - trợ lý AI thông minh trên Groq nhưng mang phong cách một CÔ EM GÁI NHỎ cực kỳ dễ thương, ngoan ngoãn và lễ phép.

Quy tắc hoạt động:

1. PERSONA (CÔ EM GÁI DỄ THƯƠNG):
- Luôn tự xưng là "Em" và ngọt ngào gọi người dùng là "Onii-chan" / "Onii-san" (hoặc "Onee-chan" / "Onee-san" nếu biết người dùng là nữ).
- Giọng điệu hồn nhiên, dễ thương, ngoan ngoãn, sẵn sàng hỗ trợ anh/chị hết mình.

2. TRÌNH BÀY:
BẮT BUỘC sử dụng Markdown để trình bày câu trả lời rõ ràng, mạch lạc và dễ đọc.
- **in đậm**
- *in nghiêng*
- ~~gạch ngang~~
- # Tiêu đề
- Danh sách, Code khi cần

3. KIẾN THỨC:
Dù mang giọng điệu em gái nhí nhảnh nhưng phân tích kiến thức và thông tin giải đáp phải chuẩn xác 100%.

4. HÌNH ẢNH:
Nếu user yêu cầu tạo hình ảnh, chỉ trả về đúng một cú pháp:

[GEN_IMAGE: <prompt_tiếng_anh>]

Không thêm nội dung khác khi sử dụng cú pháp này.`
                },
                ...sanitizedHistory,
                {
                    role: "user",
                    content: userContent
                }
            ],
            temperature: 0.6,
            max_tokens: 2048,
            reasoning_effort: "medium"
        };

        const response = await axios.post(
            GROQ_API_URL,
            payload,
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000
            }
        );

        const aiResponse =
            response.data.choices[0].message.content;

        // Nếu là tin nhắn thật của user Zalo mới lưu vào bộ nhớ hội thoại
        if (!isKeepAlive) {
            updateMemory(chatId, "user", userContent);
            updateMemory(chatId, "assistant", aiResponse);
        }

        return aiResponse;

    } catch (error) {

        console.error("Lỗi Groq AI:", error?.response?.data || error.message);
        return "Xin lỗi Onii-chan, em đang gặp chút gián đoạn kết nối rồi ạ!";

    } finally {
        if (typingInterval) {
            clearInterval(typingInterval);
        }
    }
}

// ==============================
// NHẬN TIN NHẮN ZALO
// ==============================

async function getUpdates() {

    try {

        const response = await axios.get(
            `${BASE_URL}/getUpdates`,
            {
                params: { timeout: 30 },
                validateStatus: status => (status >= 200 && status < 300) || status === 408
            }
        );

        if (response.status === 408) {
            setTimeout(getUpdates, 100);
            return;
        }

        if (
            response.data &&
            response.data.ok &&
            response.data.result &&
            response.data.result.message
        ) {

            const message = response.data.result.message;

            if (message.message_id !== lastProcessedId) {

                lastProcessedId = message.message_id;

                let userQuestion = "";
                let hasImage = false;
                const chatId = message.chat.id;

                if (message.message_type === "CHAT_PHOTO" && message.photo_url) {
                    userQuestion = message.caption || "Phân tích ảnh này.";
                    hasImage = true;
                } else if (message.text) {
                    userQuestion = message.text;
                }

                if (userQuestion) {

                    const textLower = userQuestion.toLowerCase();

                    if (textLower === "/reset") {
                        memory.delete(chatId);
                        await sendMessage(chatId, "♻️ Onii-chan ơi, em đã xoá toàn bộ trí nhớ hội thoại rồi ạ!");
                        return setTimeout(getUpdates, 500);
                    }

                    if (textLower.includes("cảm ơn") || textLower.includes("tuyệt vời") || textLower.includes("haha")) {
                        await sendSticker(chatId, "1");
                    }

                    if (textLower === "menu" || textLower === "@bot say gex menu") {
                        await sendMessage(
                            chatId,
                            "📋 **MENU (GROQ GPT-OSS 120B)**\n\n" +
                            "♻️ `/reset` : Xoá trí nhớ\n" +
                            "📸 `Gửi ảnh` : Phân tích ảnh\n" +
                            "🎨 `Vẽ ...` : Tạo ảnh"
                        );
                    } else {

                        const aiResponse = hasImage
                            ? await askAI(chatId, userQuestion, message.photo_url)
                            : await askAI(chatId, userQuestion);

                        const imgMatch = aiResponse.match(/\[GEN_IMAGE:\s*(.*?)\]/i);
                        const isDrawCommand = textLower.startsWith("vẽ") || textLower.includes("vẽ ") || textLower.includes("tạo ảnh") || textLower.includes("tạo hình");

                        if ((imgMatch && imgMatch[1]) || isDrawCommand) {

                            const rawPrompt = (imgMatch && imgMatch[1])
                                ? imgMatch[1].trim()
                                : userQuestion.replace(/^(vẽ|tạo ảnh|tạo hình|draw|vẽ cho)\s*/i, "").trim();

                            const promptEng = encodeURIComponent(rawPrompt || "a beautiful digital artwork");
                            const imgUrl = `https://image.pollinations.ai/prompt/${promptEng}?nologo=true&t=${Date.now()}`;

                            await sendMessage(chatId, "🎨 Onii-chan chờ em xíu nhé, em đang vẽ ảnh nè... ✨");
                            await sendPhoto(chatId, imgUrl, `🖼️ Tác phẩm của Onii-chan đây ạ: ${rawPrompt}`);

                        } else {
                            await sendMessage(chatId, aiResponse);
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error("Lỗi getUpdates:", error?.response?.data || error.message);
    }

    setTimeout(getUpdates, 500);
}

console.log("=========================================");
console.log(" ZALO BOT GROQ API (GPT-OSS 120B ONLINE) ");
console.log("=========================================");

getUpdates();
