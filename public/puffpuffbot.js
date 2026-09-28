function setupBot() {
const socket = io();
const prefix = "$";
function sendMsg(msg) {
socket.emit('say', {text: msg});
}
const commands = [
{n: "help", d: "Help."},
{n: "say", d: "Make me say something."},
{n: "hate", d: "I hate [X]."},
{n: "sprunki", d: "Sprunki is the worst mod!"},
    {n: "wtf", d: "Embarass."},
    {n: "img", d: "Post an image."},
    ];
    const imgblacklist = [
        {n: "https://files.catbox.moe/t0c4ql.jpg", d: "It appears to be an numberblocks inflation image of 39."},
        {
            n: "https://files.catbox.moe/ysszbq.jpg",
            d: "Inflation shit."
        },
    ];
const cmdhints = [];
socket.emit('login', {name: "puffpuff_  |  $help", pfp: "https://files.catbox.moe/a0p1nm.png"});
socket.on("message", message => {
if (message.text.startsWith(prefix + "help")) {
commands.forEach((com) => {
cmdhints.push(`\$${com.n} - ${com.d}`);
});
sendMsg( 'commands: ' + cmdhints.join('  |  ') );
}
if (message.text.startsWith(prefix + "say")) {
const args = message.text.split(" ");
const arg = message.text.substring(prefix.length + args[0].length).trim();
sendMsg(arg);
}
if (message.text.startsWith(prefix + "hate")) {
const args = message.text.split(" ");
const arg = message.text.substring(prefix.length + args[0].length).trim();
sendMsg('I hate ' + arg + '.');
}
    if (message.text.startsWith(prefix + "img")) {
const args = message.text.split(" ");
const arg = message.text.substring(prefix.length + args[0].length).trim();
        const blacklist = arg;
        const blacklistedItems = imgblacklist.filter(item => 
  item.n.includes(blacklist) || item.d.includes(blacklist)
);
            blacklistedItems.forEach(({ n, d }) => {// Check if either 'n' or 'd' contains the blacklist string
  if (n.includes(blacklist) || d.includes(blacklist)) {
    sendMsg(`❌️ Your image is blacklisted due to - ${d}`);
  } else {
      sendMsg(`✅️ Image is not on blacklist. Posting...`);
      cmd(`img ${n}`)
  }
});
                                     }
    if (message.text.startsWith(prefix + "wtf")) {
        const phrases = [
            ""
        ];
        sendMsg(phrases[Math.floor(Math.random()*phrases.length)]);
    }
if (message.text.startsWith(prefix + "sprunki")) {
const text = 
`Sprunki is the worst mod!
It's too toxic and faggoted.
Get a life when you fucking love sprunki.
What are you expecting? For me to return to sprunki community?
NO.
SPRUNKI SUCKS.
YOU FUCKING IDIOT.
WILL SPRUNKI BE THE BEST?
FUCK NO.
GET.
A..
FUCKING...
LIIIIIIIIIIIIFEEEEEEEEE!!!!!!!!!!!!!!
I'm sorry. I'm calming down.`


// Splits safely on both Windows (\r\n) and UNIX/Linux (\n) line breaks
const bosniaLines = text.split(/\r?\n/);

let i = 0;

const interval = setInterval(() => {
    if (i >= bosniaLines.length) {
        clearInterval(interval);
        return;
    }

    socket.emit("say", {
        text: bosniaLines[i]
    });

    i++;
}, 3000);
}
});
}
for (let i = 0; i < 1; i++) {
setupBot();
}