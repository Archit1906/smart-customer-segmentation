from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from routes.api import api

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB upload limit
CORS(app)
app.register_blueprint(api, url_prefix="/api")


@app.errorhandler(HTTPException)
def http_err(e):
    msg = "File is too large (max 5 MB)." if e.code == 413 else e.name
    return jsonify(error=msg), e.code


@app.errorhandler(Exception)
def any_err(e):
    return jsonify(error="Internal server error."), 500


if __name__ == "__main__":
    app.run(port=5001, debug=False)
