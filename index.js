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

                io.emit("message", {
                    name: socket.name,
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
                    "What do you hear when you get earpods from the factory? Hard metal.",
                    "Why do we call money bread? Because we KNEAD it. Haha please send money to my PayPal at nigerianprince99@bonzi.com", 
                    "What do bugs need to make the cake? \"Butter\"flies.",
                    "A noodle among us, impasta!",
                    "What is in the middle of paris? A giant inflatable buttplug. Don't judge me on my sense of humor alone.",
                    "Who earns a living by driving his customers away? Nintendo.",
                    "How many letters are in \"the alphabet\"? 11. See? T-H-E-A-L-P-H-A-B-E-T.",
                    "What is the longest word? Smile. See? Because there's a mile. Nah it's pneumonoultramicroscopicsilicovolcanoconiosis.",
                    "How do penguins build their houses? Igloo.",
                    "Value of bonzi.",
                ];
                io.emit("message", {name: socket.name, text: jokes[Math.floor(Math.random()*jokes.length)]});
                    break;

            case "fact": 
                const facts = [
                    "Did you know that uranus is 31,518 miles in diameter?",
                    "Did you know that alcyoneus is the largest galaxy in the universe?",
                    "Did you know that James E. webb died from a heart attack?",
                    "Did you know that the milky way is ~100K light years?",
                    "Did you know that an eclipse without glasses makes you blind?",
                    "Did you know that BWI is disbanded?",
                ];
                                io.emit("message", {name: socket.name, text: facts[Math.floor(Math.random()*facts.length)]});
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