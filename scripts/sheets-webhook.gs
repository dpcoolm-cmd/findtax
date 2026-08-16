/**
 * FindTax 제출 로그 → Google 스프레드시트 웹훅 (Google Apps Script)
 * -------------------------------------------------------------
 * 역할: findtax.kr의 제출(리드·파트너 신청·문의)을 받아
 *       타입별 시트 탭에 한 줄씩 append하고, 필요 시 알림 메일을 보낸다.
 *
 * ── 설정(1회) ─────────────────────────────────────────────
 * 1) 구글 시트 새로 만들기 → 상단 메뉴 [확장 프로그램] → [Apps Script].
 * 2) 이 파일 내용 전체를 붙여넣기.
 * 3) 아래 CONFIG의 TOKEN을 임의의 긴 문자열로 바꾸고, ALERT_EMAIL을 본인 메일로.
 * 4) [배포] → [새 배포] → 유형 "웹 앱"
 *      - 실행 계정: 나
 *      - 액세스 권한: "모든 사용자"
 *    → 배포 후 나오는 "웹 앱 URL"을 복사.
 * 5) findtax.kr 환경변수에 입력:
 *      SHEETS_WEBHOOK_URL = (4)의 웹 앱 URL
 *      SHEETS_WEBHOOK_TOKEN = (3)의 TOKEN과 동일하게
 * 6) (코드 수정 시) 매번 [배포] → [배포 관리]에서 같은 배포를 "수정"해 새 버전 적용.
 */

var CONFIG = {
  // findtax.kr의 SHEETS_WEBHOOK_TOKEN과 반드시 동일하게.
  TOKEN: "CHANGE-ME-TO-A-LONG-RANDOM-STRING",
  // 파트너 신청 등 alert:true 항목이 들어오면 이 주소로 알림 메일 발송.
  ALERT_EMAIL: "dpcoolm@gmail.com",
};

// 타입별 탭 이름과 열 순서(헤더). data 객체의 키와 맞춘다.
var SCHEMAS = {
  lead: {
    tab: "리드",
    columns: ["timestamp", "leadId", "name", "phone", "email", "sido", "sigungu", "situation", "leadQuality", "message"],
  },
  partner_application: {
    tab: "파트너신청",
    columns: ["timestamp", "name", "office_name", "phone", "email", "address", "plan", "specialties"],
  },
  support: {
    tab: "문의",
    columns: ["timestamp", "type", "email", "subject", "message", "pageUrl", "device"],
  },
};

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (!body || body.token !== CONFIG.TOKEN) {
      return json_({ ok: false, error: "unauthorized" });
    }

    var schema = SCHEMAS[body.type];
    if (!schema) {
      return json_({ ok: false, error: "unknown_type" });
    }

    var data = body.data || {};
    var ts = body.timestamp || new Date().toISOString();

    var sheet = getOrCreateSheet_(schema.tab, schema.columns);
    var row = schema.columns.map(function (key) {
      if (key === "timestamp") return ts;
      var v = data[key];
      return v === undefined || v === null ? "" : v;
    });
    sheet.appendRow(row);

    if (body.alert === true && CONFIG.ALERT_EMAIL) {
      sendAlert_(body.type, schema, data, ts);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getOrCreateSheet_(tabName, columns) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendAlert_(type, schema, data, ts) {
  var lines = schema.columns.map(function (key) {
    if (key === "timestamp") return "시각: " + ts;
    return key + ": " + (data[key] === undefined || data[key] === null ? "" : data[key]);
  });
  var subject = "[FindTax] 새 " + schema.tab + " 접수";
  MailApp.sendEmail(CONFIG.ALERT_EMAIL, subject, lines.join("\n"));
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
