from django.db import models
import uuid

class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Font(models.Model):
    name = models.CharField(max_length=255)
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            "name": self.name,
            "filename": self.filename,
            "uploaded_at": self.uploaded_at.isoformat()
        }

class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, related_name='pages', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Untitled")
    blocks = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "workspace_id": str(self.workspace.id),
            "title": self.title,
            "blocks": self.blocks,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
