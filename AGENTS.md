# Стратегия и Архитектура Проекта

Мы создаем мощную платформу для организации рабочих пространств, сочетающую в себе удобство написания документов (как в Notion) и возможности создания презентационных материалов (Слайды).

## 🟢 Текущий Статус (Phase 1 Completed)
*   **Архитектура:** Переход на React + Django REST API завершен. MongoDB заменен на SQLite (для совместимости).
*   **Основные сущности:** Workspaces, Pages, Blocks работают.
*   **Блоки:** Реализованы Text, Slide, Table, Board, Calendar (MVP).
*   **Тулбар:** Есть, с возможностью скрытия.
*   **Slash Commands:** `/slide`, `/table`, `/board`, `/calendar` работают для преобразования блоков.

## 🔜 Следующие Шаги (Next Steps)
1.  **Drag-and-Drop:** Реализовать перетаскивание блоков (dnd-kit).
2.  **Улучшение выделения:** Возможность выделять несколько блоков и оборачивать их в Слайд.
3.  **Полировка UI:** Улучшить стили таблиц и досок, добавить иконки, улучшить типографику.
4.  **Backend Tests:** Написать тесты для API.

## 🛠 Технический Стек

### Frontend
*   **React:** Основной фреймворк.
*   **Сборка:** Vite.
*   **Расположение:** `frontend/`.
*   **Стили:** Tailwind CSS v4.

### Backend
*   **Django:** REST API + ORM (SQLite).
*   **Models:** `Workspace`, `Page`, `Font`.

## 📝 Структура Данных
*   **Workspace:** `{ id, name, pages: [] }`
*   **Page:** `{ id, workspace_id, title, blocks: [] }`
*   **Block:** JSON structure inside Page.blocks.
    *   Type: `text`, `slide_wrapper`, `table`, `board`, `calendar`.
