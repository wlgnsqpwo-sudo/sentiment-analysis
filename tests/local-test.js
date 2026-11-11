/**
 * tests/local-test.js
 * docs/06-testing-acceptance.md 명세에 따른 유효성 검사 및 로직 검증 스위트
 */

import { validateAnalysisInput, validateAIOutput } from '../src/server/validation.js';

console.log('=== 감성 분석 서비스 기능 및 검증 단위 테스트 ===\n');

let passCount = 0;
let failCount = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`✅ [통과] ${description}`);
    passCount++;
  } else {
    console.error(`❌ [실패] ${description}`);
    failCount++;
  }
}

// 1. T-04: 공백만 입력 시 차단
const emptyRes = validateAnalysisInput({ text: '    ' });
assert('T-04 공백만 입력 시 차단', !emptyRes.isValid && emptyRes.error.code === 'EMPTY_INPUT');

// 2. T-05: 2,001자 입력 시 차단
const longText = '가'.repeat(2001);
const longRes = validateAnalysisInput({ text: longText });
assert('T-05 2,001자 입력 시 차단', !longRes.isValid && longRes.error.code === 'TEXT_TOO_LONG');

// 3. 정상 입력 통과 확인
const validRes = validateAnalysisInput({ text: '  오늘 하루 정말 기분이 좋아!  ' });
assert('정상 입력 시 앞뒤 공백 제거 및 통과', validRes.isValid && validRes.sanitizedText === '오늘 하루 정말 기분이 좋아!');

// 4. T-10: AI가 허용되지 않은 라벨 반환 시 차단
const invalidLabel = validateAIOutput({ sentiment: 'angry', confidence: 80, reason: '화가 남' });
assert('T-10 허용되지 않은 라벨 차단', !invalidLabel.isValid);

// 5. T-11: AI 신뢰도가 100 초과 시 차단
const invalidConf = validateAIOutput({ sentiment: 'positive', confidence: 150, reason: '신뢰도 초과' });
assert('T-11 신뢰도 100 초과 차단', !invalidConf.isValid);

// 6. 정상 AI 응답 통과 확인
const validAI = validateAIOutput({ sentiment: 'positive', confidence: 95, reason: '기분이 좋아라는 긍정 표현 사용' });
assert('정상 AI 응답 형식 검증 통과', validAI.isValid && validAI.validatedResult.sentiment === 'positive');

console.log(`\n테스트 완료: ${passCount}건 통과, ${failCount}건 실패`);
if (failCount > 0) process.exit(1);

