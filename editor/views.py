from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from editor.utils.mongo import (
    get_all_workspaces, create_workspace, get_workspace, update_workspace, delete_workspace,
    create_page, get_page, update_page, delete_page,
    get_all_fonts, save_font_metadata
)
import json
import os
from django.core.files.storage import default_storage
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from io import BytesIO
import mimetypes

def index(request):
    return render(request, 'editor/index.html')

# Workspace Views
@csrf_exempt
def api_workspaces(request):
    if request.method == 'GET':
        workspaces = get_all_workspaces()
        return JsonResponse({'workspaces': workspaces})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', 'New Workspace')
            workspace = create_workspace(name)
            return JsonResponse(workspace)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def api_workspace_detail(request, workspace_id):
    if request.method == 'GET':
        workspace = get_workspace(workspace_id)
        if not workspace:
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(workspace)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            workspace = update_workspace(workspace_id, data)
            if not workspace:
                return JsonResponse({'error': 'Not found'}, status=404)
            return JsonResponse(workspace)
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        success = delete_workspace(workspace_id)
        if success:
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'error': 'Failed or not found'}, status=404)

@csrf_exempt
def api_workspace_pages(request, workspace_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            title = data.get('title', 'Untitled Page')
            page = create_page(workspace_id, title)
            return JsonResponse(page)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

# Page Views
@csrf_exempt
def api_page_detail(request, page_id):
    if request.method == 'GET':
        page = get_page(page_id)
        if not page:
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(page)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            page = update_page(page_id, data)
            if not page:
                return JsonResponse({'error': 'Not found'}, status=404)
            return JsonResponse(page)
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        success = delete_page(page_id)
        if success:
            return JsonResponse({'success': True})
        else:
             return JsonResponse({'error': 'Failed or not found'}, status=404)

# Font Views
@csrf_exempt
def api_fonts(request):
    if request.method == 'GET':
        fonts = get_all_fonts()
        data = []
        for font in fonts:
            f_dict = font.copy()
            f_dict['url'] = settings.MEDIA_URL + 'fonts/' + font.get('filename', '')
            data.append(f_dict)
        return JsonResponse({'fonts': data})
    elif request.method == 'POST':
        if 'font_file' not in request.FILES:
             return JsonResponse({'error': 'No file'}, status=400)

        f = request.FILES['font_file']
        save_path = os.path.join('fonts', f.name)
        real_path = default_storage.save(save_path, f)
        filename = os.path.basename(real_path)

        font_name = request.POST.get('font_name', filename.split('.')[0])
        save_font_metadata(font_name, filename)

        return JsonResponse({'success': True, 'filename': filename, 'url': settings.MEDIA_URL + 'fonts/' + filename})

@csrf_exempt
def api_upload_file(request):
    if request.method == 'POST':
        if 'file' not in request.FILES:
             return JsonResponse({'error': 'No file'}, status=400)

        f = request.FILES['file']
        save_path = os.path.join('uploads', f.name)
        real_path = default_storage.save(save_path, f)
        filename = os.path.basename(real_path)

        url = settings.MEDIA_URL + 'uploads/' + filename
        thumbnail_url = url # Default to original

        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = f.content_type

        # Generate Thumbnail only for images
        if content_type and content_type.startswith('image/'):
            try:
                full_file_path = default_storage.path(real_path)

                with Image.open(full_file_path) as img:
                    # Convert to RGB (in case of RGBA/P)
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')

                    img.thumbnail((300, 300))

                    thumb_io = BytesIO()
                    img.save(thumb_io, format='JPEG', quality=70)

                    thumb_filename = f"thumb_{filename}"
                    # Force .jpg extension for the thumbnail
                    thumb_filename = os.path.splitext(thumb_filename)[0] + '.jpg'

                    thumb_save_path = os.path.join('thumbnails', thumb_filename)

                    thumb_file = ContentFile(thumb_io.getvalue(), name=thumb_filename)
                    saved_thumb_path = default_storage.save(thumb_save_path, thumb_file)
                    thumb_real_name = os.path.basename(saved_thumb_path)

                    thumbnail_url = settings.MEDIA_URL + 'thumbnails/' + thumb_real_name
            except Exception as e:
                print(f"Thumbnail generation failed: {e}")

        return JsonResponse({
            'url': url,
            'filename': filename,
            'thumbnail_url': thumbnail_url,
            'content_type': content_type
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)
