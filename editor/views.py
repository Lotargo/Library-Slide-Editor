from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Workspace, Page, Font
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
        workspaces = Workspace.objects.all().order_by('-created_at')
        return JsonResponse({'workspaces': [w.to_dict() for w in workspaces]})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', 'New Workspace')
            workspace = Workspace.objects.create(name=name)
            return JsonResponse(workspace.to_dict())
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def api_workspace_detail(request, workspace_id):
    try:
        workspace = Workspace.objects.get(id=workspace_id)
    except Workspace.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        data = workspace.to_dict()
        # Pages - we need minimal info for sidebar
        pages = workspace.pages.all().order_by('updated_at')
        data['pages'] = [p.to_dict() for p in pages]
        return JsonResponse(data)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            if 'name' in data:
                workspace.name = data['name']
                workspace.save()
            return JsonResponse(workspace.to_dict())
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        workspace.delete()
        return JsonResponse({'success': True})

@csrf_exempt
def api_workspace_pages(request, workspace_id):
    if request.method == 'POST':
        try:
            workspace = Workspace.objects.get(id=workspace_id)
            data = json.loads(request.body)
            title = data.get('title', 'Untitled Page')
            page = Page.objects.create(workspace=workspace, title=title)
            return JsonResponse(page.to_dict())
        except Workspace.DoesNotExist:
             return JsonResponse({'error': 'Workspace not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

# Page Views
@csrf_exempt
def api_page_detail(request, page_id):
    try:
        page = Page.objects.get(id=page_id)
    except Page.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(page.to_dict())
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            if 'title' in data:
                page.title = data['title']
            if 'blocks' in data:
                page.blocks = data['blocks']
            page.save()
            return JsonResponse(page.to_dict())
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        page.delete()
        return JsonResponse({'success': True})

# Font Views
@csrf_exempt
def api_fonts(request):
    if request.method == 'GET':
        fonts = Font.objects.all()
        data = []
        for font in fonts:
            f_dict = font.to_dict()
            f_dict['url'] = settings.MEDIA_URL + 'fonts/' + font.filename
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
        Font.objects.create(name=font_name, filename=filename)

        return JsonResponse({'success': True, 'filename': filename, 'url': settings.MEDIA_URL + 'fonts/' + filename})
