import json
import os
from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS # Import CORS
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = Flask(__name__, static_folder=None) # Disable default static handler
CORS(app) # Enable CORS for all routes

# Get the directory where the script is located
base_dir = os.path.dirname(os.path.abspath(__file__))
cards_file_path = os.path.join(base_dir, 'cards.json')

# Determine the card images directory from environment variable or default
# IMPORTANT: This path MUST exist and be accessible by the server process.
CARD_IMAGES_DIR = os.getenv('CARD_IMAGES_DIR', os.path.join(base_dir, 'card_images')) # Default to relative path if not set
print(f"Attempting to use card images directory: {CARD_IMAGES_DIR}")
if not os.path.isdir(CARD_IMAGES_DIR):
     print(f"WARNING: Configured CARD_IMAGES_DIR '{CARD_IMAGES_DIR}' does not exist or is not a directory. Image loading might fail.")


# Route to serve the main editor page
@app.route('/')
@app.route('/edit.html')
def editor():
    return send_from_directory(base_dir, 'edit.html')

# Route to serve static files (CSS, JS, Templates) from the project directory
@app.route('/<path:filename>')
def serve_static(filename):
    # Allow access to specific directories and files relative to the project
    allowed_dirs = ['css', 'js', 'templates', 'fonts']
    # Check if the requested path starts with an allowed directory or is cards.json
    if any(filename.startswith(dir + '/') for dir in allowed_dirs) or filename == 'cards.json':
         # Use safe_join to prevent directory traversal within the base_dir
        safe_path = os.path.join(base_dir, filename)
        if os.path.exists(safe_path):
             # Determine the directory part of the filename relative to base_dir
            directory = os.path.dirname(filename)
            file = os.path.basename(filename)
            # Serve templates from the templates directory specifically
            if directory == 'templates':
                 return send_from_directory(os.path.join(base_dir, 'templates'), file)
            # Serve other allowed files/directories from base_dir
            return send_from_directory(os.path.join(base_dir, directory), file)
    # Return 404 if the file is not found or not allowed within base_dir
    return "File not found", 404

# Route to serve images specifically from the configured CARD_IMAGES_DIR
@app.route('/external_image/<path:image_filename>')
def serve_external_image(image_filename):
    # Basic security check: prevent directory traversal
    if '..' in image_filename or image_filename.startswith('/') or image_filename.startswith('\\'):
        return "Invalid filename", 400

    try:
        # Serve the file directly from the absolute CARD_IMAGES_DIR
        # Ensure CARD_IMAGES_DIR is an absolute path for send_from_directory to work correctly here
        if not os.path.isabs(CARD_IMAGES_DIR):
             print(f"ERROR: CARD_IMAGES_DIR '{CARD_IMAGES_DIR}' is not an absolute path. Cannot serve external images securely.")
             return "Server configuration error", 500

        print(f"Attempting to serve image: {os.path.join(CARD_IMAGES_DIR, image_filename)}")
        return send_from_directory(CARD_IMAGES_DIR, image_filename, as_attachment=False)
    except FileNotFoundError:
        print(f"Image not found: {os.path.join(CARD_IMAGES_DIR, image_filename)}")
        return "Image not found", 404
    except Exception as e:
        print(f"Error serving image {image_filename}: {e}")
        return "Error serving image", 500

# Route to save card data
@app.route('/save_cards', methods=['POST'])
def save_cards():
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "Invalid JSON data received"}), 400

        # Basic validation (check if it's a dictionary)
        if not isinstance(data, dict):
             return jsonify({"status": "error", "message": "Data must be a JSON object"}), 400

        # Write the data to cards.json
        with open(cards_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4) # Use indent for pretty printing

        return jsonify({"status": "success", "message": "Cards saved successfully"})
    except Exception as e:
        print(f"Error saving cards: {e}") # Log error to server console
        return jsonify({"status": "error", "message": f"An error occurred: {e}"}), 500

if __name__ == '__main__':
    print(f"Serving files from: {base_dir}")
    print(f"Attempting to save to: {cards_file_path}")
    # Check if cards.json exists and is writable
    if not os.path.exists(cards_file_path):
        print(f"Warning: {cards_file_path} does not exist. It will be created on first save.")
    elif not os.access(cards_file_path, os.W_OK):
         print(f"Error: Cannot write to {cards_file_path}. Check file permissions.")

    # Run the Flask app
    # Use 0.0.0.0 to make it accessible on the network if needed, otherwise use 127.0.0.1
    app.run(host='127.0.0.1', port=8000, debug=True) # debug=True provides auto-reload and more error details