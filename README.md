# Surfly (서플리)

[![Netlify Status](https://api.netlify.com/api/v1/badges/11299e53-6009-4f56-8fc0-1ecf19dc8132/deploy-status)](https://app.netlify.com/projects/surfly/deploys)

**Surfly**는 기상청 데이터를 기반으로 국내 주요 서핑 스팟의 파도 상태와 날씨를 분석하여, 최적의 서핑 장소를 추천해주는 웹 서비스입니다.

🔗 **Live Site**: [https://surfly.info](https://surfly.info)

## 주요 기능 (Key Features)

-   **실시간 서핑 추천**: 기상청 해양 예보 API를 연동하여 파고, 파주기, 풍속, 수온 등을 분석하고 자체 알고리즘으로 서핑 점수를 산출합니다.
-   **7일 주간 예보**: 오늘부터 일주일 뒤까지의 원하는 날짜를 선택하여 미리 서핑 계획을 세울 수 있습니다.
-   **전국 해수욕장 커버리지**: 제주도, 부산, 양양, 포항 등 국내 주요 서핑 명소 19곳의 데이터를 제공합니다.
-   **상세 정보 제공**: 각 해수욕장별 상세 페이지에서 시간대별 예보 및 주변 편의시설 정보를 확인할 수 있습니다.

## 기술 스택 (Tech Stack)

-   **Frontend**: HTML5, CSS3, Vanilla JavaScript
-   **Backend (Proxy)**: Netlify Functions (Node.js) to bypass CORS and handle KMA API requests securely.
-   **API**: [기상청 단기예보 조회 서비스](https://www.data.go.kr) & 해양 기상 정보 Integration.
-   **Deployment**: Netlify

## 개발 및 기여 (Development)

이 프로젝트는 현재 활발히 개발 중이며, 서핑 커뮤니티 기능 등이 추가될 예정입니다.
