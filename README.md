# Zajebiste Samochody - Car Card Editor

This project provides a web-based editor for creating and modifying car stat cards.

## Features

*   Displays car cards based on data from `cards.json`.
*   Loads card structure from `templates/card.html` and styles from `templates/card_style.css`.
*   Allows adding new cards with default values (data stored in browser memory only).
*   Allows removing cards (data removed from browser memory only).
*   Supports editing stats (Speed, Acceleration, Handling) by clicking stars.
*   Supports editing costs (Money, Gas, Tires, Parts, Tools) by left-clicking (increment) or right-clicking (decrement).
*   Supports editing Year by clicking on it.
*   Supports editing Name by double-clicking (Name edit is display-only).
*   Allows selecting cards via checkboxes for printing.
*   "Print Selected" button opens a new window with selected cards formatted for printing (A4, no margins).
*   "Save Changes" button logs the current in-memory card data to the browser console.

## Setup and Running

1.  **Prerequisites:** Ensure you have Python 3 and pip installed.
2.  **Install Dependencies:** Double-click the `install.bat` file. This will automatically install the necessary Python packages listed in `requirements.txt`. Alternatively, you can open a command prompt or terminal in the project directory and run `pip install -r requirements.txt`.
3.  **Run the Server:** Double-click the `start_server.bat` file (or run `python server.py` in the terminal). This will:
    *   Start the Flask development server.
    *   Automatically open the editor (`edit.html`) in your default web browser at `http://localhost:8000/edit.html` (if using `start_server.bat`). If running manually, navigate to this URL.
4.  **Use the Editor:** Interact with the cards as described in the Features section.
5.  **Stop the Server:** Close the command prompt window that was opened by `start_server.bat` (or press `Ctrl+C` in the terminal where `server.py` is running).

## File Structure

*   `edit.html`: The main editor page.
*   `cards.json`: Contains the data for the car cards.
*   `.env`: Optional file to specify the `CARD_IMAGES_DIR`. This can be a relative path within the project (e.g., `card_images2`) or an absolute path on your system (e.g., `G:\MyCardImages`). If not present or the path is invalid, it defaults to `card_images/` relative to the project. The server must have read access to this directory.
*   `card_images/`: Default directory to store card images (e.g., `AC COBRA 289.png`). Image filenames must match the card name in `cards.json`.
*   `css/style.css`: Styles for the main `edit.html` page.
*   `css/print.css`: Styles specifically for the print view.
*   `js/edit.js`: JavaScript logic for loading data, rendering cards, and handling interactions.
*   `templates/card.html`: HTML template for a single card.
*   `templates/card_style.css`: CSS styles specifically for the card template.
*   `server.py`: The Flask backend server script. Handles serving the application and proxying image requests from the configured `CARD_IMAGES_DIR`.
*   `install.bat`: Script to easily install Python dependencies.
*   `start_server.bat`: Script to easily start the Flask server and open the editor.
*   `requirements.txt`: Lists the Python dependencies required by the server (includes `Flask`, `Flask-Cors`, `python-dotenv`).
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `README.md`: This file.

## Notes

*   All edits (adding, removing, modifying cards) are currently stored **only in the browser's memory**. Changes will be lost when the page is closed or refreshed. The "Save Changes" button only logs the current data to the console.
*   Editing the card name only changes the displayed text, not the underlying data key or the associated image filename due to complexity.