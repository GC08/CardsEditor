# Zajebiste Samochody - Car Card Editor

This project provides a web-based editor for creating and modifying car stat cards.

## Features

*   Displays car cards based on data from `cards.json`.
*   Loads card structure from `templates/card.html` and styles from `templates/card_style.css`.
*   Allows adding new cards with default values (data stored in browser memory only).
*   Allows removing cards (data removed from browser memory only).
*   Supports editing stats (Speed, Acceleration, Handling) by clicking stars.
*   Supports editing costs (Money, Gas, Tires, Parts, Tools) by left-clicking (increment) or right-clicking (decrement).
*   Supports editing Year and Name by double-clicking (Name edit is display-only).
*   "Save Changes" button logs the current in-memory card data to the browser console.

## Setup and Running

1.  **Prerequisites:** Ensure you have Python 3 installed.
2.  **Run the Server:** Double-click the `start_server.bat` file. This will:
    *   Start a local Python HTTP server.
    *   Automatically open the editor (`edit.html`) in your default web browser at `http://localhost:8000/edit.html`.
3.  **Use the Editor:** Interact with the cards as described in the Features section.
4.  **Stop the Server:** Close the command prompt window that was opened by `start_server.bat` (or press `Ctrl+C` in that window).

## File Structure

*   `edit.html`: The main editor page.
*   `cards.json`: Contains the data for the car cards.
*   `card_images/`: Directory to store card images (e.g., `AC COBRA 289.png`). Image filenames must match the card name in `cards.json`.
*   `css/style.css`: Styles for the main `edit.html` page.
*   `js/edit.js`: JavaScript logic for loading data, rendering cards, and handling interactions.
*   `templates/card.html`: HTML template for a single card.
*   `templates/card_style.css`: CSS styles specifically for the card template.
*   `start_server.bat`: Script to easily start the local web server and open the editor.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `README.md`: This file.

## Notes

*   All edits (adding, removing, modifying cards) are currently stored **only in the browser's memory**. Changes will be lost when the page is closed or refreshed. The "Save Changes" button only logs the current data to the console.
*   Editing the card name only changes the displayed text, not the underlying data key or the associated image filename due to complexity.