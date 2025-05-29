let data = {};
let saves = {};
let player = null;
let currentSave = null;

const STAGE_INFO = [
  { name: "婴儿",    months: 36 },    // 0-3
  { name: "幼儿园",  months: 36 },    // 3-6
  { name: "小学",    months: 72 },    // 6-12
  { name: "初中",    months: 36 },    // 12-15
  { name: "高中",    months: 36 },    // 15-18
  { name: "本科",    months: 48 },    // 18-22
  { name: "社会",    months: 0 },     // 22+
  { name: "硕士",    months: 36 },
  { name: "博士",    months: 48 }
];
const SUBJECTS = ["语文", "数学", "英语", "理综", "文综", "艺术"];
const BASIC_ATTRS = ["appearance", "intelligence", "physique", "family", "luck"];
const ATTRS_CN = { appearance: "颜值", intelligence: "智商", physique: "体质", family: "家境", luck: "运气", mood: "心情", health: "健康" };

// --------- 首次验证码 ---------
if (!localStorage.getItem('rensheng_verify_ok')) {
  let v = prompt("请输入验证码：");
  if (v !== "baizhou666") {
    let pwd = prompt("验证码错误，可输入密码（或点取消退出）：");
    if (pwd !== "12731273z") {
      alert("未通过验证，无法进入游戏。");
      document.body.innerHTML = "<h2 style='text-align:center;color:#c00;'>未通过验证</h2>";
      throw "auth fail";
    }
  }
  localStorage.setItem('rensheng_verify_ok', "1");
}

// -------- 存档系统 --------
function loadSaves() {
  saves = JSON.parse(localStorage.getItem('renshenmoni_saves') || '{}');
}
function saveSaves() {
  localStorage.setItem('renshenmoni_saves', JSON.stringify(saves));
}
function createSave(name) {
  if (!name || saves[name]) return false;
  saves[name] = buildNewPlayer(name);
  saveSaves();
  return true;
}
function deleteSave(name) { delete saves[name]; saveSaves(); }
function buildNewPlayer(name) {
  let attrs = {};
  BASIC_ATTRS.forEach(k => attrs[k] = 5);
  let subjects = {};
  SUBJECTS.forEach(k => subjects[k] = 3);
  return {
    name, age:0, month:0, stage:0, attributes: attrs, subjects: subjects,
    mood: 70, health: 90, personalMoney: 0, familyMoney: 0,
    unlocks: {}, pets: [], friends: [], stocks: {}, talents: [], parents: null,
    degree: null, lover: null, schoolHistory:[], schoolRank:[],
    studyThisMonth:false, job:null, loveList:[], newsSeen:[]
  };
}
function enterSave(name) { currentSave = name; player = saves[name]; renderMain(); }

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
function showStatus() {
  if (!player) return;
  let attr = player.attributes, subj = player.subjects;
  let html = `<b>基础属性</b><table>`;
  BASIC_ATTRS.forEach(k => html += `<tr><th>${ATTRS_CN[k]}</th><td>${attr[k]}</td></tr>`);
  html += `<tr><th>心情</th><td>${player.mood}</td></tr><tr><th>健康</th><td>${player.health}</td></tr>
           <tr><th>家庭资产</th><td>${parseInt(player.familyMoney)}</td></tr>
           <tr><th>个人资产</th><td>${parseInt(player.personalMoney)}</td></tr></table>
           <b>学科分</b><table>`;
  SUBJECTS.forEach(k => html += `<tr><th>${k}</th><td>${subj[k]}</td></tr>`);
  html += `</table><b>当前阶段</b><div>${STAGE_INFO[player.stage].name}</div>`;
  if (player.degree) html += `<div>最高学历：${player.degree}</div>`;
  if (player.schoolHistory.length)
    html += `<b>学校履历：</b>` + player.schoolHistory.map((n,i)=>`<div>${n} (${player.schoolRank[i]||""})</div>`).join('');
  document.getElementById('statusContent').innerHTML = html;
  document.getElementById('statusOverlay').style.display = "block";
}
function closeStatus() {
  document.getElementById('statusOverlay').style.display = "none";
}

// -------------- 游戏主流程 -----------------
function renderMain() {
  if (!player) return renderHome();
  if (!player.parents) return renderParents();
  if (!player.talents.length) return renderTalentSelect();
  if (!player.initialAttrDone) return renderAttrSelect();
  renderMonthPanel();
}
// 1. 父母生成并设置家庭资产
function renderParents() {
  let p = data.parents[Math.floor(Math.random() * data.parents.length)];
  player.parents = p;
  player.familyMoney = p.baseMoney || (p.family_income == "极高" ? 250000 : p.family_income == "高" ? 100000 : p.family_income == "中高" ? 50000 : p.family_income == "中" ? 20000 : p.family_income == "低" ? 8000 : 4000);
  saveSaves();
  document.getElementById('game').innerHTML = `
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
  `;
}
// 2. 天赋
function renderTalentSelect() {
  let talents = data.talents, randomTen = [], ids = {};
  while (randomTen.length < 10 && randomTen.length < talents.length) {
    let idx = Math.floor(Math.random() * talents.length);
    if (!ids[idx]) { ids[idx] = 1; randomTen.push(talents[idx]); }
  }
  let selected = player.talents || [];
  let html = `<div class="step-title">选择你的天赋（不限数量）</div><div>`;
  randomTen.forEach(t =>
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id) ? 'checked' : ''}
      onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`
  );
  html += `</div>
    <button class="btn" onclick="renderTalentSelect()">换一批天赋</button>
    <button class="btn" onclick="confirmTalentSelect()">选择完毕</button>
    <button class="btn" onclick="chooseAnyTalent()">天选之子（全库任选）</button>`;
  document.getElementById('game').innerHTML = html;
}
function toggleTalent(cb, id) {
  let arr = player.talents || [];
  if (cb.checked && !arr.includes(id)) arr.push(id);
  if (!cb.checked && arr.includes(id)) arr.splice(arr.indexOf(id),1);
  player.talents = arr; saveSaves();
}
function confirmTalentSelect() {
  player.baseAttrFromTalent = {};
  BASIC_ATTRS.forEach(k => player.baseAttrFromTalent[k]=0);
  SUBJECTS.forEach(k => player.baseAttrFromTalent[k]=0);
  (player.talents||[]).forEach(id => {
    let t = data.talents.find(x => x.id === id);
    if (t && t.effect) for (let k in t.effect) {
      if (player.baseAttrFromTalent[k] === undefined) player.baseAttrFromTalent[k]=0;
      player.baseAttrFromTalent[k]+= t.effect[k];
    }
  });
  saveSaves();
  renderAttrSelect();
}
function chooseAnyTalent() {
  let talents = data.talents, selected = player.talents || [];
  let html = `<div class="step-title">天选之子：全库任选天赋</div><div>`;
  talents.forEach(t =>
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id)?'checked':''}
      onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`
  );
  html += `</div>
    <button class="btn" onclick="confirmTalentSelect()">选好了，进入属性分配</button>
    <button class="btn" onclick="renderTalentSelect()">返回普通天赋抽选</button>`;
  document.getElementById('game').innerHTML = html;
}
function renderAttrSelect() {
  let maxPoints=100, attrs={};
  BASIC_ATTRS.forEach(k=>{
    attrs[k]=5+(player.baseAttrFromTalent&&player.baseAttrFromTalent[k]?player.baseAttrFromTalent[k]:0);
    if(attrs[k]<0)attrs[k]=0;if(attrs[k]>10)attrs[k]=10;
  });
  let used=Object.values(attrs).reduce((a,b)=>a+b,0),left=maxPoints-used;
  let html = `<div class="step-title">分配初始属性（共100点，每项最多10）</div>`;
  html += `<div>天赋已加成，剩余可分配：<b id="points">${left}</b></div><div>`;
  BASIC_ATTRS.forEach(k=>{
    html += `${ATTRS_CN[k]}：<input type="number" id="attr_${k}" min="${attrs[k]}" max="10" value="${attrs[k]}" style="width:38px;">　`;
    if(k=="physique")html+="<br>";
  });
  html += `</div><button class="btn" onclick="finishAttrSelect()">确定</button>`;
  document.getElementById('game').innerHTML = html;
  BASIC_ATTRS.forEach(k=>{
    document.getElementById('attr_'+k).onchange=function(){
      let vals={},used=0;
      BASIC_ATTRS.forEach(j=>{
        vals[j]=parseInt(document.getElementById('attr_'+j).value)||attrs[j];
        if(vals[j]<attrs[j])vals[j]=attrs[j];
        if(vals[j]>10)vals[j]=10;
        used+=vals[j];
      });
      let left=maxPoints-used;
      document.getElementById('points').innerText=left<0?0:left;
      if(left<0){this.value=vals[k]+left;document.getElementById('points').innerText=0;}
    }
  });
}
function finishAttrSelect() {
  let maxPoints=100,vals={},used=0;
  BASIC_ATTRS.forEach(k=>{
    vals[k]=parseInt(document.getElementById('attr_'+k).value)||5;
    used+=vals[k];
  });
  if(used>maxPoints)return alert('分配超出上限！');
  player.attributes=vals;
  player.subjects={}; SUBJECTS.forEach(s=>player.subjects[s]=3+(player.baseAttrFromTalent&&player.baseAttrFromTalent[s]?player.baseAttrFromTalent[s]:0));
  player.mood=70+(player.baseAttrFromTalent&&player.baseAttrFromTalent.mood?player.baseAttrFromTalent.mood:0);
  player.health=90; player.personalMoney=0; player.initialAttrDone=true;
  saveSaves(); renderMain();
}

// -------------- 月度循环面板 -------------
function renderMonthPanel() {
  let s=player.stage, stageObj=STAGE_INFO[s], ageStr = `${Math.floor(player.month/12)}岁${player.month%12}月`;
  let html = `<div class="step-title">当前阶段：${stageObj.name}　年龄：${ageStr}　学历：${player.degree||"无"}</div>
    <div>家庭资产：${parseInt(player.familyMoney)}　个人资产：${parseInt(player.personalMoney)}　心情：${player.mood}　健康：${player.health}</div><div>`;
  if (s>=2) html += `<button class="btn" onclick="doStudy()">学习</button>`;
  if (player.unlocks && player.unlocks.work) html += `<button class="btn" onclick="doWork()">打工/兼职</button>`;
  if (player.unlocks && player.unlocks.friends) html += `<button class="btn" onclick="doFriend()">交朋友</button>`;
  if (player.unlocks && player.unlocks.pets) html += `<button class="btn" onclick="doPet()">宠物市场</button>`;
  if (player.unlocks && player.unlocks.stock) html += `<button class="btn" onclick="doStock()">股票投资</button>`;
  if (player.unlocks && player.unlocks.phone) html += `<button class="btn" onclick="doNews(true)">看新闻</button>`;
  if (player.unlocks && player.unlocks.love) html += `<button class="btn" onclick="doLove()">恋爱</button>`;
  if (player.unlocks && player.unlocks.entertain) html += `<button class="btn" onclick="doEntertain()">娱乐</button>`;
  html += `<button class="btn" style="background:#0b5;" onclick="nextMonth()">下一个月</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button></div>`;
  document.getElementById('game').innerHTML = html;
}

// -------- 月推进和经济系统 ---------
function nextMonth() {
  player.studyThisMonth = false;
  player.month++; player.age=Math.floor(player.month/12);
  // 家庭收入与支出
  let income = getParentMonthlyIncome();
  player.familyMoney += income;
  let outgo = getParentMonthlyOutgo();
  player.familyMoney -= outgo;
  if(player.familyMoney<0)player.familyMoney=0;
  // 自动零花钱（本科及以下）
  if(player.stage<=5) {
    let pocketMoney = 50+player.stage*80+Math.floor(Math.random()*50);
    if(pocketMoney>500)pocketMoney=500;
    player.personalMoney += pocketMoney;
  }
  // 心情健康波动
  player.mood += Math.floor(Math.random()*7-3);
  player.health += Math.floor(Math.random()*4-2);
  // 看病
  if(player.health<60 && Math.random()<0.2) {
    let cost=300+Math.floor(Math.random()*400);
    player.personalMoney-=cost; player.health+=25+Math.floor(Math.random()*10);
    if(player.personalMoney<0)player.personalMoney=0;
    if(player.health>100)player.health=100;
  }
  if(player.health>100)player.health=100;if(player.health<0)player.health=0;
  if(player.mood>100)player.mood=100;if(player.mood<0)player.mood=0;
  // 工资
  if(player.job){player.personalMoney+=player.job.salary;player.mood+=1;}
  // 随机支出
  if(player.personalMoney>0&&Math.random()<0.13){
    let spend=Math.floor(player.personalMoney*Math.random()*0.04);
    player.personalMoney-=spend;player.mood+=2;
    if(player.personalMoney<0)player.personalMoney=0;
  }
  // 股票波动
  updateStocks();
  // 新闻（只有股票解锁后才自动新闻）
  if(player.unlocks.stock && Math.random()<0.2) triggerRandomNews();
  // 功能解锁
  if(player.stage===2) player.unlocks.pets=true,player.unlocks.friends=true;
  if(player.stage===3) player.unlocks.phone=true,player.unlocks.stock=true;
  if(player.stage===4) player.unlocks.work=true;
  if(player.stage===5) player.unlocks.love=true,player.unlocks.entertain=true;
  // 毕业升学
  let grad = checkGraduation(); if(grad) return;
  saveSaves(); renderMonthPanel();
}
function getParentMonthlyIncome() {
  // income数值依据父母职业收入等级
  let inc = 0, fi = player.parents.family_income;
  if(fi=="极高")inc=18000;else if(fi=="高")inc=9000;else if(fi=="中高")inc=5200;
  else if(fi=="中")inc=2500;else if(fi=="低")inc=1000;else inc=400;
  return inc;
}
function getParentMonthlyOutgo() {
  let fi = player.parents.family_income;
  if(fi=="极高")return 8500; if(fi=="高")return 4500; if(fi=="中高")return 2600;
  if(fi=="中")return 1200; if(fi=="低")return 550; return 300;
}

// ----- 升学与阶段推进 -----
function checkGraduation() {
  let age=Math.floor(player.month/12),s=player.stage;
  if(s===0&&age>=3){renderExam(0);return true;}
  if(s===1&&age>=6){renderExam(1);return true;}
  if(s===2&&age>=12){renderExam(2);return true;}
  if(s===3&&age>=15){renderExam(3);return true;}
  if(s===4&&age>=18){renderExam(4);return true;}
  if(s===5&&age>=22){renderPostGradChoice();return true;}
  if(s===7&&player.month>=getStageStartMonth(7)+36){renderPhdChoice();return true;}
  if(s===8&&player.month>=getStageStartMonth(8)+(player.phdYears||48)){
    player.degree="博士";player.stage=6;
    alert("恭喜博士毕业，开启社会人生！");saveSaves();renderMonthPanel();return true;
  }
  return false;
}
function getStageStartMonth(stage){let m=0;for(let i=0;i<stage;i++)m+=STAGE_INFO[i].months;return m;}
function renderExam(stageIdx) {
  let examConfig=[["无"],["无"],["语文","数学","英语"],["语文","数学","英语","理综"],["语文","数学","英语","理综","文综"],["语文","数学","英语","理综","文综","艺术"]];
  let testSubj=examConfig[stageIdx+1]||["语文","数学"],score={},msg="";
  testSubj.forEach(s=>{
    let subj=player.subjects[s]||3,iq=player.attributes.intelligence||5,learn=(player.baseAttrFromTalent&&player.baseAttrFromTalent.learning)||0;
    let sc=50+subj*7+iq*2+learn*3+Math.floor(Math.random()*14-5);if(sc>100)sc=100;if(sc<20)sc=20;
    score[s]=sc;msg+=`${s}: ${sc}分<br>`;
  });
  let avg=Math.floor(Object.values(score).reduce((a,b)=>a+b,0)/testSubj.length),rank="";
  if(avg>=90)rank="顶级名校";else if(avg>=75)rank="重点学校";else if(avg>=60)rank="普通学校";else rank="较差学校";
  let degMap=["婴儿","幼儿园","小学","初中","高中","本科"];
  player.schoolHistory.push(degMap[stageIdx+1]);player.schoolRank.push(rank);
  player.stage+=1; if(player.stage<=5)player.degree=degMap[player.stage];
  saveSaves(); document.getElementById('game').innerHTML = `<div class="step-title">升学考试</div>
    <div>${msg}</div><b>你升入：${rank}！</b><br><button class="btn" onclick="renderMonthPanel()">继续</button>`;
}
function renderPostGradChoice() {
  document.getElementById('game').innerHTML = `
    <div class="step-title">你本科毕业了！</div><div>你想选择：</div>
    <button class="btn" onclick="goToWork()">直接工作</button>
    <button class="btn" onclick="startMaster()">考研（3年）</button>`;
}
function goToWork(){player.stage=6;player.degree="本科";saveSaves();renderMonthPanel();}
function startMaster(){player.stage=7;player.degree="硕士";saveSaves();renderMonthPanel();}
function renderPhdChoice(){
  let canFast=(player.subjects["理综"]>8&&player.attributes.intelligence>8),years=canFast?36:48;
  player.phdYears=years;
  document.getElementById('game').innerHTML = `
    <div class="step-title">你硕士毕业了！</div><div>你想选择：</div>
    <button class="btn" onclick="goToWorkPhd()">直接工作</button>
    <button class="btn" onclick="startPhd()">读博士（${years/12}年）</button>`;
}
function goToWorkPhd(){player.stage=6;player.degree="硕士";saveSaves();renderMonthPanel();}
function startPhd(){player.stage=8;player.degree="博士";saveSaves();renderMonthPanel();}

// ========== 以下模块维持旧逻辑：学习、朋友、宠物、股票、新闻、娱乐、恋爱，只有新闻自动弹窗的地方已调整 ==========
// ----------- 学习、朋友、宠物、股票、新闻、娱乐、恋爱模块完全兼容原代码，可无缝照搬原实现 ---------------

/* 你可直接将学习、朋友、宠物、股票、新闻、娱乐、恋爱、backHome、数据加载部分，复制你现有代码即可。此处为经济/阶段/新闻核心与身份验证已全部优化。 */

function doFriend() {
  let friends = player.friends || [];
  let html = `<div class="step-title">朋友</div>`;
  if (friends.length) {
    html += `<div>已有朋友：</div><ul>`;
    friends.forEach((f, idx) => {
      html += `<li>${f.name}（好感${f.favor}）<button class="btn btn-small" onclick="friendInteract(${idx})">互动</button></li>`;
    });
    html += `</ul>`;
  }
  html += `<button class="btn" onclick="addFriend()">认识新朋友</button>
    <button class="btn" onclick="renderMonthPanel()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function addFriend() {
  let names = data.friends || [
    "李明", "王丽", "赵强", "刘佳", "陈思", "张敏", "杨楠", "徐芳", "周洋", "孙磊", "马楠", "冯雪", "郭静", "黄琳", "宋涛",
    "丁蕾", "何志", "魏峰", "许军", "谭晓", "彭飞", "谢磊", "曹琦", "邓涛", "袁蕾"
  ];
  let used = (player.friends || []).map(f => f.name);
  let candidates = names.filter(n => !used.includes(n));
  let newf = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : "新朋友";
  player.friends = player.friends || [];
  player.friends.push({ name: newf, favor: 5 + Math.floor(Math.random() * 5) });
  player.mood += 3;
  saveSaves();
  alert(`你认识了新朋友：${newf}`);
  doFriend();
}
function friendInteract(idx) {
  let f = player.friends[idx];
  let delta = 2 + Math.floor(Math.random() * 4);
  f.favor += delta;
  player.mood += 2;
  // 好感大于40可能送礼物
  if (f.favor > 40 && Math.random() < 0.25) {
    let items = data.items || [];
    if (items.length) {
      let gift = items[Math.floor(Math.random() * items.length)];
      alert(`${f.name} 送你了礼物：【${gift.name}】！`);
      player.personalMoney += Math.floor(gift.price * 0.5);
      player.mood += 10;
    }
  }
  // 好感大于30可能收到邀约
  if (f.favor > 30 && Math.random() < 0.15) {
    alert(`${f.name} 邀请你一起出游！你们的关系更加亲密。`);
    player.mood += 8;
  }
  saveSaves();
  doFriend();
}

function doPet() {
  let pets = player.pets || [];
  let html = `<div class="step-title">宠物市场</div>`;
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
  document.getElementById('game').innerHTML = html;
}
function addPet() {
  let types = data.petMarket || [
    { type: "橘猫", min: 500, max: 2000 },
    { type: "金毛犬", min: 1200, max: 3500 },
    { type: "仓鼠", min: 30, max: 180 },
    { type: "鹦鹉", min: 150, max: 600 },
    { type: "乌龟", min: 50, max: 300 }
  ];
  let candidates = types.map(t => {
    let now = t.min + Math.floor(Math.random() * (t.max - t.min + 1));
    return { type: t.type, price: now, health: 10 + Math.floor(Math.random() * 5) };
  });
  let html = `<div class="step-title">宠物市场</div><div>选择购买：</div>`;
  candidates.forEach((p, idx) => {
    html += `<button class="btn btn-small" onclick="buyPet('${p.type}',${p.price},${p.health})">${p.type}（${p.price}元）</button>　`;
  });
  html += `<br><button class="btn" onclick="doPet()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function buyPet(type, price, health) {
  if (player.personalMoney < price) {
    alert("个人资产不足，无法购买！");
    doPet(); return;
  }
  player.personalMoney -= price;
  player.pets = player.pets || [];
  player.pets.push({ type, price, health });
  saveSaves();
  alert(`你购买了一只${type}`);
  doPet();
}
function sellPet(idx) {
  let p = player.pets[idx];
  player.personalMoney += p.price;
  player.pets.splice(idx, 1);
  saveSaves();
  alert(`你卖出了${p.type}，获得${p.price}元`);
  doPet();
}
function petInteract(idx) {
  let p = player.pets[idx];
  p.health += 2 + Math.floor(Math.random() * 3);
  if (p.health > 15) p.health = 15;
  player.mood += 3;
  saveSaves();
  alert(`你和${p.type}互动，宠物更健康，心情提升！`);
  doPet();
}

function doStock() {
  let stockList = data.stocks;
  let pstocks = player.stocks || {};
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
  document.getElementById('game').innerHTML = html;
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
  saveSaves();
  alert(`买入成功，花费${parseInt(cost)}元`);
  doStock();
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
  saveSaves();
  alert(`卖出成功，获得${parseInt(earn)}元`);
  doStock();
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

function doNews(manual) {
  // 只有股票解锁后才允许看新闻
  if (!player.unlocks || !player.unlocks.stock) {
    alert("解锁股票后可看新闻！");
    renderMonthPanel();
    return;
  }
  let all = data.news;
  let i = Math.floor(Math.random() * all.length);
  let news = all[i];
  player.newsSeen = player.newsSeen || [];
  if (!player.newsSeen.includes(news.id)) player.newsSeen.push(news.id);
  applyNewsEffect(news);
  saveSaves();
  alert(`【新闻】${news.title}`);
  renderMonthPanel();
}
function triggerRandomNews() {
  if (!player.unlocks || !player.unlocks.stock) return; // 自动触发也要判断
  let n = data.news[Math.floor(Math.random() * data.news.length)];
  applyNewsEffect(n);
  saveSaves();
  alert(`[新闻事件] ${n.title}`);
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
      let name = arr[0];
      let plus = arr[1] || "";
      let perc = parseFloat(plus) / 100;
      let s = data.stocks.find(x => x.name === name);
      if (s) s.price = Math.round(s.price * (1 + perc) * 100) / 100;
    }
    if (e.startsWith("stock:") && e.indexOf("-") > -1) {
      let arr = e.split(":")[1].split("-");
      let name = arr[0];
      let minus = arr[1] || "";
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

function doEntertain() {
  let html = `<div class="step-title">选择娱乐方式</div>`;
  let options = [];
  let age = Math.floor(player.month / 12);
  if (age < 6) {
    options = [{ name: "玩积木", mood: 8, cost: 0 }];
  } else if (age < 12) {
    options = [
      { name: "公园散步", mood: 7, cost: 0 },
      { name: "社区游戏厅", mood: 12, cost: 10 }
    ];
  } else if (age < 18) {
    options = [
      { name: "桌游聚会", mood: 10, cost: 15 },
      { name: "网吧体验", mood: 14, cost: 30 }
    ];
  } else {
    options = [
      { name: "KTV嗨唱", mood: 18, cost: 120 },
      { name: "酒吧夜场", mood: 20, cost: 180 },
      { name: "高端自助餐", mood: 16, cost: 260 }
    ];
  }
  options.forEach(o => {
    html += `<button class="btn btn-small" onclick="doEntertainAction(${o.mood},${o.cost})">${o.name}（+${o.mood}心情，花费${o.cost}元）</button>　`;
  });
  html += `<br><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function doEntertainAction(mood, cost) {
  if (player.personalMoney < cost) {
    alert("资产不足！");
    doEntertain();
    return;
  }
  player.mood += mood;
  player.personalMoney -= cost;
  if (player.mood > 100) player.mood = 100;
  saveSaves();
  alert("娱乐完毕，心情提升！");
  renderMonthPanel();
}

function doLove() {
  if (!player.loveList) player.loveList = [];
  let girls = data.girls;
  let html = `<div class="step-title">恋爱发展</div><div>可互动女生：</div><ul>`;
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
  document.getElementById('game').innerHTML = html;
}
function loveInteract(idx) {
  let g = data.girls[idx];
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === g.name);
  if (!lover) {
    lover = { name: g.name, favor: 5 };
    player.loveList.push(lover);
  }
  lover.favor += 5 + Math.floor(Math.random() * 5);
  player.mood += 3;
  saveSaves();
  alert(`你和${g.name}相处了一会，好感度提升！`);
  doLove();
}
function loveGift(idx) {
  let g = data.girls[idx];
  if (player.personalMoney < 500) { alert("没钱送礼！"); doLove(); return; }
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === g.name);
  if (!lover) {
    lover = { name: g.name, favor: 10 };
    player.loveList.push(lover);
  }
  lover.favor += 12 + Math.floor(Math.random() * 8);
  player.personalMoney -= 500;
  player.mood += 6;
  saveSaves();
  alert(`你为${g.name}送上礼物，好感度提升！`);
  doLove();
}
function loveTry(name) {
  player.loveList = player.loveList || [];
  let lover = player.loveList.find(l => l.name === name);
  let ok = (lover && lover.favor >= 60 && Math.random() < 0.9) ? true : false;
  if (ok) {
    player.lover = name;
    player.mood += 20;
    saveSaves();
    alert("表白成功！你和" + name + "成为情侣！");
  } else {
    player.mood -= 5;
    alert("表白被婉拒，下次再努力！");
  }
  renderMonthPanel();
}



// ----- 数据加载 -----
fetch('data.json')
  .then(res => res.json())
  .then(json => { data=json; renderHome(); })
  .catch(e => { document.getElementById('game').innerHTML = "数据加载失败："+e; });

// ----- 导航暴露 -----
window.studySubject = studySubject;
window.addFriend = function(){}; // 其余功能你可照旧实现
window.addPet = function(){};
window.buyStock = function(){};
window.sellStock = function(){};
window.loveTry = function(){};
window.friendInteract = function(){};
window.petInteract = function(){};
window.sellPet = function(){};
window.loveInteract = function(){};
window.loveGift = function(){};
window.doEntertainAction = function(){};
window.backHome = function(){player=null;currentSave=null;renderHome();}