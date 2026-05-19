from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    # إعدادات متطورة لتجاوز حظر استضافات السحاب وتنكر السيرفر كجهاز هاتف
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios']  # كسر حظر اليوتيوب لخوادم Render
            }
        },
        'http_headers': {
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
