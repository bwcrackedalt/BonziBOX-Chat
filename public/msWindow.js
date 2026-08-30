//Based!
//remind me this is stupidly vibecoded on may-june 2026
var idcounter = 0;

function movestart(mouse, win) {
    let offset = {
        x: mouse.clientX - win.x,
        y: mouse.clientY - win.y
    };

    function move(e) {
        let ev = e.touches ? e.touches[0] : e;
        win.x = ev.clientX - offset.x;
        win.y = ev.clientY - offset.y;
        win.update();
    }

    function stop() {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", stop);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", stop);
}

class msWindow {
    constructor(title, html, x, y, width, height, buttons) {
        this.x = x || 100;
        this.y = y || 100;
        this.w = width || 300;
        this.h = height || 200;
        this.id = "msw_" + idcounter++;
        
        let btnHtml = "";
        if (!buttons) buttons = [{ name: "OK" }];
        buttons.forEach((btn, i) => {
            btnHtml += `<button id="${this.id}_btn_${i}" class="msBtn" style="margin-left: 10px; padding: 6px 16px; cursor: pointer; background: blue; color: white; border: none; border-radius: 4px; font-weight: 500; font-size: 13px; transition: opacity 0.2s;">${btn.name}</button>`;
        });

        const winHtml = `
            <div id="${this.id}" class="msWindow_cont" style="left:${this.x}px; top:${this.y}px; width:${this.w}px; height:${this.h}px; position: absolute; z-index: 10000; border: 4px solid #5d33a1; border-radius: 0px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden; background: white;">
                <div id="${this.id}_title" class="msWindow_title" style="cursor: move; user-select: none; background: #5d33a1; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <span style="font-weight: bold; font-size: 14px;">${title}</span>
                    <button id="${this.id}_close" style="background: #c9ac2a; color: white; border: none; cursor: pointer; padding: 2px 8px; border-radius: 4px; font-weight: bold; transition: background 0.2s;">X</button>
                </div>
                <div class="msWindow_body" style="background: #fff; flex-grow: 1; overflow: auto; padding: 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.5;">
                    <div class="msWindow_content">${html}</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', winHtml);

        const titleEl = document.getElementById(`${this.id}_title`);
        titleEl.onmousedown = (e) => movestart(e, this);
        titleEl.ontouchstart = (e) => movestart(e.touches[0], this);
        
        document.getElementById(`${this.id}_close`).onclick = () => this.kill();
        
        buttons.forEach((btn, i) => {
            const b = document.getElementById(`${this.id}_btn_${i}`);
            if (b) {
                b.onclick = () => {
                    if (btn.callback) btn.callback();
                    this.kill();
                };
            }
        });
    }

    update() {
        const el = document.getElementById(this.id);
        if (el) {
            el.style.left = this.x + "px";
            el.style.top = this.y + "px";
        }
    }

    kill() {
        const el = document.getElementById(this.id);
        if (el) el.remove();
    }
}

window.msWindow = msWindow;
window.createWindow = function(title, html, x, y, width, height) {
    return new msWindow(title, html, x, y, width, height);
};

// Check for socket and add listener
function checkSocket() {
    if (window.socket) {
        window.socket.on("ms_window", function(data) {
            new msWindow(data.title, data.html, data.x, data.y, data.w, data.h);
        });
    } else {
        setTimeout(checkSocket, 100);
    }
}
checkSocket();