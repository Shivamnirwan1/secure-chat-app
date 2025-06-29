const socket = io(location.origin);

let aesKey = null;
let rsaKeyPair = null;
let username = "";
let room = "";

const chatBox = document.getElementById("chat");
const input = document.getElementById("msg");
const typingIndicator = document.getElementById("typingIndicator");
let typingTimeout = null;

function startChat() {
  username = document.getElementById("usernameInput").value.trim();
  room = document.getElementById("roomInput").value.trim();
  const password = document.getElementById("roomPassword").value.trim();

  if (!username || !room || !password) return alert("Please fill all fields.");

  socket.emit("join_room", { username, room, password });
}

socket.on("room_join_success", () => {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");
  generateRSAKeys();
});

socket.on("room_join_error", () => {
  document.getElementById("loginError").classList.remove("hidden");
});

async function generateRSAKeys() {
  rsaKeyPair = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await window.crypto.subtle.exportKey("spki", rsaKeyPair.publicKey);
  socket.emit("public_key", { pubKeyB64: arrayBufferToBase64(exported), room });
}

socket.on("aes_key", async (b64EncryptedKey) => {
  const encryptedKey = base64ToArrayBuffer(b64EncryptedKey);
  try {
    const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaKeyPair.privateKey, encryptedKey);
    aesKey = await window.crypto.subtle.importKey("raw", decrypted, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    appendMessage("[+] AES key received and decrypted.");
  } catch (err) {
    appendMessage("[!] Failed to decrypt AES key: " + err);
  }
});

socket.on("receive_message", async (data) => {
  if (!aesKey) return;

  const [nonceB64, ciphertextB64] = data.split(":");
  const nonce = base64ToArrayBuffer(nonceB64);
  const ciphertext = base64ToArrayBuffer(ciphertextB64);

  try {
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, aesKey, ciphertext);
    const payload = JSON.parse(new TextDecoder().decode(decrypted));
    const timeStr = formatTimestamp(payload.time);
    
    // ✅ FIXED: Make sure sender is passed properly!
    appendMessage(`${payload.text}\n• ${timeStr}`, false, payload.user);
  } catch (e) {
    console.error("Decryption failed", e);
  }
});

socket.on("file_download", async ({ file }) => {
  if (!aesKey) return;

  const iv = base64ToArrayBuffer(file.iv);
  const content = base64ToArrayBuffer(file.content);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      content
    );

    appendFileMessage({ ...file, decrypted }, false);
  } catch (e) {
    appendMessage("[!] Failed to decrypt file.");
  }
});


async function sendMessage() {
  const text = input.value.trim();
  if (!aesKey || !text) return;
  input.value = "";
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ user: username, text, time: timestamp });
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(payload);
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aesKey, encoded);
  socket.emit("encrypted_message", { msg: base64Encode(iv) + ":" + base64Encode(ciphertext), room });
  appendMessage(`${text}\n• ${formatTimestamp(timestamp)}`, true, username);
}

document.getElementById("fileInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file || !aesKey) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const arrayBuffer = reader.result;

    // Encrypt file
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      arrayBuffer
    );

    const payload = {
      name: file.name,
      type: file.type,
      iv: base64Encode(iv),
      content: base64Encode(encrypted),
      sender: username,
      time: new Date().toISOString(),
    };

    socket.emit("file_upload", { room, file: payload });

    appendFileMessage(payload, true);
  };
  reader.readAsArrayBuffer(file);
});


function appendMessage(msg, isSelf = false, sender = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `flex items-start gap-2 ${isSelf ? "justify-end" : "justify-start"} animate-fadeIn`;

  if (!isSelf) {
    const avatar = document.createElement("div");
    avatar.className = "text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shadow shrink-0";
    avatar.style.backgroundColor = stringToColor(sender);
    avatar.textContent = sender[0]?.toUpperCase() || "?";
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words shadow ${isSelf ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`;
  bubble.textContent = msg;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendFileMessage(file, isSelf = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `flex items-start gap-2 ${isSelf ? "justify-end" : "justify-start"} animate-fadeIn`;

  if (!isSelf) {
    const avatar = document.createElement("div");
    avatar.className = "text-white font-bold rounded-full h-8 w-8 flex items-center justify-center shadow shrink-0";
    avatar.style.backgroundColor = stringToColor(file.sender);
    avatar.textContent = file.sender[0]?.toUpperCase() || "?";
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] px-4 py-2 rounded-2xl break-words shadow bg-gray-700 text-white`;

  const timeStr = formatTimestamp(file.time);

  if (file.type.startsWith("image/")) {
    const blob = new Blob([file.decrypted], { type: file.type });
    const url = URL.createObjectURL(blob);
    bubble.innerHTML = `
      <img src="${url}" class="max-w-xs rounded mb-1" />
      <div class="text-xs text-gray-300">📎 ${file.name}<br>• ${timeStr}</div>
    `;
  } else {
    const blob = new Blob([file.decrypted], { type: file.type });
    const url = URL.createObjectURL(blob);
    bubble.innerHTML = `
      <a href="${url}" download="${file.name}" class="underline text-blue-300">📄 ${file.name}</a>
      <div class="text-xs text-gray-300">• ${timeStr}</div>
    `;
  }

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
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

socket.on("show_typing", (name) => {
  if (!name || name === username) return;
  typingIndicator.textContent = `${name} is typing...`;
  typingIndicator.classList.remove("hidden");
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => typingIndicator.classList.add("hidden"), 1500);
});

function onInput() {
  socket.emit("typing", { room, username });
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function base64Encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return `${date.getHours() % 12 || 12}:${(date.getMinutes() + "").padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = (hash % 360 + 360) % 360; // Normalize to 0-359
  return `hsl(${hue}, 70%, 60%)`; // Bright and readable
}



const themeToggle = document.getElementById("themeToggle");
const appBody = document.body;
const chatArea = document.getElementById("chat");
const chatScreen = document.getElementById("chatScreen");

themeToggle?.addEventListener("click", () => {
  const isDark = appBody.classList.contains("bg-gray-900");

  if (isDark) {
    // Switch to Light Mode (custom color)
    appBody.classList.remove("bg-gray-900", "text-white");
    appBody.classList.add("text-black");
    appBody.style.backgroundColor = "#FFFDF6";

    chatArea.classList.remove("bg-gray-950");
    chatArea.style.backgroundColor = "#ffffff";

    chatScreen.querySelectorAll(".bg-gray-800").forEach(el => {
      el.classList.remove("bg-gray-800");
      el.style.backgroundColor = "#f0f0f0"; // Light gray UI blocks
    });
  } else {
    // Switch back to Dark Mode
    appBody.classList.add("bg-gray-900", "text-white");
    appBody.classList.remove("text-black");
    appBody.style.backgroundColor = "";

    chatArea.classList.add("bg-gray-950");
    chatArea.style.backgroundColor = "";

    chatScreen.querySelectorAll("[style]").forEach(el => {
      el.style.backgroundColor = "";
    });
  }
});
