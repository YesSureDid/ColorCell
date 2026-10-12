import "./style.css";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(width, height);
}

function draw(w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#3b6f94";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ColorCell", w / 2, h / 2);
}

window.addEventListener("resize", resize);
resize();
