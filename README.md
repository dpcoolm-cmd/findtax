# FindTax

세금 계산기로 먼저 판단하고, 필요할 때 지역 세무사에게 연결하는 서비스.
운영 중: **https://findtax.kr**

## 무엇을 하는 서비스인가

세무 상담의 어려움은 "세무사를 못 찾는 것"보다 **무엇을 물어봐야 할지 모르는 것**에 있다.
FindTax는 순서를 뒤집는다.

1. **계산** — 양도세·종합소득세·상속증여·기장료 등 11종 계산기로 예상 세액을 먼저 확인
2. **판단** — 결과 구간별로 "이 구간에서 흔히 놓치는 것"을 제시
3. **연결** — 계산 내용이 자동으로 채워진 상태로 지역 세무사에게 상담 요청

## 기술 스택

- **Next.js 15** (App Router, SSG + ISR)
- **Supabase** (Postgres, RLS, SECURITY DEFINER RPC)
- **Vercel** (호스팅·자동 배포)
- **Resend** (상담 접수 알림)

## 구조

```
app/                  라우트 (계산기·지역·상황별 가이드·블로그·상담)
components/
  calculators/        세목별 계산기 UI
lib/
  calculators/        세액 계산 로직
  blog/               블로그 콘텐츠 (파트별 분리, 최신 우선 병합)
  seo/                메타데이터·구조화 데이터·내부 링크 자동 생성
supabase/migrations/  스키마 및 RPC
docs/                 운영 문서
```

### 데이터 접근 원칙

`leads`, `partner_applications` 등 민감 테이블은 RLS로 anon 접근을 막고,
검증을 마친 서버 라우트가 `SECURITY DEFINER` RPC를 통해서만 기록한다.
공개 디렉터리에 노출되는 파트너 정보도 화이트리스트 컬럼만 반환하는 RPC를 거친다.

## 블로그 자동 발행

매주 수·토요일에 세무 시즌 이슈를 리서치해 글을 추가하는 자동화가 동작한다.
작성 기준은 [docs/blog-automation-playbook.md](docs/blog-automation-playbook.md) 참고.

핵심 원칙: 1차 출처(국세청·기획재정부)로 확인한 내용만 쓰고,
국회 통과 전 개정안은 확정된 것처럼 서술하지 않는다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## 면책

계산기 결과는 참고용 간이 추정이며 확정 세액이 아니다.
실제 신고는 세무사 검토와 해당 시점의 세법 적용이 필요하다.
