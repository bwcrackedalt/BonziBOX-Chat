const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // index.html + client.js

io.on("connection", socket => {

    socket.name = "Guest";
    socket.pfp = "";

    socket.on("login", data => {

        socket.name = (data.name || "Guest").trim();
        socket.pfp = data.pfp || "";

        socket.emit("message", {
            name: "Server",
            text: "Welcome, " + socket.name + "!"
        });

        socket.broadcast.emit("message", {
            name: "Server",
            text: socket.name + " joined the chat."
        });

    });

    socket.on("say", data => {

        if (!data.text) return;

        io.emit("message", {
            name: socket.name,
            text: data.text,
            pfp: socket.pfp
        });

    });

    socket.on("command", data => {

        const cmd = (data.command || "").toLowerCase();
        const args = data.args || [];

        switch (cmd) {

            case "hello":

                socket.emit("message", {
                    name: "Server",
                    text: "Hello, " + (args.length ? args.join(" ") : socket.name) + "!"
                });

                break;

            case "name":

                if (!args.length) {
                    socket.emit("message", {
                        name: "Server",
                        text: "Usage: /name <new name>"
                    });
                    return;
                }

                const old = socket.name;
                socket.name = args.join(" ");

                io.emit("message", {
                    name: "Server",
                    text: old + " is now known as " + socket.name + "."
                });

                break;

            case "img":

                if (!args.length) return;

                io.emit("message", {
                    name: socket.name,
                    pfp: socket.pfp,
                    html: true,
                    text: `<img src="${args[0]}" style="max-width:300px;border-radius:6px;">`
                });

                break;

            case "me":

                if (!args.length) return;

                io.emit("message", {
                    name: "*",
                    text: socket.name + " " + args.join(" "),
                    pfp: socket.pfp
                });

                break;

            case "clear":

                socket.emit("clear");

                break;

            case "joke":
                const jokes = [
                    
                ];
                    break;

            default:

                socket.emit("message", {
                    name: "Server",
                    text: 'Unknown command: "' + cmd + '"'
                });

        }

    });

    socket.on("disconnect", () => {

        io.emit("message", {
            name: "Server",
            text: socket.name + " left the chat."
        });

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});