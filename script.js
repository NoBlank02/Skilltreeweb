let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let nodes = [];
let history = [],future = [];
let zoom = 1;
let systems = {};
let currentSystem = "Default";

fetch("skills.json").then(res => res.json()).then(data => {
  data.forEach(s => addSkillNode(s));
  drawConnections();
});

function addSkill() {
  let name = prompt("Skill name?");
  if (!name) return;
  const skill = { id: Date.now(), name, x: 100, y: 100, tag: "default" };
  nodes.push(skill);
  saveState();
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.rect(n.x * zoom, n.y * zoom, 100 * zoom, 50 * zoom);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeText(n.name, (n.x + 10) * zoom, (n.y + 25) * zoom);
    ctx.stroke();
  });
}

function zoomIn() { zoom *= 1.1; draw(); }
function zoomOut() { zoom /= 1.1; draw(); }

function undo() {
  if (history.length) {
    future.push(JSON.parse(JSON.stringify(nodes)));
    nodes = history.pop();
    draw();
  }
}

function redo() {
  if (future.length) {
    history.push(JSON.parse(JSON.stringify(nodes)));
    nodes = future.pop();
    draw();
  }
}

function saveState() {
  history.push(JSON.parse(JSON.stringify(nodes)));
  future = [];
}

function createNewSystem() {
  const name = prompt("System name?");
  if (!name) return;
  systems[name] = [];
  let sel = document.getElementById("systemSelector");
  let opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  sel.appendChild(opt);
  sel.value = name;
  loadSystem(name);
}

function loadSystem(name) {
  currentSystem = name;
  nodes = systems[name] || [];
  draw();
}
function handleFileUpload(e) {
  let list = document.getElementById("file-list");
  Array.from(e.target.files).forEach(file => {
    let li = document.createElement("li");
    li.textContent = file.name;
    list.appendChild(li);
  });
}

window.onload = () => {
  systems["Default"] = nodes;
  let sel = document.getElementById("systemSelector");
  let opt = document.createElement("option");
  opt.value = "Default";
  opt.textContent = "Default";
  sel.appendChild(opt);
};
function switchView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id + "-view").classList.add("active");
}

function renderNode(skill) {
  let div = document.createElement("div");
  div.className = "skill-node" + (document.body.classList.contains("dark") ? " dark" : "");
  div.style.left = skill.x + "px";
  div.style.top = skill.y + "px";
  div.setAttribute("data-id", skill.id);
  div.innerHTML = `<strong>${skill.name}</strong><br><small>${skill.description}</small><br><em>${skill.shape}</em>`;
  div.style.borderRadius = skill.shape === "circle" ? "50%" : "8px";
  canvas.parentElement.appendChild(div);
  makeDraggable(div, skill);
}

function makeDraggable(el, skill) {
  el.onmousedown = function(e) {
    let offsetX = e.clientX - el.offsetLeft;
    let offsetY = e.clientY - el.offsetTop;
    function onMove(e) {
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;
    let snapToGrid = false;

function snap(value) {
  return Math.round(value / 20) * 20; // Snap to 20px grid
}

el.style.left = newX + "px";
el.style.top = newY + "px";
      skill.x = e.clientX - offsetX;
      skill.y = e.clientY - offsetY;
      drawConnections();
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", onMove);
    }, { once: true });
  };
}

function drawConnections() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  nodes.forEach(parent => {
    parent.evolves_to.forEach(childId => {
      let child = nodes.find(n => n.id === childId);
      if (child) {
        ctx.beginPath();
        ctx.moveTo(parent.x + 50, parent.y + 25);
        ctx.lineTo(child.x + 50, child.y + 25);
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
    });
  });
}

function saveSkills() {
  const json = JSON.stringify(nodes, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "skills.json";
  a.click();
}

function loadSkills(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    nodes = [];
    document.querySelectorAll(".skill-node").forEach(n => n.remove());
    data.forEach(s => addSkillNode(s));
    drawConnections();
  };
  reader.readAsText(file);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  document.querySelectorAll(".skill-node").forEach(div => {
    div.classList.toggle("dark");
  });
}
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("skill-node") || e.target.parentElement?.classList.contains("skill-node")) {
    let nodeEl = e.target.classList.contains("skill-node") ? e.target : e.target.parentElement;
    let skill = nodes.find(s => s.name === nodeEl.querySelector("strong").innerText);
    if (!skill) return;

    let newName = prompt("Edit Skill Name:", skill.name);
    if (newName !== null) skill.name = newName;

    let newDesc = prompt("Edit Description:", skill.description);
    if (newDesc !== null) skill.description = newDesc;

    let newColor = prompt("Change background color (e.g. red, #ff0000):", nodeEl.style.backgroundColor || "#ffffff");
    if (newColor) nodeEl.style.backgroundColor = newColor;

    let newShape = prompt("Change shape (circle, square, diamond):", skill.shape);
    if (newShape) skill.shape = newShape;

    let newImg = prompt("Optional: image URL/icon for node (leave blank for none):", skill.icon || "");
    skill.icon = newImg || "";

    nodeEl.innerHTML = `<strong>${skill.name}</strong><br><small>${skill.description}</small>` + 
      (skill.icon ? `<br><img src="${skill.icon}" style="width:40px;height:40px;">` : "");

    drawConnections();
  }
});

let snapToGrid = true; // toggle this

function snap(value, grid = 50) {
  return Math.round(value / grid) * grid;
}

function searchSkill(query) {
  const lower = query.toLowerCase();
  const nodeDivs = document.querySelectorAll('.skill-node');
  nodeDivs.forEach(div => {
    const name = div.querySelector('strong')?.innerText.toLowerCase();
    if (name && name.includes(lower)) {
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
      div.style.borderColor = "red";
    } else {
      div.style.borderColor = "#333";
    }
  });
}
function autoSave() {
  localStorage.setItem("skillTreeSave", JSON.stringify(nodes));
}

setInterval(autoSave, 10000); // Save every 10 seconds

function loadFromLocalStorage() {
  const saved = localStorage.getItem("skillTreeSave");
  if (saved) {
    nodes = [];
    document.querySelectorAll(".skill-node").forEach(n => n.remove());
    JSON.parse(saved).forEach(s => addSkillNode(s));
    drawConnections();
  }
}

// Load on start
loadFromLocalStorage();

function clearTree() {
  if (!confirm("Clear the entire skill tree?")) return;
  nodes = [];
  canvas.parentElement.querySelectorAll('.skill-node').forEach(n => n.remove());
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  localStorage.removeItem("skillTreeSave");
}
let connectMode = false;
let selectedNode = null;

function toggleConnectMode() {
  connectMode = !connectMode;
  alert(connectMode ? "Connect mode ON. Tap two nodes to link them." : "Connect mode OFF.");
}

document.addEventListener("click", function(e) {
  if (!connectMode) return;
  const target = e.target.closest(".skill-node");
  if (!target) return;

  const name = target.querySelector('strong')?.innerText;
  const skill = nodes.find(s => s.name === name);
  if (!selectedNode) {
    selectedNode = skill;
    target.style.borderColor = "blue";
  } else if (selectedNode.id !== skill.id) {
    selectedNode.evolves_to.push(skill.id);
    drawConnections();
    document.querySelectorAll('.skill-node').forEach(d => d.style.borderColor = "#333");
    selectedNode = null;
  }
});
function showEditor(skill, div) {
  const box = document.createElement("div");
  box.style.position = "absolute";
  box.style.left = skill.x + 60 + "px";
  box.style.top = skill.y + "px";
  box.style.background = "#fff";
  box.style.border = "1px solid #000";
  box.style.padding = "10px";
  box.style.zIndex = 999;
  box.innerHTML = `
    <input value="${skill.name}" id="editName"><br>
    <textarea id="editDesc">${skill.description}</textarea><br>
    <input type="color" id="editColor" value="${div.style.backgroundColor || '#ffffff'}"><br>
    <select id="editShape">
      <option ${skill.shape === "square" ? "selected" : ""}>square</option>
      <option ${skill.shape === "circle" ? "selected" : ""}>circle</option>
      <option ${skill.shape === "diamond" ? "selected" : ""}>diamond</option>
    </select><br>
    <button onclick="applyEdit()">Apply</button>
    <button onclick="this.parentElement.remove()">Close</button>
  `;
  document.body.appendChild(box);

  window.applyEdit = function() {
    skill.name = document.getElementById("editName").value;
    skill.description = document.getElementById("editDesc").value;
    div.querySelector("strong").innerText = skill.name;
    div.querySelector("small").innerText = skill.description;
    div.style.backgroundColor = document.getElementById("editColor").value;
    skill.shape = document.getElementById("editShape").value;
    box.remove();
    drawConnections();
  };
}

document.addEventListener("dblclick", function(e) {
  const node = e.target.closest(".skill-node");
  if (!node) return;
  const name = node.querySelector("strong").innerText;
  const skill = nodes.find(s => s.name === name);
  if (skill) showEditor(skill, node);
});

let pressTimer, pressTarget = null;

canvas.addEventListener("touchstart", function(e) {
  pressTarget = e.target.closest(".skill-node");
  pressTimer = setTimeout(() => showContextMenu(e), 1500); // 1.5s hold
});

canvas.addEventListener("touchend", () => {
  clearTimeout(pressTimer);
});

function showContextMenu(e) {
  e.preventDefault();
  document.querySelectorAll(".context-menu").forEach(m => m.remove());

  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.style.left = e.touches[0].clientX + "px";
  menu.style.top = e.touches[0].clientY + "px";

  // If tapping on a skill node
  if (pressTarget) {
    menu.innerHTML = `
      <button onclick="editNode('${pressTarget.innerText}')">✏️ Edit Node</button>
      <button onclick="changeColor('${pressTarget.innerText}')">🎨 Change Color</button>
      <button onclick="changeShape('${pressTarget.innerText}')">📐 Change Shape</button>
      <button onclick="changeSize('${pressTarget.innerText}')">📏 Change Size</button>
      <button onclick="changeImage('${pressTarget.innerText}')">🖼️ Change Image</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="createOrigin()">➕ Create Origin</button>
      <button onclick="createBranch()">➕ Create Branch</button>
    `;
  }

  document.body.appendChild(menu);
  setTimeout(() => menu.remove(), 8000); // auto-remove in 8s
}

function getNodeByName(name) {
  return nodes.find(n => n.name === name.trim());
}

function editNode(name) {
  let n = getNodeByName(name);
  if (!n) return;
  n.name = prompt("New name?", n.name) || n.name;
  n.description = prompt("New description?", n.description) || n.description;
  refresh();
}

function changeColor(name) {
  let n = getNodeByName(name);
  if (!n) return;
  n.color = prompt("Color (name or hex)?", n.color || "#ffffff");
  refresh();
}

function changeShape(name) {
  let n = getNodeByName(name);
  if (!n) return;
  n.shape = prompt("Shape (square/circle/diamond)?", n.shape || "square");
  refresh();
}

function changeSize(name) {
  let n = getNodeByName(name);
  if (!n) return;
  let size = parseInt(prompt("Size in px (default 100)?", "100"));
  if (!isNaN(size)) {
    n.size = size;
    refresh();
  }
}

function changeImage(name) {
  let n = getNodeByName(name);
  if (!n) return;
  let url = prompt("Image URL?");
  if (url) n.icon = url;
  refresh();
}

function createOrigin() {
  const name = prompt("Origin name?");
  if (!name) return;
  const id = "origin_" + Date.now();
  const skill = {
    id, name, description: "", x: 200, y: 200,
    evolves_to: [], shape: "circle", color: "#e0e0ff", icon: ""
  };
  nodes.push(skill);
  refresh();
}

function createBranch() {
  const name = prompt("Branch name?");
  if (!name) return;
  const id = "branch_" + Date.now();
  const skill = {
    id, name, description: "", x: 300, y: 300,
    evolves_to: [], shape: "square", color: "#ffe0e0", icon: ""
  };
  nodes.push(skill);
  refresh();
}

function refresh() {
  document.querySelectorAll(".skill-node").forEach(n => n.remove());
  nodes.forEach(s => addSkillNode(s));
  drawConnections();
}
