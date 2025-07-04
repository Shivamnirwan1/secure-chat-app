import os
from flask import Flask, send_from_directory, render_template, request
from flask_socketio import SocketIO, emit, join_room
from encryption import load_rsa_cipher
from base64 import b64encode, b64decode
from Crypto.Random import get_random_bytes
from flask import Flask, send_file


room_users = {}
room_passwords = {}
client_rsa_ciphers = {}
sid_to_username = {}  # 🔥 NEW: track sid to username for disconnect


# ✅ Correct Flask initialization (just ONCE)
app = Flask(
    __name__,
    static_url_path="/static",
    static_folder="../static",     # allows serving from /static/*
    template_folder="./templates"  # keeps using your existing chat UI
)

socketio = SocketIO(app, cors_allowed_origins="*")

aes_key = get_random_bytes(16)
room_passwords = {}
room_users = {}        # room: {sid: username}
client_rsa_ciphers = {}  # sid: RSA cipher

# ✅ Serve the new landing page
@app.route("/")
def landing():
    return send_from_directory("../static/landing", "index.html")




# ✅ Serve your existing chat UI
import os
from flask import send_file

@app.route("/chat")
def chat():
    return render_template("index.html")  # <-- from templates/index.html



# ✅ SOCKET.IO EVENTS

@socketio.on("join_room")
def join(data):
    sid = request.sid
    room = data["room"]
    password = data["password"]
    username = data["username"]

    if room in room_passwords:
        if room_passwords[room] != password:
            emit("room_join_error")
            return
    else:
        room_passwords[room] = password

    join_room(room)

    if room not in room_users:
        room_users[room] = {}

    room_users[room][sid] = username
    sid_to_username[sid] = username  # 🔥 Save SID for disconnect tracking

    emit("room_join_success")
    emit("update_users", list(room_users[room].values()), room=room)
    emit("user_joined", username, room=room)  # ✅ NEW

    

@socketio.on("public_key")
def send_aes(data):
    sid = request.sid
    room = data["room"]
    pub_key = load_rsa_cipher(b64decode(data["pubKeyB64"]))
    client_rsa_ciphers[sid] = pub_key
    encrypted = pub_key.encrypt(aes_key)
    emit("aes_key", b64encode(encrypted).decode())

@socketio.on("encrypted_message")
def handle_message(data):
    emit("receive_message", data["msg"], room=data["room"], include_self=False)

@socketio.on("typing")
def handle_typing(data):
    emit("show_typing", {
        "name": data["username"],
        "isTyping": data["isTyping"]
    }, room=data["room"])


@socketio.on("disconnect")
def disconnect_user():
    sid = request.sid
    username = sid_to_username.get(sid)  # 🔥

    for room, users in room_users.items():
        if sid in users:
            del users[sid]
            emit("update_users", list(users.values()), room=room)
            if username:
                emit("user_left", username, room=room)  # ✅ NEW
            break

    client_rsa_ciphers.pop(sid, None)
    sid_to_username.pop(sid, None)  # ✅ Clean up sid map


@socketio.on("file_upload")
def handle_file_upload(data):
    room = data["room"]
    emit("file_download", data, room=room, include_self=False)

@socketio.on("encrypted_file")
def handle_file(data):
    emit("receive_file", data, room=data["room"])


# ✅ RUN THE APP
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
