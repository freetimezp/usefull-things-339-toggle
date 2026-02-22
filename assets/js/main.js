const video = document.getElementById("promoVideo");
const overlay = document.getElementById("videoOverlay");
const videoWrap = document.getElementById("videoWrap");

let motionEnabled = false;
let time = 0;
let shaderRunning = false;

/* ================= WEBGL SHADER ================= */

const canvas = document.getElementById("shader");
const gl = canvas.getContext("webgl");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();
window.addEventListener("resize", resize);

const vert = `
attribute vec2 p;
void main(){gl_Position=vec4(p,0.,1.);}
`;

const frag = `
precision mediump float;
uniform float t;
uniform vec2 r;

void main(){
vec2 uv = gl_FragCoord.xy/r.xy;
vec3 col = 0.5 + 0.5*cos(t+uv.xyx+vec3(0,2,4));
gl_FragColor = vec4(col*0.25,1.);
}
`;

function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
gl.linkProgram(prog);
gl.useProgram(prog);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

const loc = gl.getAttribLocation(prog, "p");
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(prog, "t");
const resLoc = gl.getUniformLocation(prog, "r");

function render() {
    if (shaderRunning) {
        time += 0.01;
    }

    gl.uniform1f(timeLoc, time);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}
render();

/* ================= FLOATING LETTERS ================= */

const lettersContainer = document.getElementById("letters");
const chars = "TOGGLEUIUXMOTION";

const letterAnims = [];

for (let i = 0; i < 32; i++) {
    const s = document.createElement("span");
    s.className = "letter";
    s.textContent = chars[Math.floor(Math.random() * chars.length)];
    s.style.left = Math.random() * 100 + "vw";
    s.style.top = Math.random() * 100 + "vh";
    lettersContainer.appendChild(s);

    const anim = gsap.to(s, {
        x: "random(-500,500)",
        y: "random(-400,400)",
        rotation: "random(-180,180)",
        duration: "random(25,45)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        paused: true, // ⭐ IMPORTANT
    });

    letterAnims.push(anim);
}

/* ================= MORPHING BLOB ================= */

const blobAnim = gsap.to("#blob", {
    borderRadius: "40% 60% 55% 45% / 55% 45% 60% 40%",
    duration: 6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    paused: true, // ⭐ important
});

/* ================= LIQUID TOGGLE ================= */

const toggle = document.getElementById("toggle");
const card = document.getElementById("card");
let active = false;

toggle.onclick = () => {
    motionEnabled = !motionEnabled;
    toggle.classList.toggle("active");

    if (motionEnabled) {
        // ✅ start everything
        shaderRunning = true;
        blobAnim.play();
        letterAnims.forEach((a) => a.play());

        gsap.to(card, {
            scale: 1.06,
            rotateX: 10,
            duration: 0.7,
            ease: "elastic.out(1,0.5)",
        });

        gsap.to("#blob", {
            scale: 1.3,
            opacity: 0.5,
            duration: 1.2,
            ease: "power3.out",
        });
    } else {
        // 🧊 stop everything
        shaderRunning = false;
        blobAnim.pause();
        letterAnims.forEach((a) => a.pause());

        overlay.classList.remove("hide");
        video.pause();

        gsap.to(card, {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            duration: 0.6,
        });

        gsap.to("#blob", {
            scale: 1,
            opacity: 0.35,
            duration: 0.6,
        });

        gsap.to(cta, {
            x: 0,
            y: 0,
            duration: 0.4,
        });
    }
};
/* ================= MAGNETIC ================= */

const cta = document.getElementById("cta");

document.addEventListener("mousemove", (e) => {
    if (!motionEnabled) return; // ⭐ lock when off

    const r = cta.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;

    gsap.to(cta, { x: x * 0.25, y: y * 0.25, duration: 0.4 });
    gsap.to(card, { rotateY: x * 0.02, rotateX: -y * 0.02, duration: 0.6 });
});

document.addEventListener("mouseleave", () => {
    gsap.to([cta, card], { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.6 });
});

/* ================= ENTRY ================= */

gsap.from(".card", { opacity: 0, y: 80, duration: 1.4, ease: "power4.out" });

/* ================= VIDEO INTERACTION ================= */

overlay.addEventListener("click", () => {
    if (!motionEnabled) return; // ⭐ lock when off

    video.play();
    overlay.classList.add("hide");

    gsap.fromTo(videoWrap, { scale: 0.96 }, { scale: 1, duration: 0.6, ease: "power3.out" });
});

/* subtle hover depth */

videoWrap.addEventListener("mouseenter", () => {
    gsap.to(videoWrap, {
        y: -6,
        duration: 0.35,
        ease: "power2.out",
    });
});

videoWrap.addEventListener("mouseleave", () => {
    gsap.to(videoWrap, {
        y: 0,
        duration: 0.35,
    });
});
