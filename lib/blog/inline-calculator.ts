// Only attach to individually inspected passages, once per article.
export function getInlineCalculator(slug:string,h2:string) {
  if(slug === "부가세-신고-세무사-직접-판단" && h2 === "직접 신고·1회 검토·대행 비교표") return {href:"/calculator/부가세#filing-check",title:"내 자료로 직접 신고할 수 있을까요?",description:"과세유형과 증빙 준비 상태를 입력해 신고 복잡도를 확인하세요. 신고 준비 진단이며 실제 부가세 납부액 계산은 아닙니다.",calculatorType:"vat_decision"};
  if(slug === "프리랜서-3점3-종합소득세-환급-추가납부" && h2 === "3.3%는 확정세액이 아니라 선납액입니다") return {href:"/calculator/종합소득세#calculator-input",title:"예시를 봤다면 내 과세표준도 확인해 보세요",description:"수입·경비·소득공제 보조 안내로 과세표준을 정리할 수 있습니다. 표시 결과는 국세 산출세액이며 3.3% 환급·추가납부액을 자동 정산하지 않습니다.",calculatorType:"comprehensive_income"};
  if(slug === "증여세-계산-방법-쉽게" && h2 === "FindTax 계산기에 넣을 때") return {href:"/calculator/증여세#calculator-input",title:"성인·미성년 자녀의 차이를 직접 비교하세요",description:"금액은 만원 단위입니다. 7천만원이면 7000을 입력하고 자녀·미성년 여부를 선택하세요. 과거 증여 합산과 사용한 공제는 자동 정산하지 않습니다.",calculatorType:"gift_tax"};
  return null;
}
