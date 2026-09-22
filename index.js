const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


// ======================================================
// STATIC FRONTEND
// ======================================================

app.use(express.static("public"));


// ======================================================
// SETTINGS
// ======================================================

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "fuckyouwho";


// ======================================================
// RANDOM DEFAULT PFPS
// ======================================================

const defaultPfps = [
    "https://files.catbox.moe/gen4ga.png",
    "https://files.catbox.moe/0tu0sw.png",
    "https://files.catbox.moe/u4e529.png",
    "https://files.catbox.moe/o0ohwh.png",
    "https://files.catbox.moe/xcux31.png",
    "https://files.catbox.moe/mvutwk.png",
    "https://files.catbox.moe/asec78.png",
    "https://files.catbox.moe/70mtow.png",
    "https://files.catbox.moe/tnprsn.png",
    "https://files.catbox.moe/nmyye1.png"
];


// ======================================================
// USERS
// ======================================================

const users = new Map();


// ======================================================
// BANS
// ======================================================

const bans = new Map();


// ======================================================
// CURRENT BYOUTUBE MEDIA
// ======================================================

let currentMedia = null;


// ======================================================
// RANDOM GUEST NAME
// ======================================================

function generateGuestName(socket) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    let random = "";

    for (let i = 0; i < 6; i++) {
        random += chars[Math.floor(Math.random() * chars.length)];
    }

    return "Guest-" + random;
}


// ======================================================
// RANDOM PFP
// ======================================================

function getRandomPFP() {
    return defaultPfps[
        Math.floor(Math.random() * defaultPfps.length)
    ];
}


// ======================================================
// GET USER
// ======================================================

function getUser(socket) {
    return users.get(socket.id);
}


// ======================================================
// SEND USER LIST
// ======================================================

function sendUserList() {
    const list = Array.from(users.values()).map(user => ({
        guid: user.guid,
        name: user.name,
        pfp: user.pfp,
        admin: user.admin
    }));

    io.emit("users", list);
}


// ======================================================
// SYSTEM MESSAGE
// ======================================================

function systemMessage(socket, text) {
    socket.emit("system", {
        text: text
    });
}


// ======================================================
// BROADCAST SYSTEM MESSAGE
// ======================================================

function broadcastSystem(text) {
    io.emit("system", {
        text: text
    });
}


// ======================================================
// YOUTUBE ID PARSER
// ======================================================

function getYouTubeID(input) {
    if (!input) {
        return null;
    }

    input = input.trim();

    // YouTube embed URL
    let match = input.match(
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    );

    if (match) {
        return match[1];
    }

    // YouTube watch URL
    match = input.match(
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    );

    if (match) {
        return match[1];
    }

    // youtu.be URL
    match = input.match(
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
    );

    if (match) {
        return match[1];
    }

    // Direct YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    return null;
}


// ======================================================
// BYOUTUBE PARSER
// ======================================================

function parseByoutube(input) {
    if (!input) {
        return null;
    }

    input = input.trim();

    // YouTube
    const youtubeID = getYouTubeID(input);

    if (youtubeID) {
        return {
            type: "youtube",
            value: youtubeID
        };
    }

    // Direct media URL
    if (/^https?:\/\//i.test(input)) {
        return {
            type: "media",
            value: input
        };
    }

    return null;
}


// ======================================================
// SOCKET.IO
// ======================================================

io.on("connection", (socket) => {

    console.log("CONNECTED:", socket.id);


    // ==================================================
    // LOGIN
    // ==================================================

    socket.on("login", (data) => {

        data = data || {};

        let name = "";

        if (typeof data.name === "string") {
            name = data.name.trim();
        }

        // Empty username = guest
        if (!name) {
            name = generateGuestName(socket);
        }

        // Limit username length
        name = name.slice(0, 32);


        // Check existing ban by socket ID
        const existingBan = bans.get(socket.id);

        if (existingBan) {

            if (existingBan.until > Date.now()) {

                socket.emit("banned", {
                    minutes: Math.ceil(
                        (existingBan.until - Date.now()) / 60000
                    )
                });

                return;
            }

            bans.delete(socket.id);
        }


        // User-selected PFP or random PFP
        let pfp = "";

        if (
            typeof data.pfp === "string" &&
            data.pfp.trim()
        ) {
            pfp = data.pfp.trim();
        } else {
            pfp = getRandomPFP();
        }


        const user = {
            guid: socket.id,
            name: name,
            pfp: pfp,
            admin: false,
            loggedIn: true
        };


        users.set(socket.id, user);


        console.log(
            "LOGIN:",
            name,
            socket.id,
            pfp
        );


        // IMPORTANT:
        // This is what makes the client hide
        // the login screen.
        socket.emit("loginSuccess", {
            success: true,
            guid: socket.id,
            name: name,
            pfp: pfp,
            admin: false
        });


        // Send current users
        sendUserList();


        // Tell everyone someone joined
        broadcastSystem(
            name + " joined the chat."
        );


        // Send current Byoutube media
        if (currentMedia) {
            socket.emit("byoutube", currentMedia);
        }
    });


    // ==================================================
    // CHAT MESSAGE
    // ==================================================

    socket.on("say", (data) => {

        const user = getUser(socket);

        if (!user) {
            return;
        }

        if (!data) {
            return;
        }

        let text = "";

        if (typeof data.text === "string") {
            text = data.text.trim();
        }

        if (!text) {
            return;
        }

        // Limit message size
        text = text.slice(0, 2000);


        io.emit("say", {
            guid: user.guid,
            name: user.name,
            pfp: user.pfp,
            text: text
        });
    });


    // ==================================================
    // COMMANDS
    // ==================================================

    socket.on("command", (data) => {

        const user = getUser(socket);

        if (!user) {
            return;
        }

        if (!data) {
            return;
        }

        const command = String(
            data.command || ""
        ).toLowerCase().trim();

        const args = Array.isArray(data.args)
            ? data.args
            : [];


        console.log(
            "COMMAND:",
            user.name,
            command,
            args
        );


        // ==============================================
        // /hello
        // ==============================================

        if (command === "hello") {

            const target = args.join(" ").trim();

            const helloName =
                target || user.name;

            io.emit("say", {
                guid: "system",
                name: "Server",
                pfp: "",
                text: "Hello, " + helloName + "!"
            });

            return;
        }


        // ==============================================
        // /name
        // ==============================================

        if (command === "name") {

            const newName = args.join(" ").trim();

            if (!newName) {
                systemMessage(
                    socket,
                    "Usage: /name <new name>"
                );

                return;
            }

            user.name = newName.slice(0, 32);

            socket.emit("say", {
                guid: "system",
                name: "Server",
                pfp: "",
                text: "Your name is now " + user.name
            });

            sendUserList();

            return;
        }


        // ==============================================
        // /img
        // ==============================================

        if (command === "img") {

            const newPFP = args.join(" ").trim();

            if (!newPFP) {
                systemMessage(
                    socket,
                    "Usage: /img <image URL>"
                );

                return;
            }

            if (!/^https?:\/\//i.test(newPFP)) {
                systemMessage(
                    socket,
                    "PFP must be an image URL."
                );

                return;
            }

            user.pfp = newPFP;

            socket.emit("say", {
                guid: "system",
                name: "Server",
                pfp: "",
                text: "Your profile picture was changed."
            });

            sendUserList();

            return;
        }


        // ==============================================
        // /me
        // ==============================================

        if (command === "me") {

            const text = args.join(" ").trim();

            if (!text) {
                return;
            }

            io.emit("say", {
                guid: user.guid,
                name: user.name,
                pfp: user.pfp,
                text: "* " + user.name + " " + text
            });

            return;
        }


        // ==============================================
        // /clear
        // ==============================================

        if (command === "clear") {

            if (!user.admin) {
                systemMessage(
                    socket,
                    "You must be an admin."
                );

                return;
            }

            io.emit("clearChat");

            return;
        }


        // ==============================================
        // /admin
        // ==============================================

        if (command === "admin") {

            const password = args.join(" ");

            if (password !== ADMIN_PASSWORD) {

                systemMessage(
                    socket,
                    "Incorrect admin password."
                );

                return;
            }

            user.admin = true;

            socket.emit("admin", true);

            socket.emit("loginSuccess", {
                success: true,
                guid: socket.id,
                name: user.name,
                pfp: user.pfp,
                admin: true
            });

            sendUserList();

            systemMessage(
                socket,
                "You are now an admin."
            );

            console.log(
                "ADMIN LOGIN:",
                user.name,
                socket.id
            );

            return;
        }


        // ==============================================
        // /byoutube
        // ==============================================

        if (command === "byoutube") {

            if (!user.admin) {
                systemMessage(
                    socket,
                    "You must be an admin to use /byoutube."
                );

                return;
            }

            const input = args.join(" ").trim();

            if (!input) {
                systemMessage(
                    socket,
                    "Usage: /byoutube <media URL or YouTube URL>"
                );

                return;
            }

            const media = parseByoutube(input);

            if (!media) {
                systemMessage(
                    socket,
                    "Invalid media URL or YouTube URL."
                );

                return;
            }

            currentMedia = {
                type: media.type,
                value: media.value,
                startedAt: Date.now(),
                position: 0,
                paused: false
            };


            console.log(
                "BYOUTUBE:",
                currentMedia
            );


            io.emit(
                "byoutube",
                currentMedia
            );

            return;
        }


        // ==============================================
        // /stopbyoutube
        // ==============================================

        if (command === "stopbyoutube") {

            if (!user.admin) {
                systemMessage(
                    socket,
                    "You must be an admin."
                );

                return;
            }

            currentMedia = null;

            io.emit("byoutubeClear");

            return;
        }


        // ==============================================
        // /kick
        // ==============================================

        if (command === "kick") {

            if (!user.admin) {
                systemMessage(
                    socket,
                    "You must be an admin."
                );

                return;
            }

            const guid = args[0];

            if (!guid) {
                systemMessage(
                    socket,
                    "Usage: /kick <guid>"
                );

                return;
            }

            const targetSocket = io.sockets.sockets.get(guid);

            if (!targetSocket) {
                systemMessage(
                    socket,
                    "User not found."
                );

                return;
            }

            const targetUser = users.get(guid);

            targetSocket.emit("kicked", {
                reason: "You were kicked by an admin."
            });

            targetSocket.disconnect(true);

            if (targetUser) {
                broadcastSystem(
                    targetUser.name + " was kicked."
                );
            }

            return;
        }


        // ==============================================
        // /ban
        // ==============================================

        if (command === "ban") {

            if (!user.admin) {
                systemMessage(
                    socket,
                    "You must be an admin."
                );

                return;
            }

            const guid = args[0];
            const minutes = Number(args[1]);


            if (!guid || !Number.isFinite(minutes)) {
                systemMessage(
                    socket,
                    "Usage: /ban <guid> <minutes>"
                );

                return;
            }


            if (minutes <= 0) {
                systemMessage(
                    socket,
                    "Ban length must be greater than 0."
                );

                return;
            }


            const targetSocket =
                io.sockets.sockets.get(guid);


            if (!targetSocket) {
                systemMessage(
                    socket,
                    "User not found."
                );

                return;
            }


            const targetUser =
                users.get(guid);


            const until =
                Date.now() +
                minutes * 60 * 1000;


            bans.set(guid, {
                until: until
            });


            targetSocket.emit("banned", {
                minutes: minutes
            });


            if (targetUser) {
                broadcastSystem(
                    targetUser.name +
                    " was banned for " +
                    minutes +
                    " minutes."
                );
            }


            targetSocket.disconnect(true);

            return;
        }


        // ==============================================
        // UNKNOWN COMMAND
        // ==============================================

        systemMessage(
            socket,
            "Unknown command: /" + command
        );
    });


    // ==================================================
    // REQUEST CURRENT BYOUTUBE
    // ==================================================

    socket.on("requestMedia", () => {

        if (currentMedia) {
            socket.emit(
                "byoutube",
                currentMedia
            );
        }
    });


    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on("disconnect", () => {

        const user = users.get(socket.id);

        if (user) {

            console.log(
                "DISCONNECTED:",
                user.name,
                socket.id
            );

            users.delete(socket.id);

            broadcastSystem(
                user.name + " left the chat."
            );

            sendUserList();
        }
    });
});


// ======================================================
// MEDIA TIME BROADCAST
// ======================================================

setInterval(() => {

    if (!currentMedia) {
        return;
    }

    let position =
        currentMedia.position || 0;


    if (!currentMedia.paused) {
        position =
            (Date.now() - currentMedia.startedAt) / 1000;
    }


    io.emit("mediaTime", {
        position: position
    });

}, 1000);


// ======================================================
// CLEAN EXPIRED BANS
// ======================================================

setInterval(() => {

    const now = Date.now();

    for (const [guid, ban] of bans.entries()) {

        if (ban.until <= now) {
            bans.delete(guid);
        }
    }

}, 10000);


// ======================================================
// START SERVER
// ======================================================

server.listen(PORT, () => {

    console.log(
        "Server running on port " + PORT
    );

});