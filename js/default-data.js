// =====================================================================
// 初回アクセス時に GPX ルート・コンビニ休憩ポイントなどを自動で読み込むための
// 「デフォルトデータ」ファイルです。
//
// ▼ 使い方
// 1. このアプリ(手元のPCやスマホのブラウザ)で、いつも通り
//    GPX読込・PC/コンビニ登録・BRM距離などの準備を済ませる。
// 2. メニュー内の「バックアップ書き出し」を押して、JSONファイルを保存する。
// 3. 保存された JSON ファイルをテキストエディタで開き、中身を全部コピーする。
// 4. 下にある「DEFAULT_BACKUP_DATA = の右側の値（プレースホルダー文字列）」を、
//    コピーした JSON の中身（{ から } まで）でそのまま置き換える。
//    （JSONの中身をそのまま貼り付ければOKです。書き換えは不要です）
// 5. このファイルごと GitHub にアップロードして GitHub Pages を公開すると、
//    そのページを初めて開いた端末で、自動的にこの内容が読み込まれた状態になります。
//
// ▼ 注意点
// ・一度自動読込されると、その端末のブラウザ内に保存されるため、
//   次回以降は「上書き」されません（誤って現在の作業内容が消えることはありません）。
// ・別のブレヴェ用にデータを更新したい場合は、この配下のJSONを新しい内容に
//   差し替えた上で、利用者側でメニュー内「リセット」→再読込するか、
//   ブラウザのサイトデータを削除してから開き直してください。
// ・中身を貼り付けていない（空のまま）の場合は、何も起こりません
//   （今まで通り、手動でGPX読込・登録する状態で開始します）。
// =====================================================================

const DEFAULT_BACKUP_DATA = "PASTE_YOUR_BACKUP_JSON_HERE";

(function () {
  try {
    // まだ何もデータが入っていない端末(初回アクセス)かどうかを判定
    const hasExistingData = localStorage.getItem("gpxTrackPoints") || localStorage.getItem("pcList3");
    if (hasExistingData) return; // 既にデータがある場合は絶対に上書きしない

    if (DEFAULT_BACKUP_DATA === "PASTE_YOUR_BACKUP_JSON_HERE") return; // 未設定の場合は何もしない

    const parsed = typeof DEFAULT_BACKUP_DATA === "string" ? JSON.parse(DEFAULT_BACKUP_DATA) : DEFAULT_BACKUP_DATA;

    const BACKUP_KEYS = ["startTime", "brm", "distance", "pcList3", "shopList3", "customBRMDataSets3", "shopToggleState", "mapDblClickState", "convenienceBtnState", "gpxTrackPoints"];
    BACKUP_KEYS.forEach(function (key) {
      if (parsed[key] !== undefined) {
        localStorage.setItem(key, parsed[key]);
      }
    });
  } catch (e) {
    // 貼り付け内容が不正な場合等はサイレントに無視し、通常起動する
    console.warn("デフォルトデータの読み込みに失敗しました:", e);
  }
})();
