const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const COBALT_INSTANCES = [
    'https://co.wuk.sh',
    'https://cobalt.owo.si',
    'https://api.cobalt.ac',
    'https://api.cobalt.tools'
];

app.get('/', (req, res) => {
    res.send('Vortex Proxy Active');
});

app.post('/api/proxy', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let lastError = "All instances failed";

    for (const instance of COBALT_INSTANCES) {
        try {
            const response = await fetch(instance.endsWith('/') ? instance : `${instance}/`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({ url: url })
            });

            if (response.ok) {
                const data = await response.json();
                return res.status(200).json(data);
            } else {
                lastError = await response.text();
            }
        } catch (error) {
            lastError = error.message;
            continue;
        }
    }

    res.status(400).json({ error: lastError });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
