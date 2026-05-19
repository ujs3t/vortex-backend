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
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
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
                return JSONResponse(status_code=400, content={"error": "تعذر استخراج رابط مباشر. المنصة قد تكون محمية."})
                
            return {"url": download_url}
            
    except Exception as e:
        error_msg = str(e)
        # تبسيط رسائل حظر اليوتيوب الشائعة للمستخدم
        if "Sign in to confirm your age" in error_msg or "confirm your identity" in error_msg:
            error_msg = "المنصة تطلب تسجيل دخول لحمايتها. جرب فيديو آخر أو منصة أخرى (تيك توك، إنستغرام، إلخ)."
        elif "Incomplete data" in error_msg:
            error_msg = "رابط الفيديو غير صالح أو غير مدعوم."
            
        # إرسال الخطأ بصيغة مفتاح (error) المتوافقة تماماً مع الـ HTML لديك
        return JSONResponse(status_code=400, content={"error": error_msg})
