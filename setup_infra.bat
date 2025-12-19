@echo off
echo Logging into Docker...
echo dckr_pat_QdBDB82Cy_p0Ci_VzZhmidEe2_Q | docker login -u lotargo --password-stdin

echo Starting MongoDB...
docker pull mongo:latest

docker ps -q -f name=mongodb >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting new MongoDB container...
    REM Remove if exists and stopped (simple check failed, assuming clean start or existing running)
    REM Better to just try run, if fails because name conflict, it means it exists.
    docker run -d --name mongodb -p 27017:27017 mongo:latest 2>nul
    if %errorlevel% neq 0 (
        echo Container might already exist. Trying to start it...
        docker start mongodb
    )
) else (
    echo MongoDB is already running.
)

echo Installing dependencies...
call poetry install

echo Infrastructure setup complete.
