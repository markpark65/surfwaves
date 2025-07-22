const fetch = require('node-fetch');

const KMA_API_KEY = "NoUqstwNKMHeBB65bcIoo1UOyRFYBA3vYzOYaKGL3ssOWSnGVkABuHn3KylDNxI5ZLjIk8RRqR7J8VdAbVnILw%3D%3D";

exports.handler = async function(event, context) {
  const params = event.queryStringParameters || {};
  const { reqDate, numOfRows = 300, pageNo = 1 } = params;
  
  if (!reqDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "reqDate 파라미터가 필요합니다 (YYYYMMDD00 형식)." })
    };
  }
  if (reqDate.length !== 10) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "reqDate 형식이 올바르지 않습니다. YYYYMMDD00 형식이어야 합니다." })
    };
  }
  
  const url = `https://apis.data.go.kr/1192136/fcstSurfing/GetFcstSurfingApiService?serviceKey=${KMA_API_KEY}&type=json&reqDate=${reqDate}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  console.log(`Proxying KMA Surf API request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KMA API response not OK: ${response.status} - ${errorText}`);
    }
    const json = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(json)
    };
  } catch (e) {
    console.error("KMA 서핑 예측 API 프록시 오류:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: e.toString(), 
        message: "KMA API 데이터를 가져오지 못했습니다. API 키와 서버 상태를 확인하세요." 
      })
    };
  }
};