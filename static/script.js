const socket = io(location.origin);

let aesKey = null;
let rsaKeyPair = null;
let username = "";
let room = "";
let typingUsers = new Set();
let typingClearTimeout = null;



// Grab values from URL if present
const params = new URLSearchParams(window.location.search);
const urlName = params.get("name");
const urlRoom = params.get("room");
const urlPassword = params.get("password");

// DOM elements
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

// 🌟 Automatically join room if URL has parameters
if (urlName && urlRoom && urlPassword) {
  username = urlName;
  room = urlRoom;
  socket.emit("join_room", {
    username: urlName,
    room: urlRoom,
    password: urlPassword,
  });
}

socket.on("room_join_success", () => {
  document.getElementById("loginScreen")?.classList.add("hidden");
  document.getElementById("chatScreen")?.classList.remove("hidden");
  generateRSAKeys();
  appendSystemMessage(`✅ You joined the chat as ${username}`);
});

socket.on("room_join_error", () => {
  alert("Invalid room password.");
  window.location.href = "/"; // Send them back to homepage
});

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

  const exported = await window.crypto.subtle.exportKey("spki", rsaKeyPair.publicKey);
  socket.emit("public_key", { pubKeyB64: arrayBufferToBase64(exported), room });
}

socket.on("aes_key", async (b64EncryptedKey) => {
  const encryptedKey = base64ToArrayBuffer(b64EncryptedKey);
  try {
    const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaKeyPair.privateKey, encryptedKey);
    aesKey = await window.crypto.subtle.importKey("raw", decrypted, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    appendSystemMessage("[+] AES key received and decrypted.");
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
    const msg = `${payload.text || "[File Received]"}\n• ${timeStr}`;
    appendMessage(msg, false, payload.user, payload.file);
  } catch (e) {
    appendMessage("[!] Failed to decrypt message.");
  }
});


socket.on("receive_file", async ({ data }) => {
  if (!aesKey) return;

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(data.iv) },
      aesKey,
      base64ToArrayBuffer(data.encrypted)
    );

    const blob = new Blob([decrypted], { type: data.type });
    const url = URL.createObjectURL(blob);
    appendFile({ ...data, url }, false);
  } catch (e) {
    appendMessage("[!] Failed to decrypt file.");
  }
});


async function sendMessage() {
  const text = input.value.trim();
  const file = fileInput.files?.[0];

  if (!aesKey || (!text && !file)) return;

  const timestamp = new Date().toISOString();
  let payload = { user: username, time: timestamp };

  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const base64File = base64Encode(arrayBuffer);
    payload.file = {
      name: file.name,
      type: file.type,
      data: base64File
    };
  }

  if (text) {
    payload.text = text;
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  socket.emit("encrypted_message", { msg: base64Encode(iv) + ":" + base64Encode(ciphertext), room });

  if (text) {
    appendMessage(`${text}\n• ${formatTimestamp(timestamp)}`, true, username);
  } else if (file) {
    appendMessage(`[File Sent: ${file.name}]\n• ${formatTimestamp(timestamp)}`, true, username, payload.file);
  }

  // Reset input
  input.value = "";
  fileInput.value = "";
  filePreviewContainer.classList.add("hidden");
  filePreview.innerHTML = "";
}



document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !aesKey) return;

  const reader = new FileReader();
  reader.onload = async function (event) {
    const arrayBuffer = event.target.result;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, arrayBuffer);

    const data = {
      name: file.name,
      type: file.type,
      iv: base64Encode(iv),
      encrypted: base64Encode(encrypted),
    };

    socket.emit("encrypted_file", { data, room });
    appendFile(data, true);
  };
  reader.readAsArrayBuffer(file);
});



function appendMessage(msg, isSelf = false, sender = "", file = null) {
  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isSelf ? "justify-end" : "justify-start"} items-start gap-2 animate-fadeIn`;

  // Avatar for received messages
  if (!isSelf) {
    const avatar = document.createElement("div");
    const initials = (sender || "?")
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    avatar.className = "h-9 w-9 rounded-full text-white font-bold flex items-center justify-center shadow-md text-sm shrink-0";
    avatar.textContent = initials;
    avatar.style.backgroundColor = stringToColor(sender || "?");
    wrapper.appendChild(avatar);
  }

  // === Bubble ===
  const bubble = document.createElement("div");
  bubble.className = `
    group relative max-w-[70%] px-4 py-2 shadow-md whitespace-pre-wrap break-words text-sm transition-all duration-300
    ${isSelf
      ? "bg-blue-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
      : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded-tr-2xl rounded-tl-2xl rounded-br-2xl"
    }
    hover:scale-[1.01]
  `;

  // Sender name
  if (!isSelf && sender) {
    const name = document.createElement("div");
    name.textContent = sender;
    name.className = "text-xs font-semibold mb-1 text-white/70";
    bubble.appendChild(name);
  }

  // Text content
  const [text, timestamp] = msg.split("\n•");
  if (text?.trim()) {
    const content = document.createElement("div");
    content.textContent = text.trim();
    bubble.appendChild(content);
  }

  // File preview (if exists)
  if (file) {
    if (file.type?.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = `data:${file.type};base64,${file.data}`;
      img.alt = file.name;
      img.className = "rounded mt-2 max-w-[200px] max-h-[200px]";
      bubble.appendChild(img);
    } else {
      const fileLink = document.createElement("a");
      fileLink.href = `data:application/octet-stream;base64,${file.data}`;
      fileLink.download = file.name;
      fileLink.className = "block text-sm mt-2 underline";
      fileLink.textContent = `📎 Download ${file.name}`;
      bubble.appendChild(fileLink);
    }
  }

  // Timestamp
  const timeTag = document.createElement("div");
  timeTag.textContent = timestamp?.trim() || "";
  timeTag.className = "text-xs text-white/60 text-right mt-1";
  bubble.appendChild(timeTag);

  // === Reaction Button (😊 icon on hover) ===
  const reactBtn = document.createElement("button");
  reactBtn.innerHTML = "😊";
  reactBtn.title = "React";
  reactBtn.className = "absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100 transition";
  bubble.appendChild(reactBtn);

  // === Reaction Display Area ===
  const reactions = document.createElement("div");
  reactions.className = "flex gap-1 mt-1 text-xl";
  bubble.appendChild(reactions);

  // === Reaction Click Handler ===
  reactBtn.addEventListener("click", () => {
    const emoji = prompt("React with an emoji (e.g., 👍 ❤️ 😂)");
    if (emoji) {
      const span = document.createElement("span");
      span.textContent = emoji;
      reactions.appendChild(span);
    }
  });

  // Scroll logic
  const atBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 10;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);

  if (atBottom) {
    chatBox.scrollTop = chatBox.scrollHeight;
    scrollToBottomBtn.classList.add("hidden");
  } else {
    scrollToBottomBtn.classList.remove("hidden");
  }
}





function appendSystemMessage(msg) {
  const div = document.createElement("div");
  div.className = "text-center text-xs italic py-1 animate-fadeIn text-gray-600 dark:text-gray-400";
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}





function appendFile(fileData, isSelf = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isSelf ? "justify-end" : "justify-start"} items-end gap-2 animate-fadeIn`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[70%] px-4 py-3 rounded-2xl shadow-md whitespace-pre-wrap break-words text-sm ${isSelf
      ? "bg-blue-600 text-white"
      : "bg-gray-100 text-black dark:bg-gray-700 dark:text-white"
    }`;


  if (fileData.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = fileData.url || "#";
    img.alt = fileData.name;
    img.className = "rounded-lg max-w-xs";
    bubble.appendChild(img);
  } else {
    const link = document.createElement("a");
    link.href = fileData.url || "#";
    link.download = fileData.name;
    link.textContent = `📎 ${fileData.name}`;
    link.className = "underline";
    bubble.appendChild(link);
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

socket.on("show_typing", ({ name, isTyping }) => {
  if (!name || name === username) return;

  if (isTyping) {
    typingUsers.add(name);
  } else {
    typingUsers.delete(name);
  }

  updateTypingIndicator();

  // Clear after inactivity
  clearTimeout(typingClearTimeout);
  typingClearTimeout = setTimeout(() => {
    typingUsers.clear();
    updateTypingIndicator();
  }, 2000);
});

socket.on("user_joined", (name) => {
  if (name !== username) {
    appendSystemMessage(`🟢 ${name} joined the chat`);
  }
});

socket.on("user_left", (name) => {
  if (name !== username) {
    appendSystemMessage(`🔴 ${name} left the chat`);
  }
});




function updateTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");

  if (typingUsers.size === 0) {
    typingIndicator.classList.add("hidden");
    typingIndicator.innerHTML = "";
    return;
  }

  typingIndicator.classList.remove("hidden");

  // Show initials of those typing
  const usersTyping = [...typingUsers];

  if (usersTyping.length === 1) {
    typingIndicator.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <span class="inline-block h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center text-white shadow"
              style="background-color: ${stringToColor(usersTyping[0])}">
          ${usersTyping[0].split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
        </span>
        <span>${usersTyping[0]} is typing<span class="typing-dots"></span></span>
      </span>
    `;
  } else {
    typingIndicator.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <span>${usersTyping.length} people are typing</span>
        <span class="typing-dots"></span>
      </span>
    `;
  }
}




function onInput() {
  socket.emit("typing", { room, username, isTyping: true });

  // Stop typing if no input after 1.5s
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("typing", { room, username, isTyping: false });
  }, 1500);
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

// === Theme Toggle + Emoji Picker ===

// === Universal Theme Toggle ===

document.addEventListener("DOMContentLoaded", () => {
  const appBody = document.body;
  const chatArea = document.getElementById("chat");
  const chatScreen = document.getElementById("chatScreen");
  const loginScreen = document.getElementById("loginScreen");
  const themeButtons = document.querySelectorAll(".theme-toggle");
  const themeIcons = document.querySelectorAll(".theme-icon");

  let isDark = true;

  applyTheme(); // Initial theme setup

  themeButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      isDark = !isDark;
      applyTheme();
    })
  );

  function applyTheme() {
    const html = document.documentElement;

    if (isDark) {
      // --- Dark Mode ---
      // For message input bar in dark mode
      const msgInput = document.getElementById("msg");
      const messageBar = document.getElementById("messageBar");
messageBar.style.backgroundColor = "#111827"; // Tailwind gray-900
messageBar.style.borderTopColor = "#1f2937";  // Tailwind gray-800

      msgInput.style.backgroundColor = "#1f2937"; // dark gray
      msgInput.style.color = "white";
      msgInput.style.setProperty("--tw-placeholder-color", "#9ca3af"); // Tailwind gray-400
      msgInput.classList.remove("text-black");
      msgInput.classList.add("text-white");

      html.classList.add("dark");
      appBody.classList.add("bg-gray-900", "text-white");
      appBody.classList.remove("text-black");
      appBody.style.backgroundColor = "";

      chatArea?.classList.remove("bg-white");
      chatArea?.classList.add("bg-gray-950");

      chatScreen?.querySelectorAll("[style]").forEach(el => {
        el.style.removeProperty("background-color");
      });

      loginScreen?.style.setProperty("background", "linear-gradient(to right, #004e92, #000428)");

      // Only update login screen inputs — not #msg
      loginScreen?.querySelectorAll("#usernameInput, #roomInput, #roomPassword").forEach(input => {
        input.classList.remove("text-black");
        input.classList.add("text-white", "placeholder-gray-300");
        input.style.backgroundColor = "#1f2937";
        input.style.color = "white";
      });

      loginScreen?.querySelectorAll(".text-gray-600").forEach(el => {
        el.classList.remove("text-gray-600");
        el.classList.add("text-gray-300");
      });

      themeIcons.forEach(icon => icon.innerHTML = `
      <!-- Sun icon -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 
          6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 
          1.591M5.25 12H3m4.227-4.773L5.636 
          5.636M15.75 12a3.75 3.75 0 1 1-7.5 
          0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    `);
    } else {
      // --- Light Mode ---
      // For message input bar in light mode
      const msgInput = document.getElementById("msg");
      const messageBar = document.getElementById("messageBar");
messageBar.style.backgroundColor = "#ffffff"; // Light mode background
messageBar.style.borderTopColor = "#d1d5db";  // Tailwind gray-300

      msgInput.style.backgroundColor = "#f9fafb"; // light background
      msgInput.style.color = "black";
      msgInput.style.setProperty("--tw-placeholder-color", "#6b7280"); // Tailwind gray-500
      msgInput.classList.remove("text-white");
      msgInput.classList.add("text-black");

      html.classList.remove("dark");
      appBody.classList.remove("bg-gray-900", "text-white");
      appBody.classList.add("text-black");

      chatArea?.classList.remove("bg-gray-950");
      chatArea?.classList.add("bg-white");

      chatScreen?.querySelectorAll(".bg-gray-800").forEach(el => {
        el.classList.remove("bg-gray-800");
        el.style.backgroundColor = "#f0f0f0";
      });

      loginScreen?.style.setProperty("background", "linear-gradient(to right, rgb(210,210,210), rgb(70,221,255))");

      loginScreen?.querySelectorAll("#usernameInput, #roomInput, #roomPassword").forEach(input => {
        input.classList.remove("text-white", "placeholder-gray-300");
        input.classList.add("text-black");
        input.style.backgroundColor = "#f9fafb";
        input.style.color = "black";
      });

      loginScreen?.querySelectorAll(".text-gray-300, .text-gray-400").forEach(el => {
        el.classList.remove("text-gray-300", "text-gray-400");
        el.classList.add("text-gray-600");
      });

      themeIcons.forEach(icon => icon.innerHTML = `
      <!-- Moon icon -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21.752 15.002A9.72 9.72 0 0 1 18 
          15.75c-5.385 0-9.75-4.365-9.75-9.75 
          0-1.33.266-2.597.748-3.752A9.753 
          9.753 0 0 0 3 11.25C3 16.635 
          7.365 21 12.75 21a9.753 9.753 0 
          0 0 9.002-5.998Z" />
      </svg>
    `);
    }
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  const input = document.getElementById("msg");

  emojiBtn?.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
  });

  emojiPicker?.addEventListener("emoji-click", (event) => {
    input.value += event.detail.unicode;
    input.focus();
  });

  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
      emojiPicker.style.display = "none";
    }
  });
});

const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");

chatBox.addEventListener("scroll", () => {
  const atBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 10;
  scrollToBottomBtn.classList.toggle("hidden", atBottom);
});

scrollToBottomBtn?.addEventListener("click", () => {
  chatBox.scrollTop = chatBox.scrollHeight;
  scrollToBottomBtn.classList.add("hidden");
});


const fileInput = document.getElementById("fileInput");
const filePreviewContainer = document.getElementById("filePreviewContainer");
const filePreview = document.getElementById("filePreview");

// Handle file selection
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) {
    filePreviewContainer.classList.add("hidden");
    filePreview.innerHTML = "";
    return;
  }

  const isImage = file.type.startsWith("image/");
  filePreview.innerHTML = ""; // Clear previous preview

  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.innerHTML = `
        <img src="${e.target.result}" alt="preview" class="w-20 h-20 rounded object-cover border" />
        <div class="flex flex-col gap-1">
          <span class="font-medium">${file.name}</span>
          <button id="cancelPreview" class="text-red-400 text-xs hover:underline self-start">❌ Cancel</button>
        </div>
      `;
      filePreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    filePreview.innerHTML = `
      <div class="flex gap-2 items-center">
        📄 <span>${file.name}</span>
        <button id="cancelPreview" class="text-red-400 text-xs hover:underline">❌ Cancel</button>
      </div>
    `;
    filePreviewContainer.classList.remove("hidden");
  }
});

// Cancel preview
document.addEventListener("click", (e) => {
  if (e.target.id === "cancelPreview") {
    fileInput.value = "";
    filePreviewContainer.classList.add("hidden");
    filePreview.innerHTML = "";
  }
});

document.getElementById("msg").addEventListener("input", onInput);


document.getElementById("msg")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // prevent newline
    sendMessage();      // send message
  }
});


async function sendFile(file) {
  if (!aesKey || !file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const arrayBuffer = reader.result;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const payload = JSON.stringify({
      user: username,
      name: file.name,
      type: file.type,
      data: arrayBufferToBase64(arrayBuffer),
      time: new Date().toISOString(),
      isFile: true,
    });

    const encoded = new TextEncoder().encode(payload);
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);

    socket.emit("encrypted_message", {
      msg: base64Encode(iv) + ":" + base64Encode(ciphertext),
      room,
    });

    // Also show locally
    appendMessage(`\n• ${formatTimestamp(new Date().toISOString())}`, true, username, {
      name: file.name,
      type: file.type,
      data: arrayBufferToBase64(arrayBuffer),
    });
  };

  reader.readAsArrayBuffer(file);
}
