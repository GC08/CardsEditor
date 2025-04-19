@echo off
echo Starting Flask application server on http://localhost:8000/
echo Serving the Car Card Editor...
echo Press Ctrl+C in this window to stop the server.
echo.

REM Open the editor page in the default browser
start "" "http://localhost:8000/edit.html"

REM Start the Flask server (this will keep the window open)
python server.py