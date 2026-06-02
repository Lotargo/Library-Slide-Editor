# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY frontend ./

# Create output directory explicitly to ensure permissions/existence
RUN mkdir -p /app/editor/static/editor/react

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy project configuration
COPY pyproject.toml poetry.lock ./
COPY README.md ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy Backend Code
COPY . .

# Copy Built Frontend from Stage 1
COPY --from=frontend-builder /app/editor/static/editor/react /app/editor/static/editor/react

# Expose port
EXPOSE 8000

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
