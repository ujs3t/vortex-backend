const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// نقطة فحص الحالة ومنع النوم
app.get('/ping', (req, res) => {
    res.status(200).send('Alive');
});

// استقبال رابط الفيديو واستخراج البيانات والروابط المباشرة
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // مصفوفة من المحركات الحديثة فائقة السرعة والاستقرار
    const apiEndpoints = [
        {
            url: 'https://api.v01.co/api/danger/download',
            data: { url: url }
        },
        {
            url: 'https://api.cobalt.tools/api/json',
            data: { url: url, videoQuality: '720' }
        }
    ];

    let success = false;

    for (const api of apiEndpoints) {
        try {
            const response = await axios.post(api.url, api.data, {
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
                },
                timeout: 9000
            });

            // قراءة البيانات حسب استجابة المحرك الناجح
            const resData = response.data;
            const finalUrl = resData.url || resData.data?.url || resData.links?.[0]?.url;
            const finalTitle = resData.title || resData.filename || resData.data?.title || "Vortex_Video_" + Math.floor(Math.random() * 1000);
            const finalThumb = resData.thumbnail || resData.picker?.preview || resData.data?.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500";

            if (finalUrl) {
                res.json({
                    title: finalTitle,
                    thumbnail: finalThumb,
                    duration: resData.duration || "00:00",
                    url: finalUrl
                });
                success = true;
                break;
            }
        } catch (error) {
            console.error(`Engine failed: ${api.url} -> ${error.message}`);
        }
    }

    if (!success) {
        // إذا فشلت المحركات المباشرة، نقوم بعمل تحويل مباشر للرابط لتفادي حظر المستخدم
        res.json({
            title: "اضغط لبدء التحميل المباشر",
            thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500",
            duration: "تنزيل سريع",
            url: url
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    const SERVER_URL = process.env.RENDER_EXTERNAL_URL;
    if (SERVER_URL) {
        setInterval(async () => {
            try {
                await axios.get(`${SERVER_URL}/ping`);
            } catch (e) {
                console.error('Self-ping error:', e.message);
            }
        }, 600000);
    }
});
