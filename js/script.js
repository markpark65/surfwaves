// 기상청 서핑지수 API 연동 + 해수욕장 정보 + 팝업 연동 + 로딩 UI + 날짜 선택

const KMA_API_KEY = 'NoUqstwNKMHeBB65bcIoo1UOyRFYBA3vYzOYaKGL3ssOWSnGVkABuHn3KylDNxI5ZLjIk8RRqR7J8VdAbVnILw%3D%3D';

// 해수욕장 정보 (spotName은 기상청 표기와 일치해야 함)
const beaches = [
  { name: "이호테우 해변", region: "제주도", spotName: "이호테우해수욕장" },
  { name: "월정리 해수욕장", region: "제주도", spotName: "월정리해수욕장" },
  { name: "함덕 해수욕장", region: "제주도", spotName: "함덕해수욕장" },
  { name: "곽지 해수욕장", region: "제주도", spotName: "곽지해수욕장" },
  { name: "중문 색달 해수욕장", region: "제주도", spotName: "중문색달해수욕장" },
  // 부산
  { name: "송정해변", region: "부산", spotName: "송정해수욕장" },
  { name: "기장 임랑해변", region: "부산", spotName: "임랑해수욕장" },
  { name: "다대포해수욕장", region: "부산", spotName: "다대포해수욕장" },
  { name: "해운대", region: "부산", spotName: "해운대해수욕장" },
  { name: "광안리 해수욕장", region: "부산", spotName: "광안리해수욕장" },
  // 양양
  { name: "죽도해수욕장", region: "양양", spotName: "죽도해수욕장" },
  { name: "인구해변", region: "양양", spotName: "인구해수욕장" },
  { name: "서피비치", region: "양양", spotName: "서피비치해수욕장" },
  { name: "38선해변", region: "양양", spotName: "38선해수욕장" },
  { name: "낙산해수욕장", region: "양양", spotName: "낙산해수욕장" },
  { name: "갯마을해변", region: "양양", spotName: "갯마을해수욕장" },
  // 포항
  { name: "월포해수욕장", region: "포항", spotName: "월포해수욕장" },
  { name: "용한리해수욕장", region: "포항", spotName: "용한리해수욕장" },
  { name: "영일대해수욕장", region: "포항", spotName: "영일대해수욕장" }
];

// 로딩 오버레이 생성
function showLoading() {
  let loading = document.getElementById('loadingOverlay');
  if (!loading) {
    loading = document.createElement('div');
    loading.id = 'loadingOverlay';
    loading.innerHTML = `
      <div class="loading-bg"></div>
      <div class="loading-popup">
        <div class="loader"></div>
        <div style="margin-top:16px;">로딩중입니다...</div>
      </div>
    `;
    document.body.appendChild(loading);
  }
  loading.style.display = 'flex';
}
function hideLoading() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = 'none';
}

// 기상청 서핑지수 API에서 전체 데이터 받아오기 (엔드포인트/필드명 최신화)
async function fetchKmaSurfDataAll(reqDate) {
  const url = `https://apis.data.go.kr/1192136/fcstSurfing/GetFcstSurfingApiService?serviceKey=${KMA_API_KEY}&type=json&reqDate=${reqDate}&pageNo=1&numOfRows=300`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(json); // 응답 전체 구조 확인
    return json.response?.body?.items?.item || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

// 해수욕장별로 오전 데이터만 추출 (surfPlcNm 매칭)
function findTodayMorningItem(items, spotName) {
  const filtered = items.filter(
    item => item.surfPlcNm === spotName && item.predcNoonSeCd === "오전"
  );
  if (filtered.length > 0) return filtered[0];
  return items.find(item => item.surfPlcNm === spotName) || null;
}

// 팝업에 API 결과 반영 (필드명 최신화)
function showPopupsWithApi(topBeaches) {
  for (let i = 1; i <= 3; i++) {
    const spot = topBeaches[i - 1];
    if (!spot) {
      document.getElementById(`recommendPopup${i}`).style.display = 'none';
      continue;
    }
    const link = document.getElementById(`spotLink${i}`);
    link.textContent = `${i}순위: ${spot.name}`;
    link.href = "#";
    link.target = "_blank";
    document.getElementById(`spotImg${i}`).src = `https://source.unsplash.com/featured/250x150/?beach,sea,${encodeURIComponent(spot.name)}`;
    document.getElementById(`spotImg${i}`).alt = spot.name;
    document.getElementById(`spotReason${i}`).textContent =
      `파고: ${spot.data?.avgWvhgt ?? '-'}m, 파주기: ${spot.data?.avgWvpd ?? '-'}s, 풍속: ${spot.data?.avgWspd ?? '-'}m/s, 수온: ${spot.data?.avgWtem ?? '-'}°C, 서핑지수: ${spot.data?.totalIndex ?? '-'}`;
    document.getElementById(`recommendPopup${i}`).style.display = 'block';
  }
  document.getElementById('popupBg').style.display = 'block';
  document.getElementById('popupCloseX').style.display = 'flex';
}

// 날짜 유효성 검사 (오늘~7일 뒤만 허용)
function isValidDate(selectedDate) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);
  selectedDate.setHours(0,0,0,0);
  return selectedDate >= today && selectedDate <= maxDate;
}

// 지역별 필터링 및 점수 계산
async function updateAndShow(region, reqDate, selectedDate) {
  showLoading();
  // 날짜 유효성 체크
  if (!isValidDate(selectedDate)) {
    hideLoading();
    alert("오늘부터 7일 이내의 날짜만 조회할 수 있습니다.");
    return;
  }
  const items = await fetchKmaSurfDataAll(reqDate);
  let filtered = beaches;
  if (region !== "all") filtered = beaches.filter(b => b.region === region);
  const results = [];
  for (const beach of filtered) {
    const item = findTodayMorningItem(items, beach.spotName);
    if (item) {
      const score = Number(item.totalIndex) || 0;
      results.push({ ...beach, score, data: item });
    } else {
      results.push({ ...beach, score: 0, data: {} });
    }
  }
  results.sort((a, b) => b.score - a.score);
  hideLoading();
  showPopupsWithApi(results.slice(0, 3));
}

// 기존 버튼 이벤트 연결
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('searchBtn').onclick = function () {
    const region = document.getElementById('regionSelect').value;
    // flatpickr가 있으면 calendar에서 날짜 가져오기
    let selectedDateStr = "오늘";
    let selectedDate = new Date();
    if (window.flatpickr && document.querySelector("#calendar input")) {
      selectedDateStr = document.querySelector("#calendar input").value;
    } else if (document.querySelector(".flatpickr-day.selected")) {
      selectedDateStr = document.querySelector(".flatpickr-day.selected").dateObj;
    }
    // YYYY-MM-DD → YYYYMMDD
    if (!selectedDateStr || selectedDateStr === "오늘") {
      selectedDate = new Date();
    } else if (typeof selectedDateStr === "string") {
      selectedDate = new Date(selectedDateStr);
    } else if (selectedDateStr instanceof Date) {
      selectedDate = selectedDateStr;
    }
    const reqDate = selectedDate.toISOString().slice(0,10).replace(/-/g, '');
    updateAndShow(region, reqDate, selectedDate);
  };
  document.getElementById('popupBg').onclick = function () {
    [1, 2, 3].forEach(i => document.getElementById(`recommendPopup${i}`).style.display = 'none');
    document.getElementById('popupBg').style.display = 'none';
    document.getElementById('popupCloseX').style.display = 'none';
  };
  document.getElementById('popupCloseX').onclick = function () {
    [1, 2, 3].forEach(i => document.getElementById(`recommendPopup${i}`).style.display = 'none');
    document.getElementById('popupBg').style.display = 'none';
    document.getElementById('popupCloseX').style.display = 'none';
  };
});

// 로딩 스타일 추가
const style = document.createElement('style');
style.innerHTML = `
#loadingOverlay {
  position: fixed; left:0; top:0; width:100vw; height:100vh; z-index:9999; display:none; align-items:center; justify-content:center;
}
#loadingOverlay .loading-bg {
  position:absolute; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3);
}
#loadingOverlay .loading-popup {
  position:relative; z-index:2; background:#fff; border-radius:12px; padding:40px 32px; box-shadow:0 4px 24px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center;
}
.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3498db;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
`;
document.head.appendChild(style);

console.log("Surf Info Website Loaded");