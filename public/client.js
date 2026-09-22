document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("loaded");
});
const socket = io();

let myGUID = null;
let myName = null;
let myPFP = "";
let isAdmin = false;
let currentMedia = null;

const loginScreen = document.getElementById("loginScreen");
const chatPage = document.getElementById("chatPage");

const usernameInput = document.getElementById("username");
const pfpInput = document.getElementById("pfp");
const joinButton = document.getElementById("join");

const chat = document.getElementById("chat");
const users = document.getElementById("users");

const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

const byoutubePlayer = document.getElementById("byoutubePlayer");

// ==============================
// GUEST NAME
// ==============================

function generateGuestName() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return "Guest-" + result;
}

// ==============================
// SHOW CHAT
// ==============================

function showChat() {
    if (loginScreen) {
        setTimeout(()=>{
            
        loginScreen.style.display = "none";

        }, 1500);
        loginScreen.classList.add("joined");
    }

    if (chatPage) {
        chatPage.style.display = "flex";
        chatPage.classList.add("visible");
    }

    document.body.classList.add("logged-in");

    socket.emit("requestMedia");
}

// ==============================
// LOGIN
// ==============================

function login() {
    let name = usernameInput ? usernameInput.value.trim() : "";

    // Empty username = guest
    if (!name) {
        name = generateGuestName();
    }

    myName = name;

    if (pfpInput) {
        myPFP = pfpInput.value.trim();
    }

    localStorage.setItem("chat_username", myName);

    if (myPFP) {
        localStorage.setItem("chat_pfp", myPFP);
    }

    console.log("Logging in as:", myName);

    socket.emit("login", {
        name: myName,
        pfp: myPFP,
    });
}

// ==============================
// LOGIN BUTTON
// ==============================

if (joinButton) {
    joinButton.addEventListener("click", function (event) {
        event.preventDefault();
        login();
    });
}

// Enter key
if (usernameInput) {
    usernameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            login();
        }
    });
}

// ==============================
// SAVED USERNAME
// ==============================

const savedName = localStorage.getItem("chat_username");
const savedPFP = localStorage.getItem("chat_pfp");

if (savedName && usernameInput) {
    usernameInput.value = savedName;
}

if (savedPFP && pfpInput) {
    pfpInput.value = savedPFP;
}

// ==============================
// SOCKET CONNECT
// ==============================

socket.on("connect", () => {
    myGUID = socket.id;

    console.log("Connected:", socket.id);
});

// ==============================
// LOGIN SUCCESS
// ==============================

// Support loginSuccess
socket.on("loginSuccess", function (data) {
    console.log("Login successful:", data);

    if (data) {
        myGUID = data.guid || socket.id;
        myName = data.name || myName;
        isAdmin = !!data.admin;
    }

    showChat();
});

// Support loggedIn
socket.on("loggedIn", function (data) {
    console.log("Logged in:", data);

    if (data) {
        myGUID = data.guid || socket.id;
        myName = data.name || myName;
        isAdmin = !!data.admin;
    }

    showChat();
});

// Support a simple "login" response
socket.on("login", function (data) {
    console.log("Login response:", data);

    if (data && data.success === false) {
        return;
    }

    if (data) {
        myGUID = data.guid || socket.id;
        myName = data.name || myName;
        isAdmin = !!data.admin;
    }

    showChat();
});

// ==============================
// LOGIN ERROR
// ==============================

socket.on("loginError", function (data) {
    alert(data && data.message ? data.message : "Unable to log in.");
});

// ==============================
// MESSAGES
// ==============================

function addSystemMessage(text) {
    if (!chat) return;

    const div = document.createElement("div");

    div.className = "message system-message";
    div.textContent = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function addMessage(data) {
    if (!chat) return;

    const wrapper = document.createElement("div");
    wrapper.className = "message";

    if (data.pfp) {
        const image = document.createElement("img");

        image.className = "pfp";
        image.src = data.pfp;
        image.alt = data.name + "'s PFP";

        image.onerror = function () {
            image.remove();
        };

        wrapper.appendChild(image);
    }

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("span");
    name.className = "message-name";
    name.textContent = data.name || "Unknown";

    const line = document.createElement("br");
    
    const text = document.createElement("span");
    text.className = "message-text";
    text.textContent = data.text || "";

    content.appendChild(name);
    content.appendChild(line);
    content.appendChild(text);

    wrapper.appendChild(content);

    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;
    speak(data.text, {
        amplitude: 100,
        pitch: 50,
        speed: 175,
        voice: "en/en-us",
    });
}

socket.on("message", addMessage);
socket.on("say", addMessage);

socket.on("system", function (data) {
    addSystemMessage(
        data && (data.text || data.message) ? data.text || data.message : "",
    );
});

// ==============================
// SEND MESSAGE
// ==============================

function sendMessage() {
    if (!messageInput) return;

    const text = messageInput.value.trim();

    if (!text) return;

    if (text.startsWith("/")) {
        const parts = text.substring(1).trim().split(/\s+/);

        const commandName = parts.shift().toLowerCase();

        socket.emit("command", {
            command: commandName,
            args: parts,
        });
    } else {
        socket.emit("say", {
            text: text,
        });
    }

    messageInput.value = "";
    messageInput.focus();
}

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

if (messageInput) {
    messageInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}

// ==============================
// USERS
// ==============================

function renderUsers(userList) {
    if (!users) return;

    users.innerHTML = "";

    if (!Array.isArray(userList)) return;

    userList.forEach(function (user) {
        const element = document.createElement("div");

        element.className = "user";

        element.dataset.guid = user.guid || "";
        element.dataset.name = user.name || "Unknown";

        if (user.pfp) {
            const image = document.createElement("img");

            image.className = "user-pfp";
            image.src = user.pfp;
            image.alt = "";

            image.onerror = function () {
                image.remove();
            };

            element.appendChild(image);
        }

        const name = document.createElement("span");

        name.className = "user-name";
        name.textContent = user.name || "Unknown";

        element.appendChild(name);

        if (user.admin) {
            const admin = document.createElement("span");

            admin.className = "admin-tag";
            admin.innerHTML = " <glow>ADMIN</glow>";

            element.appendChild(admin);
        }

        users.appendChild(element);
    });
}

socket.on("users", renderUsers);
socket.on("userList", renderUsers);

// ==============================
// ADMIN
// ==============================

socket.on("admin", function (data) {
    isAdmin = !!data;
});

// ==============================
// KICK
// ==============================

socket.on("kicked", function (data) {
    alert(data && data.reason ? data.reason : "You were kicked.");

    location.reload();
});

// ==============================
// BAN
// ==============================

socket.on("banned", function (data) {
    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (chatPage) {
        chatPage.style.display = "none";
    }

    let banScreen = document.getElementById("banScreen");

    if (!banScreen) {
        banScreen = document.createElement("div");

        banScreen.id = "banScreen";

        banScreen.innerHTML = `
            <div class="ban-box">
                <h1>You are banned</h1>
                <p id="banReason"></p>
            </div>
        `;

        document.body.appendChild(banScreen);
    }

    const reason = document.getElementById("banReason");

    if (reason) {
        reason.textContent =
            data && data.minutes
                ? "Ban length: " + data.minutes + " minutes."
                : "You cannot join this chat.";
    }

    banScreen.style.display = "flex";
});

// ==============================
// BYOUTUBE
// ==============================

function showByoutube(data) {
    if (!byoutubePlayer) return;

    currentMedia = data;

    byoutubePlayer.innerHTML = "";

    if (!data) return;

    // YouTube
    if (data.type === "youtube") {
        const iframe = document.createElement("iframe");

        iframe.src =
            "https://www.youtube.com/embed/" +
            encodeURIComponent(data.value) +
            "?autoplay=1&mute=1&controls=0";

        iframe.allow = "autoplay; encrypted-media; picture-in-picture";

        iframe.allowFullscreen = true;

        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";

        byoutubePlayer.appendChild(iframe);

        return;
    }

    // Direct media
    if (data.type === "media") {
        const url = data.value.toLowerCase();

        if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(url)) {
            const audio = document.createElement("audio");

            audio.src = data.value;
            audio.controls = true;
            audio.autoplay = true;

            audio.style.width = "100%";

            byoutubePlayer.appendChild(audio);

            return;
        }

        const video = document.createElement("video");

        video.src = data.value;
        video.controls = false;
        video.autoplay = true;
        video.playsInline = true;

        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "contain";

        byoutubePlayer.appendChild(video);
    }
}

socket.on("byoutube", function (data) {
    showByoutube(data);
});

socket.on("currentMedia", function (data) {
    showByoutube(data);
});

socket.on("byoutubeClear", function () {
    currentMedia = null;

    if (byoutubePlayer) {
        byoutubePlayer.innerHTML = "";
    }
});

// ==============================
// CURRENT MEDIA
// ==============================

socket.on("connect", function () {
    socket.emit("requestMedia");
});

// ==============================
// HELPERS
// ==============================

function say(text) {
    socket.emit("say", {
        text: text,
    });
}

function command(commandName, ...args) {
    socket.emit("command", {
        command: commandName,
        args: args,
    });
}

function byoutube(url) {
    socket.emit("command", {
        command: "byoutube",
        args: [url],
    });
}

// ==============================
// DEBUG
// ==============================

console.log("client.js loaded");
