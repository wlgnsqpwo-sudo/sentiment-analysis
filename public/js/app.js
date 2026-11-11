/**
 * public/js/app.js
 * 
 * [모듈 역할]
 * 프론트엔드 사용자 인터랙션, 입력 검증, /api/analyze 호출, 결과 및 에러 렌더링을 처리합니다.
 * 
 * [규칙 및 보안 지침 준수]
 * 1. AI 응답 이유(reason)는 XSS 방지를 위해 innerHTML 대신 textContent로 안전하게 출력합니다.
 * 2. 0자 및 2,000자 초과 입력 시 API 호출 전 즉시 차단합니다.
 * 3. 분석 요청 중에는 버튼 비활성화로 중복 호출을 방지합니다.
 * 4. 성공, 로딩, 실패 상태를 명확히 구분하여 보여줍니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 주요 DOM 엘리먼트 참조
  const form = document.getElementById('sentimentForm');
  const textarea = document.getElementById('inputText');
  const charCounter = document.getElementById('charCounter');
  const inputFeedback = document.getElementById('inputFeedback');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  const loadingSection = document.getElementById('loadingSection');
  const resultSection = document.getElementById('resultSection');
  const sentimentBadge = document.getElementById('sentimentBadge');
  const confidenceValue = document.getElementById('confidenceValue');
  const resultReason = document.getElementById('resultReason');

  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  const btnRetry = document.getElementById('btnRetry');

  // 모달 및 예시 칩 버튼
  const sampleChips = document.querySelectorAll('.chip-button');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const helpDialog = document.getElementById('helpDialog');
  const navGuide = document.getElementById('navGuide');

  const MAX_LENGTH = 2000;

  // 2. 실시간 글자 수 카운터 업데이트 함수
  function updateCharCount() {
    const length = textarea.value.length;
    charCounter.textContent = `${length.toLocaleString()} / ${MAX_LENGTH.toLocaleString()}자`;

    if (length > MAX_LENGTH) {
      charCounter.style.color = 'var(--color-error-text)';
      charCounter.style.fontWeight = 'bold';
    } else {
      charCounter.style.color = 'var(--color-muted)';
      charCounter.style.fontWeight = 'normal';
    }
  }

  // 3. 피드백 메시지 표시/숨김 헬퍼 함수
  function showInputError(message) {
    inputFeedback.textContent = message;
    inputFeedback.hidden = false;
    textarea.focus();
  }

  function clearInputError() {
    inputFeedback.textContent = '';
    inputFeedback.hidden = true;
  }

  // 4. 화면 상태 초기화 (결과 및 에러 숨김)
  function resetViews() {
    clearInputError();
    loadingSection.hidden = true;
    resultSection.hidden = true;
    errorSection.hidden = true;
  }

  // 5. 로딩 상태 토글 함수
  function setLoading(isLoading) {
    btnSubmit.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = '분석 중...';
      if (btnSpinner) btnSpinner.hidden = false;
      loadingSection.hidden = false;
      resultSection.hidden = true;
      errorSection.hidden = true;
    } else {
      btnText.textContent = '감성 분석하기';
      if (btnSpinner) btnSpinner.hidden = true;
      loadingSection.hidden = true;
    }
  }

  // 6. 결과 렌더링 함수 (보안: textContent 사용 필수)
  function renderResult(result) {
    const { sentiment, confidence, reason } = result;

    // 감성 라벨 한글 매핑 및 클래스 설정
    const sentimentMap = {
      positive: { label: '긍정 😊', className: 'positive' },
      negative: { label: '부정 😢', className: 'negative' },
      neutral: { label: '중립 😐', className: 'neutral' }
    };

    const currentSentiment = sentimentMap[sentiment] || { label: '알 수 없음', className: 'neutral' };

    // 카드 테마 클래스 교체
    resultSection.classList.remove('positive', 'negative', 'neutral');
    resultSection.classList.add(currentSentiment.className);

    sentimentBadge.className = 'result-badge ' + currentSentiment.className;
    sentimentBadge.textContent = currentSentiment.label;

    confidenceValue.textContent = `신뢰도 ${confidence}%`;
    
    // XSS 방지를 위해 반드시 textContent 사용
    resultReason.textContent = reason;

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 7. 에러 메시지 렌더링 함수
  function renderError(message) {
    errorMessage.textContent = message || '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    errorSection.hidden = false;
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 8. 폼 제출 및 분석 요청 핸들러
  async function handleSubmit(event) {
    if (event) event.preventDefault();

    resetViews();
    const rawValue = textarea.value;
    const trimmedValue = rawValue.trim();

    // 빈 문자열 검사 (PRD FR-05)
    if (trimmedValue.length === 0) {
      showInputError('분석할 텍스트를 입력해 주세요.');
      return;
    }

    // 최대 글자 수 초과 검사 (PRD FR-05)
    if (trimmedValue.length > MAX_LENGTH) {
      showInputError('텍스트는 2,000자 이하로 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmedValue })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !data.success) {
        const errorMsg = data?.error?.message || '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        renderError(errorMsg);
        return;
      }

      // 정상 분석 결과 출력
      renderResult(data.result);
    } catch (networkError) {
      // 네트워크 연결 실패 처리 (PRD FR-05)
      renderError('서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  // 이벤트 리스너 바인딩
  textarea.addEventListener('input', () => {
    updateCharCount();
    clearInputError();
  });

  form.addEventListener('submit', handleSubmit);
  btnRetry.addEventListener('click', handleSubmit);

  // 예시 문장 칩 클릭 이벤트
  sampleChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const sampleText = chip.getAttribute('data-sample');
      if (sampleText) {
        textarea.value = sampleText;
        updateCharCount();
        clearInputError();
        textarea.focus();
      }
    });
  });

  // 도움말 다이얼로그 제어
  function openHelp() {
    if (typeof helpDialog.showModal === 'function') {
      helpDialog.showModal();
    } else {
      alert('감성 분석기는 사용자가 입력한 문장의 긍정/부정/중립 감성을 AI로 분석해 드리는 서비스입니다.');
    }
  }

  btnHelp?.addEventListener('click', openHelp);
  navGuide?.addEventListener('click', openHelp);
  btnCloseHelp?.addEventListener('click', () => helpDialog.close());

  // 초기 글자 수 표시
  updateCharCount();
});

