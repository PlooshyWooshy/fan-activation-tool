/* ============================================================
   NHL Global Series: Germany — Digital Photobooth
   Hugo Boss × NHL Activation
   ============================================================ */

/* ---- Team config: each team maps to a frame template + label ---- */
const TEAMS = {
  hugo: {
    template: "template3.png",   // red Team Hugo frame
    frame: { x: 0, y: 0, width: 375, height: 406 },
    label: "Team Hugo",
    color: "#e11d2a"
  },
  boss: {
    template: "template2.png",   // gold Team Boss frame
    frame: { x: 0, y: 0, width: 375, height: 406 },
    label: "Team Boss",
    color: "#c9a974"
  }
};

/* ---- Fabric canvas ---- */
const canvas = new fabric.Canvas("canvas", {
  selection: false,
  preserveObjectStacking: true,
  backgroundColor: "#ffffff"
});

/* ---- State ---- */
let currentTeam = "hugo";
let userImg = null;
let templateImg = null;
let activeFrame = TEAMS[currentTeam].frame;

/* ---- DOM ---- */
const $upload         = document.getElementById("upload");
const $uploadDrop     = document.getElementById("uploadDrop");
const $stageFrame     = document.getElementById("stageFrame");
const $zoom           = document.getElementById("zoom");
const $zoomValue      = document.getElementById("zoomValue");
const $resetBtn       = document.getElementById("resetBtn");
const $downloadBtn    = document.getElementById("downloadBtn");
const $dropHint       = document.getElementById("dropHint");
const $boothTeamLabel = document.getElementById("boothTeamLabel");
const $stageTeam      = document.getElementById("stageTeam");
const $toggleBtns     = document.querySelectorAll(".toggle-btn");
const $teamCards      = document.querySelectorAll(".team-card[data-team]");

/* ============================================================
   Layer ordering — user image at back, template overlay on top.
   ============================================================ */
function enforceLayerOrder() {
  if (userImg)     canvas.sendToBack(userImg);
  if (templateImg) canvas.bringToFront(templateImg);
  canvas.renderAll();
}

/* Fabric.js sets fixed pixel dimensions on its wrapper + canvases.
   Force them to fill the stage so no white background bleeds through. */
function syncStageSize() {
  const wrap  = canvas.wrapperEl;
  const lower = canvas.lowerCanvasEl;
  const upper = canvas.upperCanvasEl;

  [wrap, lower, upper].forEach(el => {
    if (!el) return;
    el.style.width    = "100%";
    el.style.height   = "100%";
    el.style.position = "absolute";
    el.style.top      = "0";
    el.style.left     = "0";
  });
}

/* ============================================================
   Fit user photo so it fully covers the frame opening.
   ============================================================ */
function fitAndCenterImage(img) {
  const scaleX = activeFrame.width / img.width;
  const scaleY = activeFrame.height / img.height;
  const scale  = Math.max(scaleX, scaleY);

  img.set({
    scaleX: scale,
    scaleY: scale,
    left: activeFrame.x + (activeFrame.width  - img.width  * scale) / 2,
    top:  activeFrame.y + (activeFrame.height - img.height * scale) / 2
  });

  // Sync zoom slider
  $zoom.min   = Math.min(parseFloat($zoom.min), scale).toString();
  $zoom.value = scale;
  updateZoomLabel(scale);

  canvas.renderAll();
}

/* ============================================================
   Load the team frame template and (re)fit the user photo.
   ============================================================ */
function loadTemplate(team) {
  const cfg = TEAMS[team];
  activeFrame = cfg.frame;

  fabric.Image.fromURL(cfg.template, function (img) {
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

    // Reapply 100% sizing every time the canvas is resized.
    syncStageSize();

    if (userImg) {
      userImg.clipPath = new fabric.Rect({
        left: activeFrame.x,
        top:  activeFrame.y,
        width:  activeFrame.width,
        height: activeFrame.height,
        absolutePositioned: true
      });
      fitAndCenterImage(userImg);
    }

    enforceLayerOrder();
  });
}

/* ============================================================
   Switch team — updates frame, theme, labels, toggle state.
   ============================================================ */
function switchTeam(team) {
  if (!TEAMS[team]) return;
  currentTeam = team;

  // Theme tokens (drives CSS via [data-team])
  document.body.dataset.team = team;

  // UI labels
  $boothTeamLabel.textContent = TEAMS[team].label;
  $stageTeam.textContent      = TEAMS[team].label;

  // Toggle button state
  $toggleBtns.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.team === team);
  });

  // Team card highlight
  $teamCards.forEach(card => {
    card.classList.toggle("is-selected", card.dataset.team === team);
  });

  loadTemplate(team);
}

/* ============================================================
   Upload handling — file input + drag & drop.
   ============================================================ */
function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    fabric.Image.fromURL(event.target.result, function (img) {
      if (userImg) canvas.remove(userImg);

      userImg = img;
      img.set({
        selectable: true,
        hasControls: true,
        hasBorders: false,
        cornerColor: TEAMS[currentTeam].color,
        cornerSize: 10,
        transparentCorners: false
      });

      img.clipPath = new fabric.Rect({
        left: activeFrame.x,
        top:  activeFrame.y,
        width:  activeFrame.width,
        height: activeFrame.height,
        absolutePositioned: true
      });

      canvas.add(img);
      fitAndCenterImage(img);
      enforceLayerOrder();

      // Hide the placeholder + flip cursor
      $dropHint.classList.add("is-hidden");
      $stageFrame.classList.add("has-image");
    });
  };
  reader.readAsDataURL(file);
}

$upload.addEventListener("change", e => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

/* Drag & drop on the upload zone */
["dragenter","dragover"].forEach(evt => {
  $uploadDrop.addEventListener(evt, e => {
    e.preventDefault();
    $uploadDrop.classList.add("is-drag");
  });
});
["dragleave","drop"].forEach(evt => {
  $uploadDrop.addEventListener(evt, e => {
    e.preventDefault();
    $uploadDrop.classList.remove("is-drag");
  });
});
$uploadDrop.addEventListener("drop", e => {
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

/* ============================================================
   Constrain user photo within the frame opening while dragging.
   ============================================================ */
canvas.on("object:moving", function (e) {
  const obj = e.target;
  if (obj !== userImg) return;

  const w = obj.width  * obj.scaleX;
  const h = obj.height * obj.scaleY;

  if (obj.left > activeFrame.x) obj.left = activeFrame.x;
  if (obj.top  > activeFrame.y) obj.top  = activeFrame.y;

  if (obj.left + w < activeFrame.x + activeFrame.width) {
    obj.left = activeFrame.x + activeFrame.width - w;
  }
  if (obj.top + h < activeFrame.y + activeFrame.height) {
    obj.top = activeFrame.y + activeFrame.height - h;
  }
});

canvas.on("object:modified", enforceLayerOrder);

/* ============================================================
   Zoom slider
   ============================================================ */
function updateZoomLabel(scale) {
  $zoomValue.textContent = Math.round(scale * 100) + "%";
}
$zoom.addEventListener("input", e => {
  if (!userImg) return;
  const scale = parseFloat(e.target.value);
  userImg.scale(scale);
  updateZoomLabel(scale);
  enforceLayerOrder();
});

/* ============================================================
   Reset — remove user image and restore placeholder.
   ============================================================ */
$resetBtn.addEventListener("click", () => {
  if (userImg) {
    canvas.remove(userImg);
    userImg = null;
  }
  $upload.value = "";
  $dropHint.classList.remove("is-hidden");
  $stageFrame.classList.remove("has-image");
  $zoom.value = 1;
  updateZoomLabel(1);
  enforceLayerOrder();
});

/* Tap the stage itself to upload (until a photo is loaded). */
$stageFrame.addEventListener("click", e => {
  if (userImg) return;                              // photo present — let user drag/zoom
  if (e.target.closest("canvas") || e.target === $stageFrame || $dropHint.contains(e.target)) {
    $upload.click();
  }
});

/* ============================================================
   Download — export final canvas as PNG.
   ============================================================ */
$downloadBtn.addEventListener("click", () => {
  if (!userImg) {
    // Nudge: open upload dialog instead of exporting an empty frame.
    $upload.click();
    return;
  }

  // Deselect so corner handles don't render in the export.
  canvas.discardActiveObject();
  canvas.renderAll();

  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 2   // 2x for crisp share-quality output
  });

  const link = document.createElement("a");
  link.download = `hugoboss-nhl-${currentTeam}-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
});

/* ============================================================
   Wire team selection (cards + toggle)
   ============================================================ */
$teamCards.forEach(card => {
  card.addEventListener("click", () => {
    switchTeam(card.dataset.team);
    // Smooth scroll to photobooth after picking a team
    document.getElementById("photobooth").scrollIntoView({ behavior: "smooth" });
  });
});
$toggleBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTeam(btn.dataset.team));
});

/* ============================================================
   Initial boot
   ============================================================ */
switchTeam("hugo");
