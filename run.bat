@echo off
echo Starting Card Editor...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM Build Frontend
echo Building Frontend...
call npm --version >nul 2>&1
if %errorlevel% equ 0 (
    cd frontend
    call npm install
    call npm run build
    cd ..
) else (
    echo Warning: npm not found. Skipping frontend build.
)

REM Install Dependencies
echo Installing dependencies...
if exist poetry.lock (
    echo Using Poetry...
    call poetry install
) else (
    echo Using pip...
    pip install django pymongo dnspython
)

REM Migrations
echo Applying migrations...
poetry run python manage.py migrate

REM Init Data
echo Initializing default session...
poetry run python manage.py init_data

REM Start Server
echo Starting Django server...
echo Open http://127.0.0.1:8000 in your browser.
poetry run python manage.py runserver

pause
