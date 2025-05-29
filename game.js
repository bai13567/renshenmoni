let data = { items: [], girls: [], news: [] };
let saves = {};      // 所有存档
let currentSave = ""; // 当前激活存档名
let player = null;

// --- 存档管理 ---
function loadSaves() {
  saves = JSON.parse(localStorage.getItem('renshenmoni_saves') || '{}');
}
function saveSaves() {
  localStorage.setItem('renshenmoni_saves', JSON.stringify(saves));
}
function createSave(name) {
  if (!name || saves[name]) return false;
  saves[name] = {
    player: { name: name, money: 100000, mood: 60 },
    girls: JSON.parse(JSON.stringify(data.girls))
  };
  saveSaves();
  return true;
}
function deleteSave(name) {
  delete saves[name];
  saveSaves();
}

// --- 界面渲染 ---
function renderHome() {
  loadSaves();
  let html = `<h2>请选择存档</h2><ul>`;
  for (let key in saves) {
    html += `<li>
      <b>${key}</b>
      <button class="btn btn-small" onclick="enterGame('${key}')">进入</button>
      <button class="btn btn-small danger" onclick="delSave('${key}')">删除</button>
    </li>`;
  }
  html += `</ul>
    <input type="text" id="newSaveName" placeholder="新存档名">
    <button class="btn" onclick="newSave()">新建存档</button>
    <hr>
    <div style="color:#888;">Tips: 你可以建多个不同人生的存档，切换体验不同人生轨迹！</div>
  `;
  document.getElementById('game').innerHTML = html;
  currentSave = ""; // 重点：始终回到主界面时清空当前存档
}

// 进入存档（只有点按钮才进！）
function enterGame(name) {
  currentSave = name;
  player = saves[name].player;
  // girls是每个存档独立进度
  data.girls = JSON.parse(JSON.stringify(saves[name].girls));
  renderGame();
}

// 删除存档
function delSave(name) {
  if (confirm('确定要删除存档 "' + name + '" 吗？此操作不可恢复。')) {
    deleteSave(name);
    renderHome();
  }
}

// 新建存档
function newSave() {
  let name = document.getElementById('newSaveName').value.trim();
  if (!name) { alert('请输入存档名'); return; }
  if (saves[name]) { alert('该名字已存在，请换一个'); return; }
  createSave(name);
  renderHome();
}

// 游戏主界面
function renderGame() {
  let html = `
    <div>
      <b>姓名：</b>${player.name}　
      <b>金钱：</b>￥${player.money}　
      <b>心情：</b>${player.mood}
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div><hr>
    <h3>花钱享受人生</h3>
    <ul>
  `;
  data.items.forEach(item => {
    html += `<li>
      ${item.name}（￥${item.price}，${item.desc}）
      <button class="btn btn-small" onclick="buyItem(${item.id})">购买</button>
    </li>`;
  });
  html += `</ul>
    <h3>社交/恋爱</h3>
    <ul>
  `;
  data.girls.forEach((girl, i) => {
    html += `<li>
      <b>${girl.name}</b>：${girl.desc}　
      好感度：${girl.favor}
      <button class="btn btn-small" onclick="dateGirl(${i})">约会</button>
    </li>`;
  });
  html += `</ul>`;
  document.getElementById('game').innerHTML = html;
  saveCurrent();
}

// 保存当前存档进度
function saveCurrent() {
  if (currentSave && saves[currentSave]) {
    saves[currentSave].player = player;
    saves[currentSave].girls = JSON.parse(JSON.stringify(data.girls));
    saveSaves();
  }
}

// 返回主界面（存档选择）
function backHome() {
  renderHome();
}

// 消费行为
function buyItem(itemId) {
  const item = data.items.find(it => it.id === itemId);
  if (player.money >= item.price) {
    player.money -= item.price;
    player.mood += item.mood || 0;
    alert(`你购买了${item.name}，${item.desc}！`);
  } else {
    alert("钱不够，无法购买！");
  }
  renderGame();
}

// 约会行为
function dateGirl(i) {
  let girl = data.girls[i];
  if (player.mood > 50) {
    girl.favor += 10;
    player.money -= 500;
    alert(`你和${girl.name}约会了一次，好感度+10`);
  } else {
    alert(`心情太低，约会失败`);
  }
  renderGame();
}

// === 数据加载与初始化 ===
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderHome(); // 一定先显示存档选择
  });

window.newSave = newSave;
window.enterGame = enterGame;
window.delSave = delSave;
window.buyItem = buyItem;
window.dateGirl = dateGirl;
window.backHome = backHome;