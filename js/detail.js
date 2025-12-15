// Surfly Detail Page Logic
// Fetches real KMA API data for specific beach pages.

// KMA API Fetcher (Duplicated from script.js for standalone safety)
async function fetchKmaSurfDataForDetail(reqDate) {
    const url = `https://surfly.info/.netlify/functions/kmaSurfForcast?reqDate=${reqDate}&numOfRows=500`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        return json.response?.body?.items?.item || [];
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

    // Find Best Forecast (Same logic as main script: Today PM > AM > Future AM)
    const now = new Date();
    const isAfternoon = now.getHours() >= 12;
    const preferredTime = isAfternoon ? "오후" : "오전";

    // Filter by spot
    const spotItems = items.filter(i => i.surfPlcNm === spotName);

    let targetItem = spotItems.find(i => i.predcNoonSeCd === preferredTime);
    if (!targetItem) {
        // Fallback
        targetItem = spotItems.find(i => i.predcNoonSeCd === (preferredTime === "오전" ? "오후" : "오전"));
    }
    if (!targetItem && spotItems.length > 0) targetItem = spotItems[0];

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
