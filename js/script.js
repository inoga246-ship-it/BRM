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
  if (cachedGpx) {
    gpxTrackPoints = JSON.parse(cachedGpx);
    // 起動時に背景高低図を描画
    setTimeout(() => {
      const brmVal = brm.value || "200,13.5";
      const [targetDistance] = brmVal.split(",").map(Number);
      drawElevationProfile(targetDistance);
    }, 300);
  }
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
  drawElevationProfile(targetDistance);
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

// ★新機能：グラフの裏側の隙間に簡易工程高低図（SVG）を描画する関数
function drawElevationProfile(targetDistance) {
  const container = document.getElementById("graphScale");
  if (!container || gpxTrackPoints.length === 0 || !targetDistance || targetDistance <= 0) return;

  // 既存の背景用SVGを一度クリア
  const oldSvg = container.querySelector(".elevation-profile-svg");
  if (oldSvg) oldSvg.remove();

  // 標高の最大・最小値を取得
  let minEle = Infinity;
  let maxEle = -Infinity;
  gpxTrackPoints.forEach(pt => {
    if (pt.ele < minEle) minEle = pt.ele;
    if (pt.ele > maxEle) maxEle = pt.ele;
  });

  // 平坦すぎる場合の安全処理
  if (maxEle === minEle) { maxEle += 100; minEle -= 100; }
  const eleRange = maxEle - minEle;

  // トラックポイントの間引き処理（負荷軽減のため最大200ピクセルに縮小）
  const samplingCount = 150;
  let pathCoords = [];
  
  for (let i = 0; i <= samplingCount; i++) {
    const currentSampleDist = (targetDistance * i) / samplingCount;
    // 最も近い距離のポイントを探索
    let matchedPt = gpxTrackPoints[0];
    for (let j = 0; j < gpxTrackPoints.length; j++) {
      if (gpxTrackPoints[j].dist >= currentSampleDist) {
        matchedPt = gpxTrackPoints[j];
        break;
      }
    }
    
    const xPct = (matchedPt.dist / targetDistance) * 100;
    // 上下に少しマージン（10%〜90%の範囲に収める）を持たせて反転（SVGは上が0のため）
    const yPct = 95 - ((matchedPt.ele - minEle) / eleRange) * 80;
    pathCoords.push(`${xPct.toFixed(1)},${yPct.toFixed(1)}`);
  }

  // SVGエレメントを作成してスケールコンテナの最背面に挿入
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "elevation-profile-svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.zIndex = "1"; // スケールや文字より下、背景より上
  svg.style.pointerEvents = "none";
  svg.style.opacity = "0.22"; // 邪魔にならないように半透明化

  // 面を塗りつぶすためのパスデータ（山の形の下側を閉じる）
  const fillPathData = `M 0,100 L ${pathCoords.join(" L ")} L 100,100 Z`;
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", fillPathData);
  path.setAttribute("fill", "url(#elevationGrad)");
  path.setAttribute("stroke", "#38ef7d"); // 頂点ラインにネオングリーン
  path.setAttribute("stroke-width", "1.5");

  // グラデーション効果の定義
  const defs = document.createElementNS(svgNS, "defs");
  const grad = document.createElementNS(svgNS, "linearGradient");
  grad.setAttribute("id", "elevationGrad");
  grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "0%"); grad.setAttribute("y2", "100%");
  
  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%"); stop1.setAttribute("stop-color", "#11998e");
  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "100%"); stop2.setAttribute("stop-color", "transparent");

  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(path);

  container.appendChild(svg);
}

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
        if (t.startsWith("PC,")) { t = t.replace("PC,", `PC${pcIdx},`); pcIdx++; }
        else if (t.startsWith("通過チェック,")) { t = t.replace("通過チェック,", `通過チェック${circleNumbers[chkIdx-1]||chkIdx},`); chkIdx++; }
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

function getGpxGainAtDistance(dist) {
  if (gpxTrackPoints.length === 0) return 0;
  if (dist <= 0) return 0;
  for (let i = 0; i < gpxTrackPoints.length; i++) {
    if (gpxTrackPoints[i].dist >= dist) return gpxTrackPoints[i].gain;
  }
  return gpxTrackPoints[gpxTrackPoints.length - 1].gain;
}

function loadSavedListsDropdown() {
  const savedData = localStorage.getItem("customBRMDataSets3");
  let lists = savedData ? JSON.parse(savedData) : {};
  savedListsSelect.innerHTML = "";
  const keys = Object.keys(lists);
  if (keys.length === 0) {
    const opt = document.createElement("option"); opt.value = ""; opt.innerText = "-- 保存データがありません --"; savedListsSelect.appendChild(opt); return;
  }
  const defaultOpt = document.createElement("option"); defaultOpt.value = ""; defaultOpt.innerText = "-- リストを選択して呼び出し --"; savedListsSelect.appendChild(defaultOpt);
  keys.forEach(key => { const opt = document.createElement("option"); opt.value = key; opt.innerText = key; savedListsSelect.appendChild(opt); });
}

saveBtn.addEventListener("click", () => {
  const name = saveName.value.trim(); if (!name) { alert("保存する名前を入力してください。"); return; }
  const savedData = localStorage.getItem("customBRMDataSets3"); let lists = savedData ? JSON.parse(savedData) : {};
  if (lists[name] && !confirm("「" + name + "」は既に保存されています。上書きしますか？")) { return; }
  lists[name] = { pc: pcInput.value.trim(), shop: shopInput.value.trim() };
  localStorage.setItem("customBRMDataSets3", JSON.stringify(lists));
  saveName.value = ""; loadSavedListsDropdown(); alert("セット「" + name + "」を保存しました。");
});

savedListsSelect.addEventListener("change", () => {
  const selectedName = savedListsSelect.value; if (!selectedName) return;
  const savedData = localStorage.getItem("customBRMDataSets3"); let lists = savedData ? JSON.parse(savedData) : {};
  if (lists[selectedName]) {
    const data = lists[selectedName]; pcInput.value = data.pc || ""; shopInput.value = data.shop || "";
    isPcUserNavigating = false; isShopUserNavigating = false; persistInputs(); update(true); alert("「" + selectedName + "」のデータを読み込みました。");
  }
});

deleteBtn.addEventListener("click", () => {
  const selectedName = savedListsSelect.value; if (!selectedName) { alert("削除したいリストを選択してください。"); return; }
  if (confirm("リスト「" + selectedName + "」を削除してもよろしいですか？")) {
    const savedData = localStorage.getItem("customBRMDataSets3"); let lists = savedData ? JSON.parse(savedData) : {};
    delete lists[selectedName]; localStorage.setItem("customBRMDataSets3", JSON.stringify(lists));
    loadSavedListsDropdown(); alert("削除しました。");
  }
});

const BACKUP_KEYS = ["startTime", "brm", "distance", "pcList3", "shopList3", "customBRMDataSets3", "shopToggleState", "mapDblClickState", "convenienceBtnState", "gpxTrackPoints"];

exportBtn.addEventListener("click", () => {
  const backupData = {};
  BACKUP_KEYS.forEach(key => { const v = localStorage.getItem(key); if (v !== null) backupData[key] = v; });
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  const stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + "_" + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  a.href = url; a.download = "brm_pace_manager_backup_" + stamp + ".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("バックアップファイルを書き出しました。");
});

importBtn.addEventListener("click", () => { importFileInput.click(); });

importFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      const validKeys = Object.keys(parsed).filter(k => BACKUP_KEYS.includes(k));
      if (validKeys.length === 0) { alert("このファイルには有効なバックアップデータが見つかりませんでした。"); return; }
      if (!confirm("現在の設定・リストをすべて上書きして読み込みます。よろしいですか？")) return;
      validKeys.forEach(key => { localStorage.setItem(key, parsed[key]); });

      startTime.value = localStorage.getItem("startTime") || "";
      brm.value = localStorage.getItem("brm") || "200,13.5";
      distance.value = localStorage.getItem("distance") || "";
      pcInput.value = localStorage.getItem("pcList3") || "";
      shopInput.value = localStorage.getItem("shopList3") || "";

      try {
        const cachedGpx = localStorage.getItem("gpxTrackPoints");
        gpxTrackPoints = cachedGpx ? JSON.parse(cachedGpx) : [];
      } catch(e) { gpxTrackPoints = []; }

      const toggleState = localStorage.getItem("shopToggleState");
      shopToggle.checked = toggleState !== "false";
      document.body.classList.toggle("shop-off", !shopToggle.checked);
      shopCard.style.display = shopToggle.checked ? "block" : "none";

      const dblClickState = localStorage.getItem("mapDblClickState");
      mapDblClickToggle.checked = dblClickState !== "false";

      const convState = localStorage.getItem("convenienceBtnState");
      convenienceBtnToggle.checked = convState !== "false";
      convenienceBtnWrapper.style.display = convenienceBtnToggle.checked ? "block" : "none";
      topRowGrid.classList.toggle("convenience-off", !convenienceBtnToggle.checked);

      isPcUserNavigating = false; isShopUserNavigating = false;
      loadSavedListsDropdown();
      update(true);
      alert("バックアップを読み込みました。");
    } catch (err) {
      alert("ファイルの読み込みに失敗しました。");
    } finally {
      importFileInput.value = "";
    }
  };
  reader.readAsText(file);
});

pcPrevBtn.addEventListener("click", () => { if (globalPCList.length === 0) return; if (pcDisplayIdx > 0) { isPcUserNavigating = true; pcDisplayIdx--; const brmVal = brm.value || "200,13.5"; const [targetDistance] = brmVal.split(",").map(Number); renderGraphScale(targetDistance); drawElevationProfile(targetDistance); updateDisplayOnly(); } });
pcNextBtn.addEventListener("click", () => { if (globalPCList.length === 0) return; if (pcDisplayIdx < globalPCList.length - 1) { isPcUserNavigating = true; pcDisplayIdx++; const brmVal = brm.value || "200,13.5"; const [targetDistance] = brmVal.split(",").map(Number); renderGraphScale(targetDistance); drawElevationProfile(targetDistance); updateDisplayOnly(); } });
shopPrevBtn.addEventListener("click", () => { if (globalShopList.length === 0) return; if (shopDisplayIdx > 0) { isShopUserNavigating = true; shopDisplayIdx--; const brmVal = brm.value || "200,13.5"; const [targetDistance] = brmVal.split(",").map(Number); renderGraphScale(targetDistance); drawElevationProfile(targetDistance); updateDisplayOnly(); } });
shopNextBtn.addEventListener("click", () => { if (globalShopList.length === 0) return; if (shopDisplayIdx < globalShopList.length - 1) { isShopUserNavigating = true; shopDisplayIdx++; const brmVal = brm.value || "200,13.5"; const [targetDistance] = brmVal.split(",").map(Number); renderGraphScale(targetDistance); drawElevationProfile(targetDistance); updateDisplayOnly(); } });

function formatArrivalDate(targetDate, startStr) {
  if (!startStr) return "--:--"; const start = new Date(startStr); const hrs = String(targetDate.getHours()).padStart(2, '0'); const mins = String(targetDate.getMinutes()).padStart(2, '0');
  if (targetDate.getDate() !== start.getDate() || targetDate.getMonth() !== start.getMonth()) { return ["日", "月", "火", "水", "木", "金", "土"][targetDate.getDay()] + ")" + hrs + ":" + mins; }
  return hrs + ":" + mins;
}

function updateDisplayOnly() {
  const currentDist = parseFloat(distance.value) || 0;
  let startReady = false; let start = null; if (startTime.value) { start = new Date(startTime.value); if (!isNaN(start.getTime())) startReady = true; }

  const currentGain = getGpxGainAtDistance(currentDist);

  if (globalPCList.length > 0 && pcDisplayIdx !== -1) {
    const selectedPC = globalPCList[pcDisplayIdx]; const diffDist = selectedPC.dist - currentDist;
    let prefix = (pcDisplayIdx === pcAutoTrackIdx) ? "次: " : (pcDisplayIdx < pcAutoTrackIdx ? "通過: " : "先々: ");
    document.getElementById("pcLabel").innerText = prefix + selectedPC.id + " " + selectedPC.name + "（" + selectedPC.dist.toFixed(1) + "km）";
    
    let gainStr = "--m";
    if (gpxTrackPoints.length > 0) {
      const pcGain = getGpxGainAtDistance(selectedPC.dist);
      const remGain = Math.max(0, Math.round(pcGain - currentGain));
      gainStr = remGain + "m";
    }
    pcRemainDist.innerHTML = diffDist >= 0 
      ? `残り ${diffDist.toFixed(1)} km<span class="ele-small">獲得標高 ${gainStr}</span>` 
      : `通過後 ${Math.abs(diffDist).toFixed(1)} km<span class="ele-small">獲得標高 --m</span>`;
    
    [15, 16, 17, 18, 19, 20].forEach(speed => {
      const el = document.getElementById("pc_sp" + speed);
      if (startReady) { el.innerText = formatArrivalDate(new Date(start.getTime() + (selectedPC.dist / speed) * 3600000), startTime.value); } else { el.innerText = "--:--"; }
    });
  } else {
    document.getElementById("pcLabel").innerText = "次: ゴール"; pcRemainDist.innerHTML = '残り 0.0 km<span class="ele-small">獲得標高 --m</span>'; ["15","16","17","18","19","20"].forEach(s => document.getElementById("pc_sp" + s).innerText = "--:--");
  }

  if (shopToggle.checked && globalShopList.length > 0 && shopDisplayIdx !== -1) {
    const selectedShop = globalShopList[shopDisplayIdx]; const diffDist = selectedShop.dist - currentDist;
    let prefix = (shopDisplayIdx === shopAutoTrackIdx) ? "次休憩: " : (shopDisplayIdx < shopAutoTrackIdx ? "通過休憩: " : "先々休憩: ");
    document.getElementById("shopLabel").innerText = prefix + selectedShop.id + " " + selectedShop.name + "（" + selectedShop.dist.toFixed(1) + "km）";
    
    let gainStr = "--m";
    if (gpxTrackPoints.length > 0) {
      const shopGain = getGpxGainAtDistance(selectedShop.dist);
      const remGain = Math.max(0, Math.round(shopGain - currentGain));
      gainStr = remGain + "m";
    }
    shopRemainDist.innerHTML = diffDist >= 0 
      ? `残り ${diffDist.toFixed(1)} km<span class="ele-small">獲得標高 ${gainStr}</span>` 
      : `通過後 ${Math.abs(diffDist).toFixed(1)} km<span class="ele-small">獲得標高 --m</span>`;
  } else {
    document.getElementById("shopLabel").innerText = "次休憩: 登録なし"; shopRemainDist.innerHTML = '残り -- km<span class="ele-small">獲得標高 --m</span>';
  }
}

function renderGraphScale(targetDistance) {
  if (!targetDistance || targetDistance <= 0) return;
  const items = graphScale.querySelectorAll(".scale-point"); items.forEach(el => el.remove());
  createScalePoint(0, "START", "neutral-type", "10px", null); createScalePoint(100, "GOAL", "neutral-type", "10px", null);
  let lastPctPC = -999; let useUpperRowPC = false;
  globalPCList.forEach((p, idx) => {
    if (p.dist < targetDistance) {
      const pct = (p.dist / targetDistance) * 100; let label = String(p.id).split(/[\s,，、]/)[0]; if (label.length > 6) { label = label.substring(0, 4); }
      if (pct - lastPctPC < 4.5) { useUpperRowPC = !useUpperRowPC; } else { useUpperRowPC = false; }
      let typeClass = "pc-type " + (useUpperRowPC ? "pc-type-row1" : "pc-type-row0"); if (idx === pcDisplayIdx) typeClass += " active-pc";
      createScalePoint(pct, label, typeClass, useUpperRowPC ? "1px" : "10px", null); lastPctPC = pct;
    }
  });
  if (shopToggle.checked) {
    let lastPctShop = -999; let useLowerRowShop = false;
    globalShopList.forEach((s, idx) => {
      if (s.dist < targetDistance) {
        const pct = (s.dist / targetDistance) * 100; let label = String(s.id).split(/[\s,，、]/)[0]; if (label.length > 6) { label = label.substring(0, 4); }
        if (pct - lastPctShop < 4.5) { useLowerRowShop = !useLowerRowShop; } else { useLowerRowShop = false; }
        let typeClass = "shop-type " + (useLowerRowShop ? "shop-type-row1" : "shop-type-row0"); if (idx === shopDisplayIdx) typeClass += " active-shop";
        createScalePoint(pct, label, typeClass, null, useLowerRowShop ? "1px" : "10px"); lastPctShop = pct;
      }
    });
  }
}

function createScalePoint(leftPct, label, className, topStyle, bottomStyle) {
  const div = document.createElement("div"); div.className = "scale-point " + className; div.style.left = leftPct + "%"; div.innerText = label;
  if (topStyle !== null) div.style.top = topStyle; if (bottomStyle !== null) div.style.bottom = bottomStyle; graphScale.appendChild(div);
}

function parseTextList(textData, isPCMode = false) {
  if (!textData) return [];
  const lines = textData.split("\n").filter(line => line.trim() !== ""); const tempResult = [];
  for (let line of lines) {
    const columns = line.split(/[,,、，]/).map(c => c.trim()); if (columns.length < 2) continue;
    let idOrName = columns[0]; let secondVal = columns[1]; let distStr = ""; let finalName = "";
    if (isPCMode) { if (columns.length >= 3) { distStr = columns[2]; finalName = secondVal; } else { distStr = secondVal; finalName = idOrName; } } else { distStr = secondVal; finalName = idOrName; }
    const itemDist = parseFloat(distStr.replace(/[^\d.]/g, "")); if (!isNaN(itemDist)) { tempResult.push({ rawId: idOrName, name: finalName, dist: itemDist }); }
  }
  tempResult.sort((a, b) => a.dist - b.dist); let genericCounter = 0;
  return tempResult.map(item => {
    let finalId = "";
    if (isPCMode) {
      let cleanId = toHalfWidthAlphaNum(item.rawId);
      if (cleanId.includes("PC")) { finalId = cleanId.match(/PC\d+/)?.[0] || cleanId; } else if (cleanId.includes("GOAL") || cleanId.includes("FINISH")) { finalId = "GOAL"; } else { finalId = circleNumbers[genericCounter] || `（${genericCounter + 1}）`; genericCounter++; }
    } else { finalId = circleNumbers[genericCounter] || `（${genericCounter + 1}）`; genericCounter++; }
    return { id: finalId, name: item.name, dist: item.dist };
  });
}

function persistInputs() {
  localStorage.setItem("startTime", startTime.value); localStorage.setItem("brm", brm.value); localStorage.setItem("distance", distance.value); localStorage.setItem("pcList3", pcInput.value); localStorage.setItem("shopList3", shopInput.value);
}

function update(isDistanceOrInputChanged = false) {
  const now = new Date(); document.getElementById("currentTime").innerText = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
  const currentDist = parseFloat(distance.value) || 0; 
  const brmVal = brm.value || "200,13.5";
  const [targetDistance, limitHours] = brmVal.split(",").map(Number);
  
  if (pcInput.value !== lastPcInputText) { globalPCList = parseTextList(pcInput.value, true); lastPcInputText = pcInput.value; }
  if (shopInput.value !== lastShopInputText) { globalShopList = parseTextList(shopInput.value, false); lastShopInputText = shopInput.value; }
  let progressPct = targetDistance > 0 ? Math.min(100, Math.max(0, (currentDist / targetDistance) * 100)) : 0; 
  graphBar.style.width = progressPct + "%";

  let detectedPcIdx = globalPCList.length > 0 ? globalPCList.length - 1 : -1;
  for (let i = 0; i < globalPCList.length; i++) { if (globalPCList[i].dist > currentDist) { detectedPcIdx = i; break; } }
  pcAutoTrackIdx = detectedPcIdx; if (isDistanceOrInputChanged || !isPcUserNavigating || pcDisplayIdx === -1 || pcDisplayIdx >= globalPCList.length) { if (isDistanceOrInputChanged) isPcUserNavigating = false; pcDisplayIdx = pcAutoTrackIdx; }

  let detectedShopIdx = globalShopList.length > 0 ? globalShopList.length - 1 : -1;
  for (let i = 0; i < globalShopList.length; i++) { if (globalShopList[i].dist > currentDist) { detectedShopIdx = i; break; } }
  shopAutoTrackIdx = detectedShopIdx; if (isDistanceOrInputChanged || !isShopUserNavigating || shopDisplayIdx === -1 || shopDisplayIdx >= globalShopList.length) { if (isDistanceOrInputChanged) isShopUserNavigating = false; shopDisplayIdx = shopAutoTrackIdx; }

  renderGraphScale(targetDistance); 
  drawElevationProfile(targetDistance); // 各種更新時に高低図を再配置
  updateDisplayOnly();
  
  if (!startTime.value) return; let start = new Date(startTime.value);
  if (isNaN(start.getTime())) return;
  if (now < start) {
    document.getElementById("elapsed").innerText = "スタート前"; document.getElementById("remainTime").innerText = "スタート前"; document.getElementById("gross").innerText = "--";
    document.getElementById("remainDistance").innerText = targetDistance.toFixed(1) + " km"; document.getElementById("finish").innerText = "--"; document.getElementById("needSpeed").innerText = "--";
    document.getElementById("saving").innerText = "--"; document.getElementById("saving").className = "big-value"; return;
  }
  let elapsed = (now - start) / 1000 / 3600; if (elapsed <= 0 || !distance.value) return;
  const gross = currentDist / elapsed; document.getElementById("elapsed").innerText = Math.floor(elapsed) + "時間" + Math.floor((elapsed - Math.floor(elapsed)) * 60) + "分";
  const totalRemainTime = limitHours - elapsed; document.getElementById("remainTime").innerText = totalRemainTime > 0 ? Math.floor(totalRemainTime) + "時間" + Math.floor((totalRemainTime - Math.floor(totalRemainTime)) * 60) + "分" : "タイムアウト";
  document.getElementById("gross").innerText = gross.toFixed(2) + " km/h"; const remainDist = targetDistance - currentDist; document.getElementById("remainDistance").innerText = Math.max(0, remainDist).toFixed(1) + " km";
  document.getElementById("finish").innerText = new Date(start.getTime() + (targetDistance / gross) * 3600000).toLocaleDateString("ja-JP", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  document.getElementById("needSpeed").innerText = (remainDist > 0 && totalRemainTime > 0) ? (remainDist / totalRemainTime).toFixed(1) + " km/h" : "---";
  
  const saving = limitHours - (targetDistance / gross); const savSign = saving >= 0 ? "+" : "-"; const savH = Math.floor(Math.abs(saving)); const savM = Math.floor((Math.abs(saving) % 1) * 60);
  let statusIcon = "🔴", statusClass = "big-value red"; if (saving >= 2) { statusIcon = "🟢"; statusClass = "big-value green"; } else if (saving >= 1) { statusIcon = "🟡"; statusClass = "big-value yellow"; }
  const savingElement = document.getElementById("saving"); savingElement.innerText = statusIcon + " " + savSign + savH + "時間" + savM + "分"; savingElement.className = statusClass;
}

resetBtn.addEventListener("click", () => {
  if (confirm("すべての設定、リスト、走行データをリセットしますか？")) {
    localStorage.removeItem("startTime"); localStorage.removeItem("distance"); localStorage.removeItem("pcList3"); localStorage.removeItem("shopList3");
    localStorage.removeItem("convenienceBtnState"); localStorage.removeItem("gpxTrackPoints");
    gpxTrackPoints = [];
    startTime.value = ""; distance.value = ""; pcInput.value = ""; shopInput.value = ""; saveName.value = ""; tempDistanceValue = ""; graphBar.style.width = "0%";
    const oldSvg = graphScale.querySelector(".elevation-profile-svg"); if (oldSvg) oldSvg.remove();
    ["elapsed", "remainTime", "gross", "remainDistance", "finish", "needSpeed", "saving"].forEach(id => document.getElementById(id).innerText = "--");
    document.getElementById("saving").className = "big-value"; isPcUserNavigating = false; isShopUserNavigating = false; menuContent.classList.remove("open");
    loadSavedListsDropdown(); savedListsSelect.selectedIndex = 0; shopToggle.checked = true; localStorage.setItem("shopToggleState", "true");
    document.body.classList.remove("shop-off"); shopCard.style.display = "block"; mapDblClickToggle.checked = true; localStorage.setItem("mapDblClickState", "true");
    convenienceBtnToggle.checked = true; convenienceBtnWrapper.style.display = "block"; topRowGrid.classList.remove("convenience-off");
    update(true); alert("リセットが完了しました。");
  }
});

setInterval(() => update(false), 1000);
distance.addEventListener("input", () => { persistInputs(); update(true); });
pcInput.addEventListener("input", () => { persistInputs(); update(true); });
shopInput.addEventListener("input", () => { persistInputs(); update(true); });
startTime.addEventListener("change", () => { persistInputs(); update(false); });
brm.addEventListener("change", () => { persistInputs(); update(false); });
document.addEventListener("resume", () => update(false), false);
loadSavedListsDropdown();
update(true);
