// 基础玩家数据
let player = {
  name: "你",
  money: 100000,
  mood: 60
};

let data = { items: [], girls: [], news: [] };

// 异步加载 data.json
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    render();
  });

// 主UI渲染
function render() {
  let html = `
    <div><b>姓名：</b>${player.name}　<b>金钱：</b>￥${player.money}　<b>心情：</b>${player.mood}</div>
    <hr>
    <h3>花钱享受人生</h3>
    <ul>
  `;
  data.items.forEach(item => {
    html += `<li>
      ${item.name}（￥${item.price}，${item.desc}）
      <button class="btn" onclick="buyItem(${item.id})">购买</button>
    </li>`;
  });
  html += `</ul>
    <h3>社交/恋爱</h3>
    <ul>
  `;
  data.girls.forEach((girl, i) => {
    html += `<li>
      <b>${girl.name}</b>：${girl.desc}　好感度：${girl.favor}
      <button class="btn" onclick="dateGirl(${i})">约会</button>
    </li>`;
  });
  html += `</ul>
    <h3>新闻</h3>
    <ul>
  `;
  data.news.forEach(news => {
    html += `<li>${news.title}</li>`;
  });
  html += `</ul>`;
  document.getElementById('game').innerHTML = html;
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
  render();
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
  render();
}
