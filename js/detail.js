// KMA API Fetcher (Duplicated from script.js for standalone safety)
// KMA API Fetcher (Duplicated from script.js for standalone safety)
async function fetchKmaSurfDataForDetail(reqDate) {
    const CACHE_KEY = `kmaData_${reqDate}_detail`; // script.js와 분리하거나 공유해도 됨 (여기서는 분리)
    const CACHE_EXPIRY = 30 * 60 * 1000; // 30분

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
                console.log("Using Cached Detail Data");
                return parsed.data;
            }
        } catch (e) {
            sessionStorage.removeItem(CACHE_KEY);
        }
    }

    const url = `https://surfly.info/.netlify/functions/kmaSurfForcast?reqDate=${reqDate}&numOfRows=300`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        const r = json.response || json;
        const items = r.body?.items?.item || [];

        if (items.length > 0) {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: items
            }));
        }
        return items;
    } catch (e) {
        console.error("API Fetch Error:", e);
        return [];
    }
}

// Local Date Helper
function getLocalYYYYMMDD_Detail() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}00`; // API format usually needs Time appended
}

function getYYYYMMDD_Dash(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Map Page Title/Filename to KMA Spot Name
// Key: Keyword found in document title or URL, Value: KMA Spot Name
const surfSpots = {
    "이호테우": "이호테우해수욕장",
    "월정리": "월정리해수욕장",
    "함덕": "함덕해수욕장",
    "곽지": "곽지해수욕장",
    "중문": "중문색달해수욕장",
    "송정": "송정해수욕장",
    "임랑": "임랑해수욕장",
    "다대포": "다대포해수욕장",
    "해운대": "해운대해수욕장",
    "광안리": "광안리해수욕장",
    "죽도": "죽도해수욕장",
    "인구": "인구해수욕장",
    "서피비치": "서피비치해수욕장",
    "38선": "38선해수욕장",
    "낙산": "낙산해수욕장",
    "갯마을": "갯마을해수욕장",
    "월포": "월포해수욕장",
    "용한리": "용한리해수욕장",
    "영일대": "영일대해수욕장"
};

function identifySpotName() {
    const title = document.title;
    const path = window.location.pathname;

    for (const [key, value] of Object.entries(surfSpots)) {
        if (title.includes(key) || decodeURIComponent(path).includes(key)) {
            return value;
        }
    }
    return null;
}

// Main Update Function
async function updateWeatherInfo() {
    const spotName = identifySpotName();
    if (!spotName) {
        console.warn("Could not identify surf spot from title/url.");
        return;
    }

    // Set Loading State
    const spans = ['waveHeight', 'period', 'windSpeed', 'waterTemp', 'surfIndex'];
    spans.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "로딩중...";
    });

    const reqDate = getLocalYYYYMMDD_Detail();
    const items = await fetchKmaSurfDataForDetail(reqDate);

    // Parse Date from URL or default to Today
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    let targetDate = new Date();

    if (dateParam) {
        targetDate = new Date(dateParam);
    }

    const targetDateStr = getYYYYMMDD_Dash(targetDate); // YYYY-MM-DD helper needed

    // Find Best Forecast
    // Filter by spot AND date
    const spotItems = items.filter(i => i.surfPlcNm === spotName && i.predcYmd === targetDateStr);

    // Time Logic (Same as script.js)
    const now = new Date();
    // If target is today, check time. If future, prefer AM.
    let preferredTime = "오전";
    const isToday = targetDate.toDateString() === now.toDateString();

    if (isToday && now.getHours() >= 12) {
        preferredTime = "오후";
    }

    let targetItem = spotItems.find(i => i.predcNoonSeCd === preferredTime);
    if (!targetItem) {
        // Fallback to opposite time
        targetItem = spotItems.find(i => i.predcNoonSeCd === (preferredTime === "오전" ? "오후" : "오전"));
    }
    if (!targetItem && spotItems.length > 0) targetItem = spotItems[0];

    // Update Title with Date
    const weatherInfoTitle = document.querySelector('.weather-info h3') || document.getElementById('weatherInfo');
    if (weatherInfoTitle) {
        // Create or find a sub-header for date
        // Or just log it for now as UI might not have slot
    }

    // Update UI
    if (targetItem) {
        if (document.getElementById('waveHeight')) document.getElementById('waveHeight').textContent = (targetItem.avgWvhgt || '-') + "m";
        if (document.getElementById('period')) document.getElementById('period').textContent = (targetItem.avgWvpd || '-') + "s";
        if (document.getElementById('windSpeed')) document.getElementById('windSpeed').textContent = (targetItem.avgWspd || '-') + "m/s";
        if (document.getElementById('waterTemp')) document.getElementById('waterTemp').textContent = (targetItem.avgWtem || '-') + "°C";

        const idxEl = document.getElementById('surfIndex');
        if (idxEl) {
            idxEl.textContent = targetItem.totalIndex || '-';
            idxEl.style.color = '#2196f3';
            idxEl.style.fontWeight = 'bold';
        }
    } else {
        spans.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "정보없음";
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateWeatherInfo();
});
