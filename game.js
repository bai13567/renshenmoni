let data = { talents: [], parents: [] };
let saves = {};    // 所有存档
let currentSave = null;
let player = null; // 当前玩家
let step = 'home'; // home/born/parents/talent/attr/main

// 加载所有存档
function loadSaves() {
  saves = JSON.parse(localStorage.getItem('renshenmoni_saves') || '{}');
}

// 保存所有存档
function saveSaves() {
  localStorage.setItem('renshenmoni_saves', JSON.stringify(saves));
}

// 新建存档（只含名）
function createSave(name) {
  if (!name || saves[name]) return false;
  saves[name] = {
    name,
    stage: 'init', // init/born/parents/talent/attr/main
    openData: {}   // 父母、天赋、属性
  };
  saveSaves();
  return true;
}

// 删除存档
function deleteSave(name) {
  delete saves[name];
  saveSaves();
}

// 进入某个存档
function enterSave(name) {
  currentSave = name;
  player = saves[name];
  // 自动判断流程从哪里继续
  switch (player.stage) {
    case 'init':
    default:
      step = 'born';
      renderBorn();
      break;
    case 'born': renderBorn(); break;
    case 'parents': renderParents(); break;
    case 'talent': renderTalent(); break;
    case 'attr': renderAttr(); break;
    case 'main': renderMainGame(); break;
  }
}

// 返回主界面
function backHome() {
  currentSave = null;
  player = null;
  step = 'home';
  renderHome();
}

// ========== 渲染主界面 ==========
function renderHome() {
  loadSaves();
  let html = `<h2>请选择/管理存档</h2><ul>`;
  let keys = Object.keys(saves);
  if (!keys.length) html += `<li style="color:#999;">暂无存档，请新建</li>`;
  for (let key of keys) {
    html += `<li>
      <b>${key}</b>
      <button class="btn btn-small" onclick="enterSave('${key}')">进入</button>
      <button class="btn btn-small danger" onclick="delSavePrompt('${key}')">删除</button>
    </li>`;
  }
  html += `</ul>
    <input type="text" id="newSaveName" placeholder="新存档名" maxlength="10">
    <button class="btn" onclick="newSave()">新建存档</button>
    <hr>
    <div style="color:#888;font-size:0.96em;">每个存档拥有独立人生轨迹，可反复体验！</div>
  `;
  document.getElementById('game').innerHTML = html;
}

// 新建存档UI
function newSave() {
  let name = document.getElementById('newSaveName').value.trim();
  if (!name) { alert('请输入存档名'); return; }
  if (saves[name]) { alert('存档名已存在'); return; }
  createSave(name);
  renderHome();
}
function delSavePrompt(name) {
  if (confirm(`确认要删除存档 "${name}"？此操作不可恢复。`)) {
    deleteSave(name);
    renderHome();
  }
}

// ========== 出生动画 ==========
function renderBorn() {
  player.stage = 'born';
  saveSaves();
  document.getElementById('game').innerHTML = `
    <div style="font-size:2.1em;text-align:center;">👶</div>
    <div class="step-title" style="text-align:center;">你出生了！</div>
    <div style="text-align:center; margin:10px 0 25px 0; color:#888;">开启你的人生旅程</div>
    <div style="text-align:center;">
      <button class="btn" onclick="nextStep('parents')">继续</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div>
  `;
}

// ========== 父母职业 ==============
function renderParents() {
  player.stage = 'parents';
  saveSaves();
  // 未抽过父母就初始化
  if (!player.openData.parents) randomParents(false);
  let p = player.openData.parents;
  document.getElementById('game').innerHTML = `
    <div class="step-title">你的父母与家庭</div>
    <div style="font-size:1.13em;">父亲职业：<b>${p.father}</b><br>
      母亲职业：<b>${p.mother}</b><br>
      家庭收入：<b>${p.family_income}</b><br>
      <span style="color:#888;">${p.desc}</span>
    </div>
    <div style="margin-top:18px;">
      <button class="btn" onclick="randomParents(true)">重新随机</button>
      <button class="btn" onclick="nextStep('talent')">满意，下一步</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div>
  `;
}
function randomParents(show) {
  let sel = data.parents[Math.floor(Math.random() * data.parents.length)];
  player.openData.parents = JSON.parse(JSON.stringify(sel));
  saveSaves();
  if (show !== false) renderParents();
}

// ========== 天赋选择 ==============
function renderTalent() {
  player.stage = 'talent';
  saveSaves();
  player.openData.talents = player.openData.talents || [];
  // 随机10个天赋
  let allTalents = [...data.talents];
  let randomTalents = [];
  for(let i=0; i<10&&allTalents.length; i++) {
    let idx = Math.floor(Math.random()*allTalents.length);
    randomTalents.push(allTalents[idx]);
    allTalents.splice(idx,1);
  }
  let selected = player.openData.talents || [];
  let html = `<div class="step-title">选择你的天赋（不限数量）</div><div>`;
  randomTalents.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id)?'checked':''}
      onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="renderTalent()">换一批天赋</button>
    <button class="btn" onclick="confirmTalent()">选择完毕</button>
    <button class="btn btn-small" onclick="backHome()">返回主界面</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function toggleTalent(cb, id) {
  let arr = player.openData.talents || [];
  if(cb.checked) {
    if(!arr.includes(id)) arr.push(id);
  } else {
    let idx = arr.indexOf(id);
    if(idx > -1) arr.splice(idx, 1);
  }
  player.openData.talents = arr;
  saveSaves();
}
function confirmTalent() {
  // 计算所有天赋对属性的加成
  let all = player.openData.talents || [];
  let baseAttributes = {appearance:0,intelligence:0,physique:0,luck:0,family:0};
  all.forEach(id => {
    let t = data.talents.find(t => t.id === id);
    if (t) for(let k in t.effect) if (k in baseAttributes) baseAttributes[k] += t.effect[k];
  });
  player.openData.baseAttributes = baseAttributes;
  saveSaves();
  nextStep('attr');
}

// ========== 属性分配 ==============
function renderAttr() {
  player.stage = 'attr';
  saveSaves();
  let baseAttributes = player.openData.baseAttributes || {appearance:0,intelligence:0,physique:0,luck:0,family:0};
  player.openData.attributes = player.openData.attributes || {...baseAttributes};
  let attributes = {...player.openData.attributes};
  let attrPoints = 100;
  for(let key in attributes) {
    if(attributes[key] < baseAttributes[key]) attributes[key] = baseAttributes[key];
  }
  function htmlAttrInput() {
    let html = "";
    for(let key in attributes) {
      let cn = {"appearance":"颜值","intelligence":"智商","physique":"体质","luck":"运气","family":"家境"}[key];
      html += `${cn}：<input type="number" id="attr_${key}" value="${attributes[key]}" min="${baseAttributes[key]||0}" max="10" onchange="updateAttr('${key}')">　`;
      if(key=="physique") html+="<br>";
    }
    return html;
  }
  let remain = () => attrPoints - Object.values(attributes).reduce((a,b)=>a+b,0);
  window.updateAttr = function(key) {
    let val = parseInt(document.getElementById('attr_'+key).value)||0;
    if(val>10) val=10;
    if(val<(baseAttributes[key]||0)) val=baseAttributes[key]||0;
    attributes[key] = val;
    let left = remain();
    document.getElementById('points').innerText = left;
    if(left<0) {
      attributes[key] += left; // 扣回多的
      document.getElementById('attr_'+key).value = attributes[key];
      document.getElementById('points').innerText = 0;
    }
    player.openData.attributes = {...attributes};
    saveSaves();
  }
  let html = `<div class="step-title">分配初始属性（总共100点，每项最多10）</div>
    <div style="color:#666;font-size:0.98em;">天赋加成自动计入起始点数</div>
    <div>剩余点数：<b id="points">${remain()}</b></div>
    <div style="margin:10px 0 18px 0;">${htmlAttrInput()}</div>
    <button class="btn" onclick="confirmAttr()">进入人生</button>
    <button class="btn btn-small" onclick="backHome()">返回主界面</button>
  `;
  document.getElementById('game').innerHTML = html;
  for(let key in attributes) {
    document.getElementById('attr_'+key).value = attributes[key];
    document.getElementById('attr_'+key).min = baseAttributes[key]||0;
  }
  document.getElementById('points').innerText = remain();
}
function confirmAttr() {
  let baseAttributes = player.openData.baseAttributes || {};
  let attributes = player.openData.attributes || {...baseAttributes};
  let total = Object.values(attributes).reduce((a,b)=>a+b,0);
  if(100-total > 0) {
    if(!confirm(`你还有${100-total}点未分配，确定进入吗？`)) return;
  }
  player.stage = 'main';
  saveSaves();
  nextStep('main');
}

// ========== 主游戏界面 ==========
function renderMainGame() {
  player.stage = 'main';
  saveSaves();
  let p = player.openData.parents || {};
  let tArr = player.openData.talents || [];
  let talents = tArr.map(id=>data.talents.find(t=>t.id===id));
  let attr = player.openData.attributes || {};
  let html = `<div class="step-title">你的人生开始了！</div>
    <div style="margin-bottom:8px;">
      <b>父母：</b>${p.father||'-'} & ${p.mother||'-'}
      <span style="color:#888;">（家庭收入：${p.family_income||'-'}）</span>
    </div>
    <div style="margin-bottom:8px;">
      <b>天赋：</b>${talents.length ? talents.map(t=>`<span class="talent-${t.type}">${t.name}</span>`).join("、") : "无"}
    </div>
    <div style="margin-bottom:8px;">
      <b>属性：</b>
      颜值${attr.appearance||0}　
      智商${attr.intelligence||0}　
      体质${attr.physique||0}　
      运气${attr.luck||0}　
      家境${attr.family||0}
    </div>
    <hr>
    <div style="color:gray;">
      <b>（下一步：婴儿/幼儿园/小学/初中/高中/大学……后续功能将逐步开放！）</b>
    </div>
    <div style="margin-top:26px;">
      <button class="btn" onclick="resetGame()">重开本人生</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div>
  `;
  document.getElementById('game').innerHTML = html;
}

// 重开本人生（不删除存档，仅重置开局数据和流程）
function resetGame() {
  if(!confirm("确定要重开本存档的人生吗？")) return;
  player.stage = 'born';
  player.openData = {};
  saveSaves();
  step = 'born';
  renderBorn();
}

// ========== 通用入口 ==========
function nextStep(s) {
  step = s;
  if(s === 'parents') renderParents();
  if(s === 'talent') renderTalent();
  if(s === 'attr') renderAttr();
  if(s === 'main') renderMainGame();
}

// ======== 初始化 ========
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderHome();
  });

window.enterSave = enterSave;
window.delSavePrompt = delSavePrompt;
window.newSave = newSave;
window.randomParents = randomParents;
window.nextStep = nextStep;
window.toggleTalent = toggleTalent;
window.renderTalent = renderTalent;
window.confirmTalent = confirmTalent;
window.confirmAttr = confirmAttr;
window.backHome = backHome;
window.resetGame = resetGame;