/**
 * src/server/supabase.js
 * 
 * [모듈 역할]
 * Supabase 클라이언트를 초기화하고 필요 시 분석 로그 메타데이터를 저장하는 모듈입니다.
 * 
 * [규칙 및 보안 지침 준수]
 * 1. PRD 및 보안 규칙에 따라 원문 텍스트는 저장하지 않으며, 메타데이터(결과, 신뢰도, 이유)만 다룹니다.
 * 2. 서버 전용 Service Role Key가 환경 변수에 제공되었을 때만 안전하게 저장 기능을 수행합니다.
 * 3. Supabase 설정이 비어있더라도 전체 분석 서비스가 멈추지 않고 안전하게 건너뛰도록 처리합니다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient = null;

// Supabase 접속 정보가 올바르게 설정되어 있는지 확인
const hasValidConfig =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceRoleKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseServiceRoleKey.includes('your_supabase_service_role_key');

if (hasValidConfig) {
  try {
    // 서버 전용 권한을 가진 Supabase 인스턴스 생성
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    // 연결 실패 시 서버가 다운되지 않도록 에러 로깅만 진행
    console.error('[Supabase Init Warning] Supabase 초기화 실패:', error.message);
  }
}

/**
 * 분석 완료된 결과 메타데이터를 Supabase 데이터베이스에 기록합니다.
 * (원문 텍스트는 개인정보 보호 규칙에 따라 절대 저장하지 않습니다.)
 * 
 * @param {object} params
 * @param {string} params.sentiment - 감성 라벨 ('positive', 'negative', 'neutral')
 * @param {number} params.confidence - 신뢰도 (0~100)
 * @param {string} params.reason - 판단 근거 설명
 * @param {string} [params.model] - 사용된 모델명
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveAnalysisLog({ sentiment, confidence, reason, model = 'gpt-4o-mini' }) {
  // Supabase가 설정되지 않은 경우 조용히 건너뜁니다 (MVP 제약 조건 준수).
  if (!supabaseClient) {
    return false;
  }

  try {
    const { error } = await supabaseClient
      .from('analysis_logs')
      .insert([
        {
          sentiment,
          confidence,
          reason,
          model
        }
      ]);

    if (error) {
      console.error('[Supabase Log Warning] 로그 저장 오류:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase Log Exception] 예외 발생:', err.message);
    return false;
  }
}

