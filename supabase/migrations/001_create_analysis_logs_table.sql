-- ============================================================================
-- 001_create_analysis_logs_table.sql
-- 설명: 감성 분석 결과를 저장하기 위한 Supabase 테이블 생성 쿼리 (멱등성 보장 버전)
-- 프로젝트 규칙 준수:
--   1. 파일명 번호 부여 규칙 (000_ 형태): 001_create_analysis_logs_table.sql
--   2. 보안 및 개인정보 보호: 
--      - 사용자의 입력 '원문 텍스트'는 저장하지 않음 (개인정보 보호 및 PRD 정책)
--      - RLS(Row Level Security, 행 수준 보안) 활성화로 인가되지 않은 외부 접근 차단
--      - Service Role(서버리스 백엔드) 전용 쓰기/조회 정책 설정
--   3. 반복 실행(재시도) 시에도 에러가 발생하지 않도록 DROP POLICY IF EXISTS 적용
-- ============================================================================

-- 1. UUID 생성을 위한 확장 모듈 활성화 (Supabase 기본 제공)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. analysis_logs (감성 분석 로그) 테이블 생성 (이미 존재하면 건너뜀)
CREATE TABLE IF NOT EXISTS public.analysis_logs (
    -- 고유 식별자 (자동 생성되는 UUID)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 감성 분석 결과 라벨 ('positive', 'negative', 'neutral' 중 하나만 허용)
    sentiment VARCHAR(10) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),

    -- 모델이 추정한 신뢰도 (0 이상 100 이하의 정수값)
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

    -- 감성 판단 이유 (간략한 설명 문구)
    reason TEXT NOT NULL,

    -- 사용된 AI 모델명 (예: 'gpt-4o-mini')
    model VARCHAR(50) DEFAULT 'gpt-4o-mini',

    -- 레코드 생성 일시
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 및 컬럼 한글 주석 추가
COMMENT ON TABLE public.analysis_logs IS '감성 분석 결과 메타데이터 로그 테이블 (원문 텍스트 제외)';
COMMENT ON COLUMN public.analysis_logs.id IS '로그 고유 UUID';
COMMENT ON COLUMN public.analysis_logs.sentiment IS '감성 분류 결과 (positive, negative, neutral)';
COMMENT ON COLUMN public.analysis_logs.confidence IS 'AI 모델 추정 신뢰도 (0~100)';
COMMENT ON COLUMN public.analysis_logs.reason IS '감성 분석 판단 근거 및 이유';
COMMENT ON COLUMN public.analysis_logs.model IS '분석에 사용된 AI 모델 이름';
COMMENT ON COLUMN public.analysis_logs.created_at IS '분석 일시';

-- 3. 검색 및 통계 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analysis_logs_sentiment ON public.analysis_logs (sentiment);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_created_at ON public.analysis_logs (created_at DESC);

-- 4. 보안 설정 (RLS - Row Level Security 활성화)
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- 5. 백엔드 서버(Service Role) 전용 접근 정책 재설정
-- [오류 해결 핵심]: 정책이 이미 존재할 경우 에러가 나지 않도록 기존 정책을 먼저 삭제 후 생성합니다.
DROP POLICY IF EXISTS "서버 전용 로그 삽입 정책" ON public.analysis_logs;
DROP POLICY IF EXISTS "서버 전용 로그 조회 정책" ON public.analysis_logs;

-- 정책 재생성: service_role 키를 가진 백엔드 서버만 INSERT 가능
CREATE POLICY "서버 전용 로그 삽입 정책" 
ON public.analysis_logs 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- 정책 재생성: service_role 키를 가진 백엔드 서버만 SELECT 가능
CREATE POLICY "서버 전용 로그 조회 정책" 
ON public.analysis_logs 
FOR SELECT 
TO service_role 
USING (true);
