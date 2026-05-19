const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Vortex Proxy is Running!');
});

app.post('/api/proxy', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    try {
        const targetUrl = 'https://api.cobalt.tools/';
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                videoQuality: '720',
                filenameStyle: 'pretty'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText || `HTTP Error ${response.status}` });
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: "Failed to connect to Cobalt API" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
