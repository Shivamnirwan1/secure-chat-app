# server/server.py
import os
from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
from encryption import generate_rsa_keypair, load_rsa_cipher
from Crypto.Random import get_random_bytes
from base64 import b64encode, b64decode

app = Flask(__name__, static_url_path='/static', static_folder='../static', template_folder='./templates')
socketio = SocketIO(app, cors_allowed_origins="*")

# AES key and RSA ciphers per client
aes_key = get_random_bytes(16)
connected_users = {}  # sid: username
client_rsa_ciphers = {}


@app.route('/')
def home():
    return render_template("index.html")

@socketio.on('public_key')
def handle_public_key(data):
    sid = request.sid
    rsa_cipher = load_rsa_cipher(b64decode(data))
    client_rsa_ciphers[sid] = rsa_cipher
    encrypted_aes = rsa_cipher.encrypt(aes_key)
    emit('aes_key', b64encode(encrypted_aes).decode())

@socketio.on('register_username')
def handle_register_username(name):
    sid = request.sid
    connected_users[sid] = name
    emit('update_users', list(connected_users.values()), broadcast=True)


@socketio.on('encrypted_message')
def handle_encrypted_message(data):
    emit('receive_message', data, broadcast=True, include_self=False)

@socketio.on('typing')
def handle_typing(name):
    emit('show_typing', name, broadcast=True, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in client_rsa_ciphers:
        del client_rsa_ciphers[sid]
    if sid in connected_users:
        del connected_users[sid]
        emit('update_users', list(connected_users.values()), broadcast=True)
    print(f"[-] Client {sid} disconnected.")


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
