const canvas = new fabric.Canvas('canvas', {
  selection: false
});

let userImg = null;
let templateImg = null;
let frameGuide = null;

// 🎯 Frame presets for each template
const FRAMES = {
  "template1.png": { x: 260, y: 180, width: 560, height: 720 },
  "template2.png": { x: 180, y: 140, width: 720, height: 820 },
  "template3.png": { x: 300, y: 220, width: 520, height: 650 }
};

let FRAME = FRAMES["template1.png"];


// 📤 Upload Image
document.getElementById("upload").addEventListener("change", function(e) {
  const reader = new FileReader();

  reader.onload = function(event) {
    fabric.Image.fromURL(event.target.result, function(img) {

      if (userImg) canvas.remove(userImg);

      userImg = img;

      img.set({
        left: FRAME.x,
        top: FRAME.y,
        scaleX: 0.8,
        scaleY: 0.8,
        selectable: true,
        hasControls: true
      });

      // ✂️ Clip to frame
      img.clipPath = new fabric.Rect({
        left: FRAME.x,
        top: FRAME.y,
        width: FRAME.width,
        height: FRAME.height,
        absolutePositioned: true
      });

      canvas.add(img);
      canvas.sendToBack(img);

      if (templateImg) templateImg.bringToFront();
      if (frameGuide) frameGuide.bringToFront();
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});


// 🖼️ Set Template
function setTemplate(src) {

  FRAME = FRAMES[src];

  fabric.Image.fromURL(src, function(img) {

    if (templateImg) canvas.remove(templateImg);

    canvas.setWidth(img.width);
    canvas.setHeight(img.height);

    img.set({
      left: 0,
      top: 0,
      selectable: false,
      evented: false
    });

    templateImg = img;

    canvas.add(img);
    canvas.bringToFront(img);

    drawFrameGuide();

    if (userImg) {
      // Update clip path when template changes
      userImg.clipPath = new fabric.Rect({
        left: FRAME.x,
        top: FRAME.y,
        width: FRAME.width,
        height: FRAME.height,
        absolutePositioned: true
      });
    }
  });
}


// 📐 Draw Frame Guide
function drawFrameGuide() {

  if (frameGuide) canvas.remove(frameGuide);

  frameGuide = new fabric.Rect({
    left: FRAME.x,
    top: FRAME.y,
    width: FRAME.width,
    height: FRAME.height,
    fill: 'transparent',
    stroke: 'white',
    strokeDashArray: [6, 6],
    selectable: false,
    evented: false
  });

  canvas.add(frameGuide);

  if (templateImg) templateImg.bringToFront();
}


// 🚧 Restrict Movement Inside Frame
canvas.on('object:moving', function(e) {
  const obj = e.target;

  if (obj !== userImg) return;

  const objWidth = obj.width * obj.scaleX;
  const objHeight = obj.height * obj.scaleY;

  // LEFT
  if (obj.left > FRAME.x) obj.left = FRAME.x;

  // TOP
  if (obj.top > FRAME.y) obj.top = FRAME.y;

  // RIGHT
  if (obj.left + objWidth < FRAME.x + FRAME.width) {
    obj.left = FRAME.x + FRAME.width - objWidth;
  }

  // BOTTOM
  if (obj.top + objHeight < FRAME.y + FRAME.height) {
    obj.top = FRAME.y + FRAME.height - objHeight;
  }

  if (templateImg) templateImg.bringToFront();
  if (frameGuide) frameGuide.bringToFront();
});


// 🔍 Keep Template Always on Top
canvas.on('object:modified', function() {
  if (templateImg) templateImg.bringToFront();
  if (frameGuide) frameGuide.bringToFront();
});


// 🎚️ Zoom Slider
document.getElementById("zoom").addEventListener("input", function(e) {
  if (!userImg) return;

  const scale = parseFloat(e.target.value);
  userImg.scale(scale);

  canvas.renderAll();
});


// ⌨️ Arrow Key Fine-Tuning (for dev use)
document.addEventListener('keydown', (e) => {
  if (!frameGuide) return;

  if (e.key === 'ArrowUp') FRAME.y -= 5;
  if (e.key === 'ArrowDown') FRAME.y += 5;
  if (e.key === 'ArrowLeft') FRAME.x -= 5;
  if (e.key === 'ArrowRight') FRAME.x += 5;

  drawFrameGuide();
});


// 💾 Download Image
function download() {
  const link = document.createElement("a");
  link.download = "fan-card.png";
  link.href = canvas.toDataURL({
    format: 'png',
    quality: 1
  });
  link.click();
}