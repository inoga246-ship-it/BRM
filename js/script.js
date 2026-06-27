const brm = document.getElementById("brm");
const startTime = document.getElementById("startTime");
const distance = document.getElementById("distance");
const pcInput = document.getElementById("pcInput");
const shopInput = document.getElementById("shopInput");
const menuTrigger = document.getElementById("menuTrigger");
const menuContent = document.getElementById("menuContent");
const menuCloseBtn = document.getElementById("menuCloseBtn");
const resetBtn = document.getElementById("resetBtn");
const shopToggle = document.getElementById("shopToggle");
const mapDblClickToggle = document.getElementById("mapDblClickToggle");
const shopCard = document.getElementById("shopCard");

const convenienceBtnToggle = document.getElementById("convenienceBtnToggle");
const convenienceBtnWrapper = document.getElementById("convenienceBtnWrapper");
const convenienceBtn = document.getElementById("convenienceBtn");
const topRowGrid = document.getElementById("topRowGrid");

const helpTrigger = document.getElementById("helpTrigger");
const helpModal = document.getElementById("helpModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const pcPrevBtn = document.getElementById("pcPrevBtn");
const pcNextBtn = document.getElementById("pcNextBtn");
const pcRemainDist = document.getElementById("pcRemainDist");
const pcTitleRow = document.getElementById("pcTitleRow");

const shopPrevBtn = document.getElementById("shopPrevBtn");
const shopNextBtn = document.getElementById("shopNextBtn");
const shopRemainDist = document.getElementById("shopRemainDist");
const shopTitleRow = document.getElementById("shopTitleRow");

const graphBar = document.getElementById("graphBar");
const graphScale = document.getElementById("graphScale");

const saveName = document.getElementById("saveName");
const saveBtn = document.getElementById("saveBtn");
const savedListsSelect = document.getElementById("savedListsSelect");
const deleteBtn = document.getElementById("deleteBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

// GPX関連の要素
const gpxBtn = document.getElementById("gpxBtn");
const gpxFileInput = document.getElementById("gpxFileInput");

const circleNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];

const defaultPCList = "PC1, 御幸橋, 24.9km\nPC2, 山城大橋, 68.0km";
const defaultShopList = "ローソン 八幡南店, 32.1\nセブン 宇治川店, 50.4";

let globalPCList = [];   
let globalShopList = []; 
let gpxTrackPoints = []; // GPXから解析した全トラックポイント [{lat, lon, ele, dist, gain}]

let pcDisplayIdx = -1; 
let pcAutoTrackIdx = -1;        
let isPcUserNavigating = false; 

let shopDisplayIdx = -1;
let shopAutoTrackIdx = -1;
let isShopUserNavigating = false;

let tempDistanceValue = ""; 

let lastPcInputText = null;
let lastShopInputText = null;

function toHalfWidthAlphaNum(str) {
  if (!str) return "";
  return str.replace(/[！-～]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  }).replace(/[\s ]+/g, '').toUpperCase();
}

startTime.value = localStorage.getItem("startTime") || "";
brm.value = localStorage.getItem("brm") || "200,13.5";
distance.value = localStorage.getItem("distance") || "";
pcInput.value = localStorage.getItem("pcList3") || defaultPCList;
shopInput.value = localStorage.getItem("shopList3") || defaultShopList;

// GPXトラックデータの復元
try {
  const cachedGpx = localStorage.getItem("gpxTrackPoints");
  if (cachedGpx) gpxTrackPoints = JSON.parse(cachedGpx);
} catch(e) { gpxTrackPoints = []; }

const savedToggleState = localStorage.getItem("shopToggleState");
if (savedToggleState === "false") {
  shopToggle.checked = false;
  document.body.classList.add("shop-off");
  shopCard.style.display = "none";
} else {
  shopToggle.checked = true;
  document.body.classList.remove("shop-off");
  shopCard.style.display = "block";
}

const savedMapDblClickState = localStorage.getItem("mapDblClickState");
if (savedMapDblClickState === "false") {
  mapDblClickToggle.checked = false;
} else {
  mapDblClickToggle.checked = true;
}

const savedConvenienceBtnState = localStorage.getItem("convenienceBtnState");
if (savedConvenienceBtnState === "false") {
  convenienceBtnToggle.checked = false;
  convenienceBtnWrapper.style.display = "none";
  topRowGrid.classList.add("convenience-off");
} else {
  convenienceBtnToggle.checked = true;
  convenienceBtnWrapper.style.display = "block";
  topRowGrid.classList.remove("convenience-off");
}

menuTrigger.addEventListener("click", () => menuContent.classList.add("open"));
menuCloseBtn.addEventListener("click", () => menuContent.classList.remove("open"));
menuContent.addEventListener("click", (e) => { if (e.target === menuContent) { menuContent.classList.remove("open"); } });

helpTrigger.addEventListener("click", () => { helpModal.classList.add("open"); });
modalCloseBtn.addEventListener("click", () => { helpModal.classList.remove("open"); });
helpModal.addEventListener("click", (e) => { if (e.target === helpModal) { helpModal.classList.remove("open"); } });

shopToggle.addEventListener("change", () => {
  localStorage.setItem("shopToggleState", shopToggle.checked);
  if (shopToggle.checked) {
    document.body.classList.remove("shop-off");
    shopCard.style.display = "block";
  } else {
    document.body.classList.add("shop-off");
    shopCard.style.display = "none";
  }
  const brmVal = brm.value || "200,13.5";
  const [targetDistance] = brmVal.split(",").map(Number);
  renderGraphScale(targetDistance);
  updateDisplayOnly();
});

mapDblClickToggle.addEventListener("change", () => { localStorage.setItem("mapDblClickState", mapDblClickToggle.checked); });

convenienceBtnToggle.addEventListener("change", () => {
  localStorage.setItem("convenienceBtnState", convenienceBtnToggle.checked);
  if (convenienceBtnToggle.checked) {
    convenienceBtnWrapper.style.display = "block";
    topRowGrid.classList.remove("convenience-off");
  } else {
    convenienceBtnWrapper.style.display = "none";
    topRowGrid.classList.add("convenience-off");
  }
});

distance.addEventListener("focus", () => { tempDistanceValue = distance.value; distance.value = ""; });
distance.addEventListener("blur", () => { if (distance.value === "") { distance.value = tempDistanceValue; update(false); } });

function searchOnGoogleMap(keyword) {
  if (!keyword || keyword.includes("ゴール") || keyword.includes("登録なし") || keyword.includes("---")) return;
  const userAgent = navigator.userAgent.toLowerCase();
  
  let url = /iphone|ipad|ipod/.test(userAgent) 
    ? "http://maps.apple.com/?q=" + encodeURIComponent(keyword) 
    : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(keyword);
    
  if (window.cordova && window.cordova.InAppBrowser) { 
    window.cordova.InAppBrowser.open(url, '_system'); 
  } else { 
    window.open(url, '_blank'); 
  }
}

function searchOnGoogleMapNearby(keyword, lat, lng) {
  const userAgent = navigator.userAgent.toLowerCase();
  let url;
  if (/iphone|ipad|ipod/.test(userAgent)) {
    url = "http://maps.apple.com/?q=" + encodeURIComponent(keyword) + "&sll=" + lat + "," + lng + "&z=15";
  } else {
    url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(keyword + " 近く") + "&center=" + lat + "," + lng;
  }
  if (window.cordova && window.cordova.InAppBrowser) { window.cordova.InAppBrowser.open(url, '_system'); } else { window.open(url, '_blank'); }
}

convenienceBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { searchOnGoogleMapNearby("コンビニ", pos.coords.latitude, pos.coords.longitude); },
      () => { searchOnGoogleMap("コンビニ"); },
      { timeout: 5000, maximumAge: 60000 }
    );
  } else {
    searchOnGoogleMap("コンビニ");
  }
});

pcRemainDist.addEventListener("dblclick", (e) => { e.stopPropagation(); if (isPcUserNavigating) { isPcUserNavigating = false; pcDisplayIdx = pcAutoTrackIdx; update(true); } });
pcTitleRow.addEventListener("dblclick", (e) => { e.stopPropagation(); if (!mapDblClickToggle.checked) return; if (globalPCList.length > 0 && pcDisplayIdx !== -1) { const item = globalPCList[pcDisplayIdx]; searchOnGoogleMap(item.id + " " + item.name); } });
shopRemainDist.addEventListener("dblclick", (e) => { e.stopPropagation(); if (isShopUserNavigating) { isShopUserNavigating = false; shopDisplayIdx = shopAutoTrackIdx; update(true); } });
shopTitleRow.addEventListener("dblclick", (e) => { e.stopPropagation(); if (!mapDblClickToggle.checked) return; if (globalShopList.length > 0 && shopDisplayIdx !== -1) { searchOnGoogleMap(globalShopList[shopDisplayIdx].name); } });

// --- GPXパーサー実装部分 ---
gpxBtn.addEventListener("click", () => gpxFileInput.click());
gpxFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
      
      const trkpts = xmlDoc.getElementsByTagName("trkpt");
      if (trkpts.length === 0) { alert("GPXファイル内にトラックデータ(ルート線)が見つかりませんでした。"); return; }
      
      gpxTrackPoints = [];
      let totalDist = 0;
      let totalGain = 0;
      
      const ELE_THRESHOLD = 1.5; 
      let lastCountedEle = null; 
      
      function calcDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }
      
      for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute("lat"));
        const lon = parseFloat(trkpts[i].getAttribute("lon"));
        const eleEl = trkpts[i].getElementsByTagName("ele")[0];
        const ele = eleEl ? parseFloat(eleEl.textContent) : 0;
        
        if (i === 0) {
          lastCountedEle = ele;
        } else {
          const prev = gpxTrackPoints[i - 1];
          const d = calcDistance(prev.lat, prev.lon, lat, lon);
          totalDist += d;
          
          const dEle = ele - lastCountedEle;
          if (dEle >= ELE_THRESHOLD) {
            totalGain += dEle;
            lastCountedEle = ele; 
          } else if (dEle <= -ELE_THRESHOLD) {
            lastCountedEle = ele;
          }
        }
        gpxTrackPoints.push({ lat, lon, ele, dist: totalDist, gain: totalGain });
      }
      localStorage.setItem("gpxTrackPoints", JSON.stringify(gpxTrackPoints));

      const wpts = xmlDoc.getElementsByTagName("wpt");
      let pcTextLines = [];
      let shopTextLines = [];
      
      for (let i = 0; i < wpts.length; i++) {
        const wLat = parseFloat(wpts[i].getAttribute("lat"));
        const wLon = parseFloat(wpts[i].getAttribute("lon"));
        const nameEl = wpts[i].getElementsByTagName("name")[0];
        const name = nameEl ? nameEl.textContent.trim() : `Point ${i+1}`;
        const nameLower = name.toLowerCase();
        
        let minDist = Infinity;
        let matchedPoint = gpxTrackPoints[0];
        for (let j = 0; j < gpxTrackPoints.length; j++) {
          const d = calcDistance(wLat, wLon, gpxTrackPoints[j].lat, gpxTrackPoints[j].lon);
          if (d < minDist) { minDist = d; matchedPoint = gpxTrackPoints[j]; }
        }
        
        const ptDistStr = matchedPoint.dist.toFixed(1);
        
        if (nameLower.includes("pc") || nameLower.includes("check") || nameLower.includes("チェック") || nameLower.includes("start") || nameLower.includes("goal") || nameLower.includes("finish") || nameLower.includes("通過")) {
          let cleanName = name.replace(/^(pc\d*|通過チェック[①-⑳\d]*|start|goal|finish|チェック)\s*[\s ,，、_\-]/i, "").trim();
          cleanName = cleanName.replace(/^(通過チェック[①-⑳\d]*|ｐｃ\d*)/i, "").trim();
          
          let label = "PC";
          if (nameLower.includes("start")) label = "START";
          else if (nameLower.includes("goal") || nameLower.includes("finish")) label = "GOAL";
          else if (nameLower.includes("通過") || nameLower.includes("check")) label = "通過チェック";
          
          pcTextLines.push({ d: matchedPoint.dist, text: `${label}, ${cleanName}, ${ptDistStr}km` });
        } else {
          shopTextLines.push({ d: matchedPoint.dist, text: `${name}, ${ptDistStr}` });
        }
      }
      
      pcTextLines.sort((a,b) => a.d - b.d);
      shopTextLines.sort((a,b) => a.d - b.d);
      
      let pcIdx = 1;
      let chkIdx = 1;
      const formattedPcLines = pcTextLines.map(item => {
        let t = item.text;
        if (t.startsWith("PC,")) {
          t = t.replace("PC,", `PC${pcIdx},`);
          pcIdx++;
        } else if (t.startsWith("通過チェック,")) {
          t = t.replace("通過チェック,", `通過チェック${circleNumbers[chkIdx-1]||chkIdx},`);
          chkIdx++;
        }
        return t;
      });
      
      if (formattedPcLines.length > 0) pcInput.value = formattedPcLines.join("\n");
      if (shopTextLines.length > 0) shopInput.value = shopTextLines.map(item => item.text).join("\n");
      
      const finalRouteDist = Math.ceil(totalDist);
      if (finalRouteDist > 50) {
        let matchedBrmVal = "200,13.5";
        if (finalRouteDist > 550) matchedBrmVal = "600,40";
        else if (finalRouteDist > 350) matchedBrmVal = "400,27";
        else if (finalRouteDist > 250) matchedBrmVal = "300,20";
        brm.value = matchedBrmVal;
      }
      
      isPcUserNavigating = false;
      isShopUserNavigating = false;
      persistInputs();
      update(true);
      alert(`GPXデータの解析に成功しました！\n総距離: ${totalDist.toFixed(1)}km\n総獲得標高: ${Math.round(totalGain)}m\nチェックポイントを自動登録しました。`);
    } catch(err) {
      alert("GPXファイルの解析中にエラーが発生しました。");
    } finally {
      gpxFileInput.value = "";
    }
  };
  reader.readAsText(file);
});

function getElevationAtDistance(targetD) {
  if (!gpxTrackPoints || gpxTrackPoints.length === 0) return 0;
  if (targetD <= 0) return gpxTrackPoints[0].ele;
  if (targetD >= gpxTrackPoints[gpxTrackPoints.length - 1].dist) return gpxTrackPoints[gpxTrackPoints.length - 1].ele;
  
  let low = 0, high = gpxTrackPoints.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (gpxTrackPoints[mid].dist < targetD) low = mid + 1;
    else high = mid - 1;
  }
  let idx = low;
  if (idx >= gpxTrackPoints.length) idx = gpxTrackPoints.length - 1;
  return gpxTrackPoints[idx].ele;
}

function getAccumGainAtDistance(targetD) {
  if (!gpxTrackPoints || gpxTrackPoints.length === 0) return 0;
  if (targetD <= 0) return 0;
  if (targetD >= gpxTrackPoints[gpxTrackPoints.length - 1].dist) return gpxTrackPoints[gpxTrackPoints.length - 1].gain;
  
  let low = 0, high = gpxTrackPoints.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (gpxTrackPoints[mid].dist < targetD) low = mid + 1;
    else high = mid - 1;
  }
  let idx = low;
  if (idx >= gpxTrackPoints.length) idx = gpxTrackPoints.length - 1;
  return gpxTrackPoints[idx].gain;
}

// 背面のCanvas要素にオレンジ色の簡易高低図を自動描画する新機能
function drawElevationOnCanvas(currentDist, targetDistance) {
  const canvas = document.getElementById("elevationCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  // 親要素のリアルタイムな表示幅に合わせてキャンバスピクセルサイズを最適化
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!gpxTrackPoints || gpxTrackPoints.length === 0) return;
  
  // 全データ中の最高・最低高度を算出して縦軸スケールを調整
  let minEle = Infinity;
  let maxEle = -Infinity;
  gpxTrackPoints.forEach(p => {
    if (p.ele < minEle) minEle = p.ele;
    if (p.ele > maxEle) maxEle = p.ele;
  });
  if (maxEle === minEle) maxEle += 100;
  const eleRange = maxEle - minEle;
  
  // 現在の走行進捗率の計算
  const currentProgressRatio = Math.min(1, Math.max(0, currentDist / targetDistance));
  const currentX = canvas.width * currentProgressRatio;
  
  // 1. 未走破区間の高低図（薄いグレーオレンジ）
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  gpxTrackPoints.forEach(p => {
    const x = (p.dist / targetDistance) * canvas.width;
    const y = canvas.height - ((p.ele - minEle) / eleRange) * (canvas.height - 8) - 2;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = "rgba(249, 115, 22, 0.08)";
  ctx.fill();
  
  // 2. 走破済み区間の高低図（鮮やかなサイバーオレンジでの塗りつぶし）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, currentX, canvas.height);
  ctx.clip();
  
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  gpxTrackPoints.forEach(p => {
    const x = (p.dist / targetDistance) * canvas.width;
    const y = canvas.height - ((p.ele - minEle) / eleRange) * (canvas.height - 8) - 2;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = "rgba(249, 115, 22, 0.35)";
  ctx.fill();
  ctx.restore();
  
  // 3. 高低図のアウトライン最上部（シャープなオレンジの境界線）
  ctx.beginPath();
  gpxTrackPoints.forEach((p, idx) => {
    const x = (p.dist / targetDistance) * canvas.width;
    const y = canvas.height - ((p.ele - minEle) / eleRange) * (canvas.height - 8) - 2;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function parsePCList() {
  const lines = pcInput.value.split("\n");
  const list = [];
  lines.forEach(line => {
    let parts = line.split(/[,，、]/);
    if (parts.length >= 2) {
      let idStr = parts[0].trim();
      let nameStr = parts[1].trim();
      let distStr = parts[2] ? parts[2].trim() : "";
      
      if (!distStr && nameStr) {
        let match = nameStr.match(/([\d.]+)\s*(km|KM)?$/);
        if (match) {
          distStr = match[1];
          nameStr = nameStr.replace(/([\d.]+)\s*(km|KM)?$/, "").trim();
        }
      }
      let d = parseFloat(distStr);
      if (!isNaN(d)) {
        list.push({ id: idStr, name: nameStr, dist: d });
      }
    }
  });
  list.sort((a, b) => a.dist - b.dist);
  return list;
}

function parseShopList() {
  const lines = shopInput.value.split("\n");
  const list = [];
  lines.forEach(line => {
    let parts = line.split(/[,，、]/);
    if (parts.length >= 2) {
      let nameStr = parts[0].trim();
      let distStr = parts[1].trim();
      let d = parseFloat(distStr);
      if (!isNaN(d)) {
        list.push({ name: nameStr, dist: d });
      }
    } else if (parts.length === 1 && parts[0].trim()) {
      let lineStr = parts[0].trim();
      let match = lineStr.match(/^(.*?)([\d.]+)$/);
      if (match) {
        let nameStr = match[1].replace(/[,，、\s]+$/, "").trim();
        let d = parseFloat(match[2]);
        if (!isNaN(d) && nameStr) {
          list.push({ name: nameStr, dist: d });
        }
      }
    }
  });
  list.sort((a, b) => a.dist - b.dist);
  return list;
}

function persistInputs() {
  localStorage.setItem("startTime", startTime.value);
  localStorage.setItem("brm", brm.value);
  localStorage.setItem("distance", distance.value);
  localStorage.setItem("pcList3", pcInput.value);
  localStorage.setItem("shopList3", shopInput.value);
}

pcPrevBtn.addEventListener("click", () => {
  if (globalPCList.length === 0) return;
  isPcUserNavigating = true;
  pcDisplayIdx--;
  if (pcDisplayIdx < 0) pcDisplayIdx = 0;
  update(true);
});
pcNextBtn.addEventListener("click", () => {
  if (globalPCList.length === 0) return;
  isPcUserNavigating = true;
  pcDisplayIdx++;
  if (pcDisplayIdx >= globalPCList.length) pcDisplayIdx = globalPCList.length - 1;
  update(true);
});

shopPrevBtn.addEventListener("click", () => {
  if (globalShopList.length === 0) return;
  isShopUserNavigating = true;
  shopDisplayIdx--;
  if (shopDisplayIdx < 0) shopDisplayIdx = 0;
  update(true);
});
shopNextBtn.addEventListener("click", () => {
  if (globalShopList.length === 0) return;
  isShopUserNavigating = true;
  shopDisplayIdx++;
  if (shopDisplayIdx >= globalShopList.length) shopDisplayIdx = globalShopList.length - 1;
  update(true);
});

function renderGraphScale(targetDistance) {
  const existingMarks = graphScale.querySelectorAll(".scale-mark, .scale-label");
  existingMarks.forEach(el => el.remove());
  
  let step = 50;
  if (targetDistance <= 200) step = 50;
  else if (targetDistance <= 400) step = 100;
  else step = 100;
  
  for (let d = step; d < targetDistance; d += step) {
    let pct = (d / targetDistance) * 100;
    
    let mark = document.createElement("div");
    mark.className = "scale-mark";
    mark.style.left = pct + "%";
    graphScale.appendChild(mark);
    
    let label = document.createElement("div");
    label.className = "scale-label";
    label.style.left = pct + "%";
    label.innerText = d;
    graphScale.appendChild(label);
  }
}

function updateDisplayOnly() {
  update(true);
}

function update(forceListReparse = false) {
  if (forceListReparse || lastPcInputText !== pcInput.value) {
    globalPCList = parsePCList();
    lastPcInputText = pcInput.value;
  }
  if (forceListReparse || lastShopInputText !== shopInput.value) {
    globalShopList = parseShopList();
    lastShopInputText = shopInput.value;
  }
  
  const curD = parseFloat(distance.value) || 0;
  const brmVal = brm.value || "200,13.5";
  const [targetDistance, limitHours] = brmVal.split(",").map(Number);
  
  let progressPct = (curD / targetDistance) * 100;
  if (progressPct < 0) progressPct = 0;
  if (progressPct > 100) progressPct = 100;
  graphBar.style.width = progressPct + "%";
  
  // 高低図をリアルタイム自動再描画
  drawElevationOnCanvas(curD, targetDistance);
  
  let autoPcIdx = globalPCList.findIndex(item => item.dist > curD);
  if (autoPcIdx === -1 && globalPCList.length > 0) {
    autoPcIdx = globalPCList.length - 1;
  }
  pcAutoTrackIdx = autoPcIdx;
  if (!isPcUserNavigating) {
    pcDisplayIdx = autoPcIdx;
  }
  
  let autoShopIdx = globalShopList.findIndex(item => item.dist > curD);
  if (autoShopIdx === -1 && globalShopList.length > 0) {
    autoShopIdx = globalShopList.length - 1;
  }
  shopAutoTrackIdx = autoShopIdx;
  if (!isShopUserNavigating) {
    shopDisplayIdx = autoShopIdx;
  }
  
  // --- ① PCカードの更新 ---
  if (globalPCList.length === 0) {
    pcRemainDist.innerHTML = `残り -- km<span class="ele-small">獲得標高 --m</span>`;
    document.getElementById("pcLabel").innerText = "次: PC枠の登録なし";
    ["15","16","17","18","19","20"].forEach(s => document.getElementById("pc_sp" + s).innerText = "--:--");
  } else if (pcDisplayIdx !== -1) {
    const item = globalPCList[pcDisplayIdx];
    const diff = item.dist - curD;
    
    let signStr = isPcUserNavigating ? "◀ " : "次: ";
    if (diff < 0) {
      pcRemainDist.innerHTML = `通過済 ${Math.abs(diff).toFixed(1)} km`;
      document.getElementById("pcLabel").innerText = `${item.id} ${item.name} (${item.dist.toFixed(1)}km)`;
    } else {
      // 改良完了：獲得標高から「（ ）」の括弧を除去して直にすっきり結合
      if (gpxTrackPoints && gpxTrackPoints.length > 0) {
        const gainAtPoint = getAccumGainAtDistance(item.dist);
        pcRemainDist.innerHTML = `残り ${diff.toFixed(1)} km<span class="ele-small">獲得標高 ${Math.round(gainAtPoint)}m</span>`;
      } else {
        pcRemainDist.innerHTML = `残り ${diff.toFixed(1)} km<span class="ele-small">獲得標高 --m</span>`;
      }
      document.getElementById("pcLabel").innerText = `${signStr}${item.id} ${item.name} (${item.dist.toFixed(1)}km)`;
    }
    
    if (startTime.value) {
      const sTime = new Date(startTime.value);
      ["15","16","17","18","19","20"].forEach(s => {
        const speed = parseInt(s);
        const hoursNeeded = item.dist / speed;
        const targetTime = new Date(sTime.getTime() + hoursNeeded * 60 * 60 * 1000);
        document.getElementById("pc_sp" + s).innerText = 
          String(targetTime.getHours()).padStart(2, '0') + ":" + String(targetTime.getMinutes()).padStart(2, '0');
      });
    } else {
      ["15","16","17","18","19","20"].forEach(s => document.getElementById("pc_sp" + s).innerText = "--:--");
    }
  }
  
  // --- ② 休憩・コンビニカードの更新 ---
  if (!shopToggle.checked) {
    // 非表示なら処理スキップ
  } else if (globalShopList.length === 0) {
    shopRemainDist.innerHTML = `残り -- km<span class="ele-small">獲得標高 --m</span>`;
    document.getElementById("shopLabel").innerText = "次休憩: 登録なし";
  } else if (shopDisplayIdx !== -1) {
    const item = globalShopList[shopDisplayIdx];
    const diff = item.dist - curD;
    
    let signStr = isShopUserNavigating ? "◀ " : "次休憩: ";
    if (diff < 0) {
      shopRemainDist.innerHTML = `通過済 ${Math.abs(diff).toFixed(1)} km`;
      document.getElementById("shopLabel").innerText = `${item.name} (${item.dist.toFixed(1)}km)`;
    } else {
      // 改良完了：獲得標高から「（ ）」の括弧を除去して直にすっきり結合
      if (gpxTrackPoints && gpxTrackPoints.length > 0) {
        const gainAtPoint = getAccumGainAtDistance(item.dist);
        shopRemainDist.innerHTML = `残り ${diff.toFixed(1)} km<span class="ele-small">獲得標高 ${Math.round(gainAtPoint)}m</span>`;
      } else {
        shopRemainDist.innerHTML = `残り ${diff.toFixed(1)} km<span class="ele-small">獲得標高 --m</span>`;
      }
      document.getElementById("shopLabel").innerText = `${signStr}${item.name} (${item.dist.toFixed(1)}km)`;
    }
  }
  
  // --- 各種下部共通数値ステータスの計算 ---
  const now = new Date();
  document.getElementById("currentTime").innerText = 
    String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
    
  if (!startTime.value) {
    ["elapsed", "remainTime", "gross", "remainDistance", "finish", "needSpeed", "saving"].forEach(id => {
      if(id !== "remainDistance") document.getElementById(id).innerText = "--";
    });
    document.getElementById("remainDistance").innerText = (targetDistance - curD).toFixed(1) + " km";
    document.getElementById("saving").className = "big-value";
    return;
  }
  
  const sTime = new Date(startTime.value);
  const limitTime = new Date(sTime.getTime() + limitHours * 60 * 60 * 1000);
  
  const elapsedMs = now.getTime() - sTime.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  
  if (elapsedHours < 0) {
    document.getElementById("elapsed").innerText = "未スタート";
    document.getElementById("remainTime").innerText = limitHours.toFixed(1) + "h";
    document.getElementById("gross").innerText = "0.0 km/h";
    document.getElementById("remainDistance").innerText = (targetDistance - curD).toFixed(1) + " km";
    document.getElementById("finish").innerText = "--:--";
    document.getElementById("needSpeed").innerText = (targetDistance / limitHours).toFixed(1) + " km/h";
    document.getElementById("saving").innerText = "00:00";
    document.getElementById("saving").className = "big-value green";
    return;
  }
  
  // 経過時間
  const elapH = Math.floor(elapsedHours);
  const elapM = Math.floor((elapsedHours - elapH) * 60);
  document.getElementById("elapsed").innerText = String(elapH).padStart(2, '0') + ":" + String(elapM).padStart(2, '0');
  
  // 残り時間
  const remainMs = limitTime.getTime() - now.getTime();
  const remainHours = remainMs / (1000 * 60 * 60);
  if (remainHours < 0) {
    document.getElementById("remainTime").innerText = "タイムアウト";
  } else {
    const remH = Math.floor(remainHours);
    const remM = Math.floor((remainHours - remH) * 60);
    document.getElementById("remainTime").innerText = String(remH).padStart(2, '0') + ":" + String(remM).padStart(2, '0');
  }
  
  // グロス速度
  const grossSpeed = elapsedHours > 0 ? (curD / elapsedHours) : 0;
  document.getElementById("gross").innerText = grossSpeed.toFixed(1) + " km/h";
  
  // 残り距離
  const remDist = targetDistance - curD;
  document.getElementById("remainDistance").innerText = (remDist < 0 ? 0 : remDist).toFixed(1) + " km";
  
  // 完走予想時刻
  if (curD > 0.1 && grossSpeed > 2) {
    const totalEstHours = targetDistance / grossSpeed;
    const finishTime = new Date(sTime.getTime() + totalEstHours * 60 * 60 * 1000);
    document.getElementById("finish").innerText = 
      String(finishTime.getHours()).padStart(2, '0') + ":" + String(finishTime.getMinutes()).padStart(2, '0');
  } else {
    document.getElementById("finish").innerText = "--:--";
  }
  
  // 必要平均速度
  if (remDist <= 0) {
    document.getElementById("needSpeed").innerText = "ゴール済";
  } else if (remainHours <= 0) {
    document.getElementById("needSpeed").innerText = "制限超過";
  } else {
    const needS = remDist / remainHours;
    document.getElementById("needSpeed").innerText = needS.toFixed(1) + " km/h";
  }
  
  // 貯金時間計算 (現在距離に対する法定時間との差分)
  const legalSpeed = targetDistance / limitHours; 
  const legalHoursForCurD = curD / legalSpeed;
  const savingHours = legalHoursForCurD - elapsedHours;
  
  const isMinus = savingHours < 0;
  const absSaving = Math.abs(savingHours);
  const savH = Math.floor(absSaving);
  const savM = Math.floor((absSaving - savH) * 60);
  
  let savingStr = (isMinus ? "-" : "") + String(savH).padStart(2, '0') + ":" + String(savM).padStart(2, '0');
  document.getElementById("saving").innerText = savingStr;
  
  // 貯金時間のネオンカラー分岐
  const svElement = document.getElementById("saving");
  if (isMinus) {
    svElement.className = "big-value red";
  } else {
    if (savingHours >= 2.0) {
      svElement.className = "big-value green";
    } else if (savingHours >= 1.0) {
      svElement.className = "big-value yellow";
    } else {
      svElement.className = "big-value red";
    }
  }
}

// データのローカル保存管理ロジック一式
function loadSavedListsDropdown() {
  let listNames = [];
  try {
    const stored = localStorage.getItem("brm_saved_list_names");
    if (stored) listNames = JSON.parse(stored);
  } catch(e) { listNames = []; }
  
  savedListsSelect.innerHTML = "";
  if (listNames.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.innerText = "-- 保存データがありません --";
    savedListsSelect.appendChild(opt);
  } else {
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.innerText = "-- 選択してください --";
    savedListsSelect.appendChild(defOpt);
    
    listNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.innerText = name;
      savedListsSelect.appendChild(opt);
    });
  }
}

saveBtn.addEventListener("click", () => {
  const name = saveName.value.trim();
  if (!name) { alert("保存名を入力してください。"); return; }
  
  let listNames = [];
  try {
    const stored = localStorage.getItem("brm_saved_list_names");
    if (stored) listNames = JSON.parse(stored);
  } catch(e) {}
  
  if (!listNames.includes(name)) {
    listNames.push(name);
    localStorage.setItem("brm_saved_list_names", JSON.stringify(listNames));
  }
  
  const payload = {
    brm: brm.value,
    startTime: startTime.value,
    distance: distance.value,
    pcInput: pcInput.value,
    shopInput: shopInput.value,
    gpxTrackPoints: gpxTrackPoints 
  };
  localStorage.setItem("brm_saved_data_" + name, JSON.stringify(payload));
  
  saveName.value = "";
  loadSavedListsDropdown();
  alert(`「${name}」として現在の設定・GPXをローカルに保存しました。`);
});

savedListsSelect.addEventListener("change", () => {
  const name = savedListsSelect.value;
  if (!name) return;
  
  const stored = localStorage.getItem("brm_saved_data_" + name);
  if (!stored) return;
  
  try {
    const payload = JSON.parse(stored);
    brm.value = payload.brm || "200,13.5";
    startTime.value = payload.startTime || "";
    distance.value = payload.distance || "";
    pcInput.value = payload.pcInput || "";
    shopInput.value = payload.shopInput || "";
    
    if (payload.gpxTrackPoints) {
      gpxTrackPoints = payload.gpxTrackPoints;
      localStorage.setItem("gpxTrackPoints", JSON.stringify(gpxTrackPoints));
    } else {
      gpxTrackPoints = [];
      localStorage.removeItem("gpxTrackPoints");
    }
    
    isPcUserNavigating = false;
    isShopUserNavigating = false;
    
    persistInputs();
    const [targetDistance] = brm.value.split(",").map(Number);
    renderGraphScale(targetDistance);
    update(true);
    alert(`「${name}」のデータを呼び出しました。`);
  } catch(e) {
    alert("データの読み込みに失敗しました。");
  }
  savedListsSelect.value = "";
});

deleteBtn.addEventListener("click", () => {
  const name = savedListsSelect.value;
  if (!name) { alert("削除したいリストを選択肢から選んでください。"); return; }
  if (!confirm(`本当に「${name}」の保存データを削除しますか？`)) return;
  
  let listNames = [];
  try {
    const stored = localStorage.getItem("brm_saved_list_names");
    if (stored) listNames = JSON.parse(stored);
  } catch(e) {}
  
  listNames = listNames.filter(n => n !== name);
  localStorage.setItem("brm_saved_list_names", JSON.stringify(listNames));
  localStorage.removeItem("brm_saved_data_" + name);
  
  loadSavedListsDropdown();
  alert("データを削除しました。");
});

exportBtn.addEventListener("click", () => {
  let listNames = [];
  try {
    const stored = localStorage.getItem("brm_saved_list_names");
    if (stored) listNames = JSON.parse(stored);
  } catch(e) {}
  
  const allData = { brm_saved_list_names: listNames, items: {} };
  listNames.forEach(name => {
    const raw = localStorage.getItem("brm_saved_data_" + name);
    if (raw) allData.items[name] = JSON.parse(raw);
  });
  
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `brm_pace_manager_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (!data.brm_saved_list_names || !data.items) { alert("有効なバックアップファイルではありません。"); return; }
      
      let listNames = [];
      try {
        const stored = localStorage.getItem("brm_saved_list_names");
        if (stored) listNames = JSON.parse(stored);
      } catch(e) {}
      
      data.brm_saved_list_names.forEach(name => {
        if (!listNames.includes(name)) listNames.push(name);
        localStorage.setItem("brm_saved_data_" + name, JSON.stringify(data.items[name]));
      });
      
      localStorage.setItem("brm_saved_list_names", JSON.stringify(listNames));
      loadSavedListsDropdown();
      alert("バックアップデータのインポートが完了しました！");
    } catch(err) {
      alert("ファイルのインポート中にエラーが発生しました。");
    } finally {
      importFileInput.value = "";
    }
  };
  reader.readAsText(file);
});

resetBtn.addEventListener("click", () => {
  if (confirm("全ての設定、現在の入力、読み込んだGPXトラックデータを初期化しますか？\n(※アプリ保存データは削除されません)")) {
    localStorage.removeItem("startTime");
    localStorage.removeItem("brm");
    localStorage.removeItem("distance");
    localStorage.removeItem("pcList3");
    localStorage.removeItem("shopList3");
    localStorage.removeItem("gpxTrackPoints");
    gpxTrackPoints = [];
    
    startTime.value = ""; distance.value = ""; pcInput.value = ""; shopInput.value = ""; saveName.value = ""; tempDistanceValue = ""; graphBar.style.width = "0%";
    ["elapsed", "remainTime", "gross", "remainDistance", "finish", "needSpeed", "saving"].forEach(id => document.getElementById(id).innerText = "--");
    document.getElementById("saving").className = "big-value"; isPcUserNavigating = false; isShopUserNavigating = false; menuContent.classList.remove("open");
    loadSavedListsDropdown(); savedListsSelect.selectedIndex = 0; shopToggle.checked = true; localStorage.setItem("shopToggleState", "true");
    document.body.classList.remove("shop-off"); shopCard.style.display = "block"; mapDblClickToggle.checked = true; localStorage.setItem("mapDblClickState", "true");
    convenienceBtnToggle.checked = true; convenienceBtnWrapper.style.display = "block"; topRowGrid.classList.remove("convenience-off");
    
    // キャンバスクリア
    const canvas = document.getElementById("elevationCanvas");
    if (canvas) { const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    
    update(true); alert("リセットが完了しました。");
  }
});

// ウィンドウリサイズ時にもキャンバスの横幅を自動追従させる
window.addEventListener("resize", () => {
  const brmVal = brm.value || "200,13.5";
  const [targetDistance] = brmVal.split(",").map(Number);
  updateDisplayOnly();
});

setInterval(() => update(false), 1000);
distance.addEventListener("input", () => { persistInputs(); update(true); });
pcInput.addEventListener("input", () => { persistInputs(); update(true); });
shopInput.addEventListener("input", () => { persistInputs(); update(true); });
startTime.addEventListener("change", () => { persistInputs(); update(false); });
brm.addEventListener("change", () => { persistInputs(); update(false); });
document.addEventListener("resume", () => update(false), false);

// 初期起動処理
const brmVal = brm.value || "200,13.5";
const [targetDistance] = brmVal.split(",").map(Number);
renderGraphScale(targetDistance);
loadSavedListsDropdown();
update(true);
