const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const API_KEY = 'b5bf476e1ea63f7fb349ab686f2e48b2';

// 1) 버튼 클릭 이벤트
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    alert('도시 이름을 입력하세요');
    return;
  }
  fetchWeather(city);
});

// 2) 날씨 API 호출
async function fetchWeather(city) {
  resultsEl.innerHTML = `<p>로딩 중…</p>`;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather`
      + `?q=${encodeURIComponent(city)}`
      + `&units=metric&lang=kr&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('도시를 찾을 수 없습니다');
    const data = await res.json();
    displayResults(data);
  } catch (err) {
    resultsEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// 3) 결과 출력
function displayResults(data) {
  const {
    name,
    weather: [{ description }],
    clouds: { all: cloudiness },
    wind: { speed: windSpeed },
    main: { temp, feels_like, temp_min, temp_max, pressure, humidity }
  } = data;

  resultsEl.innerHTML = `
    <p>검색 지역: ${name}</p>
    <p>전체적인 날씨: ${description}</p>
    <p>흐림 정도: ${cloudiness}%</p>
    <p>풍속: ${windSpeed.toFixed(2)}m/s</p>
    <p>현재 온도: ${temp.toFixed(2)}</p>
    <p>체감 온도: ${feels_like.toFixed(2)}</p>
    <p>최저 기온: ${temp_min.toFixed(2)}</p>
    <p>최고 기온: ${temp_max.toFixed(2)}</p>
    <p>기압: ${pressure}</p>
    <p>습도: ${humidity}</p>
  `;
}