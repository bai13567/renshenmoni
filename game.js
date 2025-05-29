let data = { talents: [], parents: [], items: [], girls: [], news: [] };
let saves = {};
let currentSave = null;
let player = null;
let step = 'home';

// 阶段与学校信息
const STAGE_LIST = [
  "婴儿", "幼儿园", "小学", "初中", "高中", "大学", "社会人生"
];
const SCHOOL_INFO = [
  [ // 幼儿园升小学
    {name:"清北附小", min:90},
    {name:"重点小学", min:70},
    {name:"普通小学", min:50},
    {name:"差等小学", min:0}
  ],
  [ // 小学升初中
    {name:"市重点初中", min:90},
    {name:"普通初中", min:60},
    {name:"差等初中", min:0}
  ],
  [ // 初中升高中
    {name:"省重点高中", min:95},
    {name:"市重点高中", min:80},
    {name:"普通高中", min:60},
    {name:"职高", min:0}
  ],
  [ // 高中升大学
    {name:"清北大学", min:99},
    {name:"985高校", min:90},
    {name:"一本大学", min:80},
    {name:"二本大学", min:70},
    {name:"大专", min:60},
    {name:"落榜复读", min:0}
  ],
  [ // 大学毕业——社会人生无升学
  ]
];

// 基础存档操作
function loadSaves() {
  saves = JSON.parse(localStorage.getItem('renshenmoni_saves') || '{}');
}
function saveSaves() {
  localStorage.setItem('renshenmoni_saves', JSON.stringify(saves));
}
function createSave(name) {
  if (!name || saves[name]) return false;
  saves[name] = {
    name,
    stage: 'init',
    openData: {}
  };
  saveSaves();
  return true;
}
function deleteSave(name) {
  delete saves[name];
  saveSaves();
}
function enterSave(name) {
  currentSave = name;
  player = saves[name];
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
function backHome() {
  currentSave = null;
  player = null;
  step = 'home';
  renderHome();
}

// 主界面
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

// 出生动画
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

// 父母职业
function renderParents() {
  player.stage = 'parents';
  saveSaves();
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

// 天赋选择
function renderTalent() {
  player.stage = 'talent';
  saveSaves();
  player.openData.talents = player.openData.talents || [];
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
  let all = player.openData.talents || [];
  let baseAttributes = {appearance:0,intelligence:0,physique:0,luck:0,family:0,money:0};
  all.forEach(id => {
    let t = data.talents.find(t => t.id === id);
    if (t) for(let k in t.effect) if (k in baseAttributes) baseAttributes[k] += t.effect[k];
  });
  player.openData.baseAttributes = baseAttributes;
  saveSaves();
  nextStep('attr');
}

// 属性分配
function renderAttr() {
  player.stage = 'attr';
  saveSaves();
  let baseAttributes = player.openData.baseAttributes || {appearance:0,intelligence:0,physique:0,luck:0,family:0,money:0};
  player.openData.attributes = player.openData.attributes || {...baseAttributes};
  let attributes = {...player.openData.attributes};
  let attrPoints = 100;
  for(let key in attributes) {
    if(attributes[key] < baseAttributes[key]) attributes[key] = baseAttributes[key];
  }
  function htmlAttrInput() {
    let html = "";
    for(let key of ["appearance","intelligence","physique","luck","family"]) {
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
      attributes[key] += left;
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

// 主线推进
function renderMainGame() {
  renderLifeStage();
}

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
window.resetGame = function() {
  if(!confirm("确定要重开本存档的人生吗？")) return;
  player.stage = 'born';
  player.openData = {};
  saveSaves();
  step = 'born';
  renderBorn();
}

// --- 加载入口 ---
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderHome();
  });

function nextStep(s) {
  step = s;
  if(s === 'parents') renderParents();
  if(s === 'talent') renderTalent();
  if(s === 'attr') renderAttr();
  if(s === 'main') renderMainGame();
}

// 阶段推进与主流程
function renderLifeStage() {
  player.stage = 'main';
  saveSaves();
  let od = player.openData;
  od.currentStage = od.currentStage ?? 0;
  let stage = od.currentStage;
  let stageName = STAGE_LIST[stage];

  // 必须升学阶段
  if(stage > 0 && stage <= 5 && !od[`school${stage}`]) {
    startExam(stage-1);
    return;
  }

  let html = `<div class="step-title">当前阶段：${stageName}</div>`;
  html += renderStageMain(stage);

  // 阶段推进
  if(stage < STAGE_LIST.length-1) {
    html += `<button class="btn" onclick="advanceStage()">进入下一阶段</button>`;
  } else {
    html += `<div style="margin-top:16px;"><button class="btn" onclick="exploreSociety()">社会人生·自由探索</button></div>`;
  }
  html += `<button class="btn btn-small" onclick="backHome()">返回主界面</button>`;
  document.getElementById('game').innerHTML = html;
}

// 阶段主内容
function renderStageMain(idx) {
  let od = player.openData;
  switch(idx) {
    case 0: return `<div>你还小，正在健康成长中…<br>（自动成长，无法干预）</div>`;
    case 1: return `<div>你进入了幼儿园，和老师小朋友们一起玩耍学习。<br>完成升学考试后进入小学。</div>`;
    case 2: return `<div>你成为小学生，可以开始养宠物、交朋友、参加升学考试。</div>
      <button class="btn btn-small" onclick="makeFriend()">交朋友</button>
      <button class="btn btn-small" onclick="adoptPet()">领养宠物</button>
      ${renderFriendList()}${renderPetList()}
    `;
    case 3: return `<div>你进入初中，解锁手机、可以看新闻、炒股、参加升学考试。</div>
      <button class="btn btn-small" onclick="unlockPhone()">解锁手机</button>
      <button class="btn btn-small" onclick="readNews()">看新闻</button>
      <button class="btn btn-small" onclick="tradeStock()">炒股</button>
      ${od.phone ? "<div>手机已解锁，可访问更多内容！</div>" : ""}
    `;
    case 4: return `<div>你进入高中，解锁兼职，冲刺高考。</div>
      <button class="btn btn-small" onclick="partTimeJob()">兼职</button>
    `;
    case 5: return `<div>你考入大学，可以做科研、社交、谈恋爱、打工、娱乐。</div>
      <button class="btn btn-small" onclick="doResearch()">科研/技术提升</button>
      <button class="btn btn-small" onclick="socialize()">社交/参加社团</button>
      <button class="btn btn-small" onclick="loveSystem()">谈恋爱</button>
      <button class="btn btn-small" onclick="partTimeJob()">兼职</button>
      <button class="btn btn-small" onclick="entertain()">娱乐消费</button>
    `;
    case 6: return `<div>社会人生解锁：可以找工作、逛街、买房、谈恋爱、继续提升自己、遇到随机人生事件！</div>`;
    default: return `<div>人生阶段结束</div>`;
  }
}

// 推进阶段
function advanceStage() {
  let od = player.openData;
  od.currentStage = (od.currentStage??0) + 1;
  od.history = od.history || [];
  od.history.push({
    stage: od.currentStage-1,
    time: Date.now()
  });
  saveSaves();
  renderLifeStage();
}

// 升学/考试/志愿
function startExam(stageIdx) {
  let od = player.openData;
  let attrs = od.attributes || {};
  let attrKey = ["intelligence","intelligence","intelligence","intelligence","intelligence"];
  let mainAttr = attrs[attrKey[stageIdx]] || 0;
  let score = Math.floor(mainAttr*10 + Math.random()*40);
  document.getElementById('game').innerHTML = `
    <div style="font-size:2em;text-align:center;">📝</div>
    <div class="step-title" style="text-align:center;">${STAGE_LIST[stageIdx]} 升学考试</div>
    <div id="exam-ani" style="text-align:center;font-size:1.1em;">考试中...</div>
  `;
  setTimeout(()=>{
    document.getElementById('exam-ani').innerText = `考试结束，成绩：${score}分！`;
    setTimeout(()=>{
      chooseSchool(stageIdx, score);
    }, 900);
  }, 1000);
}
function chooseSchool(stageIdx, score) {
  let schoolList = SCHOOL_INFO[stageIdx];
  let choices = schoolList.filter(s=>score>=s.min);
  let html = `<div class="step-title">升学志愿 (${STAGE_LIST[stageIdx]}→${STAGE_LIST[stageIdx+1]})</div>
    <div>分数：<b>${score}</b>，可报考学校：</div>
    <ul>${choices.map(s=>`<li>${s.name}（分数线${s.min}）
      <button class="btn btn-small" onclick="confirmSchool(${stageIdx},'${s.name}')">选择</button></li>`).join("")}</ul>`;
  document.getElementById('game').innerHTML = html;
}
function confirmSchool(stageIdx, name) {
  let od = player.openData;
  od[`school${stageIdx+1}`] = name;
  saveSaves();
  alert(`你已选择：${name}`);
  renderLifeStage();
}

// 交友系统
function makeFriend() {
  let od = player.openData;
  od.friends = od.friends || [];
  let names = ["小明","小红","小刚","小丽","小强","小芳"];
  let newf = names[Math.floor(Math.random()*names.length)] + Math.floor(Math.random()*100);
  od.friends.push({name: newf, favor: Math.floor(Math.random()*10+1)});
  saveSaves();
  renderLifeStage();
}
function renderFriendList() {
  let arr = player.openData.friends || [];
  if(!arr.length) return "";
  return `<div style="margin:8px 0;"><b>朋友：</b>${arr.map(f=>`${f.name}(好感${f.favor})`).join("、")}</div>`;
}

// 宠物系统
function adoptPet() {
  let od = player.openData;
  od.pets = od.pets || [];
  let types = ["猫","狗","仓鼠","乌龟","金鱼"];
  let newp = types[Math.floor(Math.random()*types.length)] + Math.floor(Math.random()*1000);
  od.pets.push({type: newp, health: 10});
  saveSaves();
  renderLifeStage();
}
function renderPetList() {
  let arr = player.openData.pets || [];
  if(!arr.length) return "";
  return `<div style="margin:8px 0;"><b>宠物：</b>${arr.map(p=>p.type).join("、")}</div>`;
}

// 手机/炒股/新闻
function unlockPhone() {
  let od = player.openData;
  od.phone = true;
  saveSaves();
  renderLifeStage();
}
function readNews() {
  let nl = data.news;
  alert(nl[Math.floor(Math.random()*nl.length)].title);
}
function tradeStock() {
  let od = player.openData;
  od.money = od.money || 1000;
  let updown = Math.random()<0.5?-1:1;
  let change = Math.floor(Math.random()*300)*updown;
  od.money += change;
  saveSaves();
  alert(`你用手机炒股，本次收益：${change>0?'+':''}${change}元\n当前资产：${od.money}元`);
  renderLifeStage();
}

// 兼职
function partTimeJob() {
  let od = player.openData;
  od.money = od.money || 1000;
  let earn = Math.floor(Math.random()*500+100);
  od.money += earn;
  saveSaves();
  alert(`你兼职赚了${earn}元，当前资产：${od.money}元`);
  renderLifeStage();
}

// 科研/社团/娱乐/恋爱
function doResearch() {
  let od = player.openData;
  od.techs = od.techs || [];
  let techName = ["人工智能","生物工程","材料科学","管理学"];
  let t = techName[Math.floor(Math.random()*techName.length)];
  od.techs.push(t);
  saveSaves();
  alert(`你参与科研，获得成就：${t}`);
  renderLifeStage();
}
function socialize() {
  alert("你参加社团活动，扩大了朋友圈！");
  renderLifeStage();
}
function entertain() {
  let od = player.openData;
  od.money = (od.money||0)-200;
  alert("你娱乐消费放松心情，花费200元，身心愉快！");
  renderLifeStage();
}

// 恋爱
function loveSystem() {
  let girls = data.girls || [{name:"小雅"},{name:"思思"}];
  let od = player.openData;
  od.love = od.love || {has:false,who:""};
  if(od.love.has) {
    alert(`你已和${od.love.who}确定关系，感情升温！`);
    return renderLifeStage();
  }
  let html = `<div class="step-title">表白对象</div>
    <div>你准备向谁表白？</div>
    <ul>${girls.map(g=>`<li>${g.name}（${g.desc}）<button class="btn btn-small" onclick="loveTry('${g.name}')">表白</button></li>`).join("")}</ul>
    <button class="btn btn-small" onclick="renderLifeStage()">返回</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function loveTry(name) {
  let ok = Math.random()<0.5;
  let od = player.openData;
  if(ok) {
    od.love = {has:true,who:name};
    saveSaves();
    alert("表白成功！你和"+name+"成为情侣！");
  } else {
    alert("表白被婉拒，下次再努力！");
  }
  renderLifeStage();
}

// =====================
// 自由探索（社会人生阶段） 
// =====================
function exploreSociety() {
  let od = player.openData;
  let html = `<div class="step-title">社会人生·自由探索</div>
    <div>
      <button class="btn" onclick="jobMarket()">找工作</button>
      <button class="btn" onclick="goShopping()">逛街/城市探索</button>
      <button class="btn" onclick="improveSelf()">自我提升</button>
      <button class="btn" onclick="societyLove()">谈恋爱</button>
      <button class="btn" onclick="buyHouse()">买房置业</button>
      <button class="btn" onclick="randomEvent()">随机人生事件</button>
      <button class="btn btn-small" onclick="backHome()">返回主界面</button>
    </div>
    <hr>
    <div style="margin-top:14px;">职业：<b>${od.job?od.job.name:"无"}</b>　薪资：<b>${od.job?od.job.salary+"元/月":"-"}</b>　房产：${od.house?od.house:"无"}</div>
    <div>资产：<b>${od.money||0}元</b>　${od.love&&od.love.has?"伴侣："+od.love.who:""}</div>
  `;
  document.getElementById('game').innerHTML = html;
}

// 工作
const JOB_LIST = [
  {name:"公务员", min:{intelligence:7,appearance:5}, salary:8000},
  {name:"程序员", min:{intelligence:8}, salary:15000},
  {name:"教师", min:{intelligence:6,appearance:5}, salary:7000},
  {name:"金融分析师", min:{intelligence:9}, salary:20000},
  {name:"服务员", min:{physique:6}, salary:4500},
  {name:"模特", min:{appearance:8}, salary:12000},
  {name:"工厂工人", min:{physique:7}, salary:6000},
  {name:"自媒体", min:{appearance:5,intelligence:6}, salary:5000+Math.floor(Math.random()*10000)},
  {name:"保安", min:{physique:6}, salary:5000}
];
function jobMarket() {
  let od = player.openData;
  let attr = od.attributes || {};
  let html = `<div class="step-title">招聘市场</div><div>可应聘：</div><ul>`;
  JOB_LIST.forEach(job=>{
    html += `<li>${job.name}（薪资${job.salary}元/月，要求：${Object.entries(job.min).map(([k,v])=>{
      let cn = {"intelligence":"智商","physique":"体质","appearance":"颜值"}[k];
      return cn+">="+v;
    }).join("，")})
    <button class="btn btn-small" onclick="jobInterview('${job.name}')">面试</button></li>`;
  });
  html += `</ul><button class="btn btn-small" onclick="exploreSociety()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function jobInterview(jobName) {
  let job = JOB_LIST.find(j=>j.name===jobName);
  let od = player.openData;
  let attr = od.attributes || {};
  let pass = true, lack = [];
  for(let k in job.min) {
    if((attr[k]||0)<job.min[k]) {pass=false; lack.push(k);}
  }
  if(!pass) {
    alert("你的"+lack.map(k=>({"intelligence":"智商","physique":"体质","appearance":"颜值"}[k])).join("、")+"不达标，面试失败！");
    jobMarket();
    return;
  }
  let success = Math.random()<0.8;
  if(success) {
    od.job = {name:job.name,salary:job.salary};
    saveSaves();
    alert("面试成功！你成为了："+job.name+"，月薪："+job.salary+"元");
    exploreSociety();
  } else {
    alert("面试临场发挥不好，遗憾落选，下次再来！");
    jobMarket();
  }
}

// 城市探索
function goShopping() {
  const places = [
    {name:"市中心商场",event:"你遇到老同学一起喝咖啡，心情愉快！"},
    {name:"公园",event:"你在公园散步，遇到一只流浪猫，心情好。"},
    {name:"健身房",event:"锻炼身体，体质提升1点。"},
    {name:"书店",event:"买书提升智商1点。"},
    {name:"美食街",event:"美食花200元，心情+5。"},
    {name:"网红景点",event:"自拍发朋友圈收获点赞。"}
  ];
  let od = player.openData;
  let html = `<div class="step-title">你要去哪？</div>
    <ul>${places.map((p,i)=>`<li>${p.name} <button class="btn btn-small" onclick="placeEvent(${i})">前往</button></li>`).join("")}</ul>
    <button class="btn btn-small" onclick="exploreSociety()">返回</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function placeEvent(i) {
  const places = [
    {name:"市中心商场",event:"你遇到老同学一起喝咖啡，心情愉快！"},
    {name:"公园",event:"你在公园散步，遇到一只流浪猫，心情好。"},
    {name:"健身房",event:"锻炼身体，体质提升1点。"},
    {name:"书店",event:"买书提升智商1点。"},
    {name:"美食街",event:"美食花200元，心情+5。"},
    {name:"网红景点",event:"自拍发朋友圈收获点赞。"}
  ];
  let od = player.openData;
  let msg = places[i].event;
  if(i===2) { od.attributes.physique++; }
  if(i===3) { od.attributes.intelligence++; }
  if(i===4) { od.money=(od.money||0)-200; }
  saveSaves();
  alert(msg);
  goShopping();
}

// 自我提升
function improveSelf() {
  let od = player.openData;
  od.attributes.intelligence++;
  od.attributes.physique++;
  od.money = (od.money||0)-500;
  saveSaves();
  alert("你参加了培训班，智商和体质都提升了1点。");
  exploreSociety();
}

// 社会阶段恋爱
function societyLove() {
  let girls = data.girls || [{name:"小雅"},{name:"思思"},{name:"可馨"}];
  let od = player.openData;
  od.love = od.love || {has:false,who:""};
  if(od.love.has) {
    alert(`你已和${od.love.who}确定恋爱关系！`);
    return exploreSociety();
  }
  let html = `<div class="step-title">表白对象</div>
    <ul>${girls.map(g=>`<li>${g.name}（${g.desc}）<button class="btn btn-small" onclick="societyLoveTry('${g.name}')">表白</button></li>`).join("")}</ul>
    <button class="btn btn-small" onclick="exploreSociety()">返回</button>
  `;
  document.getElementById('game').innerHTML = html;
}
function societyLoveTry(name) {
  let ok = Math.random()<0.5;
  let od = player.openData;
  if(ok) {
    od.love = {has:true,who:name};
    saveSaves();
    alert("表白成功！你和"+name+"成为情侣！");
  } else {
    alert("表白被婉拒，下次再努力！");
  }
  exploreSociety();
}

// 买房
function buyHouse() {
  let od = player.openData;
  if(od.house) {
    alert("你已经拥有房产："+od.house);
    return exploreSociety();
  }
  let houses = [
    {name:"一居室",price:300000},
    {name:"两居室",price:500000},
    {name:"别墅",price:2000000}
  ];
  let html = `<div class="step-title">可购房产</div>
    <ul>${houses.map(h=>`<li>${h.name}（价格${h.price}元）
    <button class="btn btn-small" onclick="houseBuy('${h.name}',${h.price})">购买</button></li>`).join("")}</ul>
    <button class="btn btn-small" onclick="exploreSociety()">返回</button>`;
  document.getElementById('game').innerHTML = html;
}
function houseBuy(name, price) {
  let od = player.openData;
  od.money = od.money || 0;
  if(od.money<price) {
    alert("资产不足，无法购买！");
    return buyHouse();
  }
  od.money -= price;
  od.house = name;
  saveSaves();
  alert("恭喜你购得新房："+name);
  exploreSociety();
}

// 随机人生事件
function randomEvent() {
  let od = player.openData;
  let arr = [
    "你收到一笔意外红包，+500元！",
    "好友请你吃饭，心情大好。",
    "遭遇小偷，丢失300元。",
    "生病花费1000元医药费。",
    "幸运中了一次彩票，+2000元！",
    "被同事夸奖，心情+10。",
    "遇到堵车迟到，被老板批评。",
    "与朋友发生误会，心情-5。",
    "学习进步，智商+1。",
    "锻炼身体，体质+1。"
  ];
  let i = Math.floor(Math.random()*arr.length);
  let msg = arr[i];
  if(i===0) od.money = (od.money||0)+500;
  if(i===2) od.money = (od.money||0)-300;
  if(i===3) od.money = (od.money||0)-1000;
  if(i===4) od.money = (od.money||0)+2000;
  if(i===8) od.attributes.intelligence++;
  if(i===9) od.attributes.physique++;
  saveSaves();
  alert("随机事件："+msg);
  exploreSociety();
}