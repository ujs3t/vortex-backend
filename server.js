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
        // استخدام محرك جلب خارجي متوافق مع البيئات السحابية لمنع حظر خوادم Render
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            videoQuality: '720'
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.url) {
            res.json({
                title: response.data.filename || "Video",
                thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500", 
                duration: "00:00",
                url: response.data.url
            });
        } else {
            res.status(500).json({ error: 'تعذر استخراج الرابط المباشر' });
        }
    } catch (error) {
        res.status(500).json({ error: 'فشل الفحص', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // كود إزالة النوم الذاتي: يرسل طلب لنفسه كل 10 دقائق للبقاء مستيقظاً أونلاين
    const SERVER_URL = process.env.RENDER_EXTERNAL_URL;
    if (SERVER_URL) {
        setInterval(async () => {
            try {
                await axios.get(`${SERVER_URL}/ping`);
                console.log('Self-ping successful');
            } catch (e) {
                console.error('Self-ping failed:', e.message);
            }
        }, 600000); 
    }
});
