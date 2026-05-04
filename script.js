const canvas = new fabric.Canvas('canvas', {
  selection: false,
  preserveObjectStacking: true
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


// ✅ Single source of truth for layer ordering:
// userImg (bottom) → templateImg → frameGuide (top)
function enforceLayerOrder() {
  // Move all three to known positions using indices
  if (userImg) canvas.sendToBack(userImg);
  if (templateImg) {
    canvas.bringToFront(templateImg);
  }
  if (frameGuide) {
    canvas.bringToFront(frameGuide);
  }
  canvas.renderAll();
}


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

      // ✅ Always enforce correct layer order after adding user image
      enforceLayerOrder();
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

    // ✅ Enforce layer order after template is set
    enforceLayerOrder();
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

  // ✅ Enforce layer order after frame guide is drawn
  enforceLayerOrder();
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

  // ✅ Use enforceLayerOrder instead of ad-hoc bringToFront calls
  enforceLayerOrder();
});


// 🔍 Keep Template Always on Top After Any Modification
canvas.on('object:modified', function() {
  enforceLayerOrder();
});


// 🎚️ Zoom Slider
document.getElementById("zoom").addEventListener("input", function(e) {
  if (!userImg) return;

  const scale = parseFloat(e.target.value);
  userImg.scale(scale);

  // ✅ Re-enforce layers after zoom since scaling can trigger re-renders
  enforceLayerOrder();
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


// 💾 Download Image (hides frame guide for clean export)
function download() {
  // Temporarily hide the frame guide
  if (frameGuide) frameGuide.set('visible', false);
  canvas.renderAll();

  const link = document.createElement("a");
  link.download = "fan-card.png";
  link.href = canvas.toDataURL({
    format: 'png',
    quality: 1
  });
  link.click();

  // Restore frame guide visibility
  if (frameGuide) frameGuide.set('visible', true);
  canvas.renderAll();
}
