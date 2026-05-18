const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// نقطة فحص الحالة ومنع النوم التلقائي
app.get('/ping', (req, res) => {
    res.status(200).send('Alive');
});

// استقبال رابط الفيديو واستخراج البيانات والروابط المباشرة
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // مصفوفة من خوادم الفحص البديلة لضمان الاستقرار في حال تعطل أحدها
    const apiEndpoints = [
        'https://api.cobalt.tools/api/json',
        'https://co.wuk.sh/api/json'
    ];

    let success = false;
    let errors = [];

    for (const endpoint of apiEndpoints) {
        try {
            const response = await axios.post(endpoint, {
                url: url,
                videoQuality: '720'
            }, {
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json' 
                },
                timeout: 12000 // مهلة الاستجابة 12 ثانية
            });

            // التحقق من نجاح جلب الرابط وإرجاع البيانات الحقيقية للواجهة
            if (response.data && response.data.url) {
                res.json({
                    title: response.data.filename || "Video_" + Math.floor(Math.random() * 10000),
                    thumbnail: response.data.picker?.preview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500",
                    duration: "00:00",
                    url: response.data.url
                });
                success = true;
                break; // التوقف فور النجاح وتجاوز باقي المصفوفة
            }
        } catch (error) {
            errors.push(`${endpoint}: ${error.message}`);
        }
    }

    if (!success) {
        res.status(500).json({ error: 'فشل الفحص عبر جميع المحركات الخارجية', details: errors });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // نظام منع النوم الذاتي (Self-Ping Script)
    const SERVER_URL = process.env.RENDER_EXTERNAL_URL;
    if (SERVER_URL) {
        setInterval(async () => {
            try {
                await axios.get(`${SERVER_URL}/ping`);
                console.log('Self-ping performed successfully.');
            } catch (e) {
                console.error('Self-ping error:', e.message);
            }
        }, 600000); // تكرار الطلب التلقائي كل 10 دقائق
    }
});
