from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .utils.mongo import (
    get_all_sessions, get_session, create_session, update_session, delete_session,
    get_all_fonts, save_font_metadata
)
import json
import os
from django.core.files.storage import default_storage
from django.conf import settings

def index(request):
    return render(request, 'editor/index.html')

@csrf_exempt
def api_sessions(request):
    if request.method == 'GET':
        sessions = get_all_sessions()
        return JsonResponse({'sessions': sessions})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', 'New Session')
            slides = data.get('slides', [])
            session = create_session(name, slides)
            return JsonResponse(session)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def api_session_detail(request, session_id):
    if request.method == 'GET':
        session = get_session(session_id)
        if session:
            return JsonResponse(session)
        return JsonResponse({'error': 'Not found'}, status=404)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            session = update_session(session_id, data)
            return JsonResponse(session)
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        delete_session(session_id)
        return JsonResponse({'success': True})

@csrf_exempt
def api_fonts(request):
    if request.method == 'GET':
        fonts = get_all_fonts()
        # Add URL to the font object
        for font in fonts:
            font['url'] = settings.MEDIA_URL + 'fonts/' + font['filename']
        return JsonResponse({'fonts': fonts})
    elif request.method == 'POST':
        if 'font_file' not in request.FILES:
             return JsonResponse({'error': 'No file'}, status=400)

        f = request.FILES['font_file']
        save_path = os.path.join('fonts', f.name)
        # default_storage.save will handle duplicate names by appending _something
        real_path = default_storage.save(save_path, f)
        filename = os.path.basename(real_path)

        font_name = request.POST.get('font_name', filename.split('.')[0])
        save_font_metadata(font_name, filename)

        return JsonResponse({'success': True, 'filename': filename, 'url': settings.MEDIA_URL + 'fonts/' + filename})
