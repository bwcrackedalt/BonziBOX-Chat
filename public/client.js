const socket = io();

const loginScreen = document.getElementById("loginScreen");
const chatPage = document.getElementById("chatPage");

const usernameInput = document.getElementById("username");
const pfpInput = document.getElementById("pfp");

const joinButton = document.getElementById("join");

const chat = document.getElementById("chat");

const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

// Load saved login
usernameInput.value = localStorage.getItem("username") || "";
pfpInput.value = localStorage.getItem("pfp") || "";

function sayAPI4(texto, voz = "Sam", pitch = 100, speed = 150) {
    const urlBase = "https://tetyys.com/SAPI4/SAPI4";
    const url = `${urlBase}?text=${encodeURIComponent(texto)}&voice=${encodeURIComponent(voz)}&pitch=${pitch}&speed=${speed}`;
    
    const audio = new Audio(url);
    audio.play()
        .then(() => console.log("Playing voz retro..."))
        .catch(err => console.error("Error:", err));
}



function login() {

    const username = usernameInput.value.trim();

    if (!username) {
        socket.emit(
            'login', {
                name: ''
            }
        )
    }

    const pfp = pfpInput.value.trim();

    localStorage.setItem("username", username);
    localStorage.setItem("pfp", pfp);

    socket.emit("login", {
        name: username,
        pfp: pfp
    });

    loginScreen.style.display = "none";
    chatPage.style.display = "block";

    messageInput.focus();

}

joinButton.onclick = login;

usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});

pfpInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});

function send() {

    const text = messageInput.value.trim();

    if (!text) return;

    if (text.startsWith("/")) {

        const parts = text.substring(1).split(" ");

        socket.emit("command", {
            command: parts[0].toLowerCase(),
            args: parts.slice(1)
        });

    } else {

        socket.emit("say", {
            text: text
        });

    }

    messageInput.value = "";
}

sendButton.onclick = send;

messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
});

socket.on("message", data => {

    const message = document.createElement("div");
    message.className = "message";

    if (data.pfp) {

        const img = document.createElement("img");
        img.className = "pfp";
        img.src = data.pfp;
        img.onerror = () => img.remove();

        message.appendChild(img);

    }

    const content = document.createElement("div");
    content.className = "content";

    const name = document.createElement("div");
    name.className = "username";
    name.textContent = data.name || "Server";

    const text = document.createElement("div");
    text.className = "text";

    // Allow HTML only when explicitly sent
    if (data.html) {
        text.innerHTML = data.text;
    } else {
        text.textContent = data.text;
    }

    content.appendChild(name);
    content.appendChild(text);

    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    //sayAPI4(data.text, "Sam", 100, 150);

});

socket.on("clear", () => {
    chat.innerHTML = "";
});

socket.on("disconnect", () => {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = "<b>Disconnected from server.</b>";
    chat.appendChild(div);
});