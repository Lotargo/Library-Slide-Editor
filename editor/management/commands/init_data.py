from django.core.management.base import BaseCommand
from editor.utils.mongo import create_workspace, create_page, get_all_workspaces, update_page
import uuid
from pymongo.errors import ServerSelectionTimeoutError

class Command(BaseCommand):
    help = 'Initialize default data (Workspace and Page)'

    def handle(self, *args, **kwargs):
        try:
            if len(get_all_workspaces()) > 0:
                self.stdout.write('Workspaces already exist.')
                return

            # Create Workspace
            ws = create_workspace("Default Workspace")
            self.stdout.write(f"Created workspace: {ws['id']}")

            # Create Page
            page = create_page(ws['id'], "Welcome")
            self.stdout.write(f"Created page: {page['id']}")

            slides_data = [
                {
                    "ratio": "16/9",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "<h1>Разработка сервисов, платформ и автоматизации под ваши задачи</h1><p class='subtitle'>Помогаю превращать идеи и бизнес-задачи в работающие цифровые решения — от простых ботов до полноценных сервисов и платформ с расчётом на рост.</p><p>Если у вас есть мысль, процесс или идея, на которых вы хотите зарабатывать или которые нужно автоматизировать — я беру на себя техническую реализацию и архитектуру.</p>"
                        }
                    ]
                },
                {
                    "ratio": "16/9",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "<h2>Что могу создать</h2><ul><li>Чат-ботов и сервисы для общения с клиентами</li><li>Системы записи, обработки заявок и автоматизации</li><li>Серверную часть и backend под конкретные задачи</li><li>Онлайн-сервисы и SaaS-решения</li><li>Проекты с умными помощниками и консультантами</li><li>Архитектуру, рассчитанную на нагрузку, масштабирование и развитие</li></ul>"
                        }
                    ]
                },
                {
                    "ratio": "16/9",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "<h2>Примеры проектов</h2><ul><li><strong>Сервис помощи в учебных работах:</strong> структурирование текста, проверка на AI, сверка фактов и источников.</li><li><strong>Платформа для студий и авторов:</strong> генерация изображений и видео по заданным правилам и стилям.</li><li><strong>Умные помощники для бизнеса:</strong> консультации, приём заявок, поддержка клиентов.</li><li><strong>MVP и сервисы:</strong> проверка бизнес-идей с возможностью дальнейшего роста.</li></ul>"
                        }
                    ]
                },
                 {
                    "ratio": "16/9",
                    "blocks": [
                        {
                            "type": "mermaid",
                            "content": "graph LR\n    A[Идея] --> B[Сомнения]\n    B --> C[Хаос]\n    C --> D[Понимание]\n    D --> E[Рабочий сервис]\n    style E fill:#f9f,stroke:#333,stroke-width:4px"
                        }
                    ]
                }
            ]

            blocks = []
            for slide in slides_data:
                slide_blocks = []
                for b in slide['blocks']:
                    slide_blocks.append({
                        "id": str(uuid.uuid4()),
                        "type": b['type'],
                        "content": b['content']
                    })

                blocks.append({
                    "id": str(uuid.uuid4()),
                    "type": "slide_wrapper",
                    "ratio": slide.get("ratio", "16/9"),
                    "children": slide_blocks
                })

            # Update Page
            update_page(page['id'], {"blocks": blocks})

            self.stdout.write(self.style.SUCCESS('Successfully initialized default data'))

        except ServerSelectionTimeoutError:
             self.stdout.write(self.style.ERROR('Error: Could not connect to MongoDB.'))
             self.stdout.write(self.style.WARNING('Please ensure the database is running (try running setup_infra.bat/sh)'))
