const socket = io(location.origin);

let aesKey = null;
let rsaKeyPair = null;
let username = "";
let room = "";

const chatBox = document.getElementById("chat");
const input = document.getElementById("msg");
const typingIndicator = document.getElementById("typingIndicator");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const appBody = document.body;
const chatArea = document.getElementById("chat");
const chatScreen = document.getElementById("chatScreen");

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
    appendMessage(`${payload.text}\n• ${timeStr}`, false, payload.user);
  } catch (e) {
    appendMessage("[!] Failed to decrypt message.");
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
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  socket.emit("encrypted_message", { msg: base64Encode(iv) + ":" + base64Encode(ciphertext), room });
  appendMessage(`${text}\n• ${formatTimestamp(timestamp)}`, true, username);
}

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

// === Helper Functions ===

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
  const hue = (hash % 360 + 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// === Theme Toggle + Icon Switching ===

themeToggle?.addEventListener("click", () => {
  const isDark = appBody.classList.contains("bg-gray-900");

  if (isDark) {
    appBody.classList.remove("bg-gray-900", "text-white");
    appBody.classList.add("text-black");
    appBody.style.backgroundColor = "#FFFDF6";

    chatArea.classList.remove("bg-gray-950");
    chatArea.style.backgroundColor = "#ffffff";

    chatScreen.querySelectorAll(".bg-gray-800").forEach(el => {
      el.classList.remove("bg-gray-800");
      el.style.backgroundColor = "#f0f0f0";
    });

    // Light icon (Sun)
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 
          6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 
          1.591M5.25 12H3m4.227-4.773L5.636 
          5.636M15.75 12a3.75 3.75 0 1 1-7.5 
          0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>`;
  } else {
    appBody.classList.add("bg-gray-900", "text-white");
    appBody.classList.remove("text-black");
    appBody.style.backgroundColor = "";

    chatArea.classList.add("bg-gray-950");
    chatArea.style.backgroundColor = "";

    chatScreen.querySelectorAll("[style]").forEach(el => {
      el.style.backgroundColor = "";
    });

    // Dark icon (Moon)
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21.752 15.002A9.72 9.72 0 0 1 18 
          15.75c-5.385 0-9.75-4.365-9.75-9.75 
          0-1.33.266-2.597.748-3.752A9.753 
          9.753 0 0 0 3 11.25C3 16.635 
          7.365 21 12.75 21a9.753 9.753 0 
          0 0 9.002-5.998Z" />
      </svg>`;
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  const input = document.getElementById("msg");

  // Toggle picker visibility
  emojiBtn.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
  });

  // Insert emoji into input
  emojiPicker.addEventListener("emoji-click", (event) => {
    input.value += event.detail.unicode;
    input.focus();
  });

  // Optional: hide picker when clicking outside
  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
      emojiPicker.style.display = "none";
    }
  });
});

