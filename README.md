# Library & Slide Editor

A powerful Notion-like workspace platform that combines infinite-canvas document editing with presentation slide capabilities.

## 🚀 Features

*   **Unified Workspaces**: Organize your work into Workspaces and Pages.
*   **Hybrid Editor**:
    *   **Document Mode**: Infinite vertical scroll for writing and planning.
    *   **Slide Mode**: Wrap any content into a "Slide" block with fixed aspect ratios (16:9, 4:3, 1:1) for easy export as images.
    *   **Rename Slides**: Customize slide titles directly in the editor.
*   **Rich Blocks**:
    *   Text (with Markdown and LaTeX support), Headings, Lists.
    *   **Code**: Syntax highlighting with line wrapping.
    *   **Mermaid**: Create diagrams and flowcharts from code.
    *   **Tables**: Database-like tables.
    *   **Boards**: Kanban boards for task management.
    *   **Calendars**: Event planning.
    *   **Galleries**: Image grids.
*   **Formatting Tools**:
    *   **Inline Code**: Wrap text in backticks (\`) or select text and press \` for Telegram-style inline code. Click to copy!
    *   **Floating Menu**: Bold, Italic, Underline, Alignment, Copy/Cut.
    *   **Context Menu**: Paste, Delete Block, Move to Slide, Extract from Slide, Import File.
    *   **Slash Commands**: Type `/` to insert blocks quickly.
*   **Focus Mode**: Hideable toolbar for distraction-free writing.

## 🛠 Tech Stack

*   **Backend**: Python, Django, MongoDB (pymongo).
*   **Frontend**: React, Vite, Tailwind CSS v4.

## 📦 Installation & Development

1.  **Backend Setup**:
    ```bash
    # Setup infrastructure (Docker login, MongoDB start, install dependencies)
    ./setup_infra.sh   # Linux/Mac
    # OR
    setup_infra.bat    # Windows

    # Initialize Default Data
    poetry run python manage.py init_data

    # Start Server
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
