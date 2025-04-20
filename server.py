import json
import os
from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS # Import CORS

app = Flask(__name__, static_folder=None) # Disable default static handler
CORS(app) # Enable CORS for all routes

# Get the directory where the script is located
base_dir = os.path.dirname(os.path.abspath(__file__))
cards_file_path = os.path.join(base_dir, 'cards.json')

# Route to serve the main editor page
@app.route('/')
@app.route('/edit.html')
def editor():
    return send_from_directory(base_dir, 'edit.html')

# Route to serve static files (CSS, JS, Templates, Images)
@app.route('/<path:filename>')
def serve_static(filename):
    # Allow access to specific directories and files
    allowed_dirs = ['css', 'js', 'templates', 'card_images', 'fonts']
    # Check if the requested path starts with an allowed directory or is cards.json
    if any(filename.startswith(dir + '/') for dir in allowed_dirs) or filename == 'cards.json':
         # Use safe_join to prevent directory traversal
        safe_path = os.path.join(base_dir, filename)
        if os.path.exists(safe_path):
             # Determine the directory part of the filename
            directory = os.path.dirname(filename)
            file = os.path.basename(filename)
            # Serve templates from the templates directory specifically
            if directory == 'templates':
                 return send_from_directory(os.path.join(base_dir, 'templates'), file)
            # Serve other allowed files/directories
            return send_from_directory(os.path.join(base_dir, directory), file)
    # Return 404 if the file is not found or not allowed
    return "File not found", 404


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