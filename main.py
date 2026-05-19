from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProxyRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"status": "Vortex Engine Active"}

@app.post("/api/proxy")
def get_proxy_url(request: ProxyRequest):
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)
            if 'entries' in info:
                video = info['entries'][0]
            else:
                video = info
            download_url = video.get('url')
            if not download_url:
                formats = video.get('formats', [])
                for f in reversed(formats):
                    if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('url'):
                        download_url = f['url']
                        break
            if not download_url:
                raise HTTPException(status_code=400, detail="Could not extract direct URL")
            return {"url": download_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
