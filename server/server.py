import os
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room
from encryption import load_rsa_cipher
from base64 import b64encode, b64decode
from Crypto.Random import get_random_bytes

app = Flask(__name__, static_url_path="/static", static_folder="../static", template_folder="./templates")
socketio = SocketIO(app, cors_allowed_origins="*")

aes_key = get_random_bytes(16)
room_passwords = {}
room_users = {}        # room: {sid: username}
client_rsa_ciphers = {}  # sid: RSA cipher

@app.route("/")
def index():
    return render_template("index.html")

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
    emit("room_join_success")
    emit("update_users", list(room_users[room].values()), room=room)

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
    emit("show_typing", data["username"], room=data["room"], include_self=False)

@socketio.on("disconnect")
def disconnect_user():
    sid = request.sid
    for room, users in room_users.items():
        if sid in users:
            del users[sid]
            emit("update_users", list(users.values()), room=room)
            break
    client_rsa_ciphers.pop(sid, None)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
