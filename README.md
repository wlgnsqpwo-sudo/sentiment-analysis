# 한국어 감성 분석 웹 서비스 (Sentiment Analysis Web Service)

사용자가 입력한 한국어 텍스트를 AI 모델(OpenAI `gpt-4o-mini`)로 분석하여 **긍정 / 부정 / 중립** 감성 라벨, 모델 신뢰도(%), 판단 근거를 카드 UI로 제공하는 반응형 웹 서비스입니다.

---

## 1. 주요 기능
- **텍스트 실시간 검증**: 공백 제거 후 1~2,000자 제한, 실시간 글자 수 카운터 제공
- **구조화된 감성 분석**: OpenAI Structured Outputs(JSON Schema)를 적용하여 일관된 JSON 반환
- **모바일 우선 반응형 UI**: 최소 360px 모바일 화면부터 데스크톱(최대 720px 정렬)까지 완벽 지원
- **강력한 보안 및 개인정보 보호**:
  - 사용자 입력 원문 텍스트는 영구 저장하지 않음 (개인정보 보호 정책 준수)
  - API 키 및 시크릿은 서버 환경 변수(`.env`)로만 관리
  - XSS 방지를 위해 화면 렌더링 시 `textContent` 사용
- **Supabase 연동 지원**: 마이그레이션 SQL(`001_create_analysis_logs_table.sql`)을 통한 메타데이터 로그 테이블 및 RLS 보안 정책 구축

---

## 2. 프로젝트 폴더 구조
```text
sentiment-service/
├── AGENTS.md                  # 공통 작업 및 보안 규칙
├── PRD.md                     # 제품 요구사항 정의서
├── README.md                  # 프로젝트 설명서 (본 문서)
├── package.json               # 패키지 설정 및 스크립트
├── .gitignore                 # 환경 변수 및 임시 파일 제외
├── .env                       # 로컬 환경 변수 (Git 추적 제외)
├── .env.example               # 환경 변수 템플릿
├── index.html                 # 시맨틱 반응형 메인 화면
├── server.js                  # 로컬 통합 개발 서버
├── public/
│   ├── css/
│   │   └── styles.css         # 디자인 토큰 기반 반응형 스타일시트
│   └── js/
│       └── app.js             # 클라이언트 상호작용 및 API 연동 스크립트
├── api/
│   └── analyze.js             # Vercel Serverless Function 엔드포인트
├── src/
│   └── server/
│       ├── openai.js          # OpenAI SDK 연동 및 프롬프트 로직
│       ├── validation.js      # 입력 및 AI 응답 유효성 검사기
│       └── supabase.js        # Supabase 연동 모듈
├── supabase/
│   └── migrations/
│       └── 001_create_analysis_logs_table.sql # DB 테이블 및 RLS 설정
├── tests/
│   └── local-test.js          # 유효성 검사 단위 테스트 스위트
└── docs/                      # 프로젝트 가이드라인 문서군
```

---

## 3. 설치 및 로컬 실행 방법

### 의존성 패키지 설치
```bash
npm install
```

### 환경 변수 설정
`.env` 파일에 발급받은 API 키를 입력합니다.
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 로컬 개발 서버 실행
```bash
npm start
```
실행 후 브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 단위 테스트 실행
```bash
npm test
```

---

## 4. Vercel 배포 방법
1. 코드를 GitHub 저장소에 푸시합니다.
2. Vercel 대시보드에서 해당 저장소를 임포트(Import)합니다.
3. 프로젝트 설정의 **Environment Variables**에 `.env`에 정의된 변수들을 등록합니다:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `SUPABASE_URL` (선택 사항)
   - `SUPABASE_SERVICE_ROLE_KEY` (선택 사항)
4. 배포를 진행하면 별도의 빌드 설정 없이 즉시 동작합니다.

