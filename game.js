let data = { talents: [], parents: [] };
let selectedParents = null;
let selectedTalents = [];
let selectedTalentObjs = [];
let attrPoints = 100;
let attributes = {
  appearance: 0,
  intelligence: 0,
  physique: 0,
  luck: 0,
  family: 0
};
let baseAttributes = {
  appearance: 0,
  intelligence: 0,
  physique: 0,
  luck: 0,
  family: 0
};
let step = 'born'; // 控制流程

// ========== UI渲染和流程 ==========
function renderBorn() {
  document.getElementById('game').innerHTML = `
    <div style="font-size:2.1em;text-align:center;">👶</div>
    <div class="step-title" style="text-align:center;">你出生了！</div>
    <div id="born-ani" style="font-size:1.2em;text-align:center;color:#888;">正在生成家庭环境…</div>
  `;
  setTimeout(() => { nextStep('parents') }, 1500);
}
function nextStep(s) {
  step = s;
  if(s === 'parents') renderParents();
  if(s === 'talent') renderTalent();
  if(s === 'attr') renderAttr();
  if(s === 'main') renderMainGame();
}

// ========== 父母职业 ==============
function renderParents() {
  if(!selectedParents) randomParents(false);
  document.getElementById('game').innerHTML = `
    <div class="step-title">你的父母与家庭</div>
    <div style="font-size:1.13em;">父亲职业：<b>${selectedParents.father}</b><br>
      母亲职业：<b>${selectedParents.mother}</b><br>
      家庭收入：<b>${selectedParents.family_income}</b><br>
      <span style="color:#888;">${selectedParents.desc}</span>
    </div>
    <div style="margin-top:18px;">
      <button class="btn" onclick="randomParents(true)">重新随机</button>
      <button class="btn" onclick="nextStep('talent')">满意，下一步</button>
    </div>
  `;
}
function randomParents(show) {
  selectedParents = data.parents[Math.floor(Math.random() * data.parents.length)];
  if(show!==false) renderParents();
}

// ========== 天赋选择 ==============
function renderTalent() {
  selectedTalents = [];
  selectedTalentObjs = [];
  // 随机10个天赋
  let allTalents = [...data.talents];
  let randomTalents = [];
  for(let i=0;i<10&&allTalents.length;i++) {
    let idx = Math.floor(Math.random()*allTalents.length);
    randomTalents.push(allTalents[idx]);
    allTalents.splice(idx,1);
  }
  let html = `<div class="step-title">选择你的天赋（不限数量）</div><div>`;
  randomTalents.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="renderTalent()">换一批天赋</button>
    <button class="btn" onclick="confirmTalent()">选择完毕</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function toggleTalent(cb, id) {
  if(cb.checked) {
    if(!selectedTalents.includes(id)) selectedTalents.push(id);
  } else {
    let idx = selectedTalents.indexOf(id);
    if(idx > -1) selectedTalents.splice(idx, 1);
  }
}

// 确认天赋后，将加成同步到初始属性
function confirmTalent() {
  // 收集天赋对象
  selectedTalentObjs = selectedTalents.map(id=>data.talents.find(t=>t.id===id));
  // 计算所有天赋对属性的加成
  baseAttributes = {appearance:0,intelligence:0,physique:0,luck:0,family:0};
  selectedTalentObjs.forEach(t => {
    for(let key in t.effect) {
      if(key in baseAttributes) baseAttributes[key] += t.effect[key];
    }
  });
  nextStep('attr');
}

// ========== 属性分配 ==============
function renderAttr() {
  attrPoints = 100;
  for(let key in attributes) attributes[key] = baseAttributes[key] || 0;
  let html = `<div class="step-title">分配初始属性（总共100点，每项最多10）</div>
    <div style="color:#666;font-size:0.98em;">天赋加成自动计入起始点数</div>
    <div>剩余点数：<b id="points">${attrPoints-totalAttr()}</b></div>
    <div style="margin:10px 0 18px 0;">`;
  for(let key in attributes) {
    let cn = {"appearance":"颜值","intelligence":"智商","physique":"体质","luck":"运气","family":"家境"}[key];
    html += `${cn}：<input type="number" id="attr_${key}" value="${attributes[key]}" min="${baseAttributes[key]||0}" max="10" onchange="updateAttr('${key}')">　`;
    if(key=="physique") html+="<br>";
  }
  html += `</div>
    <button class="btn" onclick="confirmAttr()">进入人生</button>
  `;
  document.getElementById('game').innerHTML = html;
  // 强制刷新各input为实际值
  for(let key in attributes) {
    document.getElementById('attr_'+key).value = attributes[key];
    document.getElementById('attr_'+key).min = baseAttributes[key]||0;
  }
  document.getElementById('points').innerText = attrPoints-totalAttr();
}
function updateAttr(key) {
  let val = parseInt(document.getElementById('attr_'+key).value)||0;
  if(val>10) val=10;
  if(val<(baseAttributes[key]||0)) val=baseAttributes[key]||0;
  attributes[key] = val;
  let remain = attrPoints-totalAttr();
  document.getElementById('points').innerText = remain;
  // 如果超限强制修正
  if(remain<0) {
    attributes[key] += remain; //扣回多的
    document.getElementById('attr_'+key).value = attributes[key];
    document.getElementById('points').innerText = 0;
  }
}
function totalAttr() {
  return Object.values(attributes).reduce((a,b)=>a+b,0);
}
function confirmAttr() {
  let remain = attrPoints-totalAttr();
  if(remain>0) {
    if(!confirm(`你还有${remain}未分配，确定继续吗？`)) return;
  }
  nextStep('main');
}

// ========== 进入主游戏界面 ==========
function renderMainGame() {
  let html = `<div class="step-title">你的人生开始了！</div>
    <div style="margin-bottom:8px;">
      <b>父母：</b>${selectedParents.father} & ${selectedParents.mother}
      <span style="color:#888;">（家庭收入：${selectedParents.family_income}）</span>
    </div>
    <div style="margin-bottom:8px;">
      <b>天赋：</b>${selectedTalentObjs.length ? selectedTalentObjs.map(t=>`<span class="talent-${t.type}">${t.name}</span>`).join("、") : "无"}
    </div>
    <div style="margin-bottom:8px;">
      <b>属性：</b>
      颜值${attributes.appearance}　
      智商${attributes.intelligence}　
      体质${attributes.physique}　
      运气${attributes.luck}　
      家境${attributes.family}
    </div>
    <hr>
    <div style="color:gray;">
      <b>（下一步：婴儿/幼儿园/小学/初中/高中/大学……后续功能将逐步开放！）</b>
    </div>
    <div style="margin-top:26px;">
      <button class="btn" onclick="window.location.reload()">重新开局</button>
    </div>
  `;
  document.getElementById('game').innerHTML = html;
}

// ========== 数据加载入口 ==========
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderBorn();
  });

window.nextStep = nextStep;
window.randomParents = randomParents;
window.toggleTalent = toggleTalent;
window.renderTalent = renderTalent;
window.updateAttr = updateAttr;
window.confirmAttr = confirmAttr;
window.confirmTalent = confirmTalent;