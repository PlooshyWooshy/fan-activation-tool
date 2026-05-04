const canvas = new fabric.Canvas('canvas', {
  selection: false
});

let userImg = null;
let templateImg = null;

// Upload image
document.getElementById("upload").addEventListener("change", function(e) {
  const reader = new FileReader();

  reader.onload = function(event) {
    fabric.Image.fromURL(event.target.result, function(img) {
      if (userImg) canvas.remove(userImg);

      userImg = img;

      img.set({
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true
      });

      canvas.add(img);
      canvas.sendToBack(img);
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});

// Template selection
function setTemplate(src) {
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
  });
}

// Zoom control
document.getElementById("zoom").addEventListener("input", function(e) {
  if (!userImg) return;

  const scale = e.target.value;
  userImg.scale(scale);
  canvas.renderAll();
});

// Download
function download() {
  const link = document.createElement("a");
  link.download = "fan-card.png";
  link.href = canvas.toDataURL({
    format: 'png',
    quality: 1
  });
  link.click();
}