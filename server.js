const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// قائمة بأقوى سيرفرات Cobalt المجتمعية النشطة حالياً
const COBALT_INSTANCES = [
    'https://co.wuk.sh',
    'https://api.cobalt.ac',
    'https://cobalt.owo.si',
    'https://api.cobalt.biz.id',
    'https://cobalt.api.timelessnesses.me'
];

app.get('/', (req, res) => {
    res.send('Vortex Proxy Active - السيرفر يعمل بكفاءة قصوى!');
});

app.post('/api/proxy', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "لم يتم إرسال رابط الفيديو" });
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    // المرور على السيرفرات تجريبياً
    for (const instance of COBALT_INSTANCES) {
        const baseUrl = instance.replace(/\/$/, '');
        
        // --- المحاولة 1: صيغة v10 الحديثة ---
        try {
            const resV10 = await fetch(`${baseUrl}/`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': userAgent },
                body: JSON.stringify({ url: url, videoQuality: '720', filenameStyle: 'pretty' })
            });
            if (resV10.ok) {
                const data = await resV10.json();
                if (data.url) return res.status(200).json(data);
                if (data.picker?.length > 0) return res.status(200).json({ url: data.picker[0].url });
            }
        } catch (e) {}

        // --- المحاولة 2: صيغة v9 القديمة الافتراضية ---
        try {
            const resV9 = await fetch(`${baseUrl}/api/json`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': userAgent },
                body: JSON.stringify({ url: url, vQuality: '720', filenamePattern: 'pretty' })
            });
            if (resV9.ok) {
                const data = await resV9.json();
                if (data.url) return res.status(200).json(data);
            }
        } catch (e) {}

        // --- المحاولة 3: إرسال الرابط مجرداً (لتفادي خطأ المسميات 400 تماماً) ---
        try {
            const resMinimal = await fetch(`${baseUrl}/`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': userAgent },
                body: JSON.stringify({ url: url })
            });
            if (resMinimal.ok) {
                const data = await resMinimal.json();
                if (data.url) return res.status(200).json(data);
                if (data.picker?.length > 0) return res.status(200).json({ url: data.picker[0].url });
            }
        } catch (e) {}
    }

    // إذا فشلت كل المحاولات والصيغ على كل السيرفرات
    res.status(400).json({ error: "عذراً، الرابط غير مدعوم حالياً أو السيرفرات تواجه ضغطاً كبيراً." });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
