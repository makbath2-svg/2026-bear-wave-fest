/**
 * =================================================================
 * 浪熊 Bear Wave 活動報名系統 - 後端 API (外國人交通選單與 PayPal 發信版)
 * 適用活動：淡水農場暮夏浪熊祭
 * 
 * 試算表欄位順序：
 * A:時間標記 | B:國籍 | C:姓名 | D:Email | E:交通方式 | F:匯款後五碼 | G:匯款狀態 | H:桌次號碼 | I:備註 | J:退出活動
 * =================================================================
 */

// 匯款銀行資訊 (本國人使用)
const BANK_INFO = {
  bankName: "玉山銀行 (808)",
  accountNumber: "0587-976-021630"
};

// 外國人付款連結 (PayPal)
const PAYPAL_LINKS = {
  eventFee: "https://www.paypal.com/ncp/payment/TPQHEXP9JRF4S",     // 活動費 $1000 TWD
  busFee: "https://www.paypal.com/ncp/payment/XLXLAJNBUUJRN"       // 專車費 $250 TWD
};

/**
 * 輔助函式：將資料轉為 JSON 或相容前端的 JSONP 輸出（解決跨網域 CORS 問題）
 */
function toJSON(e, data) {
  var callback = e && e.parameter && e.parameter.callback;
  var jsonString = JSON.stringify(data);

  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonString + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 統一入口：支援 GET 與 POST
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = {};
    if (e && e.parameter && e.parameter.action) {
      params = e.parameter;
    } else if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }

    var action = params.action;
    if (!action) {
      return toJSON(e, { status: "error", message: "錯誤：未提供 action 參數！" });
    }

    // 取得工作表：依序尋找「報名名單」、「工作表1」，若皆無則自動使用第一個分頁
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("報名名單") || ss.getSheetByName("工作表1") || ss.getSheets()[0];
    if (!sheet) {
      return toJSON(e, { status: "error", message: "錯誤：找不到任何工作表分頁！" });
    }

    // 1. 活動報名 Action
    if (action === "register") {
      var name = params.name ? params.name.trim() : "";
      var email = params.email ? params.email.trim() : "";
      var nationality = params.nationality ? params.nationality.trim() : "本國人";
      var transportation = params.transportation ? params.transportation.trim() : "自行前往";

      if (!name || !email) {
        return toJSON(e, { status: "error", message: "姓名與 Email 為必填欄位！" });
      }

      // 使用 LockService 避免多使用者並發寫入時發生衝突
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); // 最多等待 10 秒
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var data = sheet.getDataRange().getValues();
        // 檢查 Email 是否已存在於第 D 欄 (索引 3)
        for (var i = 1; i < data.length; i++) {
          if (data[i][3] && data[i][3].toString().toLowerCase() === email.toLowerCase()) {
            lock.releaseLock();
            return toJSON(e, {
              status: "error",
              message: nationality === "外國人"
                ? "This email has already been registered!"
                : "該 Email 已經報名過囉！"
            });
          }
        }

        // 寫入新報名資料
        // A:時間 | B:國籍 | C:姓名 | D:Email | E:交通方式 | F:匯款後五碼 | G:匯款狀態 | H:桌次 | I:備註 | J:退出
        sheet.appendRow([
          Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss"),
          nationality,
          name,
          email,
          transportation,
          "",
          "未匯款",
          "",
          "",
          ""
        ]);

        // 釋放鎖定
        lock.releaseLock();

        // 發送通知信
        try {
          if (nationality === "外國人") {
            sendInternationalEmail(name, email, transportation);
          } else {
            sendDomesticEmail(name, email, transportation);
          }
        } catch (emailErr) {
          console.error("發信失敗: " + emailErr.toString());
        }

        return toJSON(e, {
          status: "success",
          message: "報名成功！",
          data: { bankInfo: BANK_INFO }
        });

      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "報名寫入失敗：" + innerErr.toString() });
      }
    }

    // 2. 登記匯款後五碼 Action (本國人使用)
    if (action === "submitPayment") {
      var email = params.email ? params.email.trim() : "";
      var lastFiveDigits = params.lastFiveDigits ? params.lastFiveDigits.trim() : "";

      if (!email || !lastFiveDigits) {
        return toJSON(e, { status: "error", message: "Email 與匯款資訊為必填！" });
      }

      var data = sheet.getDataRange().getValues();
      var foundRowIndex = -1;

      for (var i = 1; i < data.length; i++) {
        if (data[i][3] && data[i][3].toString().toLowerCase() === email.toLowerCase()) {
          foundRowIndex = i + 1; // 轉為 1-indexed 列號
          break;
        }
      }

      if (foundRowIndex === -1) {
        return toJSON(e, { status: "error", message: "找不到此 Email 的報名紀錄！" });
      }

      // 更新匯款資訊與狀態
      sheet.getRange(foundRowIndex, 6).setValue(lastFiveDigits); // Column F: 匯款後五碼
      sheet.getRange(foundRowIndex, 7).setValue("已登記(待對帳)"); // Column G: 匯款狀態

      return toJSON(e, { status: "success", message: "匯款登記成功！" });
    }

    // 3. 狀態與座位查詢 Action
    if (action === "queryStatus") {
      var email = params.email ? params.email.trim() : "";
      if (!email) {
        return toJSON(e, { status: "error", message: "請輸入 Email 進行查詢！" });
      }

      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][3] && data[i][3].toString().toLowerCase() === email.toLowerCase()) {
          return toJSON(e, {
            status: "success",
            data: {
              name: data[i][2],
              nationality: data[i][1] || "本國人",
              email: data[i][3],
              transportation: data[i][4] || "自行前往",
              lastFiveDigits: data[i][5],
              paymentStatus: data[i][6] || "未匯款",
              tableNumber: data[i][7]
            }
          });
        }
      }

      return toJSON(e, { status: "error", message: "找不到此 Email 的報名紀錄，請確認輸入是否正確。" });
    }

    return toJSON(e, { status: "error", message: "未知的 action 指令！" });

  } catch (err) {
    return toJSON(e, { status: "error", message: "系統異常：" + err.toString() });
  }
}

/**
 * 發送外籍人士確認信 (包含 PayPal 付款連結)
 */
function sendInternationalEmail(name, email, transportation) {
  var subject = "[Bear Wave] Registration Successful - Tamsui Farm Summer Bear Fest";

  // 判斷是否需要專車車費
  var isShuttle = (transportation === "西門遊覽車" || transportation === "西門交通車(遊覽車)");

  var htmlBody = `
    <div style="font-family: 'Inter', sans-serif; background-color: #fcfcfc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #2d3748; line-height: 1.6;">
      <h2 style="color: #008B8B; border-bottom: 2px solid #87CEFA; padding-bottom: 10px; margin-top: 0;">🐻Bearwave Festival Registration Successful! 🎉</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for registering for the <strong>Tamsui Farm Summer Bear Fest</strong>! We are excited to have you join us.</p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #87CEFA; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #1A4B82; font-size: 1.1rem;">Registration Details</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Nationality:</strong> International</p>
        <p style="margin: 5px 0;"><strong>Transportation:</strong> ${isShuttle ? 'Ximen Shuttle Bus (Round-trip)' : 'Self-drive'}</p>
      </div>
      
      <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #c05621; font-size: 1.1rem;">PayPal Payment Instructions</h3>
        <p>Please complete your payment via PayPal using the links below:</p>
        
        <!-- Event Fee Link (Always required) -->
        <div style="margin: 15px 0;">
          <p style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">1. Event Admission Fee ($1000 TWD):</p>
          <a href="${PAYPAL_LINKS.eventFee}" target="_blank" style="background-color: #0070ba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Pay Event Fee $1000 TWD</a>
        </div>
        
        <!-- Bus Fee Link (Conditional) -->
        ${isShuttle ? `
        <div style="margin: 20px 0 15px 0; border-top: 1px dashed #cbd5e0; padding-top: 15px;">
          <p style="font-weight: bold; margin-bottom: 5px; color: #c05621;">2. Ximen Shuttle Bus Fee ($250 TWD):</p>
          <p style="margin-top: 0; font-size: 0.9rem; color: #718096; line-height: 1.4;">* Since you registered for the Ximen Shuttle Bus, please make sure to complete this payment as well.</p>
          <a href="${PAYPAL_LINKS.busFee}" target="_blank" style="background-color: #0070ba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Pay Bus Fee $250 TWD</a>
        </div>
        ` : `
        <div style="margin: 20px 0 15px 0; border-top: 1px dashed #cbd5e0; padding-top: 15px;">
          <p style="margin: 0; font-size: 0.9rem; color: #4a5568;">* Note: You selected Self-Drive, so you do not need to pay the Bus Fee. Only the Admission Fee is required.</p>
        </div>
        `}
      </div>
      
      <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 0.95rem;">
        <strong>⚠️ CRITICAL STEP FOR PAYMENT VERIFICATION:</strong><br/>
        Before checking out on PayPal, please <strong>copy your registered email address</strong>:<br/>
        <span style="font-family: monospace; font-size: 1.1rem; background: #fff; padding: 3px 8px; border: 1px dashed #e53e3e; font-weight: bold; display: inline-block; margin: 8px 0; border-radius: 4px;">${email}</span><br/>
        and paste it directly into the <strong>"請填寫您的email"</strong> input box on the PayPal checkout screen. This is crucial for verifying and matching your payment status.
      </div>
      
      <p style="font-size: 0.9rem; color: #718096; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        If you have any questions, feel free to contact us at <a href="mailto:dreamwaver0706@gmail.com" style="color: #008B8B; text-decoration: underline;">dreamwaver0706@gmail.com</a>.<br/>
        &copy; 2026 浪熊 Bear Wave. All rights reserved.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * 發送本國人士確認信 (包含銀行匯款指引)
 */
function sendDomesticEmail(name, email, transportation) {
  var subject = "【浪熊 Bear Wave】報名成功通知 - 淡水農場暮夏浪熊祭";

  var htmlBody = `
    <div style="font-family: 'Microsoft JhengHei', sans-serif; background-color: #fcfcfc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #2d3748; line-height: 1.6;">
      <h2 style="color: #008B8B; border-bottom: 2px solid #87CEFA; padding-bottom: 10px; margin-top: 0;">🎉 報名成功通知</h2>
      <p>親愛的 <strong>${name}</strong> 您好：</p>
      <p>感謝您報名 <strong>淡水農場暮夏浪熊祭</strong>！我們已收到您的報名資料。</p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #87CEFA; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #1A4B82; font-size: 1.1rem;">您的報名資訊</h3>
        <p style="margin: 5px 0;"><strong>暱稱：</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>國籍：</strong> 本國人</p>
        <p style="margin: 5px 0;"><strong>交通方式：</strong> ${transportation}</p>
      </div>
      
      <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #c05621; font-size: 1.1rem;">匯款繳費指引</h3>
        <p>請將活動費用匯款至以下帳戶：</p>
        <div style="background: #ffffff; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 0.95rem; color: #2d3748;">
          <p style="margin: 5px 0;"><strong>銀行名稱：</strong> ${BANK_INFO.bankName}</p>
          <p style="margin: 5px 0;"><strong>銀行帳號：</strong> ${BANK_INFO.accountNumber}</p>
        </div>
        <p style="font-size: 0.9rem; color: #718096; margin-top: 10px;">
          * 費用說明：自行前往 NT$1,000 / 台中車 NT$1,400 / 新竹車 NT$1,300 / 西門車 NT$1,250
        </p>
      </div>
      
      <div style="background-color: #f0fff4; border-left: 4px solid #38a169; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>📝 重要下一步：</strong><br/>
        匯款完成後，請務必至活動報名網頁切換到 <strong>「2. 匯款登記」</strong> 分頁，填寫您的 <strong>匯出銀行代碼</strong> 與 <strong>帳號後五碼</strong>，以利主辦單位進行對帳！
      </div>
      
      <p style="font-size: 0.9rem; color: #718096; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        如有任何問題，歡迎隨時聯絡信箱：<a href="mailto:dreamwaver0706@gmail.com" style="color: #008B8B; text-decoration: underline;">dreamwaver0706@gmail.com</a> 與我們聯繫。<br/>
        &copy; 2026 浪熊 Bear Wave. All rights reserved.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}
