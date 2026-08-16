/**
 * 계산 결과 "판단 3줄" 중 셋째 줄 — 구간별 "흔히 놓치는 것" 인사이트.
 * 원칙: 단정·약속 금지("~됩니다" X), 확인·검토 권유 톤("~인지 확인해 보세요").
 * 숫자·세율은 결과 화면에 이미 있으므로 여기서는 행동 단서만 제공한다.
 */

export interface ResultInsight {
  /** 한 줄 요약 배지 (예: "공제 점검 구간") */
  tag: string;
  /** 이 구간에서 흔히 놓치는 것 1가지 */
  body: string;
}

/** 종합소득세 — 과세표준 구간 기준 */
export function comprehensiveIncomeInsight(taxableWon: number): ResultInsight {
  if (taxableWon <= 14_000_000) {
    return {
      tag: "환급 가능성 점검 구간",
      body: "세율이 낮은 구간이라 추가 납부보다, 빠뜨린 경비·기납부 세액이 없는지가 더 중요합니다. 원천징수된 3.3%가 있다면 오히려 환급 대상인지 확인해 보세요.",
    };
  }
  if (taxableWon <= 50_000_000) {
    return {
      tag: "공제 점검 구간",
      body: "이 구간에서 가장 자주 놓치는 것은 연금저축·IRP 세액공제입니다. 납입 여력이 있다면 공제 한도를 채웠는지부터 확인해 보세요.",
    };
  }
  if (taxableWon <= 88_000_000) {
    return {
      tag: "기장 방식 점검 구간",
      body: "단순·기준경비율 추계와 장부 기장 중 무엇이 유리한지가 세액을 크게 바꾸는 구간입니다. 실제 경비 비중이 높다면 기장 전환 실익을 확인해 보세요.",
    };
  }
  if (taxableWon <= 150_000_000) {
    return {
      tag: "구조 검토 구간",
      body: "누진 구간 상단에 걸쳐 있어 소득 분산·필요경비 정리에 따라 구간이 내려갈 수 있습니다. 공동사업·비용 처리 구조를 한 번 점검해 볼 만한 구간입니다.",
    };
  }
  return {
    tag: "고세율 구조 검토 구간",
    body: "35%를 넘는 고세율 구간입니다. 법인 전환, 소득 인식 시기 조절 등 구조적 선택의 실익이 커지는 구간이라 신고 전 전문가 점검 가치가 높습니다.",
  };
}

/** 부가세 — 공급가액 규모 기준 (매입 정보는 이 계산기에 없음) */
export function vatInsight(input: { supplyWon: number; vatWon: number }): ResultInsight {
  const { supplyWon } = input;

  if (supplyWon >= 80_000_000) {
    return {
      tag: "과세 유형 점검 구간",
      body: "연 매출 규모에 따라 일반과세·간이과세 유불리가 갈립니다. 부가세 부담과 매입세액 공제 폭을 함께 놓고 지금 과세 유형이 맞는지 확인해 보세요.",
    };
  }
  if (supplyWon >= 10_000_000) {
    return {
      tag: "매입세액 점검 구간",
      body: "이 계산은 매출 쪽 세액만 본 것입니다. 실무에서 가장 흔한 누락은 사업용 카드·현금영수증 매입분 미반영이니, 공제받을 매입세액을 빠뜨리지 않았는지 확인해 보세요.",
    };
  }
  return {
    tag: "증빙 관리 구간",
    body: "이 구간에서 세액 차이를 만드는 것은 세율이 아니라 증빙입니다. 세금계산서·카드 매입 자료가 신고 기간 전에 정리돼 있는지 확인해 보세요.",
  };
}

/** 양도세(간이 모델) — 차익·보유기간 기준 */
export function transferTaxInsight(input: {
  gainWon: number;
  holdingYears?: number | null;
}): ResultInsight {
  const { gainWon, holdingYears } = input;

  if (holdingYears != null && holdingYears < 2) {
    return {
      tag: "단기 보유 점검 구간",
      body: "보유 2년 미만은 단기 세율·중과 여부가 세액을 좌우합니다. 양도 시점을 몇 달 조정하는 것만으로 구간이 바뀌는지 먼저 확인해 보세요.",
    };
  }
  if (gainWon >= 300_000_000) {
    return {
      tag: "대규모 차익 구간",
      body: "차익 규모가 커서 장기보유특별공제·비과세 요건 충족 여부 하나가 수천만 원을 바꿉니다. 거주 요건·보유 요건을 신고 전에 반드시 확인해 보세요.",
    };
  }
  if (gainWon >= 50_000_000) {
    return {
      tag: "공제 적용 점검 구간",
      body: "이 구간에서 흔히 놓치는 것은 취득 부대비용(취득세·중개수수료·자본적 지출) 합산입니다. 증빙 가능한 비용을 모두 취득가액에 반영했는지 확인해 보세요.",
    };
  }
  return {
    tag: "기본 요건 점검 구간",
    body: "세액 자체보다 1세대 1주택 비과세 등 요건 충족 여부가 먼저입니다. 요건이 애매한 부분이 하나라도 있다면 그 부분만 전문가와 확인해 보세요.",
  };
}
