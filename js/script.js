// Surfly: 기상청 서핑지수 API 연동 + 해수욕장 정보 + 팝업 연동 + 로딩 UI + 날짜 선택

// 해수욕장 정보 (spotName은 기상청 표기와 일치해야 하며, imageUrl 추가)
const beaches = [
    // 제주도
    { name: "이호테우 해변", region: "제주도", spotName: "이호테우해수욕장", imageUrl: "images/jeju_ihotaewoo.jpg" },
    { name: "월정리 해수욕장", region: "제주도", spotName: "월정리해수욕장", imageUrl: "images/jeju_woljeongri.jpg" },
    { name: "함덕 해수욕장", region: "제주도", spotName: "함덕해수욕장", imageUrl: "images/jeju_hamdeok.jpg" },
    { name: "곽지 해수욕장", region: "제주도", spotName: "곽지해수욕장", imageUrl: "images/jeju_gwakji.jpg" },
    { name: "중문 색달 해수욕장", region: "제주도", spotName: "중문색달해수욕장", imageUrl: "images/jeju_jungmunsaekdal.jpg" },
    // 부산
    { name: "송정해변", region: "부산", spotName: "송정해수욕장", imageUrl: "images/busan_songjeong.jpg" },
    { name: "기장 임랑해변", region: "부산", spotName: "임랑해수욕장", imageUrl: "images/busan_imrang.jpg" },
    { name: "다대포해수욕장", region: "부산", spotName: "다대포해수욕장", imageUrl: "images/busan_dadaepo.jpg" },
    { name: "해운대", region: "부산", spotName: "해운대해수욕장", imageUrl: "images/busan_haeundae.jpg" },
    { name: "광안리 해수욕장", region: "부산", spotName: "광안리해수욕장", imageUrl: "images/busan_gwangalli.jpg" },
    // 양양
    { name: "죽도해수욕장", region: "양양", spotName: "죽도해수욕장", imageUrl: "images/yangyang_jukdo.jpg" },
    { name: "인구해변", region: "양양", spotName: "인구해수욕장", imageUrl: "images/yangyang_ingu.jpg" },
    { name: "서피비치", region: "양양", spotName: "서피비치해수욕장", imageUrl: "images/yangyang_surfyy.jpg" },
    { name: "38선해변", region: "양양", spotName: "38선해수욕장", imageUrl: "images/yangyang_38line.jpg" },
    { name: "낙산해수욕장", region: "양양", spotName: "낙산해수욕장", imageUrl: "images/yangyang_naksan.jpg" },
    { name: "갯마을해변", region: "양양", spotName: "갯마을해수욕장", imageUrl: "images/yangyang_gaetmaeul.jpg" },
    // 포항
    { name: "월포해수욕장", region: "포항", spotName: "월포해수욕장", imageUrl: "images/pohang_wolpo.jpg" },
    { name: "용한리해수욕장", region: "포항", spotName: "용한리해수욕장", imageUrl: "images/pohang_yonghanri.jpg" },
    { name: "영일대해수욕장", region: "포항", spotName: "영일대해수욕장", imageUrl: "images/pohang_yeongildae.jpg" }
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

// 기상청 서핑지수 API에서 전체 데이터 받아오기 (프록시 사용)
async function fetchKmaSurfDataAll(reqDate) {
    const url = `http://localhost:4000/api/kma-surf-forecast?reqDate=${reqDate}&numOfRows=300`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP error! status: ${res.status}, Message: ${errorText}`);
        }
        const json = await res.json();
        console.log("KMA API 응답:", json); // 응답 전체 구조 확인

        // API 응답 구조에 따라 데이터 접근 경로 변경 (여기서는 json.response.body.items.item로 가정)
        return json.response?.body?.items?.item || [];
    } catch (e) {
        console.error("Failed to fetch KMA Surf Data:", e);
        alert("날씨 정보를 가져오는 데 실패했습니다. 프록시 서버가 실행 중인지, API 키가 올바른지 확인해주세요.");
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

// 추천 알고리즘
function calculateScore(data) {
    let score = 0;

    // 1. 파주기 (Wave Period) - 최대 4점
    if (data.avgWvpd < 6) {
        score += 0;
    } else if (data.avgWvpd >= 6 && data.avgWvpd <= 8) {
        score += 2;
    } else if (data.avgWvpd >= 9 && data.avgWvpd <= 12) {
        score += 4;
    } else {
        score += 3;
    }

    // 2. 풍속 (Wind Speed) - 최대 3점
    if (data.avgWspd >= 0 && data.avgWspd <= 5) {
        score += 3;
    } else if (data.avgWspd > 10) {
        score -= 3;
    }

    // 3. 파고 (Wave Height) - 최대 2점
    if (data.avgWvhgt < 0.3) {
        score += 0;
    } else if (data.avgWvhgt >= 0.3 && data.avgWvhgt < 0.5) {
        score += 1;
    } else if (data.avgWvhgt >= 0.5 && data.avgWvhgt <= 1.5) {
        score += 2;
    } else if (data.avgWvhgt > 1.5 && data.avgWvhgt <= 2.5) {
        score += 1;
    } else {
        score += 0;
    }

    // 4. 수온 (Water Temperature) - 최대 2점
    if (data.avgWtem >= 22) {
        score += 2;
    } else if (data.avgWtem >= 18 && data.avgWtem <= 21) {
        score += 1;
    } else if (data.avgWtem >= 14 && data.avgWtem <= 17) {
        score += 0;
    } else if (data.avgWtem >= 10 && data.avgWtem <= 13) {
        score -= 1;
    } else {
        score -= 2;
    }

    return score;
}

// 팝업에 API 결과 반영 (필드명 최신화)
function showPopupsWithApi(topBeaches) {
    // 모든 팝업 숨기기
    document.getElementById('popupBg').style.display = 'none';
    document.getElementById('popupCloseX').style.display = 'none';
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`recommendPopup${i}`).style.display = 'none';
    }

    if (topBeaches.length === 0) {
        alert("추천할 해수욕장 정보가 없습니다.");
        return;
    }

    for (let i = 0; i < Math.min(topBeaches.length, 3); i++) {
        const spot = topBeaches[i];
        const popupElement = document.getElementById(`recommendPopup${i + 1}`);
        const link = document.getElementById(`spotLink${i + 1}`);
        const img = document.getElementById(`spotImg${i + 1}`);
        const reason = document.getElementById(`spotReason${i + 1}`);

        if (popupElement && link && img && reason) {
            link.textContent = `${i + 1}순위: ${spot.name}`;
            link.href = "#"; // 상세 페이지 링크 (추가 가능)
            link.target = "_blank";

            // local imageUrl 사용
            img.src = spot.imageUrl || `images/beach_placeholder.jpg`;
            img.alt = spot.name;

            reason.textContent =
                `파고: ${spot.data?.avgWvhgt ?? '-'}m, 파주기: ${spot.data?.avgWvpd ?? '-'}s, 풍속: ${spot.data?.avgWspd ?? '-'}m/s, 수온: ${spot.data?.avgWtem ?? '-'}°C, 서핑지수: ${spot.data?.totalIndex ?? '-'}`;
            
            popupElement.style.display = 'block';
        }
    }
    document.getElementById('popupBg').style.display = 'block';
    document.getElementById('popupCloseX').style.display = 'flex';
}

// 날짜 유효성 검사 (오늘~7일 뒤만 허용)
function isValidDate(selectedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    selectedDate.setHours(0, 0, 0, 0);
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

    // KMA API에서 모든 서핑 데이터 가져오기
    const items = await fetchKmaSurfDataAll(reqDate);

    let filteredBeaches = beaches;
    if (region !== "all") {
        filteredBeaches = beaches.filter(b => b.region === region);
    }

    const results = [];
    let selectedBeachInfo = null; // 선택된 특정 해수욕장 정보를 저장할 변수

    for (const beach of filteredBeaches) {
        const item = findTodayMorningItem(items, beach.spotName);
        if (item) {
            const score = calculateScore(item);
            results.push({ ...beach, score, data: item });

            // region이 "all"이 아닐 때 첫 매칭 해수욕장 정보 업데이트
            if (region !== "all" && !selectedBeachInfo && beach.region === region && beach.spotName === item.surfPlcNm) {
                selectedBeachInfo = { ...beach, score, data: item };
            }
        } else {
            // 데이터 없음 → 0점 처리하지만 상세 정보에는 포함하지 않음
            results.push({ ...beach, score: 0, data: {} });
        }
    }

    results.sort((a, b) => b.score - a.score);

    // 추천 결과가 모두 0점이거나 데이터 없음
    const validResults = results.filter(r => r.score > 0 && r.data && Object.keys(r.data).length > 0);
    if (validResults.length === 0) {
        hideLoading();
        alert("추천할 해수욕장 정보가 없습니다. 해당 날짜에 데이터가 없거나 예보가 제공되지 않습니다.");
        document.getElementById('popupBg').style.display = 'none';
        document.getElementById('popupCloseX').style.display = 'none';
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`recommendPopup${i}`).style.display = 'none';
        }
        return;
    }

    hideLoading();
    showPopupsWithApi(validResults.slice(0, 3)); // 상위 3개 팝업 표시

    // 특정 해수욕장의 날씨 정보 표시 (region이 "all"이 아닐 경우)
    const weatherInfoDisplay = document.getElementById('weatherInfo');
    if (region !== "all" && selectedBeachInfo) {
        weatherInfoDisplay.innerHTML = `<h3>${selectedBeachInfo.name} (${selectedBeachInfo.region}) - ${selectedDate.toLocaleDateString('ko-KR')} 오전 예측 날씨</h3>`;
        weatherInfoDisplay.innerHTML += `
            <p>파고: ${selectedBeachInfo.data?.avgWvhgt ?? '-'}m</p>
            <p>파주기: ${selectedBeachInfo.data?.avgWvpd ?? '-'}s</p>
            <p>풍속: ${selectedBeachInfo.data?.avgWspd ?? '-'}m/s</p>
            <p>수온: ${selectedBeachInfo.data?.avgWtem ?? '-'}°C</p>
            <p>서핑지수: ${selectedBeachInfo.data?.totalIndex ?? '-'}</p>
        `;
    } else if (region === "all") {
        weatherInfoDisplay.innerHTML = `<p>전체 지역 선택 시에는 개별 해수욕장의 상세 날씨 정보가 제공되지 않습니다. 특정 지역을 선택하여 상세 정보를 확인하세요.</p>`;
    } else {
        weatherInfoDisplay.innerHTML = `<p>선택된 지역의 날씨 정보를 찾을 수 없습니다.</p>`;
    }
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', function () {
    // Flatpickr 초기화 (캘린더 항상 보이도록 inline 설정)
    const calendarInput = document.querySelector("#calendar input");
    if (calendarInput) {
        flatpickr(calendarInput, {
            dateFormat: "Y-m-d",
            defaultDate: "today",
            locale: "ko",
            minDate: "today",
            maxDate: new Date().fp_incr(6), // 오늘 포함 7일 뒤까지
            inline: true
        });
    } else {
        console.error("Calendar input element not found for Flatpickr initialization.");
    }

    // "검색" 버튼 이벤트 연결
    const searchButton = document.getElementById('searchBtn');
    if (searchButton) {
        searchButton.onclick = function () {
            const region = document.getElementById('regionSelect').value;
            let selectedDate = new Date(); // 기본값: 오늘
            if (flatpickr && calendarInput && calendarInput._flatpickr) {
                const fpInstance = calendarInput._flatpickr;
                if (fpInstance.selectedDates.length > 0) {
                    selectedDate = fpInstance.selectedDates[0];
                }
            }
            // 기존 YYYYMMDD 형식에서 "00"을 뒤에 추가하여 YYYYMMDD00 형식으로 변환
            const reqDate = selectedDate.toISOString().slice(0, 10).replace(/-/g, '') + "00";
            updateAndShow(region, reqDate, selectedDate);
        };
    } else {
        console.error("Search button element not found.");
    }

    // 팝업 닫기 기능 연결
    const popupBg = document.getElementById('popupBg');
    const popupCloseX = document.getElementById('popupCloseX');

    if (popupBg) {
        popupBg.onclick = function () {
            for (let i = 1; i <= 3; i++) {
                const popup = document.getElementById(`recommendPopup${i}`);
                if (popup) popup.style.display = 'none';
            }
            this.style.display = 'none';
            if (popupCloseX) popupCloseX.style.display = 'none';
        };
    } else {
        console.error("Popup background element not found.");
    }

    if (popupCloseX) {
        popupCloseX.onclick = function () {
            for (let i = 1; i <= 3; i++) {
                const popup = document.getElementById(`recommendPopup${i}`);
                if (popup) popup.style.display = 'none';
            }
            if (popupBg) popupBg.style.display = 'none';
            this.style.display = 'none';
        };
    } else {
        console.error("Popup close button element not found.");
    }

    console.log("Surf Info Website Loaded");
});

// 로딩 스타일 추가 (script.js 내에 직접 삽입)
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);