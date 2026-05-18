const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
    res.status(200).send('Alive');
});

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // الاعتماد على محرك معالجة هجين مخصص لتجاوز حظر الـ IP
        const response = await axios.post('https://api.v01.co/api/danger/download', {
            url: url
        }, {
            headers: { 
                'Accept': 'application/json', 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
            },
            timeout: 15000
        });

        const resData = response.data;
        
        // استخراج الرابط المباشر الفعلي للملف لمنع إعادة التوجيه للموقع الأصلي
        const directDownloadUrl = resData.url || resData.links?.[0]?.url || resData.data?.url;
        
        if (directDownloadUrl) {
            // محاولة جلب الصورة المصغرة الحقيقية والعنوان من الاستجابة
            const videoTitle = resData.title || resData.data?.title || "Vortex_Video_" + Math.floor(Math.random() * 1000);
            const videoThumb = resData.thumbnail || resData.data?.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500";
            const videoDuration = resData.duration || "00:00";

            return res.json({
                title: videoTitle,
                thumbnail: videoThumb,
                duration: videoDuration,
                url: directDownloadUrl
            });
        } else {
            return res.status(500).json({ error: 'المحرك لم يوفر رابط تحميل مباشر' });
        }

    } catch (error) {
        // في حال فشل المحرك الأول، الانتقال فوراً إلى محرك سحابي احتياطي متقدم
        try {
            const backupResponse = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://noembed.com/embed?url=' + url)}`);
            const metadata = JSON.parse(backupResponse.data.contents);
            
            // استخدام كود جلب مباشر خارجي للتحميل
            const fallbackUrl = `https://api.cobalt.tools/api/stream?url=${encodeURIComponent(url)}`;

            return res.json({
                title: metadata.title || "فيديو يوتيوب",
                thumbnail: metadata.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500",
                duration: "720p",
                url: fallbackUrl
            });
        } catch (backupError) {
            return res.status(500).json({ error: 'فشل استخراج البيانات عبر المحركات السحابية' });
        }
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
