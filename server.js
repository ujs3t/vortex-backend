const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// قائمة أقوى السيرفرات المتاحة والمستقرة
const COBALT_INSTANCES = [
    'https://cobalt.api.timelessnesses.me',
    'https://api.cobalt.ac',
    'https://co.wuk.sh',
    'https://cobalt.owo.si'
];

app.get('/', (req, res) => {
    res.send('Vortex Proxy Active - السيرفر يعمل بنجاح!');
});

app.post('/api/proxy', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "لم يتم إرسال رابط الفيديو" });
    }

    let lastError = "جميع السيرفرات رفضت الطلب";
    let details = [];

    // السيرفر الوسيط سيحاول المرور عبر السيرفرات واحداً تلو الآخر
    for (const instance of COBALT_INSTANCES) {
        try {
            const targetUrl = instance.endsWith('/') ? instance : `${instance}/`;
            const origin = new URL(instance).origin;
            
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // هذه الترويسات تخدع سيرفر Cobalt وتجعله يعتقد أن الطلب قادم من متصفح شرعي
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Origin': origin,
                    'Referer': origin + '/'
                },
                body: JSON.stringify({ 
                    url: url,
                    videoQuality: '720',
                    filenameStyle: 'pretty'
                })
            });

            const data = await response.json().catch(() => null);

            // إذا نجحنا في جلب الرابط، نقوم بإرجاعه فوراً
            if (response.ok && data) {
                if (data.url) return res.status(200).json(data);
                if (data.picker && data.picker.length > 0) return res.status(200).json({ url: data.picker[0].url });
            } else {
                lastError = data?.error?.code || data?.text || `HTTP ${response.status}`;
                details.push(`${instance}: ${lastError}`);
            }
        } catch (error) {
            details.push(`${instance}: ${error.message}`);
            continue;
        }
    }

    // في حال فشلت كل المحاولات
    res.status(400).json({ error: "تم رفض الرابط من المصدر", details });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
