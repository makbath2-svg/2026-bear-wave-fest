/**
 * =================================================================
 * 浪熊 Bear Wave 活動報名系統 - 後端 API (外國人交通選單與 PayPal 發信版)
 * 適用活動：淡水農場暮夏浪熊祭
 * 
 * 試算表欄位順序：
 * A:時間標記 | B:國籍 | C:姓名 | D:Email | E:手機後四碼 | F:交通方式 | G:匯款後五碼 | H:匯款狀態 | I:桌次號碼 | J:歸屬 | K:備註 | L:退出活動
 * =================================================================
 */

// 匯款銀行資訊 (本國人使用 - 備用)
const BANK_INFO = {
  bankName: "臺灣銀行 (004)",
  accountNumber: "224004060158"
};

// 本國人線上繳費連結 (Oen.tw - 主要)
const DOMESTIC_OEN_LINKS = {
  "自行前往": "https://bearwave.oen.tw/payment-url/3F1pokoQUo7gqPBHflB9DksBCJg",
  "西門遊覽車": "https://bearwave.oen.tw/payment-url/3F1q2Z5XsYgN9hMiJoKe8frtoBy",
  "新竹中壢遊覽車": "https://bearwave.oen.tw/payment-url/3F1q90kXFKDaSc6oyoZUeTLmwlU",
  "台中遊覽車": "https://bearwave.oen.tw/payment-url/3F1qEmdTcpG03oZfEt1Bz0A8UXR"
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
      var phone = params.phone ? params.phone.trim() : "";
      var nationality = params.nationality ? params.nationality.trim() : "本國人";
      var transportation = params.transportation ? params.transportation.trim() : "自行前往";

      if (!name || !email || !phone) {
        return toJSON(e, {
          status: "error",
          message: nationality === "外國人"
            ? "Name, Email, and the last 4 digits of your phone number are required!"
            : "姓名、Email 與手機後四碼為必填欄位！"
        });
      }

      // Email 格式驗證
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return toJSON(e, {
          status: "error",
          message: nationality === "外國人"
            ? "Invalid email format!"
            : "Email 格式不正確！"
        });
      }

      var phonePattern = /^\d{4}$/;
      if (!phonePattern.test(phone)) {
        return toJSON(e, {
          status: "error",
          message: nationality === "外國人"
            ? "Invalid phone number format! It must be exactly 4 digits."
            : "手機後四碼格式不正確，須為 4 位數字！"
        });
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
          if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
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
        // A:時間標記 | B:國籍 | C:姓名 | D:Email | E:手機後四碼 | F:交通方式 | G:匯款後五碼 | H:匯款狀態 | I:桌次號碼 | J:歸屬 | K:備註 | L:退出活動
        var rowData = [
          Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss"),
          nationality,
          name,
          email,
          "'" + phone,
          transportation,
          "",
          "未匯款",
          "",
          "",
          "",
          ""
        ];
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);

        // 強制寫入試算表，確保併發請求能讀到最新資料
        SpreadsheetApp.flush();

        // 釋放鎖定
        lock.releaseLock();

        // 取得對應的線上繳費連結（本國人與外國人通用）
        var paymentUrl = DOMESTIC_OEN_LINKS[transportation] || DOMESTIC_OEN_LINKS["自行前往"];

        // 發送通知信
        try {
          if (nationality === "外國人") {
            sendInternationalEmail(name, email, transportation, paymentUrl);
          } else {
            sendDomesticEmail(name, email, transportation, paymentUrl);
          }
        } catch (emailErr) {
          console.error("發信失敗: " + emailErr.toString());
        }

        return toJSON(e, {
          status: "success",
          message: "報名成功！",
          data: { bankInfo: BANK_INFO, paymentUrl: paymentUrl }
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

      // 前端為兩個輸入元件（3位銀行代碼 與 5位帳號後五碼），組合後傳入格式應為 3位-5位（例如：004-12345）
      var digitsPattern = /^\d{3}-\d{5}$/;
      if (!digitsPattern.test(lastFiveDigits)) {
        return toJSON(e, { status: "error", message: "匯款資訊格式不正確，須為：3位銀行代碼-5位帳號後五碼（例如：004-12345）！" });
      }

      var data = sheet.getDataRange().getValues();
      var foundRowIndex = -1;

      for (var i = 1; i < data.length; i++) {
        if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
          foundRowIndex = i + 1; // 轉為 1-indexed 列號
          break;
        }
      }

      if (foundRowIndex === -1) {
        return toJSON(e, { status: "error", message: "找不到此 Email 的報名紀錄！" });
      }

      // 更新匯款資訊與狀態
      sheet.getRange(foundRowIndex, 7).setValue("'" + lastFiveDigits); // Column G: 匯款後五碼
      sheet.getRange(foundRowIndex, 8).setValue("已登記(待對帳)"); // Column H: 匯款狀態

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
        if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
          return toJSON(e, {
            status: "success",
            data: {
              name: data[i][2],
              nationality: data[i][1] || "本國人",
              email: data[i][3],
              phone: data[i][4] ? data[i][4].toString().replace(/^'/, "") : "",
              transportation: data[i][5] || "自行前往",
              lastFiveDigits: data[i][6] ? data[i][6].toString().replace(/^'/, "") : "",
              paymentStatus: data[i][7] || "未匯款",
              tableNumber: data[i][8]
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
function sendInternationalEmail(name, email, transportation, paymentUrl) {
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
      
      <div style="background-color: #fffaf0; border-left: 4px solid #FF7F50; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #FF7F50; font-size: 1.1rem;">💳 Online Payment Instructions</h3>
        <p>Please complete your payment via our online payment system (Oen.tw) using the link below:</p>
        
        <!-- Online Payment Link -->
        <div style="margin: 15px 0;">
          <p style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">Selected transportation: ${isShuttle ? 'Ximen Shuttle Bus (Total: $1250 TWD)' : 'Self-drive (Total: $1000 TWD)'}</p>
          
          <!-- Online Payment Email Warning -->
          <div style="margin: 12px 0; padding: 12px; background-color: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 4px; font-size: 0.95rem; color: #2d3748; line-height: 1.5;">
            <strong style="color: #c53030;">⚠️ CRITICAL STEP FOR AUTOMATIC RECONCILIATION:</strong><br/>
            When checking out on the payment page, you <strong>MUST</strong> enter your registered email address:<br/>
            <span style="font-family: monospace; font-size: 1.1rem; background: #fff; padding: 3px 8px; border: 1px dashed #e53e3e; font-weight: bold; display: inline-block; margin: 6px 0; border-radius: 4px; color: #c53030;">${email}</span><br/>
            Entering the identical email is essential for our system to automatically match and confirm your payment status.
          </div>

          <a href="${paymentUrl}" target="_blank" style="background-color: #FF7F50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 5px; margin-bottom: 10px;">Go to Online Payment</a>
        </div>
      </div>
      
      <p style="font-size: 0.9rem; color: #718096; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        If you have any questions, feel free to contact us at <a href="mailto:ponbosch@gmail.com" style="color: #008B8B; text-decoration: underline;">ponbosch@gmail.com</a>.<br/>
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
function sendDomesticEmail(name, email, transportation, paymentUrl) {
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
      
      <div style="background-color: #fffaf0; border-left: 4px solid #FF7F50; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #FF7F50; font-size: 1.1rem;">💰 繳費指引 (請優先使用線上繳費)</h3>
        
        <!-- 主要付款方式：線上繳費 -->
        <div style="margin-bottom: 20px;">
          <p style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">【主要付款方式】方式一：線上繳費</p>
          <p style="margin-top: 0; font-size: 0.9rem; color: #718096; line-height: 1.4;">這是本次活動的主要付款管道，系統已自動為您產生日後對帳方案：</p>
          <p style="margin: 8px 0; font-size: 0.95rem; color: #FF7F50; font-weight: bold;">您所選的交通方案：${transportation}</p>
          
          <!-- 線上付款 Email 提醒 -->
          <div style="margin: 12px 0; padding: 12px; background-color: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 4px; font-size: 0.9rem; color: #2d3748; line-height: 1.5;">
            <strong style="color: #c53030;">⚠️ 請注意：線上付款介面填寫資料時，請輸入活動報名時的 Email 信箱：</strong><br/>
            <span style="font-family: monospace; font-size: 1.1rem; background: #fff; padding: 3px 8px; border: 1px dashed #e53e3e; font-weight: bold; display: inline-block; margin: 6px 0; border-radius: 4px; color: #c53030;">${email}</span><br/>
            輸入相同的 Email，系統才能自動為您完成核對與銷帳。
          </div>

          <a href="${paymentUrl}" target="_blank" style="background-color: #FF7F50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 5px; margin-bottom: 10px;">點此前往主要線上繳費</a>
        </div>
        
        <!-- 次要付款方式：轉帳匯款 -->
        <div style="border-top: 1px dashed #cbd5e0; padding-top: 15px;">
          <p style="font-weight: bold; margin-bottom: 5px; color: #718096;">【備用付款方式】方式二：自行 ATM 轉帳匯款 (僅限無法使用線上繳費者)</p>
          <p style="margin-top: 0; font-size: 0.9rem; color: #718096; line-height: 1.4;">若您無法進行線上繳費，可選擇轉帳至以下帳戶（*匯款後必須至官網登記後五碼）：</p>
          <div style="background: #ffffff; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 0.95rem; color: #2d3748;">
            <p style="margin: 5px 0;"><strong>銀行名稱：</strong> ${BANK_INFO.bankName}</p>
            <p style="margin: 5px 0;"><strong>銀行帳號：</strong> ${BANK_INFO.accountNumber}</p>
          </div>
          <p style="font-size: 0.9rem; color: #f35a5aff; margin-top: 10px; line-height: 1.6;">
            * 費用說明：<br/>
            自行前往 NT$1,000 / 台中車 NT$1,400 / 新竹中壢車 NT$1,300 / 西門車 NT$1,250
          </p>
        </div>
      </div>
      
      <div style="background-color: #f0fff4; border-left: 4px solid #38a169; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>📝 重要下一步：</strong><br/>
        如果您選擇 <strong>「方式二：自行轉帳匯款」</strong>，匯款完成後請務必至活動報名網頁切換到 <strong>「2. 匯款登記」</strong> 分頁，填寫您的 <strong>匯出銀行代碼</strong> 與 <strong>帳號後五碼</strong>，以利主辦單位進行對帳！<br/>
        如果您選擇 <strong>「方式一：線上繳費」</strong>，則<strong>無須手動登記</strong>，系統會自動在對帳完成後更新狀態！
      </div>
      
      <p style="font-size: 0.9rem; color: #718096; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        如有任何問題，歡迎隨時聯絡信箱：<a href="mailto:ponbosch@gmail.com" style="color: #008B8B; text-decoration: underline;">ponbosch@gmail.com</a> 與我們聯繫。<br/>
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
