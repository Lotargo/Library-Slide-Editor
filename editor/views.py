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
