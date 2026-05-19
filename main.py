from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests

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

# قائمة بأقوى سيرفرات Cobalt المجهزة بشبكات تخطي الحظر
COBALT_INSTANCES = [
    'https://co.wuk.sh',
    'https://api.cobalt.ac',
    'https://cobalt.owo.si',
    'https://api.cobalt.biz.id',
    'https://cobalt.api.timelessnesses.me'
]

@app.get("/")
def read_root():
    return {"status": "Vortex Hybrid Engine Active"}

@app.post("/api/proxy")
def get_proxy_url(request: ProxyRequest):
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
    
    # خادمك سيقوم بالاتصال بالسيرفرات نيابة عن التطبيق لتفادي CORS والحظر
    for instance in COBALT_INSTANCES:
        base_url = instance.rstrip('/')
        
        # محاولة التجربة بصيغة v10
        try:
            res = requests.post(
                f"{base_url}/",
                json={"url": request.url, "videoQuality": "720", "filenameStyle": "pretty"},
                headers=headers,
                timeout=7
            )
            if res.status_code == 200:
                data = res.json()
                if 'url' in data:
                    return {"url": data['url']}
                if 'picker' in data and len(data['picker']) > 0:
                    return {"url": data['picker'][0]['url']}
        except Exception:
            continue

        # محاولة التجربة بصيغة v9 الافتراضية
        try:
            res = requests.post(
                f"{base_url}/api/json",
                json={"url": request.url, "vQuality": "720", "filenamePattern": "pretty"},
                headers=headers,
                timeout=7
            )
            if res.status_code == 200:
                data = res.json()
                if 'url' in data:
                    return {"url": data['url']}
        except Exception:
            continue

    # في حال فرضت المنصة حظراً شاملاً على الفيديو من كل الشبكات
    return JSONResponse(
        status_code=400, 
        content={"error": "عذراً، هذا الفيديو محمي بشكل مشدد حالياً من يوتيوب. جرب فيديو آخر أو منصة أخرى."}
    )
