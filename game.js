let data = { talents: [], parents: [], items: [], girls: [], news: [], stocks: [] };
let saves = {};
let player = null;
let currentSave = null;

const STAGE_INFO = [
  { name: "婴儿",    months: 12 },    // 0岁-1岁
  { name: "幼儿园",  months: 36 },   // 1岁-4岁（3年）
  { name: "小学",    months: 72 },   // 4岁-10岁（6年）
  { name: "初中",    months: 36 },   // 10岁-13岁（3年）
  { name: "高中",    months: 36 },   // 13岁-16岁（3年）
  { name: "本科",    months: 48 },   // 16岁-20岁（4年）
  { name: "社会",    months: 0 },    // 毕业后可选（含考研、读博）
  { name: "硕士",    months: 36 },   // 3年
  { name: "博士",    months: 36 },   // 3~4年，属性好3年，否则4年
];
const SUBJECTS = ["语文", "数学", "英语", "理综", "文综", "艺术"];
const BASIC_ATTRS = ["appearance", "intelligence", "physique", "family", "luck"];
const ATTRS_CN = { appearance: "颜值", intelligence: "智商", physique: "体质", family: "家境", luck: "运气", mood: "心情", health: "健康" };
const SUBJECTS_CN = { "语文": "语文", "数学": "数学", "英语": "英语", "理综": "理综", "文综": "文综", "艺术": "艺术" };

// 存档相关
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
function deleteSave(name) {
  delete saves[name];
  saveSaves();
}
function buildNewPlayer(name) {
  // 默认属性、科目分、解锁记录
  let attrs = {};
  BASIC_ATTRS.forEach(k => attrs[k] = 5);
  let subjects = {};
  SUBJECTS.forEach(k => subjects[k] = 3);
  return {
    name,
    age: 0,     // 当前岁数
    month: 0,   // 当前总月数
    stage: 0,   // 当前教育阶段序号
    eduStage: 0,// 同上，为后续扩展
    status: "new",
    attributes: attrs,
    subjects: subjects,
    mood: 70,
    health: 90,
    money: 10000,
    unlocks: { pets: false, friends: false, phone: false, stock: false, work: false, love: false, entertain: false },
    pets: [],
    friends: [],
    stocks: {}, // {股票id: {count, buyPrice}}
    newsSeen: [],
    girls: [],
    talents: [],
    parents: null,
    history: [],
    degree: null, // 本科/硕士/博士
    job: null,
    lover: null,
    house: null
  };
}

// 进入存档
function enterSave(name) {
  currentSave = name;
  player = saves[name];
  renderMain();
}

// 首页+存档管理
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

// 状态栏弹窗逻辑
function showStatus() {
  if (!player) { alert('请先进入存档！'); return; }
  let attr = player.attributes, subj = player.subjects;
  let html = `<b>基础属性</b><table>`;
  BASIC_ATTRS.forEach(k => {
    html += `<tr><th>${ATTRS_CN[k]}</th><td>${attr[k]}</td></tr>`;
  });
  html += `<tr><th>心情</th><td>${player.mood}</td></tr><tr><th>健康</th><td>${player.health}</td></tr>`;
  html += `<tr><th>金钱</th><td>${player.money}</td></tr>`;
  html += `</table><b>学科分</b><table>`;
  SUBJECTS.forEach(k => {
    html += `<tr><th>${SUBJECTS_CN[k]}</th><td>${subj[k]}</td></tr>`;
  });
  html += `</table><b>当前阶段</b><div>${STAGE_INFO[player.stage].name}</div>`;
  if (player.degree) html += `<div>最高学历：${player.degree}</div>`;
  html += `<b>已解锁功能：</b>`;
  html += Object.entries(player.unlocks).filter(([k,v])=>v).map(([k])=>k).join("，") || "无";
  document.getElementById('statusContent').innerHTML = html;
  document.getElementById('statusOverlay').style.display = "block";
}
function closeStatus() {
  document.getElementById('statusOverlay').style.display = "none";
}

// 导航暴露
window.enterSave = enterSave;
window.delSavePrompt = delSavePrompt;
window.newSave = newSave;
window.showStatus = showStatus;
window.closeStatus = closeStatus;

// 入口：主游戏界面
function renderMain() {
  if (!player) return renderHome();
  // 检查是否新档，进入出生/父母/天赋/初始属性流程
  if (!player.parents) return renderParents();
  if (!player.talents.length) return renderTalentSelect();
  if (!player.initialAttrDone) return renderAttrSelect();

  renderMonthPanel();
}

// 1. 出生：父母
function renderParents() {
  let p = data.parents[Math.floor(Math.random()*data.parents.length)];
  player.parents = p;
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

// 2. 天赋选择
function renderTalentSelect() {
  // 允许“天选之子”直接全库任选
  let talents = data.talents;
  let randomTen = [];
  let ids = {};
  while (randomTen.length < 10 && randomTen.length < talents.length) {
    let idx = Math.floor(Math.random()*talents.length);
    if (!ids[idx]) { ids[idx]=1; randomTen.push(talents[idx]); }
  }
  let selected = player.talents || [];
  let html = `<div class="step-title">选择你的天赋（不限数量）</div><div>`;
  randomTen.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id)?'checked':''}
      onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="renderTalentSelect()">换一批天赋</button>
    <button class="btn" onclick="confirmTalentSelect()">选择完毕</button>
    <button class="btn" onclick="chooseAnyTalent()">天选之子（全库任选）</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function toggleTalent(cb, id) {
  let arr = player.talents || [];
  if(cb.checked) {
    if(!arr.includes(id)) arr.push(id);
  } else {
    let idx = arr.indexOf(id);
    if(idx > -1) arr.splice(idx, 1);
  }
  player.talents = arr;
  saveSaves();
}
function confirmTalentSelect() {
  // 合并所有天赋effect作为初始属性加成
  player.baseAttrFromTalent = {};
  for(let k of BASIC_ATTRS) player.baseAttrFromTalent[k] = 0;
  for(let s of SUBJECTS) player.baseAttrFromTalent[s] = 0;
  if (player.talents) {
    player.talents.forEach(id => {
      let t = data.talents.find(x=>x.id===id);
      if (t && t.effect) for(let k in t.effect) {
        if(player.baseAttrFromTalent[k]===undefined) player.baseAttrFromTalent[k]=0;
        player.baseAttrFromTalent[k] += t.effect[k];
      }
    });
  }
  saveSaves();
  renderAttrSelect();
}
function chooseAnyTalent() {
  // 天选之子：全库勾选，随意选
  let talents = data.talents;
  let selected = player.talents || [];
  let html = `<div class="step-title">天选之子：全库任选天赋</div><div>`;
  talents.forEach(t => {
    html += `<label class="talent-card talent-${t.type}">
      <input type="checkbox" value="${t.id}" ${selected.includes(t.id)?'checked':''}
      onchange="toggleTalent(this,${t.id})">
      [${t.type}] <b>${t.name}</b><br><span style="font-size:0.98em;color:#777;">${t.desc}</span>
    </label>`;
  });
  html += `</div>
    <button class="btn" onclick="confirmTalentSelect()">选好了，进入属性分配</button>
    <button class="btn" onclick="renderTalentSelect()">返回普通天赋抽选</button>
  `;
  document.getElementById('game').innerHTML = html;
}

// 3. 初始属性分配
function renderAttrSelect() {
  let maxPoints = 100;
  // 基础属性：5，天赋加成后为起点
  let attrs = {};
  BASIC_ATTRS.forEach(k=>{
    attrs[k] = 5 + (player.baseAttrFromTalent&&player.baseAttrFromTalent[k]?player.baseAttrFromTalent[k]:0);
    if(attrs[k]<0) attrs[k]=0; // 防止负数
  });
  let pointsUsed = Object.values(attrs).reduce((a,b)=>a+b,0);
  let left = maxPoints-pointsUsed;
  // 允许用户分配剩余点数，每项最多10
  let html = `<div class="step-title">分配初始属性（共100点，每项最多10）</div>`;
  html += `<div>天赋已加成，剩余可分配：<b id="points">${left}</b></div><div>`;
  BASIC_ATTRS.forEach(k=>{
    html += `${ATTRS_CN[k]}：<input type="number" id="attr_${k}" min="${attrs[k]}" max="10" value="${attrs[k]}" style="width:38px;">　`;
    if(k=="physique") html+="<br>";
  });
  html += `</div><button class="btn" onclick="finishAttrSelect()">确定</button>`;
  document.getElementById('game').innerHTML = html;

  // 绑定属性分配事件
  BASIC_ATTRS.forEach(k=>{
    document.getElementById('attr_'+k).onchange = function(){
      let vals = {};
      let used = 0;
      BASIC_ATTRS.forEach(j=>{
        vals[j] = parseInt(document.getElementById('attr_'+j).value) || attrs[j];
        if(vals[j]<attrs[j]) vals[j]=attrs[j];
        if(vals[j]>10) vals[j]=10;
        used += vals[j];
      });
      let left = maxPoints-used;
      document.getElementById('points').innerText = left<0?0:left;
      // 实时限制
      if(left<0) {
        // 回退当前属性
        this.value = vals[k]+left;
        document.getElementById('points').innerText = 0;
      }
    }
  });
}
function finishAttrSelect() {
  let maxPoints = 100;
  let vals = {}, used = 0;
  BASIC_ATTRS.forEach(k=>{
    vals[k] = parseInt(document.getElementById('attr_'+k).value)||5;
    used += vals[k];
  });
  if (used>maxPoints) return alert('分配超出上限！');
  // 存档
  player.attributes = vals;
  // 初始学科科目
  player.subjects = {};
  for(let s of SUBJECTS) player.subjects[s] = 3 + (player.baseAttrFromTalent&&player.baseAttrFromTalent[s]?player.baseAttrFromTalent[s]:0);
  // 初始心情健康
  player.mood = 70 + (player.baseAttrFromTalent&&player.baseAttrFromTalent.mood?player.baseAttrFromTalent.mood:0);
  player.health = 90;
  player.money = 10000 + (player.baseAttrFromTalent&&player.baseAttrFromTalent.money?player.baseAttrFromTalent.money:0);
  player.initialAttrDone = true;
  saveSaves();
  renderMain();
}

// 4. 月度主循环界面
function renderMonthPanel() {
  // 每个月：属性显示、功能区、月推进按钮
  let stageObj = STAGE_INFO[player.stage];
  let ageStr = `${Math.floor(player.month/12)}岁${player.month%12}月`;
  let html = `<div class="step-title">当前阶段：${stageObj.name}　年龄：${ageStr}　学历：${player.degree||"无"}</div>
    <div>金钱：${player.money}　心情：${player.mood}　健康：${player.health}</div>
    <div>
      <button class="btn" onclick="doStudy()">学习</button>
      <button class="btn" onclick="doWork()" ${player.unlocks.work?'':'disabled'}>打工/兼职</button>
      <button class="btn" onclick="doFriend()" ${player.unlocks.friends?'':'disabled'}>交朋友</button>
      <button class="btn" onclick="doPet()" ${player.unlocks.pets?'':'disabled'}>养宠物</button>
      <button class="btn" onclick="doStock()" ${player.unlocks.stock?'':'disabled'}>股票投资</button>
      <button class="btn" onclick="doNews()" ${player.unlocks.phone?'':'disabled'}>看新闻</button>
      <button class="btn" onclick="doLove()" ${player.unlocks.love?'':'disabled'}>恋爱</button>
      <button class="btn" onclick="doEntertain()" ${player.unlocks.entertain?'':'disabled'}>娱乐</button>
      <button class="btn" style="background:#0b5;" onclick="nextMonth()">下一个月</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div>
  `;
  document.getElementById('game').innerHTML = html;
}

// 月推进（每月核心自动结算）
function nextMonth() {
  player.month += 1;
  player.age = Math.floor(player.month/12);

  // 心情&健康波动
  player.mood += Math.floor(Math.random()*7-3); // 小幅波动
  player.health += Math.floor(Math.random()*4-2);
  if(player.mood>100) player.mood=100; if(player.mood<0) player.mood=0;
  if(player.health>100) player.health=100; if(player.health<0) player.health=0;

  // 工资
  if(player.job) {
    player.money += player.job.salary;
    player.mood += 1;
  }
  // 随机支出
  if(player.money>0 && Math.random()<0.13) {
    let spend = Math.floor(player.money*Math.random()*0.04);
    player.money -= spend; player.mood+=2;
  }
  // 股票波动
  updateStocks();

  // 随机新闻
  if(Math.random()<0.2) triggerRandomNews();

  // 功能解锁：根据阶段只“首次解锁”，解锁后永久可用
  if(player.stage===2) player.unlocks.pets=true, player.unlocks.friends=true;
  if(player.stage===3) player.unlocks.phone=true, player.unlocks.stock=true;
  if(player.stage===4) player.unlocks.work=true;
  if(player.stage===5) player.unlocks.love=true, player.unlocks.entertain=true;

  // 阶段推进（毕业判定/升学/毕业/读研）
  let grad = checkGraduation();
  if(grad) return; // 升学时自动弹出升学考试

  saveSaves();
  renderMonthPanel();
}

// 检查毕业和升学点
function checkGraduation() {
  let s = player.stage, m = player.month;
  let total = 0;
  for(let i=0;i<STAGE_INFO.length;i++) {
    total += STAGE_INFO[i].months;
    if(i===s && s<=5 && m>=total) {
      // 本科毕业后自动弹升学
      renderExam(i);
      return true;
    }
    // 本科毕业：弹是否考研
    if(s===5 && m>=total) {
      renderPostGradChoice();
      return true;
    }
    // 硕士毕业
    if(s===7 && m>=total) {
      renderPhdChoice();
      return true;
    }
    // 博士毕业
    if(s===8 && m>=total) {
      player.degree = "博士";
      player.stage = 6;
      alert("恭喜博士毕业，开启社会人生！");
      saveSaves();
      renderMonthPanel();
      return true;
    }
  }
  return false;
}

// 升学考试
function renderExam(stageIdx) {
  // 计算分数：各学科（小学→语文数学英语，初中+理综，...）
  let test = {2:["语文","数学","英语"],3:["语文","数学","英语","理综"],4:["语文","数学","英语","理综","文综"],5:["全部"]};
  let testSubj = test[stageIdx+1]||["语文","数学"];
  let score = {};
  let msg = "";
  testSubj.forEach(s=>{
    // 分数 = 50+学科*5+智商*2+学习加成+随机
    let subj = player.subjects[s]||3;
    let iq = player.attributes.intelligence||5;
    let learn = (player.baseAttrFromTalent&&player.baseAttrFromTalent.learning)||0;
    let sc = 50 + subj*5 + iq*2 + learn*2 + Math.floor(Math.random()*12-5);
    if(sc>100) sc=100;if(sc<20) sc=20;
    score[s]=sc;
    msg += `${s}: ${sc}分<br>`;
  });
  // 最低分决定能上哪类学校
  let avg = Math.floor(Object.values(score).reduce((a,b)=>a+b,0)/testSubj.length);
  let result = "";
  if(avg>=90) result = "你考入了顶级名校！";
  else if(avg>=75) result = "你考入了重点学校。";
  else if(avg>=60) result = "你进入了普通学校。";
  else result = "分数较低，只能进入较差学校。";
  // 升学
  player.stage += 1;
  let degMap = {2:"小学",3:"初中",4:"高中",5:"本科"};
  if(player.stage<=5) player.degree = degMap[player.stage];
  saveSaves();
  document.getElementById('game').innerHTML = `<div class="step-title">升学考试</div>
    <div>${msg}</div>
    <b>${result}</b><br>
    <button class="btn" onclick="renderMonthPanel()">继续</button>
  `;
}

// 本科毕业后是否考研
function renderPostGradChoice() {
  document.getElementById('game').innerHTML = `
    <div class="step-title">你本科毕业了！</div>
    <div>你想选择：</div>
    <button class="btn" onclick="goToWork()">直接工作</button>
    <button class="btn" onclick="startMaster()">考研（3年）</button>
  `;
}
function goToWork() {
  player.stage = 6;
  player.degree = "本科";
  saveSaves();
  renderMonthPanel();
}
function startMaster() {
  player.stage = 7; // 硕士
  player.degree = "硕士";
  saveSaves();
  renderMonthPanel();
}
// 硕士毕业是否读博
function renderPhdChoice() {
  let canFast = (player.subjects["理综"]>8 && player.attributes.intelligence>8);
  let years = canFast?3:4;
  document.getElementById('game').innerHTML = `
    <div class="step-title">你硕士毕业了！</div>
    <div>你想选择：</div>
    <button class="btn" onclick="goToWorkPhd()">直接工作</button>
    <button class="btn" onclick="startPhd(${years})">读博士（${years}年）</button>
  `;
}
function goToWorkPhd() {
  player.stage = 6;
  player.degree = "硕士";
  saveSaves();
  renderMonthPanel();
}
function startPhd(years) {
  player.stage = 8;
  player.degree = "博士";
  // 调整博士阶段时长
  STAGE_INFO[8].months = years*12;
  saveSaves();
  renderMonthPanel();
}

// 功能操作（学习/打工/交友/宠物/股票/新闻/娱乐/恋爱）
function doStudy() {
  // 自选提升学科，每月选一项提升
  let html = `<div class="step-title">学习</div><div>选择你本月要主攻提升的学科：</div>`;
  SUBJECTS.forEach(s=>{
    html += `<button class="btn btn-small" onclick="studySubject('${s}')">${s}</button> `;
  });
  html += `<br><button class="btn" onclick="renderMonthPanel()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function studySubject(subj) {
  if(!player.subjects[subj]) player.subjects[subj]=3;
  player.subjects[subj] += 1 + (player.baseAttrFromTalent&&player.baseAttrFromTalent.learning?1:0);
  if(player.subjects[subj]>10) player.subjects[subj]=10;
  player.mood -= 2; player.health -= 1;
  saveSaves();
  alert("你专心学习，"+subj+"提升！");
  renderMonthPanel();
}

// 以下模块后续追加（可先粘贴本段，测试流程！）

// 打工/工作
function doWork() {
  // 首次未工作，弹出职业列表，已工作直接结算工资
  if(!player.job) {
    let jobs = [
      {name:"服务员", min:{physique:5}, salary:3000},
      {name:"家教", min:{intelligence:7}, salary:5000},
      {name:"快递员", min:{physique:7}, salary:4500},
      {name:"助教", min:{intelligence:8}, salary:7000},
      {name:"实习生", min:{intelligence:6}, salary:3500},
      {name:"自媒体", min:{appearance:7}, salary:5000}
    ];
    let html = `<div class="step-title">可应聘兼职</div><ul>`;
    jobs.forEach(j=>{
      let ok = true;
      for(let k in j.min) if((player.attributes[k]||0)<j.min[k]) ok=false;
      html += `<li>${j.name}（工资${j.salary}元，${Object.entries(j.min).map(([kk,vv])=>ATTRS_CN[kk]+">="+vv).join("，")})`
           + (ok?`<button class="btn btn-small" onclick="jobChoose('${j.name}',${j.salary})">应聘</button>`:`<span style="color:#aaa;">不满足要求</span>`)
           +`</li>`;
    });
    html += `</ul><button class="btn" onclick="renderMonthPanel()">返回</button>`;
    document.getElementById('game').innerHTML = html;
  } else {
    alert(`你本月以 ${player.job.name} 工作，获得工资${player.job.salary}元`);
    player.money += player.job.salary;
    player.mood -= 2; player.health -= 2;
    saveSaves();
    renderMonthPanel();
  }
}
function jobChoose(name,salary) {
  player.job = {name,salary};
  saveSaves();
  alert(`你成为了${name}，每月工资${salary}元`);
  renderMonthPanel();
}

// 交朋友
function doFriend() {
  // 交朋友或管理
  let friends = player.friends || [];
  let html = `<div class="step-title">朋友</div>`;
  if(friends.length) {
    html += `<div>已有朋友：</div><ul>`;
    friends.forEach(f=>{
      html += `<li>${f.name}（好感${f.favor}）</li>`;
    });
    html += `</ul>`;
  }
  html += `<button class="btn" onclick="addFriend()">认识新朋友</button>
    <button class="btn" onclick="renderMonthPanel()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function addFriend() {
  let names = ["小明","小红","小刚","小丽","小强","小芳"];
  let newf = names[Math.floor(Math.random()*names.length)] + Math.floor(Math.random()*100);
  player.friends = player.friends||[];
  player.friends.push({name: newf, favor: Math.floor(Math.random()*10+1)});
  player.mood += 3;
  saveSaves();
  alert(`你认识了新朋友：${newf}`);
  doFriend();
}

// 宠物
function doPet() {
  let pets = player.pets||[];
  let html = `<div class="step-title">宠物</div>`;
  if(pets.length) {
    html += `<div>已有宠物：</div><ul>`;
    pets.forEach(p=>{
      html += `<li>${p.type}（健康${p.health}）</li>`;
    });
    html += `</ul>`;
  }
  html += `<button class="btn" onclick="addPet()">领养新宠物</button>
    <button class="btn" onclick="renderMonthPanel()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function addPet() {
  let types = ["猫","狗","仓鼠","乌龟","金鱼"];
  let newp = types[Math.floor(Math.random()*types.length)] + Math.floor(Math.random()*1000);
  player.pets = player.pets||[];
  player.pets.push({type: newp, health: 10});
  player.mood += 3;
  saveSaves();
  alert(`你领养了新宠物：${newp}`);
  doPet();
}

// 看新闻
function doNews() {
  let all = data.news;
  let i = Math.floor(Math.random()*all.length);
  let news = all[i];
  player.newsSeen = player.newsSeen || [];
  if(!player.newsSeen.includes(news.id)) player.newsSeen.push(news.id);
  saveSaves();
  alert(`【新闻】${news.title}`);
  renderMonthPanel();
}

// 娱乐
function doEntertain() {
  player.mood += 10;
  player.money -= 500;
  saveSaves();
  alert("你享受娱乐，心情提升，花费500元");
  renderMonthPanel();
}

// 恋爱
function doLove() {
  if(player.lover) {
    alert(`你与${player.lover}的感情继续升温~`);
    player.mood += 6;
    saveSaves();
    renderMonthPanel();
    return;
  }
  let girls = data.girls;
  let html = `<div class="step-title">表白对象</div>
    <ul>${girls.map(g=>`<li>${g.name}（${g.desc}）<button class="btn btn-small" onclick="loveTry('${g.name}')">表白</button></li>`).join("")}</ul>
    <button class="btn btn-small" onclick="renderMonthPanel()">返回</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function loveTry(name) {
  let ok = Math.random()<0.5;
  if(ok) {
    player.lover = name;
    player.mood += 20;
    saveSaves();
    alert("表白成功！你和"+name+"成为情侣！");
  } else {
    player.mood -= 5;
    alert("表白被婉拒，下次再努力！");
  }
  renderMonthPanel();
}

// 股票投资
function doStock() {
  let stockList = data.stocks;
  let pstocks = player.stocks || {};
  let html = `<div class="step-title">股票投资</div><table border="0" cellpadding="4"><tr>
    <th>名称</th><th>现价</th><th>持仓</th><th>买入</th><th>卖出</th></tr>`;
  stockList.forEach(s=>{
    let holding = pstocks[s.id]?.count||0;
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
  let cnt = parseInt(document.getElementById('buy_'+id).value)||0;
  if(cnt<=0) return alert("输入买入数量！");
  let s = data.stocks.find(x=>x.id===id);
  let cost = cnt * s.price;
  if(cost>player.money) return alert("现金不足！");
  player.money -= cost;
  player.stocks = player.stocks||{};
  let pstk = player.stocks[id]||{count:0, buyPrice:0};
  pstk.buyPrice = ((pstk.count*pstk.buyPrice)+(cnt*s.price))/(pstk.count+cnt); //加权
  pstk.count += cnt;
  player.stocks[id] = pstk;
  saveSaves();
  alert(`买入成功，花费${cost}元`);
  doStock();
}
function sellStock(id) {
  let cnt = parseInt(document.getElementById('sell_'+id).value)||0;
  let pstk = player.stocks[id]||{count:0, buyPrice:0};
  if(cnt<=0 || cnt>pstk.count) return alert("输入卖出数量！");
  let s = data.stocks.find(x=>x.id===id);
  let earn = cnt * s.price;
  pstk.count -= cnt;
  if(pstk.count===0) pstk.buyPrice=0;
  player.stocks[id]=pstk;
  player.money += earn;
  saveSaves();
  alert(`卖出成功，获得${earn}元`);
  doStock();
}

// 股票价格更新和新闻影响
function updateStocks() {
  data.stocks.forEach(s=>{
    // 波动=基础波动*随机*属性影响
    let rand = (Math.random()-0.5)*2*s.volatility; // -v~+v
    let factor = 1+rand;
    s.price = Math.max(1, s.price*factor);
  });
  // 新闻实时影响 handled by triggerRandomNews()
}
function triggerRandomNews() {
  let n = data.news[Math.floor(Math.random()*data.news.length)];
  // effect支持 money+/-num，stock:名+/-%，stocks:all+/-%，mood+num
  let effect = n.effect.split(";");
  effect.forEach(e=>{
    if(e.startsWith("money+")) player.money += parseInt(e.slice(6));
    if(e.startsWith("money-")) player.money -= parseInt(e.slice(6));
    if(e.startsWith("mood+")) player.mood += parseInt(e.slice(5));
    if(e.startsWith("mood-")) player.mood -= parseInt(e.slice(5));
    if(e.startsWith("stock:")) {
      let arr = e.split(":")[1].split("+");
      let name = arr[0];
      let plus = arr[1]||"";
      let perc = parseFloat(plus)/100;
      let s = data.stocks.find(x=>x.name===name);
      if(s) s.price *= (1+perc);
    }
    if(e.startsWith("stock:") && e.indexOf("-")>-1) {
      let arr = e.split(":")[1].split("-");
      let name = arr[0];
      let minus = arr[1]||"";
      let perc = parseFloat(minus)/100;
      let s = data.stocks.find(x=>x.name===name);
      if(s) s.price *= (1-perc);
    }
    if(e.startsWith("stocks:all+")) {
      let perc = parseFloat(e.split("stocks:all+")[1])/100;
      data.stocks.forEach(s=>s.price*=(1+perc));
    }
    if(e.startsWith("stocks:all-")) {
      let perc = parseFloat(e.split("stocks:all-")[1])/100;
      data.stocks.forEach(s=>s.price*=(1-perc));
    }
  });
  saveSaves();
  alert(`[新闻事件] ${n.title}`);
}

window.jobChoose = jobChoose;
window.studySubject = studySubject;
window.addFriend = addFriend;
window.addPet = addPet;
window.buyStock = buyStock;
window.sellStock = sellStock;
window.loveTry = loveTry;