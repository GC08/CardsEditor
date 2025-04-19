@echo off
echo Starting Python HTTP server on http://localhost:8000/
echo Serving files from the current directory...
echo Press Ctrl+C in this window to stop the server.
echo.

REM Open the editor page in the default browser
start "" "http://localhost:8000/edit.html"

REM Start the Python server (this will keep the window open)
python -m http.server