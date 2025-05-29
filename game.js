let data = {};
let saves = {};
let player = null;
let currentSave = null;

const STAGE_INFO = [
  { name: "婴儿",    months: 36 },
  { name: "幼儿园",  months: 36 },
  { name: "小学",    months: 72 },
  { name: "初中",    months: 36 },
  { name: "高中",    months: 36 },
  { name: "本科",    months: 48 },
  { name: "社会",    months: 0 },
  { name: "硕士",    months: 36 },
  { name: "博士",    months: 48 }
];
const SUBJECTS = ["语文", "数学", "英语", "理综", "文综", "艺术"];
const BASIC_ATTRS = ["appearance", "intelligence", "physique", "family", "luck"];
const ATTRS_CN = { appearance: "颜值", intelligence: "智商", physique: "体质", family: "家境", luck: "运气", mood: "心情", health: "健康" };
const SUBJECTS_CN = { "语文": "语文", "数学": "数学", "英语": "英语", "理综": "理综", "文综": "文综", "艺术": "艺术" };

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function safeSetHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function formatMoney(x) { return Math.floor(x); }
function loadSaves() { try { saves = JSON.parse(localStorage.getItem('renshenmoni_saves') || '{}'); } catch { saves = {}; } }
function saveSaves() { try { localStorage.setItem('renshenmoni_saves', JSON.stringify(saves)); } catch {} }
function loadDataAndStart() {
  fetch('data.json').then(res => res.json()).then(json => { data = json; renderHome(); })
    .catch(e => safeSetHTML('game', "数据加载失败：" + e));
}
window.onload = loadDataAndStart;

// =========== 存档/主流程 ===========
function renderHome() {
  loadSaves();
  let keys = Object.keys(saves);
  let html = `<h2>请选择/管理存档</h2><ul>`;
  if (!keys.length) html += `<li style="color:#999;">暂无存档，请新建</li>`;
  for (let key of keys) {
    html += `<li><b>${key}</b>
      <button class="btn btn-small" onclick="enterSave('${key}')">进入</button>
      <button class="btn btn-small danger" onclick="delSavePrompt('${key}')">删除</button>
    </li>`;
  }
  html += `</ul>
    <input type="text" id="newSaveName" placeholder="新存档名" maxlength="10">
    <button class="btn" onclick="newSave()">新建存档</button>
    <hr><div style="color:#888;font-size:0.96em;">每个存档拥有独立人生轨迹，可反复体验！</div>`;
  safeSetHTML('game', html);
}
function enterSave(name) { player = deepClone(saves[name]); currentSave = name; renderMain(); }
function newSave() {
  let name = document.getElementById('newSaveName').value.trim();
  if (!name || saves[name]) { alert('无效或已存在！'); return; }
  saves[name] = buildNewPlayer(name); saveSaves(); renderHome();
}
function delSavePrompt(name) { if (confirm(`确认删除存档 "${name}"？`)) { delete saves[name]; saveSaves(); renderHome(); } }
function backHome() { player = null; currentSave = null; renderHome(); }
function savePlayer() { if (currentSave) { saves[currentSave] = deepClone(player); saveSaves(); } }
function buildNewPlayer(name) {
  let attrs = {}; BASIC_ATTRS.forEach(k => attrs[k] = 5);
  let subjects = {}; SUBJECTS.forEach(k => subjects[k] = 3);
  return {
    name, age: 0, month: 0, stage: 0, degree: null, parents: null, talents: [],
    mood: 70, health: 90, personalMoney: 0, familyMoney: 20000, attributes: attrs, subjects: subjects,
    unlocks: {}, pets: [], friends: [], stocks: {}, newsSeen: [], lover: null, loveList: [],
    schoolHistory: [], schoolRank: []
  };
}
function renderMain() {
  if (!player) return renderHome();
  if (!player.parents) return renderParents();
  if (!player.talents.length) return renderTalentSelect();
  if (!player.initialAttrDone) return renderAttrSelect();
  renderMonthPanel();
}

// =========== 父母/天赋/属性 ===========
function renderParents() {
  let p = data.parents[Math.floor(Math.random() * data.parents.length)];
  player.parents = p; player.familyMoney = p.baseMoney || 20000; savePlayer();
  safeSetHTML('game', `
    <div class="step-title">你的父母与家庭</div>
    <div style="font-size:1.13em;">父亲职业：<b>${p.father}</b><br>
      母亲职业：<b>${p.mother}</b><br>
      家庭收入：<b>${p.family_income}</b><br>
      <span style="color:#888;">${p.desc}</span>
    </div>
    <div style="margin-top:18px;">
      <button class="btn" onclick="renderParents()">不满意，重随机</button>
      <button class="btn" onclick="renderTalentSelect()">继续</button>
    </div>
  `);
}
function renderTalentSelect() {
  let talents = data.talents, randomTen = [], ids = {};
  while (randomTen.length < 10 && randomTen.length < talents.length) {
    let idx = Math.floor(Math.random() * talents.length);
    if (!ids[idx]) { ids[idx] = 1; randomTen.push(talents[idx]); }
  }
  let selected = player.talents || [];
  let html = `<div class="step-title">选择你的天赋（不限数量）</div><div>`;
  randomTen.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id) ? 'checked' : ''} onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="renderTalentSelect()">换一批天赋</button>
    <button class="btn" onclick="confirmTalentSelect()">选择完毕</button>
    <button class="btn" onclick="chooseAnyTalent()">天选之子（全库任选）</button>`;
  safeSetHTML('game', html);
}
function toggleTalent(cb, id) {
  let arr = player.talents || [];
  if (cb.checked) { if (!arr.includes(id)) arr.push(id); }
  else { let idx = arr.indexOf(id); if (idx > -1) arr.splice(idx, 1); }
  player.talents = arr; savePlayer();
}
function confirmTalentSelect() {
  player.baseAttrFromTalent = {};
  BASIC_ATTRS.forEach(k => player.baseAttrFromTalent[k] = 0);
  SUBJECTS.forEach(k => player.baseAttrFromTalent[k] = 0);
  if (player.talents) {
    player.talents.forEach(id => {
      let t = data.talents.find(x => x.id === id);
      if (t && t.effect) for (let k in t.effect) {
        if (player.baseAttrFromTalent[k] === undefined) player.baseAttrFromTalent[k] = 0;
        player.baseAttrFromTalent[k] += t.effect[k];
      }
    });
  }
  savePlayer(); renderAttrSelect();
}
function chooseAnyTalent() {
  let talents = data.talents, selected = player.talents || [];
  let html = `<div class="step-title">天选之子：全库任选天赋</div><div>`;
  talents.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id) ? 'checked' : ''} onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="confirmTalentSelect()">选好了，进入属性分配</button>
    <button class="btn" onclick="renderTalentSelect()">返回普通天赋抽选</button>`;
  safeSetHTML('game', html);
}
function renderAttrSelect() {
  let maxPoints = 100;
  let attrs = {}; BASIC_ATTRS.forEach(k => {
    attrs[k] = 5 + (player.baseAttrFromTalent && player.baseAttrFromTalent[k] ? player.baseAttrFromTalent[k] : 0);
    if (attrs[k] < 0) attrs[k] = 0; if (attrs[k] > 10) attrs[k] = 10;
  });
  let pointsUsed = Object.values(attrs).reduce((a, b) => a + b, 0);
  let left = maxPoints - pointsUsed;
  let html = `<div class="step-title">分配初始属性（共100点，每项最多10）</div>
    <div>天赋已加成，剩余可分配：<b id="points">${left}</b></div><div>`;
  BASIC_ATTRS.forEach(k => {
    html += `${ATTRS_CN[k]}：<input type="number" id="attr_${k}" min="${attrs[k]}" max="10" value="${attrs[k]}" style="width:38px;">　`;
    if (k == "physique") html += "<br>";
  });
  html += `</div><button class="btn" onclick="finishAttrSelect()">确定</button>`;
  safeSetHTML('game', html);
  BASIC_ATTRS.forEach(k => {
    document.getElementById('attr_' + k).onchange = function () {
      let vals = {}, used = 0;
      BASIC_ATTRS.forEach(j => {
        vals[j] = parseInt(document.getElementById('attr_' + j).value) || attrs[j];
        if (vals[j] < attrs[j]) vals[j] = attrs[j];
        if (vals[j] > 10) vals[j] = 10; used += vals[j];
      });
      let left = maxPoints - used;
      document.getElementById('points').innerText = left < 0 ? 0 : left;
      if (left < 0) { this.value = vals[k] + left; document.getElementById('points').innerText = 0; }
    }
  });
}
function finishAttrSelect() {
  let maxPoints = 100, vals = {}, used = 0;
  BASIC_ATTRS.forEach(k => { vals[k] = parseInt(document.getElementById('attr_' + k).value) || 5; used += vals[k]; });
  if (used > maxPoints) return alert('分配超出上限！');
  player.attributes = vals; player.subjects = {};
  SUBJECTS.forEach(s => player.subjects[s] = 3 + (player.baseAttrFromTalent && player.baseAttrFromTalent[s] ? player.baseAttrFromTalent[s] : 0));
  player.mood = 70 + (player.baseAttrFromTalent && player.baseAttrFromTalent.mood ? player.baseAttrFromTalent.mood : 0);
  player.health = 90; player.money = 10000 + (player.baseAttrFromTalent && player.baseAttrFromTalent.money ? player.baseAttrFromTalent.money : 0);
  player.personalMoney = 0; player.initialAttrDone = true;
  savePlayer(); renderMain();
}

// =========== 月度主面板 ===========
function renderMonthPanel() {
  let stageObj = STAGE_INFO[player.stage];
  let ageStr = `${Math.floor(player.month / 12)}岁${player.month % 12}月`;
  let html = `<div class="step-title">当前阶段：${stageObj.name}　年龄：${ageStr}　学历：${player.degree || "无"}</div>
    <div>家庭资产：${formatMoney(player.familyMoney)}　个人资产：${formatMoney(player.personalMoney)}　心情：${player.mood}　健康：${player.health}</div>
    <div>`;
  if (player.stage >= 2) html += `<button class="btn" onclick="doStudy()">学习</button>`;
  if (player.unlocks && player.unlocks.work) html += `<button class="btn" onclick="doWork()">打工/兼职</button>`;
  if (player.unlocks && player.unlocks.friends) html += `<button class="btn" onclick="doFriend()">交朋友</button>`;
  if (player.unlocks && player.unlocks.pets) html += `<button class="btn" onclick="doPet()">宠物市场</button>`;
  if (player.unlocks && player.unlocks.stock) html += `<button class="btn" onclick="doStock()">股票投资</button>`;
  if (player.unlocks && player.unlocks.phone) html += `<button class="btn" onclick="doNews()">看新闻</button>`;
  if (player.unlocks && player.unlocks.love) html += `<button class="btn" onclick="doLove()">恋爱</button>`;
  if (player.unlocks && player.unlocks.entertain) html += `<button class="btn" onclick="doEntertain()">娱乐</button>`;
  html += `<button class="btn" style="background:#0b5;" onclick="nextMonth()">下一个月</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button></div>`;
  safeSetHTML('game', html);
}

// =========== 月推进不卡死核心 ===========
function nextMonth() {
  document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
  setTimeout(() => {
    player.studyThisMonth = false;
    player.month += 1; player.age = Math.floor(player.month / 12);
    if (player.stage <= 5) {
      let pocketMoney = 50 + player.stage * 80 + Math.floor(Math.random() * 50);
      if (pocketMoney > 500) pocketMoney = 500;
      player.personalMoney += pocketMoney;
    }
    let baseSpend = 600 + player.stage * 300 + Math.floor(Math.random() * 200);
    player.familyMoney -= baseSpend; if (player.familyMoney < 0) player.familyMoney = 0;
    player.mood += Math.floor(Math.random() * 7 - 3); player.health += Math.floor(Math.random() * 4 - 2);
    if (player.health < 60 && Math.random() < 0.2) {
      let cost = 300 + Math.floor(Math.random() * 400);
      player.personalMoney -= cost; player.health += 25 + Math.floor(Math.random() * 10);
      if (player.personalMoney < 0) player.personalMoney = 0;
      if (player.health > 100) player.health = 100;
    }
    if (player.health > 100) player.health = 100;
    if (player.health < 0) player.health = 0;
    if (player.mood > 100) player.mood = 100;
    if (player.mood < 0) player.mood = 0;
    if (player.job) { player.personalMoney += player.job.salary; player.mood += 1; }
    if (player.personalMoney > 0 && Math.random() < 0.13) {
      let spend = Math.floor(player.personalMoney * Math.random() * 0.04);
      player.personalMoney -= spend; player.mood += 2; if (player.personalMoney < 0) player.personalMoney = 0;
    }
    updateStocks();
    if (Math.random() < 0.2) triggerRandomNews();
    if (player.stage === 2) player.unlocks.pets = true, player.unlocks.friends = true;
    if (player.stage === 3) player.unlocks.phone = true, player.unlocks.stock = true;
    if (player.stage === 4) player.unlocks.work = true;
    if (player.stage === 5) player.unlocks.love = true, player.unlocks.entertain = true;
    // 可加checkGraduation()等其它晋升判断
    savePlayer();
    renderMonthPanel();
  }, 8);
}

// =========== 学习 ===========
function doStudy() {
  if (player.studyThisMonth) return alert("本月已学习！"), renderMonthPanel();
  let html = `<div class="step-title">学习</div><div>选择你本月要主攻提升的学科：</div>`;
  SUBJECTS.forEach(s => { html += `<button class="btn btn-small" onclick="studySubject('${s}')">${s}</button> `; });
  html += `<br><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function studySubject(subj) {
  if (player.studyThisMonth) return renderMonthPanel();
  let delta = 1 + Math.floor(player.attributes.intelligence / 5);
  if (player.baseAttrFromTalent && player.baseAttrFromTalent.learning) delta += 1;
  if (!player.subjects[subj]) player.subjects[subj] = 3;
  player.subjects[subj] += delta;
  if (player.subjects[subj] > 10) player.subjects[subj] = 10;
  player.mood -= 2; player.health -= 1; player.studyThisMonth = true;
  savePlayer(); alert(`你专心学习，${subj}提升了${delta}点！`); renderMonthPanel();
}

// =========== 打工 ===========
function doWork() {
  let jobs = data.jobs, html = `<div class="step-title">选择兼职</div>`;
  jobs.forEach((j, idx) => {
    let ok = Object.keys(j.min).every(attr => player.attributes[attr] >= j.min[attr]);
    html += `<button class="btn btn-small" onclick="chooseWork(${idx})" ${ok ? "" : "disabled"}>${j.name}（${j.salary}元/月）</button> `;
  });
  html += `<br><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function chooseWork(idx) {
  player.job = data.jobs[idx]; savePlayer();
  alert("你获得了兼职：" + player.job.name);
  renderMonthPanel();
}

// =========== 交朋友 ===========
function doFriend() {
  let friends = player.friends || [], html = `<div class="step-title">朋友</div>`;
  if (friends.length) {
    html += `<div>已有朋友：</div><ul>`;
    friends.forEach((f, idx) => {
      html += `<li>${f.name}（好感${f.favor}）<button class="btn btn-small" onclick="friendInteract(${idx})">互动</button></li>`;
    });
    html += `</ul>`;
  }
  html += `<button class="btn" onclick="addFriend()">认识新朋友</button>
    <button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function addFriend() {
  let names = data.friends || ["李明", "王丽", "赵强", "刘佳", "陈思", "张敏"];
  let used = (player.friends || []).map(f => f.name);
  let candidates = names.filter(n => !used.includes(n));
  let newf = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : "新朋友";
  player.friends = player.friends || [];
  player.friends.push({ name: newf, favor: 5 + Math.floor(Math.random() * 5) });
  player.mood += 3;
  savePlayer(); alert(`你认识了新朋友：${newf}`); doFriend();
}
function friendInteract(idx) {
  let f = player.friends[idx];
  let delta = 2 + Math.floor(Math.random() * 4);
  f.favor += delta; player.mood += 2;
  savePlayer(); alert(`${f.name} 好感度提升！`); doFriend();
}

// =========== 宠物 ===========
function doPet() {
  let pets = player.pets || [], html = `<div class="step-title">宠物市场</div>`;
  if (pets.length) {
    html += `<div>我的宠物：</div><ul>`;
    pets.forEach((p, idx) => {
      html += `<li>${p.type}（健康${p.health}，市价${p.price}元）
        <button class="btn btn-small" onclick="sellPet(${idx})">卖出</button>
        <button class="btn btn-small" onclick="petInteract(${idx})">互动</button>
      </li>`;
    });
    html += `</ul>`;
  }
  html += `<button class="btn" onclick="addPet()">购买新宠物</button>
    <button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function addPet() {
  let pets = data.petMarket || [
    { type: "猫", min: 800, max: 2000 },
    { type: "狗", min: 1000, max: 2200 }
  ];
  let candidates = pets.map(t => {
    let now = t.min + Math.floor(Math.random() * (t.max - t.min + 1));
    return { type: t.type, price: now, health: 10 + Math.floor(Math.random() * 5) };
  });
  let html = `<div class="step-title">宠物市场</div><div>选择购买：</div>`;
  candidates.forEach((p, idx) => {
    html += `<button class="btn btn-small" onclick="buyPet('${p.type}',${p.price},${p.health})">${p.type}（${p.price}元）</button>　`;
  });
  html += `<br><button class="btn" onclick="doPet()">返回</button>`;
  safeSetHTML('game', html);
}
function buyPet(type, price, health) {
  if (player.personalMoney < price) { alert("资产不足！"); doPet(); return; }
  player.personalMoney -= price; player.pets = player.pets || [];
  player.pets.push({ type, price, health }); savePlayer();
  alert(`你购买了一只${type}`); doPet();
}
function sellPet(idx) {
  let p = player.pets[idx];
  player.personalMoney += p.price;
  player.pets.splice(idx, 1); savePlayer();
  alert(`你卖出了${p.type}，获得${p.price}元`); doPet();
}
function petInteract(idx) {
  let p = player.pets[idx];
  p.health += 2 + Math.floor(Math.random() * 3);
  if (p.health > 15) p.health = 15;
  player.mood += 3; savePlayer();
  alert(`你和${p.type}互动，宠物更健康，心情提升！`); doPet();
}

// =========== 股票 ===========
function doStock() {
  let stockList = data.stocks, pstocks = player.stocks || {};
  let html = `<div class="step-title">股票投资</div><table border="0" cellpadding="4"><tr>
    <th>名称</th><th>现价</th><th>持仓</th><th>买入</th><th>卖出</th></tr>`;
  stockList.forEach(s => {
    let holding = pstocks[s.id]?.count || 0;
    html += `<tr>
      <td>${s.name}</td>
      <td>${s.price.toFixed(2)}</td>
      <td>${holding}</td>
      <td><input id="buy_${s.id}" type="number" min="1" style="width:48px;">
        <button class="btn btn-small" onclick="buyStock(${s.id})">买入</button></td>
      <td><input id="sell_${s.id}" type="number" min="1" max="${holding}" style="width:48px;">
        <button class="btn btn-small" onclick="sellStock(${s.id})">卖出</button></td>
    </tr>`;
  });
  html += `</table><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function buyStock(id) {
  let cnt = parseInt(document.getElementById('buy_' + id).value) || 0;
  if (cnt <= 0) return alert("输入买入数量！");
  let s = data.stocks.find(x => x.id === id);
  let cost = cnt * s.price;
  if (cost > player.personalMoney) return alert("现金不足！");
  player.personalMoney -= cost;
  player.stocks = player.stocks || {};
  let pstk = player.stocks[id] || { count: 0, buyPrice: 0 };
  pstk.buyPrice = ((pstk.count * pstk.buyPrice) + (cnt * s.price)) / (pstk.count + cnt);
  pstk.count += cnt;
  player.stocks[id] = pstk;
  savePlayer(); alert(`买入成功，花费${parseInt(cost)}元`); doStock();
}
function sellStock(id) {
  let cnt = parseInt(document.getElementById('sell_' + id).value) || 0;
  let pstk = player.stocks[id] || { count: 0, buyPrice: 0 };
  if (cnt <= 0 || cnt > pstk.count) return alert("输入卖出数量！");
  let s = data.stocks.find(x => x.id === id);
  let earn = cnt * s.price;
  pstk.count -= cnt;
  if (pstk.count === 0) pstk.buyPrice = 0;
  player.stocks[id] = pstk;
  player.personalMoney += earn;
  savePlayer(); alert(`卖出成功，获得${parseInt(earn)}元`); doStock();
}
function updateStocks() {
  data.stocks.forEach(s => {
    let rand = (Math.random() - 0.5) * 2 * s.volatility;
    let factor = 1 + rand;
    let min = s.min || s.price * 0.5;
    let max = s.max || s.price * 2.5;
    s.price = Math.max(min, Math.min(max, s.price * factor));
    s.price = Math.round(s.price * 100) / 100;
  });
}

// =========== 新闻 ===========
function doNews() {
  let all = data.news;
  let i = Math.floor(Math.random() * all.length);
  let news = all[i];
  player.newsSeen = player.newsSeen || [];
  if (!player.newsSeen.includes(news.id)) player.newsSeen.push(news.id);
  applyNewsEffect(news);
  savePlayer(); alert(`【新闻】${news.title}`); renderMonthPanel();
}
function triggerRandomNews() {
  let n = data.news[Math.floor(Math.random() * data.news.length)];
  applyNewsEffect(n); savePlayer(); alert(`[新闻事件] ${n.title}`);
}
function applyNewsEffect(n) {
  let effect = n.effect.split(";");
  effect.forEach(e => {
    if (e.startsWith("money+")) player.personalMoney += parseInt(e.slice(6));
    if (e.startsWith("money-")) player.personalMoney -= parseInt(e.slice(6));
    if (e.startsWith("mood+")) player.mood += parseInt(e.slice(5));
    if (e.startsWith("mood-")) player.mood -= parseInt(e.slice(5));
    if (e.startsWith("stock:")) {
      let arr = e.split(":")[1].split("+");
      let name = arr[0]; let plus = arr[1] || "";
      let perc = parseFloat(plus) / 100;
      let s = data.stocks.find(x => x.name === name);
      if (s) s.price = Math.round(s.price * (1 + perc) * 100) / 100;
    }
    if (e.startsWith("stock:") && e.indexOf("-") > -1) {
      let arr = e.split(":")[1].split("-");
      let name = arr[0]; let minus = arr[1] || "";
      let perc = parseFloat(minus) / 100;
      let s = data.stocks.find(x => x.name === name);
      if (s) s.price = Math.round(s.price * (1 - perc) * 100) / 100;
    }
    if (e.startsWith("stocks:all+")) {
      let perc = parseFloat(e.split("stocks:all+")[1]) / 100;
      data.stocks.forEach(s => s.price = Math.round(s.price * (1 + perc) * 100) / 100);
    }
    if (e.startsWith("stocks:all-")) {
      let perc = parseFloat(e.split("stocks:all-")[1]) / 100;
      data.stocks.forEach(s => s.price = Math.round(s.price * (1 - perc) * 100) / 100);
    }
  });
}

// =========== 娱乐 ===========
function doEntertain() {
  let html = `<div class="step-title">选择娱乐方式</div>`;
  let options = [], age = Math.floor(player.month / 12);
  if (age < 6) options = [{ name: "玩积木", mood: 8, cost: 0 }];
  else if (age < 12) options = [
    { name: "公园散步", mood: 7, cost: 0 },
    { name: "社区游戏厅", mood: 12, cost: 10 }
  ];
  else if (age < 18) options = [
    { name: "桌游聚会", mood: 10, cost: 15 },
    { name: "网吧体验", mood: 14, cost: 30 }
  ];
  else options = [
    { name: "KTV嗨唱", mood: 18, cost: 120 },
    { name: "酒吧夜场", mood: 20, cost: 180 },
    { name: "高端自助餐", mood: 16, cost: 260 }
  ];
  options.forEach(o => {
    html += `<button class="btn btn-small" onclick="doEntertainAction(${o.mood},${o.cost})">${o.name}（+${o.mood}心情，花费${o.cost}元）</button>　`;
  });
  html += `<br><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function doEntertainAction(mood, cost) {
  if (player.personalMoney < cost) { alert("资产不足！"); doEntertain(); return; }
  player.mood += mood; player.personalMoney -= cost;
  if (player.mood > 100) player.mood = 100; savePlayer();
  alert("娱乐完毕，心情提升！"); renderMonthPanel();
}

// =========== 恋爱 ===========
function doLove() {
  if (!player.loveList) player.loveList = [];
  let girls = data.girls, html = `<div class="step-title">恋爱发展</div><div>可互动女生：</div><ul>`;
  girls.forEach((g, idx) => {
    let lover = player.loveList.find(l => l.name === g.name);
    html += `<li>${g.name}（${g.desc}，好感${lover ? lover.favor : 0}）
      <button class="btn btn-small" onclick="loveInteract(${idx})">互动</button>
      <button class="btn btn-small" onclick="loveGift(${idx})">送礼</button>`;
    if (lover && lover.favor >= 60 && !player.lover) {
      html += `<button class="btn btn-small" onclick="loveTry('${g.name}')">表白</button>`;
    }
    html += `</li>`;
  });
  html += `</ul><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  safeSetHTML('game', html);
}
function loveInteract(idx) {
  let g = data.girls[idx];
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === g.name);
  if (!lover) { lover = { name: g.name, favor: 5 }; player.loveList.push(lover); }
  lover.favor += 5 + Math.floor(Math.random() * 5);
  player.mood += 3; savePlayer();
  alert(`你和${g.name}相处了一会，好感度提升！`); doLove();
}
function loveGift(idx) {
  let g = data.girls[idx];
  if (player.personalMoney < 500) { alert("没钱送礼！"); doLove(); return; }
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === g.name);
  if (!lover) { lover = { name: g.name, favor: 10 }; player.loveList.push(lover); }
  lover.favor += 12 + Math.floor(Math.random() * 8);
  player.personalMoney -= 500; player.mood += 6;
  savePlayer(); alert(`你为${g.name}送上礼物，好感度提升！`); doLove();
}
function loveTry(name) {
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === name);
  let ok = (lover && lover.favor >= 60 && Math.random() < 0.9) ? true : false;
  if (ok) {
    player.lover = name; player.mood += 20;
    savePlayer(); alert("表白成功！你和" + name + "成为情侣！");
  } else { player.mood -= 5; alert("表白被婉拒，下次再努力！"); }
  renderMonthPanel();
}

// =========== 状态栏 ===========
function showStatus() {
  if (!player) { alert('请先进入存档！'); return; }
  let attr = player.attributes, subj = player.subjects;
  let html = `<b>基础属性</b><table>`;
  BASIC_ATTRS.forEach(k => { html += `<tr><th>${ATTRS_CN[k]}</th><td>${attr[k]}</td></tr>`; });
  html += `<tr><th>心情</th><td>${player.mood}</td></tr><tr><th>健康</th><td>${player.health}</td></tr>`;
  html += `<tr><th>家庭资产</th><td>${parseInt(player.familyMoney)}</td></tr>
           <tr><th>个人资产</th><td>${parseInt(player.personalMoney)}</td></tr>`;
  html += `</table><b>学科分</b><table>`;
  SUBJECTS.forEach(k => { html += `<tr><th>${SUBJECTS_CN[k]}</th><td>${subj[k]}</td></tr>`; });
  html += `</table><b>当前阶段</b><div>${STAGE_INFO[player.stage].name}</div>`;
  if (player.degree) html += `<div>最高学历：${player.degree}</div>`;
  if (player.schoolHistory && player.schoolHistory.length) {
    html += `<b>学校履历：</b>`; player.schoolHistory.forEach((item, i) => {
      html += `<div>${item} (${player.schoolRank[i] || ""})</div>`;
    });
  }
  html += `<b>已解锁功能：</b>`;
  let unlockStr = Object.entries(player.unlocks).filter(([k, v]) => v).map(([k]) => k).join("，") || "无";
  html += unlockStr;
  document.getElementById('statusContent').innerHTML = html;
  document.getElementById('statusOverlay').style.display = "block";
}
function closeStatus() { document.getElementById('statusOverlay').style.display = "none"; }

// ========= 导航暴露 =========
window.studySubject = studySubject;
window.addFriend = addFriend;
window.addPet = addPet;
window.buyStock = buyStock;
window.sellStock = sellStock;
window.loveTry = loveTry;
window.friendInteract = friendInteract;
window.petInteract = petInteract;
window.sellPet = sellPet;
window.loveInteract = loveInteract;
window.loveGift = loveGift;
window.doEntertainAction = doEntertainAction;
window.backHome = backHome;
window.showStatus = showStatus;
window.closeStatus = closeStatus;
window.doStudy = doStudy;
window.doWork = doWork;
window.doFriend = doFriend;
window.doPet = doPet;
window.doStock = doStock;
window.doNews = doNews;
window.doLove = doLove;
window.doEntertain = doEntertain;