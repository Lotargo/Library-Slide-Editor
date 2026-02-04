@echo off
echo Checking Docker environment...

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not in PATH.
    echo Please install Docker Desktop and ensure it is running.
    pause
    exit /b 1
)

REM Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker daemon is not running.
    echo Please start Docker Desktop.
    pause
    exit /b 1
)

echo Logging into Docker...
echo dckr_pat_QdBDB82Cy_p0Ci_VzZhmidEe2_Q | docker login -u lotargo --password-stdin
if %errorlevel% neq 0 (
    echo Warning: Docker login failed. Proceeding anyway as image might be public or local...
)

echo Starting MongoDB...
docker pull mongo:latest
if %errorlevel% neq 0 (
    echo Error: Failed to pull mongo image. Check your internet connection.
    pause
    exit /b 1
)

REM Check if container exists
docker container inspect mongodb >nul 2>&1
if %errorlevel% equ 0 (
    echo Container 'mongodb' exists. Checking status...

    REM Check if running
    for /f "tokens=*" %%i in ('docker container inspect -f "{{.State.Running}}" mongodb') do set IS_RUNNING=%%i

    if "%IS_RUNNING%"=="true" (
        echo MongoDB is already running.
    ) else (
        echo MongoDB is stopped. Starting it...
        docker start mongodb
        if %errorlevel% neq 0 (
            echo Error: Failed to start existing mongodb container.
            echo Try removing it manually: docker rm mongodb
            pause
            exit /b 1
        )
    )
) else (
    echo Container 'mongodb' does not exist. Creating new one...
    docker run -d --name mongodb -p 27017:27017 mongo:latest
    if %errorlevel% neq 0 (
        echo Error: Failed to run mongodb container.
        echo Check if port 27017 is already in use by another application.
        pause
        exit /b 1
    )
)

echo Waiting for MongoDB to accept connections...
timeout /t 5 /nobreak >nul

echo Installing dependencies...
if exist poetry.lock (
    echo Using Poetry...
    call poetry install
) else (
    echo Poetry lock file not found. Skipping poetry install.
)

echo Infrastructure setup complete.
pause
