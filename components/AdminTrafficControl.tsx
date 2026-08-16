"use client";

import { useEffect, useState } from "react";

export function AdminTrafficControl() {
  const [excluded, setExcluded] = useState(true);

  useEffect(() => {
    const current = localStorage.getItem("_ft_internal") !== "0";
    setExcluded(current);
    localStorage.setItem("_ft_internal", current ? "1" : "0");
  }, []);

  return (
    <button
      type="button"
      title="이 브라우저의 FindTax 방문을 자체 분석과 GA4 이벤트에서 제외합니다."
      onClick={() => {
        const next = !excluded;
        setExcluded(next);
        localStorage.setItem("_ft_internal", next ? "1" : "0");
      }}
      className={`ml-auto shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${excluded ? "border-positive-deep text-positive-deep" : "border-transparent text-ink-muted"}`}
    >
      {excluded ? "내 방문 제외 중" : "내 방문 포함 중"}
    </button>
  );
}
