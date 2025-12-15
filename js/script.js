// Surfly: 기상청 서핑지수 API 연동 + 해수욕장 정보 + 팝업 연동 + 로딩 UI + 날짜 선택

// 해수욕장 정보 (spotName은 기상청 표기와 일치해야 하며, imageUrl, pageUrl 추가)
const beaches = [
    // 제주도
    { name: "이호테우 해변", region: "제주도", spotName: "이호테우해수욕장", imageUrl: "images/jeju_ihotaewoo.jpg", pageUrl: "recommend(jeju)/ihotaewoo.html" },
    { name: "월정리 해수욕장", region: "제주도", spotName: "월정리해수욕장", imageUrl: "images/jeju_woljeongri.jpg", pageUrl: "recommend(jeju)/woljeongri.html" },
    { name: "함덕 해수욕장", region: "제주도", spotName: "함덕해수욕장", imageUrl: "images/jeju_hamdeok.jpg", pageUrl: "recommend(jeju)/hamdeok.html" },
    { name: "곽지 해수욕장", region: "제주도", spotName: "곽지해수욕장", imageUrl: "images/jeju_gwakji.jpg", pageUrl: "recommend(jeju)/gwakji.html" },
    { name: "중문 색달 해수욕장", region: "제주도", spotName: "중문색달해수욕장", imageUrl: "images/jeju_jungmunsaekdal.jpg", pageUrl: "recommend(jeju)/jungmunsaekdal.html" },
    // 부산
    { name: "송정해변", region: "부산", spotName: "송정해수욕장", imageUrl: "images/busan_songjeong.jpg", pageUrl: "recommend(busan)/songjeong.html" },
    { name: "기장 임랑해변", region: "부산", spotName: "임랑해수욕장", imageUrl: "images/busan_imrang.jpg", pageUrl: "recommend(busan)/imrang.html" },
    { name: "다대포해수욕장", region: "부산", spotName: "다대포해수욕장", imageUrl: "images/busan_dadaepo.jpg", pageUrl: "recommend(busan)/dadaepo_busan.html" },
    { name: "해운대", region: "부산", spotName: "해운대해수욕장", imageUrl: "images/busan_haeundae.jpg", pageUrl: "recommend(busan)/haeundae.html" },
    { name: "광안리 해수욕장", region: "부산", spotName: "광안리해수욕장", imageUrl: "images/busan_gwangalli.jpg", pageUrl: "recommend(busan)/gwangalli.html" },
    // 양양
    { name: "죽도해수욕장", region: "양양", spotName: "죽도해수욕장", imageUrl: "images/yangyang_jukdo.jpg", pageUrl: "recommend(yangyang)/jukdo.html" },
    { name: "인구해변", region: "양양", spotName: "인구해수욕장", imageUrl: "images/yangyang_ingu.jpg", pageUrl: "recommend(yangyang)/ingu.html" },
    { name: "서피비치", region: "양양", spotName: "하조대해수욕장", imageUrl: "images/yangyang_surfyy.jpg", pageUrl: "recommend(yangyang)/surfyy.html" },
    { name: "38선해변", region: "양양", spotName: "기사문해수욕장", imageUrl: "images/yangyang_38line.jpg", pageUrl: "recommend(yangyang)/38line.html" },
    { name: "낙산해수욕장", region: "양양", spotName: "낙산해수욕장", imageUrl: "images/yangyang_naksan.jpg", pageUrl: "recommend(yangyang)/naksan.html" },
    { name: "갯마을해변", region: "양양", spotName: "갯마을해수욕장", imageUrl: "images/yangyang_gaetmaeul.jpg", pageUrl: "recommend(yangyang)/gaetmaeul.html" },
    // 포항
    { name: "월포해수욕장", region: "포항", spotName: "월포해수욕장", imageUrl: "images/pohang_wolpo.jpg", pageUrl: "recommend(pohang)/wolpo.html" },
    { name: "용한리해수욕장", region: "포항", spotName: "용한리해수욕장", imageUrl: "images/pohang_yonghanri.jpg", pageUrl: "recommend(pohang)/yonghanri.html" },
    { name: "영일대해수욕장", region: "포항", spotName: "영일대해수욕장", imageUrl: "images/pohang_yeongildae.jpg", pageUrl: "recommend(pohang)/yeongildae.html" }
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
    // 300은 안전한 API 제한 값.
    const url = `https://surfly.info/.netlify/functions/kmaSurfForcast?reqDate=${reqDate}&numOfRows=300`;

    try {
        const res = await fetch(url);
        const json = await res.json();

        // 에러 체크
        if (json.error) {
            console.error("Proxy Error:", json.error);
            return [];
        }

        // 구조 유연성 확보: { response: { body: ... } } 또는 { body: ... }
        const r = json.response || json;
        const items = r.body?.items?.item || [];

        // 3. 유효한 데이터면 캐싱
        if (items.length > 0) {
            const cacheData = {
                timestamp: Date.now(),
                data: items
            };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        }

        return items;
    } catch (e) {
        console.error("Failed to fetch KMA Surf Data:", e);
        return [];
    }
}

/**
 * 선택된 날짜와 현재 시간에 맞춰 '오전' 또는 '오후' 예보를 지능적으로 선택합니다.
 * - 선택된 날짜가 '오늘'인 경우:
 *   - 현재 시간이 12시 이전이면 '오전' 우선, 없으면 '오후'
 *   - 현재 시간이 12시 이후면 '오후' 우선, 없으면 '오전'
 * - 선택된 날짜가 '미래'인 경우:
 *   - 기본적으로 '오전' 데이터를 우선 보여줍니다 (하루 시작 기준).
 */
function findBestForecastItem(items, spotName, selectedDate) {
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // YYYY-MM-DD 형식으로 날짜 변환 (API의 predcYmd와 비교하기 위함)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;

    // 해당 지역 AND 해당 날짜 데이터만 필터링
    const spotItems = items.filter(item => item.surfPlcNm === spotName && item.predcYmd === targetDateStr);

    // 디버깅: 해당 날짜 데이터가 없는 경우 확인
    if (spotItems.length === 0) {
        return null;
    }

    let preferredTime = "오전";
    // 오늘이고 오후 12시가 지났다면 오후 데이터를 우선
    if (isToday && now.getHours() >= 12) {
        preferredTime = "오후";
    }

    // 1순위: 선호 시간대
    let bestItem = spotItems.find(item => item.predcNoonSeCd === preferredTime);

    // 2순위: 선호 시간대 데이터가 없으면 반대 시간대 데이터
    if (!bestItem) {
        bestItem = spotItems.find(item => item.predcNoonSeCd === (preferredTime === "오전" ? "오후" : "오전"));
    }

    // 3순위: 그래도 없으면 해당 날짜의 첫번째 데이터
    if (!bestItem && spotItems.length > 0) {
        bestItem = spotItems[0];
    }

    return bestItem || null;
}

// ... (calculateScore function remains same) ...


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

// 팝업에 API 결과 반영 (동적 생성)
function showPopupsWithApi(topBeaches, selectedDate) {
    const popupContainer = document.getElementById('popupContainer');
    const bg = document.getElementById('popupBg');
    const closeX = document.getElementById('popupCloseX');

    if (!popupContainer || !bg) return;

    // 기존 내용 비우기
    popupContainer.innerHTML = '';

    if (!topBeaches || topBeaches.length === 0) {
        // 결과 없음 표시
        popupContainer.innerHTML = `
            <div class="recommend-card no-result-card">
                <h3>결과 없음</h3>
                <p>해당 날짜/지역에 맞는 추천 데이터가 없습니다.</p>
            </div>
        `;
    } else {
        // 상위 3개 (혹은 그 이상) 아이템 생성
        topBeaches.slice(0, 3).forEach((spot, index) => {
            const card = document.createElement('div');
            card.className = 'recommend-card';

            const detailHtml = `
                <div class="card-info">
                    <strong>예측 시간: ${spot.data?.predcNoonSeCd || '-'}</strong><br/>
                    파고: ${spot.data?.avgWvhgt ?? '-'}m<br/>
                    파주기: ${spot.data?.avgWvpd ?? '-'}s<br/>
                    풍속: ${spot.data?.avgWspd ?? '-'}m/s<br/>
                    수온: ${spot.data?.avgWtem ?? '-'}°C<br/>
                    <strong style="color:#2196f3;">서핑지수: ${spot.data?.totalIndex ?? '-'}</strong>
                </div>
            `;

            // 날짜 파라미터 추가
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateParam = `?date=${year}-${month}-${day}`;
            const finalUrl = spot.pageUrl ? spot.pageUrl + dateParam : '#';

            card.innerHTML = `
                <div class="card-rank">${index + 1}</div>
                <h3><a href="${finalUrl}" target="_blank">${spot.name} &rarr;</a></h3>
                <img src="${spot.imageUrl || 'images/beach_placeholder.jpg'}" alt="${spot.name}">
                ${detailHtml}
            `;
            popupContainer.appendChild(card);
        });
    }

    // 팝업 표시
    bg.style.display = 'flex'; // CSS flex centering
    popupContainer.style.display = 'flex';
    if (closeX) closeX.style.display = 'flex';
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

// 로컬 시간 기준 YYYYMMDD 반환
function getLocalYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 지역별 필터링 및 점수 계산
async function updateAndShow(region, reqDate, selectedDate) {
    showLoading();
    if (!isValidDate(selectedDate)) {
        hideLoading();
        alert("오늘부터 7일 이내의 날짜만 조회할 수 있습니다.");
        return;
    }

    // API 호출
    const items = await fetchKmaSurfDataAll(reqDate);

    let filteredBeaches = beaches;
    if (region !== "all") {
        filteredBeaches = beaches.filter(b => b.region === region);
    }

    const results = [];

    for (const beach of filteredBeaches) {
        const item = findBestForecastItem(items, beach.spotName, selectedDate);

        if (item) {
            const score = calculateScore(item);
            results.push({ ...beach, score, data: item });
        } else {
            results.push({ ...beach, score: 0, data: {} });
        }
    }

    // 서핑지수 문자열 -> 숫자 변환 (정렬/필터링용)
    function convertTotalIndexToScore(indexStr) {
        if (!indexStr) return 0;
        const mapping = {
            "매우좋음": 5,
            "좋음": 4,
            "보통": 3,
            "나쁨": 2,
            "매우나쁨": 1
        };
        return mapping[indexStr] || 0;
    }

    // 정렬 (서핑지수 -> 자체점수 -> 파고)
    // 1순위: 기상청 서핑지수 (totalIndex)
    // 2순위: 자체 계산 점수 (calculateScore)
    // 3순위: 파고 (avgWvhgt)
    results.sort((a, b) => {
        const totalIndexA = convertTotalIndexToScore(a.data?.totalIndex);
        const totalIndexB = convertTotalIndexToScore(b.data?.totalIndex);

        if (totalIndexA !== totalIndexB) {
            return totalIndexB - totalIndexA;
        }

        if (b.score !== a.score) {
            return b.score - a.score;
        }

        const waveA = Number(a.data?.avgWvhgt) || 0;
        const waveB = Number(b.data?.avgWvhgt) || 0;
        return waveB - waveA;
    });

    const validResults = results.filter(r => (r.score > 0 || convertTotalIndexToScore(r.data?.totalIndex) > 0) && r.data && Object.keys(r.data).length > 0);

    if (validResults.length === 0) {
        hideLoading();
        // 결과가 없어도 팝업을 띄워서 "결과 없음"을 보여줌 (UX 개선)
        showPopupsWithApi([], selectedDate);
        return;
    }

    hideLoading();
    showPopupsWithApi(validResults, selectedDate);

    // 날짜/날씨 정보 텍스트 업데이트 (옵션)
    const weatherInfoDisplay = document.getElementById('weatherInfo');
    if (weatherInfoDisplay) {
        if (region !== 'all') {
            weatherInfoDisplay.innerHTML = `<h3>${region} 추천 서핑 스팟 (${selectedDate.toLocaleDateString('ko-KR')})</h3>`;
        } else {
            weatherInfoDisplay.innerHTML = `<h3>전체 지역 추천 서핑 스팟 (${selectedDate.toLocaleDateString('ko-KR')})</h3>`;
        }
    }
}

// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', function () {
    const calendarInput = document.querySelector("#calendar input");
    if (calendarInput) {
        flatpickr(calendarInput, {
            dateFormat: "Y-m-d",
            defaultDate: "today",
            locale: "ko",
            minDate: "today",
            maxDate: new Date().fp_incr(6),
            inline: true
        });
    } else {
        console.error("Calendar input element not found for Flatpickr initialization.");
    }

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

            // toISOString 이슈 수정 -> 로컬 날짜 문자열 생성 (YYYYMMDD00/12 형식은 아님, API 스펙에 맞춰 YYYYMMDD + '00')
            // 기상청 API는 보통 호출 시점 날짜(BaseDate)를 요구하거나 예보 날짜를 요구함.
            // FIXME: 미래 날짜를 BaseDate로 요청하면 데이터가 없음! 무조건 "오늘"을 기준으로 요청해야 함.
            const today = new Date();
            const reqDate = getLocalYYYYMMDD(today) + "00";

            updateAndShow(region, reqDate, selectedDate);
        };
    } else {
        console.error("Search button element not found.");
    }

    // 팝업 닫기 이벤트
    const popupBg = document.getElementById('popupBg');
    const popupCloseX = document.getElementById('popupCloseX');

    function closePopup() {
        if (popupBg) popupBg.style.display = 'none';
        // popupContainer는 자동으로 숨겨짐 (부모가 display:none)
    }

    if (popupBg) {
        popupBg.onclick = function (e) {
            // 배경 클릭 시에만 닫기 (컨텐츠 클릭 시 닫히지 않음)
            if (e.target === popupBg) {
                closePopup();
            }
        };
    }
    if (popupCloseX) {
        popupCloseX.onclick = closePopup;
    }

    console.log("Surf Info Website Loaded");
});
