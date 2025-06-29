// static/script.js

const socket = io(location.origin);

let aesKey = null;
let rsaKeyPair = null;
let username = null;

const chatBox = document.getElementById("chat");
const input = document.getElementById("msg");
const typingIndicator = document.getElementById("typingIndicator");
let typingTimeout = null;

function startChat() {
  const nameInput = document.getElementById("usernameInput");
  username = nameInput.value.trim();
  if (!username) {
    alert("Please enter a name.");
    return;
  }

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  generateRSAKeys();
  socket.emit("register_username", username);

}

function appendMessage(msg, isSelf = false, sender = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `flex items-start gap-2 ${isSelf ? "justify-end" : "justify-start"} animate-fadeIn`;

  if (!isSelf) {
    // Create initials avatar with hashed background color
    const avatar = document.createElement("div");
    avatar.className = "text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shadow shrink-0";
    avatar.style.backgroundColor = stringToColor(sender);
    avatar.textContent = sender[0]?.toUpperCase() || "?";
    wrapper.appendChild(avatar);
  } else {
    wrapper.classList.add("ml-auto");
  }

  // Message bubble
  const bubble = document.createElement("div");
  bubble.className = `
    max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words shadow 
    ${isSelf ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}
  `;
  bubble.textContent = msg;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}




async function generateRSAKeys() {
  rsaKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPubKey = await window.crypto.subtle.exportKey("spki", rsaKeyPair.publicKey);
  const pubKeyB64 = arrayBufferToBase64(exportedPubKey);

  socket.emit("public_key", pubKeyB64);
}

socket.on("aes_key", async (b64EncryptedKey) => {
  const encryptedKey = base64ToArrayBuffer(b64EncryptedKey);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      rsaKeyPair.privateKey,
      encryptedKey
    );
    aesKey = await window.crypto.subtle.importKey(
      "raw",
      decrypted,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    appendMessage("[+] AES key received and decrypted.");
  } catch (err) {
    appendMessage("[!] Failed to decrypt AES key: " + err);
  }
});

socket.on("receive_message", async (data) => {
  if (!aesKey) return;

  try {
    const [nonceB64, ciphertextB64] = data.split(":");
    const nonce = base64ToArrayBuffer(nonceB64);
    const ciphertext = base64ToArrayBuffer(ciphertextB64);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(decrypted));
    const timeStr = formatTimestamp(payload.time);
    appendMessage(`${payload.text}\n• ${timeStr}`, false, payload.user);
  } catch (err) {
    appendMessage("[!] Message decryption failed.");
  }
});

async function sendMessage() {
  const text = input.value.trim();
  input.value = "";

  if (!aesKey || !text) return;

  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ user: username, text, time: timestamp });
  const encoder = new TextEncoder();
  const encoded = encoder.encode(payload);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encoded
  );

  const msg = base64Encode(iv) + ":" + base64Encode(ciphertext);
  socket.emit("encrypted_message", msg);
  const timeStr = formatTimestamp(timestamp);
  appendMessage(`${text}\n• ${timeStr}`, true);


}

function onInput() {
  socket.emit("typing", username);
}

socket.on("show_typing", (name) => {
  if (!name || name === username) return;

  typingIndicator.textContent = `${name} is typing...`;
  typingIndicator.classList.remove("hidden");

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingIndicator.classList.add("hidden");
  }, 1500);
});

// Base64 helpers
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

function base64Encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

socket.on("update_users", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.textContent = u === username ? `${u} (You)` : u;
    list.appendChild(li);
  });
});

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`; // Vivid color
}
