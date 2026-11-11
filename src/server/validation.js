/**
 * src/server/validation.js
 * 
 * [모듈 역할]
 * 클라이언트에서 전송된 입력값(텍스트)과 AI 모델이 반환한 응답 데이터를 검증합니다.
 * 보안 규칙 및 PRD 요구사항(공백 제외 1~2,000자, 허용된 감성 라벨 등)을 철저히 검사합니다.
 */

// 허용되는 감성 분석 라벨 목록 (PRD FR-03 규정)
export const ALLOWED_SENTIMENTS = ['positive', 'negative', 'neutral'];

// 최대 입력 글자 수 제한 (PRD FR-01 규정)
export const MAX_TEXT_LENGTH = 2000;

/**
 * 클라이언트로부터 받은 요청 본문(Body)의 입력 텍스트를 검증합니다.
 * @param {any} body - 파싱된 JSON 본문 객체
 * @returns {{ isValid: boolean, error?: { code: string, message: string }, sanitizedText?: string }}
 */
export function validateAnalysisInput(body) {
  // 1. 요청 본문이 객체 형태인지 확인
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_JSON',
        message: '요청 본문이 올바른 JSON 형식이 아닙니다.'
      }
    };
  }

  const { text } = body;

  // 2. text 필드가 문자열인지 확인
  if (typeof text !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_INPUT',
        message: '분석할 텍스트를 입력해 주세요.'
      }
    };
  }

  // 3. 앞뒤 공백 제거 (PRD FR-01: 앞뒤 공백을 제거한 뒤 검사)
  const trimmedText = text.trim();

  // 4. 빈 문자열 검사
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_INPUT',
        message: '분석할 텍스트를 입력해 주세요.'
      }
    };
  }

  // 5. 최대 글자 수 초과 검사 (2,000자 이하)
  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'TEXT_TOO_LONG',
        message: '텍스트는 2,000자 이하로 입력해 주세요.'
      }
    };
  }

  // 유효성 검사 통과
  return {
    isValid: true,
    sanitizedText: trimmedText
  };
}

/**
 * OpenAI API가 반환한 결과를 검증합니다.
 * AI가 규정된 형식을 지키지 않았을 경우 잘못된 데이터가 클라이언트로 전달되는 것을 차단합니다.
 * @param {any} result - AI 응답 파싱 객체
 * @returns {{ isValid: boolean, validatedResult?: { sentiment: string, confidence: number, reason: string } }}
 */
export function validateAIOutput(result) {
  if (!result || typeof result !== 'object') {
    return { isValid: false };
  }

  const { sentiment, confidence, reason } = result;

  // 1. 감성 라벨이 'positive', 'negative', 'neutral' 중 하나인지 확인
  if (typeof sentiment !== 'string' || !ALLOWED_SENTIMENTS.includes(sentiment.toLowerCase())) {
    return { isValid: false };
  }

  // 2. 신뢰도가 0~100 사이의 정수인지 확인
  if (typeof confidence !== 'number' || !Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    return { isValid: false };
  }

  // 3. 분석 이유가 비어있지 않은 문자열인지 확인
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return { isValid: false };
  }

  return {
    isValid: true,
    validatedResult: {
      sentiment: sentiment.toLowerCase(),
      confidence,
      reason: reason.trim()
    }
  };
}

