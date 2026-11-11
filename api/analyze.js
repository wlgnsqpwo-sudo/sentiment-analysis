/**
 * api/analyze.js
 * 
 * [모듈 역할]
 * Vercel Serverless Function 진입점이자 감성 분석 API 엔드포인트 핸들러입니다.
 * 경로: POST /api/analyze
 * 
 * [규칙 준수 사항]
 * 1. HTTP POST 메서드만 허용 (그 외는 HTTP 405 Method Not Allowed)
 * 2. 입력 검증 (공백 제외 1~2,000자 확인, 미달/초과 시 400 Bad Request)
 * 3. OpenAI 호출 및 실패 시 적절한 에러 핸들링
 * 4. Supabase 연동 지원 (설정 시 분석 메타데이터 저장)
 * 5. PRD 및 지침서 규격에 맞춘 일관된 JSON 성공/실패 응답 포맷 준수
 */

import 'dotenv/config';
import { validateAnalysisInput } from '../src/server/validation.js';
import { analyzeSentimentWithOpenAI } from '../src/server/openai.js';
import { saveAnalysisLog } from '../src/server/supabase.js';

export default async function handler(req, res) {
  // CORS 및 응답 헤더 설정
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 1. HTTP 메서드 검증 (POST만 허용)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'POST 요청만 지원합니다.'
      }
    });
  }

  // 2. 요청 본문 파싱 (문자열로 들어온 경우 JSON 파싱 처리)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: '요청 본문이 올바른 JSON 형식이 아닙니다.'
        }
      });
    }
  }

  // 3. 입력값 유효성 검사 (길이, 빈 문자열 등)
  const validation = validateAnalysisInput(body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  try {
    // 4. OpenAI API를 통한 감성 분석 수행
    const analysisResult = await analyzeSentimentWithOpenAI(validation.sanitizedText);

    // 5. Supabase에 분석 로그 저장 (설정되어 있는 경우에만 동작하며, 비동기로 백그라운드 처리)
    saveAnalysisLog({
      sentiment: analysisResult.sentiment,
      confidence: analysisResult.confidence,
      reason: analysisResult.reason,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }).catch((err) => {
      console.warn('[Log Skip] 데이터베이스 저장 건너뜀:', err.message);
    });

    // 6. 성공 결과 반환 (docs/03-frontend-guidelines.md 규격 준수)
    return res.status(200).json({
      success: true,
      result: {
        sentiment: analysisResult.sentiment,
        confidence: analysisResult.confidence,
        reason: analysisResult.reason
      }
    });
  } catch (error) {
    console.error('[API Error in /api/analyze]:', error.message);

    // 환경 변수 설정 누락 시
    if (error.code === 'CONFIG_MISSING') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_MISSING',
          message: '서버 환경 변수(OPENAI_API_KEY) 설정이 필요합니다. 관리자에게 문의해 주세요.'
        }
      });
    }

    // OpenAI API 요청 한도 초과 (Rate Limit) 시
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
        }
      });
    }

    // 기타 서버/AI 오류
    return res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }
    });
  }
}

