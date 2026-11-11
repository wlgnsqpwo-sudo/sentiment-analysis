# 01. 프로젝트 생성 및 기본 구조

## 목적
에이전트가 기술 스택과 폴더 구조를 임의로 바꾸지 않고 프로젝트를 시작하도록 안내한다.

## 권장 폴더 구조
```text
sentiment-service/
├── AGENTS.md
├── PRD.md
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── index.html
├── public/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── api/
│   └── analyze.js
├── src/
│   └── server/
│       ├── openai.js
│       ├── validation.js
│       └── supabase.js
└── docs/
    ├── 01-project-setup.md
    ├── 02-ui-guidelines.md
    ├── 03-frontend-guidelines.md
    ├── 04-backend-ai-guidelines.md
    ├── 05-database-deployment.md
    └── 06-testing-acceptance.md
```

## 생성 순서
1. Node.js LTS 버전을 설치한다.
2. 프로젝트 폴더를 만들고 `npm init -y`로 패키지 설정을 시작한다.
3. HTML/CSS/JavaScript 정적 파일과 Vercel 서버리스 API 폴더를 만든다.
4. 필요한 패키지만 설치한다: OpenAI 공식 Node SDK, Supabase JavaScript SDK.
5. 로컬 환경 변수 파일 `.env`를 만들되 Git에 올리지 않는다.
6. Vercel 배포 설정을 추가한다.

## 필수 환경 변수
`.env.example`에는 아래 이름만 적는다.
```env
OPENAI_API_KEY=
OPENAI_MODEL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
- `OPENAI_MODEL`은 사용할 모델의 배포 환경 설정값으로 관리한다. 임의의 모델명을 코드에 하드코딩하지 않는다.
- 실제로 Supabase 서버 연결이 필요하지 않은 MVP 단계라면 Supabase 키를 억지로 사용하지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이며 브라우저에 전달하지 않는다.

## 구현 제약
- 프론트엔드는 순수 HTML/CSS/JavaScript로 유지한다.
- 빌드 도구나 프레임워크는 기본적으로 도입하지 않는다.
- Vercel 환경에서는 `api/`의 Node.js 함수가 API 엔드포인트가 된다.
- 로컬 개발 서버와 Vercel 배포 환경의 API 경로가 같도록 구성한다.

## 완료 기준
- 문서에 적힌 폴더 구조가 생성되어 있다.
- `npm install`이 성공한다.
- `.env.example`이 존재하고 `.env`는 Git 추적 대상이 아니다.
- README에 설치·실행·배포 절차가 기록되어 있다.
