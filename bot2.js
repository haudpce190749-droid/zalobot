const http = require("http");
const axios = require("axios");

// ==============================
// DASHBOARD VÀ BỘ NHỚ LOG TRỰC TUYẾN
// ==============================
const PORT = process.env.PORT || 3000;
const RENDER_URL = "https://zalobot-eqco.onrender.com";

const chatLogs = [];
let totalMessageCount = 0;

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addLog(chatId, userQuestion, aiResponse) {
    totalMessageCount++;
    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    chatLogs.unshift({
        id: totalMessageCount,
        time: now,
        chatId: chatId,
        user: userQuestion,
        bot: aiResponse
    });
    if (chatLogs.length > 50) chatLogs.pop();
}

const audioStore = new Map();

http.createServer((req, res) => {
    if (req.url === "/api/logs") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ total: totalMessageCount, logs: chatLogs }));
    }

    if (req.url.startsWith("/audio/")) {
        const audioId = req.url.replace("/audio/", "").replace(".mp3", "");
        const audioBuf = audioStore.get(audioId);
        if (audioBuf) {
            res.writeHead(200, {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuf.length,
                "Accept-Ranges": "bytes"
            });
            return res.end(audioBuf);
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Audio file not found");
        }
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zalo Bot Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; }
        .card { background-color: #1e293b; border: 1px solid #334155; color: #f8fafc; border-radius: 12px; }
        .table-custom { color: #e2e8f0; }
        .table-custom th { background-color: #334155; color: #38bdf8; border-color: #475569; }
        .table-custom td { border-color: #334155; }
        .badge-user { background-color: #0284c7; color: white; }
        .badge-time { background-color: #334155; color: #94a3b8; }
        .user-msg { color: #38bdf8; font-weight: 600; }
        .bot-msg { color: #f1f5f9; white-space: pre-wrap; }
    </style>
</head>
<body class="p-3 p-md-5">
    <div class="container-fluid max-w-6xl">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
                <h2 class="fw-bold m-0 text-info">🌸 Zalo Bot Admin Dashboard</h2>
                <small class="text-secondary">Model: OpenAI GPT-OSS 120B | Exa MCP & ACE Step 1.5 Turbo (3-Layer Audio Active)</small>
            </div>
            <span class="badge bg-success p-2 px-3 fs-6">🟢 ONLINE 24/7 (Multi-Layer Delivery Active)</span>
        </div>
        
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card p-3 shadow-sm">
                    <span class="text-secondary small fw-bold">TỔNG SỐ TIN NHẮN</span>
                    <h1 class="text-info display-5 fw-bold m-0 mt-1">${totalMessageCount}</h1>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card p-3 shadow-sm">
                    <span class="text-secondary small fw-bold">TRẠNG THÁI SERVER</span>
                    <h3 class="text-success fw-bold m-0 mt-2">Hoạt động bình thường</h3>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card p-3 shadow-sm">
                    <span class="text-secondary small fw-bold">CƠ CHẾ CHỐNG NGỦ</span>
                    <h3 class="text-warning fw-bold m-0 mt-2">Tự động Ping 5p/lần (Ngầm)</h3>
                </div>
            </div>
        </div>

        <div class="card p-3 p-md-4 shadow">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="m-0 fw-bold">📜 Nhật ký trò chuyện Zalo gần đây</h4>
                <button onclick="location.reload()" class="btn btn-sm btn-outline-info">🔄 Tải lại trang</button>
            </div>
            
            <div class="table-responsive">
                <table class="table table-custom align-middle m-0">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 170px;">Thời gian</th>
                            <th style="width: 140px;">User ID</th>
                            <th>Câu hỏi (User)</th>
                            <th>AI Phản hồi (Bot)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chatLogs.length === 0 ? '<tr><td colspan="5" class="text-center text-secondary py-5">Chưa có tin nhắn trò chuyện nào từ Zalo...</td></tr>' : ''}
                        ${chatLogs.map(l => `
                            <tr>
                                <td><span class="badge badge-time">${l.id}</span></td>
                                <td><small class="text-secondary">${l.time}</small></td>
                                <td><span class="badge badge-user">${l.chatId}</span></td>
                                <td class="user-msg" style="max-width: 300px;">${escapeHtml(l.user)}</td>
                                <td class="bot-msg" style="max-width: 500px;">${escapeHtml(l.bot)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.end(html);
}).listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
});

// Tự động ping Render mỗi 5 phút để giữ Server 24/7 không bao giờ ngủ (Ngầm)
setInterval(() => {
    axios.get(RENDER_URL).catch(() => {});
}, 5 * 60 * 1000);

// Cứ mỗi 15-20 phút: Đóng vai 1 THÀNH VIÊN NHÓM THẬT SỰ - Kiểm tra xem mọi người trong nhóm có nhắn tin mới với nhau không.
setInterval(async () => {
    try {
        const now = Date.now();
        for (const [chatId, buffer] of groupBuffer.entries()) {
            if (!buffer || buffer.length === 0) continue;

            const lastMsgTime = buffer[buffer.length - 1].time;
            const lastReply = lastBotReplyTime.get(chatId) || 0;

            if ((now - lastMsgTime < 20 * 60 * 1000) && (now - lastReply > 15 * 60 * 1000)) {
                const groupDialog = buffer.map(b => `${b.sender}: "${b.text}"`).join("\n");
                const prompt = `Dưới đây là các tin nhắn thực tế vừa diễn ra giữa mọi người trong nhóm Zalo:\n${groupDialog}\n\nHãy là cô em gái AI nhí nhảnh, tự nhiên nhảy vào nhóm tiếp lời trò chuyện cùng mọi người như một thành viên thật sự!`;

                const aiResponse = await askAI(chatId, prompt);
                if (aiResponse) {
                    await sendMessage(chatId, aiResponse);
                    lastBotReplyTime.set(chatId, now);
                    addLog(chatId, "[THÀNH VIÊN NHÓM JUMP-IN]", aiResponse);
                    console.log(`[GROUP MEMBER JUMP-IN] 🟢 Đã đọc tin nhắn mới trong nhóm và xen vào trò chuyện!`);
                }
            }
        }
    } catch (e) {
        console.error("Lỗi Group Member Loop:", e.message);
    }
}, 15 * 60 * 1000);

const ZALO_BOT_TOKEN = (process.env.ZALO_BOT_TOKEN || "").trim();
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}`;

const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("GROQ API KEY CHECK:", GROQ_API_KEY ? `✅ Groq Key: '${GROQ_API_KEY.substring(0, 8)}...'` : "❌ LỖI: Chưa nạp GROQ_API_KEY trong Render!");
console.log("ZALO BOT TOKEN CHECK:", ZALO_BOT_TOKEN ? `✅ Zalo Token: '${ZALO_BOT_TOKEN.substring(0, 8)}...'` : "❌ LỖI: Chưa nạp ZALO_BOT_TOKEN trong Render!");

// Model Groq cực mạnh & siêu nhanh (GPT-OSS 120B & Groq Compound)
const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
const GROQ_VISION_MODEL = "groq/compound";

let lastProcessedId = null;
const memory = new Map();
const groupBuffer = new Map();
const lastBotReplyTime = new Map();

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
// GỬI FILE ÂM THANH MP3 (AUDIO - 3 LAYER FALLBACK)
// ==============================

async function sendAudio(chatId, audioUrl, caption = "") {
    let sent = false;

    // 1. Thử gửi qua sendAudio (Player Widget)
    try {
        await axios.post(`${BASE_URL}/sendAudio`, {
            chat_id: chatId,
            audio: audioUrl,
            caption: caption
        });
        sent = true;
    } catch (e1) {
        console.error("Lỗi sendAudio Zalo:", e1?.response?.data || e1.message);
    }

    // 2. Thử gửi qua sendDocument (File MP3)
    if (!sent) {
        try {
            await axios.post(`${BASE_URL}/sendDocument`, {
                chat_id: chatId,
                document: audioUrl,
                caption: caption
            });
            sent = true;
        } catch (e2) {
            console.error("Lỗi sendDocument Zalo:", e2?.response?.data || e2.message);
        }
    }

    // 3. Fallback: Gửi tin nhắn Text chứa Link MP3 trực tiếp để bấm nghe!
    if (!sent) {
        const textMsg = `🎶 **Bài hát cho Onii-chan đây ạ!**\n\n🎵 **Link nghe MP3 trực tiếp:** ${audioUrl}\n\n${caption}`;
        await sendMessage(chatId, textMsg);
    }
}

// ==============================
// TỰ ĐỘNG THIẾT KẾ PROMPT VÀ VIẾT LỜI CẢM XÚC BẰNG GROQ AI
// ==============================

async function generateMusicPayloadWithGroq(userTopic) {
    try {
        console.log(`[GROQ MUSIC PRODUCER] ✍️ Đang thiết kế nhạc và viết lời bài hát cho: "${userTopic}"`);
        const payload = {
            model: GROQ_TEXT_MODEL,
            messages: [
                {
                    role: "system",
                    content: `Bạn là Music Producer AI chuyên nghiệp.
Nhiệm vụ của bạn là lấy yêu cầu của người dùng và tạo ra một định dạng JSON gồm 2 trường:
1. "prompt": Dịch thể loại/cảm xúc nhạc cụ sang các tag tiếng Anh (vd: vpop, upbeat, female vocal, acoustic guitar, catchy).
2. "lyrics": Hãy sáng tác bài hát TIẾNG VIỆT cực kỳ cảm xúc, gieo vần chuẩn, với cấu trúc chuẩn: [Verse 1], [Chorus], [Verse 2], [Chorus], [Outro]. Chỉ trả về lời bài hát thuần túy cùng các thẻ [Verse], [Chorus]. TUYỆT ĐỐI KHÔNG chèn câu chào hay giải thích.
CHỈ trả về ĐÚNG MỘT JSON hợp lệ.`
                },
                {
                    role: "user",
                    content: `Yêu cầu nhạc: ${userTopic}`
                }
            ],
            max_tokens: 800,
            temperature: 0.7
        };

        const res = await axios.post(GROQ_API_URL, payload, {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
            timeout: 15000
        });

        const raw = res.data?.choices?.[0]?.message?.content || "";
        const cleanJson = raw.trim().replace(/```json/gi, "").replace(/```/gi, "");
        const parsed = JSON.parse(cleanJson);

        return {
            prompt: parsed.prompt || "vpop, upbeat, female vocal",
            lyrics: parsed.lyrics || ""
        };

    } catch (e) {
        console.error("Lỗi Groq Music Producer:", e.message);
        return {
            prompt: "vpop, upbeat, female vocal",
            lyrics: `[Verse 1]\nNắng lên phố rạng ngời em bước qua\nGiai điệu ngọt ngào dịu dàng trong tim ta\n\n[Chorus]\nHát cùng em câu ca đón ngày mới\nNụ cười rạng rỡ trao nhau người ơi`
        };
    }
}

// ==============================
// TẠO NHẠC AI (ACE MUSIC AI CLOUD - CHUẨN PUCHIBOT ACE-STEP 1.5 TURBO)
// ==============================

async function generateAceMusic(promptStyle, lyricsText = "") {
    const ACE_CLOUD_URL = "https://api.acemusic.ai/v1/chat/completions";
    const ACE_API_KEY = (process.env.ACE_API_KEY || "31fb983fc1634086b981d3f75befee34").trim();

    try {
        console.log(`[ACE MUSIC CLOUD] 🎵 Đang gửi request sang ACE Music Cloud (acemusic/acestep-v15-turbo)...`);
        
        let contentMessage = `<prompt>${promptStyle || "vpop, upbeat, female vocal"}</prompt>`;
        if (lyricsText && lyricsText.trim() !== "") {
            contentMessage += `\n<lyrics>${lyricsText}</lyrics>`;
        }

        const payload = {
            model: "acemusic/acestep-v15-turbo",
            messages: [{ role: "user", content: contentMessage }],
            use_format: true,
            use_cot_caption: true,
            audio_config: { duration: 180, format: "mp3", vocal_language: "vi" }
        };

        const res = await axios.post(ACE_CLOUD_URL, payload, {
            headers: {
                "Authorization": `Bearer ${ACE_API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 300000 // Chờ tối đa 5 phút cho Cloud render nhạc
        });

        const choice = res.data?.choices?.[0];
        const audioArr = choice?.message?.audio;
        if (audioArr && audioArr.length > 0) {
            const rawAudioUrl = audioArr[0]?.audio_url?.url || audioArr[0]?.url;
            if (rawAudioUrl) {
                console.log(`[ACE MUSIC CLOUD SUCCESS] 🎶 Đã tạo xong nhạc MP3!`);
                if (rawAudioUrl.startsWith("data:audio")) {
                    const base64Data = rawAudioUrl.split(",")[1];
                    const buffer = Buffer.from(base64Data, "base64");
                    const songId = `song_${Date.now()}`;
                    audioStore.set(songId, buffer);
                    
                    if (audioStore.size > 10) {
                        const firstKey = audioStore.keys().next().value;
                        audioStore.delete(firstKey);
                    }
                    
                    const publicAudioUrl = `${RENDER_URL}/audio/${songId}.mp3`;
                    console.log(`[AUDIO SERVER] 🌐 Đã cấp link MP3 công khai cho Zalo: ${publicAudioUrl}`);
                    return publicAudioUrl;
                }
                return rawAudioUrl;
            }
        }
    } catch (err) {
        console.error("Lỗi ACE Music Cloud API:", err?.response?.data || err.message);
    }

    return null;
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
// HÀM TÌM KIẾM CHUẨN MCP EXA SERVER (https://mcp.exa.ai/mcp - ZERO API KEY REQUIRED)
// ==============================

async function searchWebExa(query) {
    try {
        console.log(`[MCP EXA SERVER] ⚡ Đang gửi lệnh web_search_exa tới https://mcp.exa.ai/mcp cho từ khóa: "${query}"`);
        
        const res = await axios.post("https://mcp.exa.ai/mcp", {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "web_search_exa",
                arguments: { query: query }
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
                "User-Agent": "MCP-Client/1.0"
            },
            timeout: 15000
        });

        let rawData = res.data;
        let finalContent = "";

        if (typeof rawData === "string") {
            const lines = rawData.split("\n");
            for (const line of lines) {
                if (line.startsWith("data:")) {
                    try {
                        const parsed = JSON.parse(line.replace(/^data:\s*/, ""));
                        const content = parsed?.result?.content;
                        if (Array.isArray(content)) {
                            finalContent = content.map(c => c.text || "").join("\n\n");
                            break;
                        }
                    } catch (e) {}
                }
            }
        } else if (rawData?.result?.content) {
            const content = rawData.result.content;
            if (Array.isArray(content)) {
                finalContent = content.map(c => c.text || "").join("\n\n");
            }
        }

        if (finalContent) {
            if (finalContent.length > 2500) {
                finalContent = finalContent.substring(0, 2500) + "\n\n[...Đã tối ưu độ dài dữ liệu search...]";
            }
            return finalContent;
        }
    } catch (err) {
        console.error("Lỗi Exa MCP Endpoint:", err?.response?.data || err.message);
    }

    return "[Chưa lấy được kết quả từ Exa MCP Server, hãy tự trả lời dựa trên kiến thức chính xác của bạn]";
}

// ==============================
// GỌI GROQ AI (TÍCH HỢP MCP TOOL CALLING TRUY VẤN EXA SEARCH)
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

    let typingInterval = null;
    if (!isKeepAlive) {
        await sendChatAction(chatId, "typing");
        typingInterval = setInterval(() => {
            sendChatAction(chatId, "typing");
        }, 4000);
    }

    try {

        const systemMessage = {
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

4. HÌNH ẢNH VA NHẠC:
- Nếu user yêu cầu tạo hình ảnh, chỉ trả về đúng một cú pháp: [GEN_IMAGE: <prompt_tiếng_anh>]
- Nếu user yêu cầu sáng tác nhạc, chỉ trả về đúng một cú pháp: [GEN_MUSIC: <mô_tả_bài_hát>]

5. BẮT BUỘC SỬ DỤNG MCP EXA SEARCH ENGINE KHI TRA CỨU:
Vì dữ liệu của model AI đã cũ, BẮT BUỘC xuất ra cú pháp JSON gọi MCP Exa Tool đối với BẮT KỲ CÂU HỎI NÀO liên quan đến tra cứu thông tin, tìm hiểu người nổi tiếng (ca sĩ, diễn viên, KOL, doanh nhân...), tin tức thời sự, sự kiện, thời tiết, giá thị trường, hoặc câu hỏi có vẻ cần cập nhật thông tin:
[SEARCH_REQ: {"query": "từ khóa tìm kiếm chi tiết"}]
Không thêm bất kỳ văn bản nào khác khi xuất cú pháp [SEARCH_REQ: ...]. Tuyệt đối không tự trả lời mò bằng kiến thức cũ khi chưa có dữ liệu MCP Search!`
        };

        const payload = {
            model: selectedModel,
            messages: [
                systemMessage,
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

        let aiResponse = response.data.choices[0].message.content;

        const searchMatch = aiResponse.match(/\[SEARCH_REQ:\s*(\{.*?\})\]/s);
        if (searchMatch && searchMatch[1]) {
            try {
                const searchJson = JSON.parse(searchMatch[1]);
                console.log(`[MCP TOOL DETECTED] ⚡ Đang tra cứu Exa MCP Server: "${searchJson.query}"`);
                
                const searchResults = await searchWebExa(searchJson.query);

                const pass2Payload = {
                    model: selectedModel,
                    messages: [
                        systemMessage,
                        ...sanitizedHistory,
                        { 
                            role: "user", 
                            content: `Câu hỏi của Onii-chan: "${userContent}"\n\n[DỮ LIỆU TÌM KIẾM THỰC TẾ REALTIME VỪA TRA CỨU TỪ EXA MCP SERVER]:\n${searchResults}\n\nDựa trên dữ liệu tra cứu thực tế trên, hãy tổng hợp câu trả lời chi tiết, chính xác 100%, mới nhất và ngọt ngào cho Onii-chan!` 
                        }
                    ],
                    temperature: 0.6,
                    max_tokens: 2048,
                    reasoning_effort: "medium"
                };

                const pass2Response = await axios.post(
                    GROQ_API_URL,
                    pass2Payload,
                    {
                        headers: {
                            "Authorization": `Bearer ${GROQ_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 60000
                    }
                );

                if (pass2Response.data?.choices?.[0]?.message?.content) {
                    aiResponse = pass2Response.data.choices[0].message.content;
                }

            } catch (errParse) {
                console.error("Lỗi xử lý MCP Search Tool:", errParse.message);
            }
        }

        if (aiResponse.includes("[SEARCH_REQ:")) {
            aiResponse = aiResponse.replace(/\[SEARCH_REQ:\s*\{.*?\}\]/gs, "").trim();
        }

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
// NHẬN TIN NHẮN ZALO REALTIME
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
                    const senderName = message.from?.first_name || message.from?.name || "Thành viên";

                    if (!groupBuffer.has(chatId)) groupBuffer.set(chatId, []);
                    const gBuf = groupBuffer.get(chatId);
                    gBuf.push({ sender: senderName, text: userQuestion, time: Date.now() });
                    if (gBuf.length > 8) gBuf.shift();

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
                            "📋 **MENU (GROQ API SPEED)**\n\n" +
                            "♻️ `/reset` : Xoá trí nhớ\n" +
                            "📸 `Gửi ảnh` : Phân tích ảnh\n" +
                            "🎨 `Vẽ ...` : Tạo ảnh\n" +
                            "🎵 `Tạo nhạc ...` : Sáng tác bài hát MP3 qua ACE Music AI (Ace Step 1.5)"
                        );
                    }

                    const cleanText = textLower.replace(/^@?(bot say gex|bot)\s*/gi, "").trim();
                    const isMusicCommand = cleanText.startsWith("tạo nhạc") || 
                                           cleanText.startsWith("sáng tác nhạc") || 
                                           cleanText.startsWith("tạo bài hát") || 
                                           cleanText.startsWith("tạo 1 bài nhạc") ||
                                           cleanText.startsWith("tạo một bài nhạc") ||
                                           cleanText.includes("tạo bài nhạc") ||
                                           cleanText.includes("sáng tác bài nhạc");

                    if (isMusicCommand) {
                        const rawTopic = cleanText.replace(/^(tạo nhạc|sáng tác nhạc|tạo bài hát|tạo 1 bài nhạc|tạo một bài nhạc)\s*/i, "").trim();
                        await sendMessage(chatId, "🎵 Onii-chan chờ em xíu nhé, em đang nhờ Groq AI soạn Lời Tiếng Việt và ACE Cloud đang cất giọng hát nè... ✨");
                        
                        // 1. Groq AI tự động thiết kế Tag tiếng Anh & Sáng tác Lời Tiếng Việt chuẩn
                        const musicData = await generateMusicPayloadWithGroq(rawTopic || cleanText);
                        
                        // 2. Gửi Tag tiếng Anh + Lời Tiếng Việt chuẩn sang ACE Cloud API để hát
                        const mp3Url = await generateAceMusic(musicData.prompt, musicData.lyrics);
                        
                        if (mp3Url) {
                            await sendAudio(chatId, mp3Url, `🎶 Bài hát ca từ Tiếng Việt cho Onii-chan đây ạ!\n✨ **Phong cách:** *${musicData.prompt}*\n\n📝 **Lời bài hát:**\n${musicData.lyrics}`);
                            addLog(chatId, userQuestion, `[Gửi file nhạc MP3 ACE Music: ${mp3Url}]`);
                        } else {
                            await sendMessage(chatId, `📝 **Lời bài hát em vừa sáng tác cho Onii-chan:**\n\n${musicData.lyrics}\n\n*(Dạ Onii-chan ơi, Siêu máy chủ ACE Cloud đang bận/quá tải chưa kịp gửi file audio về, em đã lưu lại lời bài hát tuyệt đẹp này cho Onii-chan rồi nè! 🌸)*`);
                            addLog(chatId, userQuestion, "[Sáng tác lời bài hát thành công]");
                        }
                    }

                    else {
                        const isHotGroupTopic = textLower.includes("cafe") || textLower.includes("cà phê") || textLower.includes("ăn") || textLower.includes("uống") || textLower.includes("chơi") || textLower.includes("game") || textLower.includes("đi đâu") || textLower.includes("ở đâu") || textLower.includes("phim") || textLower.includes("nhậu") || textLower.includes("bây") || textLower.includes("không");
                        const now = Date.now();
                        const lastReply = lastBotReplyTime.get(chatId) || 0;
                        const isGroupJumpIn = isHotGroupTopic && (now - lastReply > 3 * 60 * 1000) && gBuf.length >= 2;

                        let promptToPass = userQuestion;
                        if (isGroupJumpIn && !textLower.includes("bot")) {
                            const recentDialog = gBuf.map(b => `${b.sender}: "${b.text}"`).join("\n");
                            promptToPass = `Dưới đây là đoạn trò chuyện gần đây giữa các thành viên trong nhóm Zalo:\n${recentDialog}\n\nHãy là cô em gái AI nhí nhảnh, tự nhiên xen vào cuộc trò chuyện (jump in), đưa ra gợi ý/đề xuất địa điểm hoặc ý kiến vui vẻ, hữu ích tiếp lời mọi người!`;
                        }

                        const aiResponse = hasImage
                            ? await askAI(chatId, userQuestion, message.photo_url)
                            : await askAI(chatId, promptToPass);

                        lastBotReplyTime.set(chatId, now);

                        addLog(chatId, userQuestion, aiResponse);

                        const imgMatch = aiResponse.match(/\[GEN_IMAGE:\s*(.*?)\]/i);
                        const isDrawCommand = textLower.startsWith("vẽ") || textLower.includes("vẽ ") || textLower.includes("tạo ảnh") || textLower.includes("tạo hình");

                        const musicMatch = aiResponse.match(/\[GEN_MUSIC:\s*(.*?)\]/i);
                        if (musicMatch && musicMatch[1]) {
                            const songPrompt = musicMatch[1].trim();
                            await sendMessage(chatId, "🎵 Onii-chan chờ em xíu nhé, em đang nhờ ACE Music AI (ACE Step 1.5) sáng tác bài hát nè... ✨");
                            const mp3Url = await generateAceMusic(songPrompt);
                            if (mp3Url) {
                                await sendAudio(chatId, mp3Url, `🎶 Bài hát sáng tác theo yêu cầu của Onii-chan đây ạ: "${songPrompt}"`);
                            } else {
                                await sendMessage(chatId, `📝 **Lời bài hát em sáng tác cho Onii-chan:**\n\n${songPrompt}`);
                            }
                        }
                        else if ((imgMatch && imgMatch[1]) || isDrawCommand) {

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
console.log(" ZALO BOT GROQ API (LLAMA 3.3 70B SPEED) ");
console.log("=========================================");

getUpdates();
