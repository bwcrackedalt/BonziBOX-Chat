const socket = io();

let isAdmin = false;

// ==========================================
// ELEMENTS
// ==========================================

const loginScreen = document.getElementById("loginScreen");
const chatPage = document.getElementById("chatPage");

const usernameInput = document.getElementById("username");
const pfpInput = document.getElementById("pfp");
const joinButton = document.getElementById("join");

const chat = document.getElementById("chat");
const users = document.getElementById("users");

const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

// ==========================================
// SAVED LOGIN
// ==========================================

usernameInput.value = localStorage.getItem("username") || "";
pfpInput.value = localStorage.getItem("pfp") || "";


// ==========================================
// LOGIN
// ==========================================

function login() {
    const name = usernameInput.value.trim();

    if (!name) {
        alert("Please enter a username.");
        return;
    }

    const pfp = pfpInput.value.trim();

    localStorage.setItem("username", name);
    localStorage.setItem("pfp", pfp);

    socket.emit("login", {
        name: name,
        pfp: pfp
    });

    loginScreen.style.display = "none";
    chatPage.style.display = "block";

    messageInput.focus();
}

joinButton.addEventListener("click", login);

usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});

pfpInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});


// ==========================================
// SEND MESSAGE
// ==========================================

function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) return;

    if (text.startsWith("/")) {
        const parts = text.slice(1).split(/\s+/);
        const command = parts.shift();

        socket.emit("command", {
            command: command.toLowerCase(),
            args: parts
        });
    } else {
        socket.emit("say", {
            text: text
        });
    }

    messageInput.value = "";
}

sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        sendMessage();
    }
});


// ==========================================
// CHAT MESSAGES
// ==========================================

socket.on("message", data => {
    const message = document.createElement("div");
    message.className = "message";

    if (data.pfp) {
        const img = document.createElement("img");

        img.className = "pfp";
        img.src = data.pfp;

        img.onerror = () => {
            img.remove();
        };

        message.appendChild(img);
    }

    const content = document.createElement("div");
    content.className = "content";

    const username = document.createElement("div");
    username.className = "username";
    username.textContent = data.name || "Server";

    const text = document.createElement("div");
    text.className = "text";

    if (data.html) {
        text.innerHTML = data.text;
    } else {
        text.textContent = data.text;
    }

    content.appendChild(username);
    content.appendChild(text);

    message.appendChild(content);

    chat.appendChild(message);
const audioContainer =
            document.getElementById(
                "audio"
            );
 
        if (audioContainer) {
            audioContainer.innerHTML = "";
        }
    chat.scrollTop = chat.scrollHeight;
    speak(data.text,{
                amplitude: 100,
                pitch: 50,
                speed: 175,
                voice: "en/en-us"
    });
});


// ==========================================
// USER LIST
// ==========================================

socket.on("users", userList => {
    users.innerHTML = "";

    userList.forEach(user => {
        const userElement = document.createElement("div");

        userElement.className = "user";
        userElement.dataset.guid = user.guid;

        if (user.pfp) {
            const img = document.createElement("img");

            img.className = "userPfp";
            img.src = user.pfp;

            img.onerror = () => {
                img.remove();
            };

            userElement.appendChild(img);
        }

        const name = document.createElement("span");

        name.className = "userName";
        name.textContent = user.name;

        userElement.appendChild(name);
        users.appendChild(userElement);
    });

    setupContextMenu();
});


// ==========================================
// ADMIN STATUS
// ==========================================

socket.on("admin", value => {
    isAdmin = value === true;

    setupContextMenu();
});


// ==========================================
// JQUERY CONTEXT MENU
// ==========================================

function setupContextMenu() {
    if (typeof $.contextMenu !== "function") {
        console.warn("jQuery ContextMenu is not loaded.");
        return;
    }

    try {
        $.contextMenu("destroy", ".user");
    } catch (e) {}

    const items = {
        hello: {
            name: "Hello",

            callback: function() {
                const guid = $(this).data("guid");

                socket.emit("command", {
                    command: "hello",
                    args: [guid]
                });
            }
        },
        asshole: {
            name: "Call an asshole",

            callback: function() {
                const guid = $(this).data("guid");

                socket.emit("command", {
                    command: "asshole",
                    args: [guid]
                });
            }
        },
        yourself: {
            name: "Actions yourself",

            items: {
img: {
name: "Send an image",
 callback: function() {

    socket.emit("command", {
        command: "img",
        args: [prompt(`what do you want to post lol (use an url, if you use "content://media/external/images/<FUCKING IMAGE NUMBER> (e.g ${Math.floor(Math.random()*100000000)})" it wont work, use an catbox, file garden or etc url`)],
    });
    }
    },
            }
        },
    };

    if (isAdmin) {
        items.fun = {
            name: "Fun (Admin)",
            items: {
                forcemessage: {
                    name: `Believable forcemessage`,
                    callback: function() {
                        const guid = $(this).data("guid");
                        socket.emit("command", {
                            command: "forcemessage",
                            args: [guid, prompt("what do you want this nophono to say lmao")],
                        });
                    }
                },
            },
        };
        items.admintab = {
            name: "Admin",
            items: {
            kick: {
            name: "Kick",

            callback: function() {
                const guid = $(this).data("guid");

                socket.emit("command", {
                    command: "kick",
                    args: [guid]
                });
            }
        },

           ban: {
            name: "Ban",

            callback: function() {
                const guid = $(this).data("guid");

                const minutes = prompt(
                    "Ban length in minutes:"
                );

                if (!minutes) return;

                const amount = Number(minutes);

                if (!Number.isFinite(amount) || amount <= 0) {
                    alert("Invalid ban length.");
                    return;
                }

                socket.emit("command", {
                    command: "ban",
                    args: [
                        guid,
                        String(amount)
                    ]
                });
            }
        },
    }};
    }

    $.contextMenu({
        selector: ".user",

        trigger: "left",

        items: items
    });
}


// ==========================================
// BAN SCREEN
// ==========================================

socket.on("banned", data => {
    loginScreen.style.display = "none";
    chatPage.style.display = "none";

    const oldScreen =
        document.getElementById("banScreen");

    if (oldScreen) oldScreen.remove();

    const banScreen =
        document.createElement("div");

    banScreen.id = "banScreen";

    banScreen.innerHTML = `
        <div class="banBox">
            <h1>You got banned!</h1>
            <br> When is it over? <p id="banTime"></p>
        </div>
    `;

    document.body.appendChild(banScreen);

    const banTime =
        document.getElementById("banTime");

    function updateBanTime() {
        const remaining =
            Math.max(
                0,
                data.expires - Date.now()
            );

        if (remaining <= 0) {
            banTime.textContent =
                "Ban expired! Reload the page.";

            clearInterval(timer);
            return;
        }

        const seconds =
            Math.ceil(remaining / 1000);

        const minutes =
            Math.floor(seconds / 60);

        const secs =
            seconds % 60;

        banTime.textContent =
            `Time remaining: ${minutes}m ${secs}s`;
    }

    updateBanTime();

    const timer =
        setInterval(updateBanTime, 1000);
});


// ==========================================
// KICK SCREEN
// ==========================================

socket.on("kicked", () => {
    loginScreen.style.display = "none";
    chatPage.style.display = "none";

    const oldScreen =
        document.getElementById("kickScreen");

    if (oldScreen) oldScreen.remove();

    const kickScreen =
        document.createElement("div");

    kickScreen.id = "kickScreen";

    kickScreen.innerHTML = `
        <div class="kickBox">
            <h1>You were kicked!</h1>
            <p>You have been removed from the chat.</p>

            <button onclick="location.reload()">
                Reload
            </button>
        </div>
    `;

    document.body.appendChild(kickScreen);
});


// ==========================================
// CLEAR CHAT
// ==========================================

socket.on("clear", () => {
    chat.innerHTML = "";
});


// ==========================================
// DISCONNECT
// ==========================================

socket.on("disconnect", () => {
    const message =
        document.createElement("div");

    message.className = "message";

    message.innerHTML =
        "<b>Disconnected from server.</b>";

    chat.appendChild(message);
});