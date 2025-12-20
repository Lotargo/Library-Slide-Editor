from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
import json
import shutil
import os
from django.conf import settings

class FileUploadTest(TestCase):
    def tearDown(self):
        # Clean up uploads
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        if os.path.exists(upload_dir):
            shutil.rmtree(upload_dir)

    def test_upload_file(self):
        c = Client()
        f = SimpleUploadedFile("test_file.txt", b"content", content_type="text/plain")
        response = c.post('/api/upload', {'file': f})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('url', data)
        self.assertIn('filename', data)
