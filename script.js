let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let nodes = [];

fetch("skills.json").then(res => res.json()).then(data => {
  data.forEach(s => addSkillNode(s));
  drawConnections();
});

function addSkill() {
  let name = prompt("Skill Name?");
  if (!name) return;
  let desc = prompt("Skill Description?");
  let shape = prompt("Shape? (circle/square)", "square");
  const skill = {
    id: "skill_" + Date.now(),
    name,
    description: desc || "",
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 400,
    evolves_to: [],
    shape: shape === "circle" ? "circle" : "square"
  };
  addSkillNode(skill);
  drawConnections();
}

function addSkillNode(skill) {
  nodes.push(skill);
  drawConnections();
  renderNode(skill);
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
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
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
