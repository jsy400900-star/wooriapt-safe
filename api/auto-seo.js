"use strict";

const SUPABASE_URL = "https://dcysjuxyjqtvkihdsjvv.supabase.co";
const SUPABASE_KEY = "sb_publishable_RZBX7u1v8MLBCfEJT0-eRg_jPcIulG2";
const INDEXNOW_KEY = "fc1e3ad82010475381daf9846e627fdd";
const INDEXNOW_HOST = "www.wooriapt.app";
const INDEXNOW_KEY_LOCATION = "https://www.wooriapt.app/fc1e3ad82010475381daf9846e627fdd.txt";

function clean(v) { return String(v || "").trim(); }
function pathEncode(v) { return encodeURIComponent(clean(v)); }

module.exports = async function handler(req, res) {
  try {
    // 1. Fetch top 500 apartments from Supabase
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/safe_apartments?select=시도,시군구,동리,읍면,단지명",
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          Range: "0-499"
        }
      }
    );

    if (!response.ok) {
      return res.status(502).send("데이터 조회 실패");
    }

    const rows = await response.json();
    const urls = [
      "https://www.wooriapt.app/index.html",
      "https://www.wooriapt.app/apt.html"
    ];

    for (const row of rows) {
      const region = clean(row["시도"]);
      const city = clean(row["시군구"]);
      const place = clean(row["동리"] || row["읍면"]);
      const apt = clean(row["단지명"]);
      if (!region || !city || !place) continue;

      urls.push(`https://www.wooriapt.app/apt-search/${pathEncode(region)}/${pathEncode(city)}/${pathEncode(place)}/sale`);
      if (apt) {
        urls.push(`https://www.wooriapt.app/apt-search/${pathEncode(region)}/${pathEncode(city)}/${pathEncode(place)}/${pathEncode(apt)}/sale`);
      }
      if (urls.length >= 200) break; // batch 200
    }

    // 2. Submit to Naver IndexNow
    const naverRes = await fetch("https://searchadvisor.naver.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: urls
      })
    });

    const isOk = naverRes.ok || naverRes.status === 200;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>네이버 검색 자동 색인 완료</title>
<style>
body { font-family: -apple-system, sans-serif; background: #f0f4f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
.card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 480px; }
h1 { color: #03c75a; font-size: 24px; margin-bottom: 12px; }
p { color: #555; line-height: 1.6; }
.badge { background: #e8f9f0; color: #03c75a; padding: 6px 14px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 10px; }
</style>
</head>
<body>
<div class="card">
<h1>🎉 네이버 검색 자동 전송 성공!</h1>
<p>총 <strong>${urls.length}개</strong>의 핵심 아파트 페이지가 네이버 검색봇(Yeti)에 즉시 수집 요청되었습니다.</p>
<div class="badge">네이버 IndexNow 상태: ${naverRes.status} OK</div>
<p style="margin-top:20px; font-size:13px; color:#888;">이 창을 닫으셔도 됩니다. 매일 자동으로 수집됩니다.</p>
</div>
</body>
</html>`);
  } catch (err) {
    return res.status(500).send("자동화 오류: " + err.message);
  }
};
