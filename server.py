import json
import os
import urllib.parse # Import urllib
from flask import Flask, request, send_from_directory, jsonify, send_file # Import send_file
from flask_cors import CORS # Import CORS
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = Flask(__name__, static_folder=None) # Disable default static handler
CORS(app) # Enable CORS for all routes

# Get the directory where the script is located
base_dir = os.path.dirname(os.path.abspath(__file__))
# Determine the cards collection filename from environment variable or default
cars_file_name = os.getenv('CARS_COLLECTION_FILE', 'cards.json') # Default to 'cards.json' if not set
cards_file_path = os.path.join(base_dir, cars_file_name)
print(f"Using cards collection file: {cards_file_path}") # Add print statement for confirmation

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
    allowed_dirs = ['css', 'js', 'templates', 'fonts', 'icons'] # Added 'icons'
    # Check if the requested path starts with an allowed directory OR is the configured cards file
    if any(filename.startswith(dir + '/') for dir in allowed_dirs) or filename == cars_file_name: # Use the variable here
        # Use safe_join to prevent directory traversal within the base_dir
        safe_path = os.path.join(base_dir, filename)
        if os.path.exists(safe_path):
            # Determine the directory part of the filename relative to base_dir
            directory = os.path.dirname(filename)
            file = os.path.basename(filename)
            # Serve templates from the templates directory specifically
            if directory == 'templates':
                 return send_from_directory(os.path.join(base_dir, 'templates'), file)
            # Serve the cards JSON file or other allowed files from base_dir or subdirs
            return send_from_directory(os.path.join(base_dir, directory), file)
    # Return 404 if the file is not found or not allowed within base_dir
    return "File not found", 404

# Route to serve images specifically from the configured CARD_IMAGES_DIR
@app.route('/external_image/<path:image_filename>')
def serve_external_image(image_filename):
    print(f"\n--- Request for image: {image_filename} ---")
    print(f"Using CARD_IMAGES_DIR: {CARD_IMAGES_DIR}")

    # Basic security check: prevent directory traversal
    if '..' in image_filename or image_filename.startswith('/') or image_filename.startswith('\\'):
        print(f"ERROR: Invalid filename pattern detected: {image_filename}")
        return "Invalid filename", 400

    try:
        # Decode the filename received from the URL
        decoded_filename = urllib.parse.unquote(image_filename)
        print(f"Decoded filename: {decoded_filename}")

        # Construct the full absolute path to the image file
        # Security Note: CARD_IMAGES_DIR comes from .env, decoded_filename had basic checks.
        # Ensure the server process has read access to this path.
        full_image_path = os.path.join(CARD_IMAGES_DIR, decoded_filename)
        print(f"Constructed full path: {full_image_path}")

        # Explicitly check existence and type before try block
        exists = os.path.exists(full_image_path)
        is_file = os.path.isfile(full_image_path)
        print(f"Checking path - Exists: {exists}, Is File: {is_file}")

        # Check if the constructed path is valid and exists
        if not exists or not is_file:
            print(f"Image not found or not a file at path: {full_image_path}")
            return "Image not found", 404

        print(f"Attempting to send file via send_file: {full_image_path}")
        # Use send_file with the absolute path
        return send_file(full_image_path, as_attachment=False)

    except Exception as e:
        # Log the specific exception type and message for debugging
        exception_type = type(e).__name__
        print(f"ERROR [{exception_type}] processing or sending image {image_filename} (decoded: {decoded_filename}): {e}")
        # Also log the traceback for more details
        import traceback
        traceback.print_exc()
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