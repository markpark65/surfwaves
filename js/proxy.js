const express = require('express');
const fetch = require('node-fetch'); // node-fetch가 설치되어 있어야 합니다 (npm install node-fetch)
const cors = require('cors');
const app = express();
app.use(cors());

// 기상청 서핑지수 API 키 - 여기에 실제 키를 입력하세요!
const KMA_API_KEY = "NoUqstwNKMHeBB65bcIoo1UOyRFYBA3vYzOYaKGL3ssOWSnGVkABuHn3KylDNxI5ZLjIk8RRqR7J8VdAbVnILw%3D%3D"; 

// reqDate는 YYYYMMDD00 형식이어야 합니다.
app.get('/api/kma-surf-forecast', async (req, res) => {
  const { reqDate, numOfRows = 300, pageNo = 1 } = req.query; // reqDate: YYYYMMDD00
  if (!reqDate) {
    return res.status(400).json({ error: "reqDate 파라미터가 필요합니다 (YYYYMMDD00 형식)." });
  }
  if (reqDate.length !== 10) {
    return res.status(400).json({ error: "reqDate 형식이 올바르지 않습니다. YYYYMMDD00 형식이어야 합니다." });
  }

  const url = `https://apis.data.go.kr/1192136/fcstSurfing/GetFcstSurfingApiService?serviceKey=${KMA_API_KEY}&type=json&reqDate=${reqDate}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  console.log(`Proxying KMA Surf API request to: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KMA API response not OK: ${response.status} - ${errorText}`);
    }
    const json = await response.json();
    res.json(json);
  } catch (e) {
    console.error("KMA 서핑 예측 API 프록시 오류:", e);
    res.status(500).json({ 
      error: e.toString(), 
      message: "Failed to fetch surfing forecast data from KMA API. Please check your API key and proxy server status." 
    });
  }
});


app.listen(4000, () => console.log('Proxy server running on port 4000'));