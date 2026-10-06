// "Try a sample photo": paints a big, photo-like sunset scene on a canvas so a
// first-time visitor can see ShrinkTo work without picking a file. No download.

export async function makeSamplePhoto(): Promise<File> {
  const w = 3024;
  const h = 2016;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const x = canvas.getContext("2d")!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const sky = x.createLinearGradient(0, 0, 0, h * 0.7);
  sky.addColorStop(0, "#ff9a76");
  sky.addColorStop(0.55, "#ffcf99");
  sky.addColorStop(1, "#ffe8c2");
  x.fillStyle = sky;
  x.fillRect(0, 0, w, h);

  const sun = x.createRadialGradient(w * 0.68, h * 0.42, 0, w * 0.68, h * 0.42, h * 0.32);
  sun.addColorStop(0, "#fffbe8");
  sun.addColorStop(0.2, "#fff2c8");
  sun.addColorStop(0.22, "rgba(255,214,160,0.75)");
  sun.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = sun;
  x.fillRect(0, 0, w, h);

  ["#c0627a", "#8d3f6e", "#4a2252"].forEach((col, layer) => {
    const base = h * (0.48 + layer * 0.1);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, h);
    for (let px = 0; px <= w; px += w / 80) {
      x.lineTo(px, base - Math.sin(px / w * (3 + layer) + layer * 2) * h * 0.07 - rnd() * h * 0.025);
    }
    x.lineTo(w, h);
    x.fill();
  });

  const water = x.createLinearGradient(0, h * 0.76, 0, h);
  water.addColorStop(0, "#d1708f");
  water.addColorStop(1, "#2c1838");
  x.fillStyle = water;
  x.fillRect(0, h * 0.76, w, h * 0.24);
  x.globalAlpha = 0.35;
  for (let i = 0; i < 260; i++) {
    x.fillStyle = "#fff1d6";
    x.fillRect(w * 0.5 + (rnd() - 0.5) * w * 0.5, h * 0.77 + rnd() * h * 0.22, 30 + rnd() * 160, 3);
  }
  x.globalAlpha = 1;

  // Film grain makes it compress like a real camera photo.
  const img = x.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
  return new File([blob], "sample-sunset.jpg", { type: "image/jpeg" });
}
