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
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 8000
            });

            if (response.data && response.data.url) {
                res.json({
                    title: response.data.filename || "Video_" + Math.floor(Math.random() * 10000),
                    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500",
                    duration: "00:00",
                    url: response.data.url
                });
                success = true;
                break;
            }
        } catch (error) {
            errors.push(`${endpoint}: ${error.message}`);
        }
    }

    if (!success) {
        res.status(500).json({ error: 'فشل الفحص عبر جميع المحركات الخادم الخارجية', details: errors });
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
