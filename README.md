# Workspace & Slide Editor

A powerful Notion-like workspace platform that combines infinite-canvas document editing with presentation slide capabilities.

## 🚀 Features

*   **Unified Workspaces**: Organize your work into Workspaces and Pages.
*   **Hybrid Editor**:
    *   **Document Mode**: Infinite vertical scroll for writing and planning.
    *   **Slide Mode**: Wrap any content into a "Slide" block with fixed aspect ratios (16:9, 4:3, 1:1) for easy export as images.
*   **Rich Blocks**:
    *   Text, Headings, Lists.
    *   **Tables**: Database-like tables.
    *   **Boards**: Kanban boards for task management.
    *   **Calendars**: Event planning.
    *   **Galleries**: Image grids.
*   **Focus Mode**: Hideable toolbar for distraction-free writing.

## 🛠 Tech Stack

*   **Backend**: Python, Django, MongoDB (pymongo).
*   **Frontend**: React, Vite.

## 📦 Installation & Development

1.  **Backend Setup**:
    ```bash
    poetry install
    # Start MongoDB (ensure it's running)
    poetry run python manage.py runserver
    ```

2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev  # For development
    # OR
    npm run build # To build for Django
    ```

## 🏗 Architecture

The project is a Django application serving a React SPA.
*   **Django (`dj_cards/`, `editor/`)**: Provides the REST API and serves the main HTML shell.
*   **React (`frontend/`)**: Handles all UI logic, state management, and the block editor.
*   **MongoDB**: Stores flexible document structures for pages and blocks.
