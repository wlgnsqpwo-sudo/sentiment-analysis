# 05. Supabase 및 Vercel 지침

## 1. Supabase 사용 범위
이번 MVP에서는 분석 결과를 기본적으로 영구 저장하지 않는다. 따라서 Supabase 연결은 향후 확장 기반으로 준비하되, 저장 요구가 확정되지 않았다면 데이터 테이블을 임의로 만들거나 원문을 저장하지 않는다.

### 추후 저장 기능 승인 시 고려할 테이블 예시
`analysis_logs`
- `id`: UUID 기본 키
- `sentiment`: positive / negative / neutral
- `confidence`: 0~100 정수
- `created_at`: 생성 시각
- `reason`: 분석 이유(저장 필요성이 승인된 경우에만)

원문 텍스트는 기본 저장 대상에서 제외한다. 저장 기능을 추가하려면 저장 목적, 보유 기간, 삭제 방식, 사용자 동의 절차를 PRD에 먼저 반영한다.

## 2. Supabase 보안
- 공개 가능한 anon key와 service role key의 역할을 구분한다.
- service role key는 서버 전용이다.
- RLS(Row Level Security)는 테이블을 만들 때 활성화하고 정책을 명시한다.
- 로그인 기능이 없는 상태에서 누구나 모든 분석 기록을 읽을 수 있는 정책을 만들지 않는다.
- 현재 MVP에서 DB 쓰기 기능을 사용하지 않는다면 Supabase를 연결했다는 이유만으로 빈 데이터를 저장하지 않는다.

## 3. Vercel 배포
1. Git 저장소에 코드를 올린다.
2. Vercel에서 저장소를 가져온다.
3. 프로젝트 환경 변수에 필요한 키를 등록한다.
4. 배포를 실행한다.
5. 배포 URL에서 메인 화면과 `/api/analyze`를 확인한다.

## 4. 환경 변수 관리
Vercel 프로젝트 설정에 다음 변수를 등록한다.
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUPABASE_URL` (Supabase를 실제 사용하는 경우)
- `SUPABASE_ANON_KEY` (서버 또는 공개 사용 여부를 설계에 맞게 제한)
- `SUPABASE_SERVICE_ROLE_KEY` (서버에서 실제 필요할 때만)

로컬 `.env` 파일은 Git에 올리지 않는다. 키를 코드에 직접 입력하거나 화면에 출력하지 않는다.

## 5. 배포 완료 기준
- Vercel 배포가 성공한다.
- 배포 URL에서 HTML/CSS/JS가 정상 로드된다.
- API 함수가 정상 실행된다.
- 환경 변수 누락 시 원인을 파악할 수 있는 서버 로그가 남되 비밀 값은 노출되지 않는다.
- 실제 API 키를 사용한 분석 테스트가 성공한다.
- 브라우저 소스와 네트워크 응답에서 비밀 키가 노출되지 않는다.
