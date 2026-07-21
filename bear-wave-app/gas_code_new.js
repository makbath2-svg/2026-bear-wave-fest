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

    // 0. 取得功能旗標 Action
    if (action === "getFeatureFlags") {
      var flagSheet = getFeatureFlagsSheet(ss);
      var flagData = flagSheet.getDataRange().getValues();
      var flags = {};
      for (var i = 1; i < flagData.length; i++) {
        var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
        var flagValue = flagData[i][1] ? flagData[i][1].toString().trim() : "";
        if (flagName) {
          flags[flagName] = flagValue;
        }
      }
      return toJSON(e, { status: "success", flags: flags });
    }

    // 1. 活動報名 Action
    if (action === "register") {
      var name = params.name ? params.name.trim() : "";
      var email = params.email ? params.email.trim() : "";
      var phone = params.phone ? params.phone.trim() : "";
      var nationality = params.nationality ? params.nationality.trim() : "本國人";
      var transportation = params.transportation ? params.transportation.trim() : "自行前往";

      // 檢查活動報名是否停止旗標
      var flagSheet = getFeatureFlagsSheet(ss);
      var flagData = flagSheet.getDataRange().getValues();
      var regStopped = false;
      for (var i = 1; i < flagData.length; i++) {
        var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
        var flagValue = flagData[i][1] ? flagData[i][1].toString().trim().toUpperCase() : "";
        if (flagName === "活動報名-停止" && flagValue === "ON") {
          regStopped = true;
          break;
        }
      }
      if (regStopped) {
        return toJSON(e, {
          status: "error",
          message: nationality === "外國人"
            ? "Due to enthusiastic response and high demand, registration is temporarily paused while we coordinate related arrangements. Friends who have not yet completed registration are kindly invited to register after August 1st. We apologize for any inconvenience and thank you for your support and patience!"
            : "因目前報名人數踴躍，我們將暫時停止受理報名，並積極協調相關安排。尚未完成報名的朋友，敬請於 8 月 1 日後再行報名。造成不便，敬請見諒，也感謝大家的支持與耐心等候！"
        });
      }

      // 檢查西門遊覽車滿額停售旗標
      if (transportation === "西門遊覽車") {
        var flagSheet = getFeatureFlagsSheet(ss);
        var flagData = flagSheet.getDataRange().getValues();
        var ximenBusSoldOut = false;
        for (var i = 1; i < flagData.length; i++) {
          var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
          var flagValue = flagData[i][1] ? flagData[i][1].toString().trim().toUpperCase() : "";
          if (flagName === "西門遊覽車滿額停售" && flagValue === "ON") {
            ximenBusSoldOut = true;
            break;
          }
        }
        if (ximenBusSoldOut) {
          return toJSON(e, {
            status: "error",
            message: nationality === "外國人"
              ? "Ximen Tour Bus is fully booked and sold out!"
              : "西門出發遊覽車已額滿停售！"
          });
        }
      }

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
              tableNumber: data[i][8],
              tableNickname: data[i][9] || ""
            }
          });
        }
      }

      return toJSON(e, { status: "error", message: "找不到此 Email 的報名紀錄，請確認輸入是否正確。" });
    }

    // 4. 上車檢查 Action
    if (action === "checkBoarding") {
      var email = params.email ? params.email.trim() : "";
      if (!email) {
        return toJSON(e, { status: "error", message: "請輸入 Email！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); // 最多等待 10 秒
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var data = sheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var name = "";
        var transportation = "";
        var paymentStatus = "";
        var withdrawalStatus = "";
        var currentBoardingStatus = "";

        for (var i = 1; i < data.length; i++) {
          if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
            foundRowIndex = i + 1; // 轉為 1-indexed 列號
            name = data[i][2];
            transportation = data[i][5] || "自行前往";
            paymentStatus = data[i][7] ? data[i][7].toString().trim() : "";
            withdrawalStatus = data[i][11] ? data[i][11].toString().trim() : "";
            currentBoardingStatus = data[i][12] ? data[i][12].toString().trim() : "";
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "查無此報名" });
        }

        // 檢查是否已退出活動 (Column L)
        if (withdrawalStatus) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "此人已辦理退款/退出活動，無法核銷上車！" });
        }

        // 檢查付款狀態 (Column H)
        var isPaid = (paymentStatus.indexOf("已確認") > -1 || paymentStatus.indexOf("已完成") > -1);
        if (!isPaid) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "此人尚未完成對帳付款，無法核銷上車！" });
        }

        // 檢查是否已經上車過
        if (currentBoardingStatus === "已上車") {
          lock.releaseLock();
          return toJSON(e, { status: "warning", name: name, message: "此人先前已核銷上車囉！" });
        }

        // 交通方式如果為 自行前往
        if (transportation === "自行前往") {
          lock.releaseLock();
          return toJSON(e, { status: "warning", name: name, message: "此人為自行前往，不需上車！" });
        }

        // 寫入上車狀態：M 欄 (第 13 欄)
        sheet.getRange(foundRowIndex, 13).setValue("已上車");
        SpreadsheetApp.flush();
        lock.releaseLock();

        return toJSON(e, { status: "success", name: name, message: "上車成功" });

      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "寫入失敗：" + innerErr.toString() });
      }
    }

    // 5. 入場檢查 Action
    if (action === "checkAdmission") {
      var email = params.email ? params.email.trim() : "";
      if (!email) {
        return toJSON(e, { status: "error", message: "請輸入 Email！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); // 最多等待 10 秒
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var data = sheet.getDataRange().getValues();
        var name = "";
        var paymentStatus = "";
        var withdrawalStatus = "";
        var currentAdmissionStatus = "";

        for (var i = 1; i < data.length; i++) {
          if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
            foundRowIndex = i + 1; // 轉為 1-indexed 列號
            name = data[i][2];
            paymentStatus = data[i][7] ? data[i][7].toString().trim() : "";
            withdrawalStatus = data[i][11] ? data[i][11].toString().trim() : "";
            currentAdmissionStatus = data[i][13] ? data[i][13].toString().trim() : "";
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "查無此報名" });
        }

        // 檢查是否已退出活動 (Column L)
        if (withdrawalStatus) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "此人已辦理退款/退出活動，無法核銷入場！" });
        }

        // 檢查付款狀態 (Column H)
        var isPaid = (paymentStatus.indexOf("已確認") > -1 || paymentStatus.indexOf("已完成") > -1);
        if (!isPaid) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "此人尚未完成對帳付款，無法核銷入場！" });
        }

        // 檢查是否已經入場過
        if (currentAdmissionStatus === "已入場") {
          lock.releaseLock();
          return toJSON(e, { status: "warning", name: name, message: "此人先前已核銷入場囉！" });
        }

        // 寫入入場狀態：N 欄 (第 14 欄)
        sheet.getRange(foundRowIndex, 14).setValue("已入場");
        SpreadsheetApp.flush();
        lock.releaseLock();

        return toJSON(e, { status: "success", name: name, message: "入場成功" });

      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "寫入失敗：" + innerErr.toString() });
      }
    }

    // 6. 批次發送新付款的 QR Code
    if (action === "sendBulkQRCodes") {
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var data = sheet.getDataRange().getValues();
        var sentCount = 0;
        var pendingRows = [];

        // 1. 篩選符合條件的行數 (H欄為 已完成核對，且 O欄「QR寄送」為 空)
        // A(0), B(1), C(2), D(3), E(4), F(5), G(6), H(7), I(8), J(9), K(10), L(11), M(12), N(13), O(14)
        for (var i = 1; i < data.length; i++) {
          var paymentStatus = data[i][7] ? data[i][7].toString().trim() : "";
          var qrStatus = data[i][14] ? data[i][14].toString().trim() : "";
          var email = data[i][3] ? data[i][3].toString().trim() : "";

          if (email && paymentStatus.indexOf("已完成") > -1 && !qrStatus) {
            pendingRows.push({
              rowIndex: i + 1, // 1-indexed for getRange
              name: data[i][2],
              email: email,
              transportation: data[i][5] || "自行前往"
            });
          }
        }

        if (pendingRows.length === 0) {
          lock.releaseLock();
          return toJSON(e, { status: "success", count: 0, message: "目前沒有需要發送的全新付款名單！" });
        }

        // 2. 逐一寄送信件，並檢查 Google 每日額度
        for (var k = 0; k < pendingRows.length; k++) {
          var remainingQuota = MailApp.getRemainingDailyQuota();
          if (remainingQuota <= 0) {
            lock.releaseLock();
            return toJSON(e, {
              status: "warning",
              count: sentCount,
              message: "今日發信配額（100封）已達上限！已成功發送 " + sentCount + " 封。請明日再次執行。"
            });
          }

          var person = pendingRows[k];

          // 寄出 HTML 信件
          var htmlBody = buildQRCodeEmailBody(person.name, person.email, person.transportation);
          MailApp.sendEmail({
            to: person.email,
            subject: "【浪熊 Bear Wave】您的活動入場票券 QR Code / Your Event Ticket QR Code",
            htmlBody: htmlBody
          });

          // 更新 O 欄 (第 15 欄) 為 已發送
          sheet.getRange(person.rowIndex, 15).setValue("已發送");
          SpreadsheetApp.flush();
          sentCount++;
        }

        lock.releaseLock();
        return toJSON(e, { status: "success", count: sentCount, message: "成功批次發送 " + sentCount + " 封 QR Code 信件！" });

      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "批次發送失敗：" + innerErr.toString() });
      }
    }

    // 7. 強制補發單一 Email 的 QR Code
    if (action === "sendSingleQRCode") {
      var email = params.email ? params.email.trim() : "";
      if (!email) {
        return toJSON(e, { status: "error", message: "請輸入 Email 地址！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var data = sheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var name = "";
        var transportation = "";

        for (var i = 1; i < data.length; i++) {
          if (data[i][3] && data[i][3].toString().trim().toLowerCase() === email.toLowerCase()) {
            foundRowIndex = i + 1; // 1-indexed 列號
            name = data[i][2];
            transportation = data[i][5] || "自行前往";
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "查無此報名，請確認 Email 是否正確！" });
        }

        // 檢查 Google 每日額度
        var remainingQuota = MailApp.getRemainingDailyQuota();
        if (remainingQuota <= 0) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "今日 Google 發信配額已滿，無法補發。請明日重試！" });
        }

        // 強制發信
        var htmlBody = buildQRCodeEmailBody(name, email, transportation);
        MailApp.sendEmail({
          to: email,
          subject: "【浪熊 Bear Wave】您的活動入場票券 QR Code / Your Event Ticket QR Code",
          htmlBody: htmlBody
        });

        // 標記 O 欄 (第 15 欄) 為 已發送
        sheet.getRange(foundRowIndex, 15).setValue("已發送");
        SpreadsheetApp.flush();
        lock.releaseLock();

        return toJSON(e, { status: "success", name: name, message: "已成功補發 QR Code 信件給 " + name + " (" + email + ")！" });

      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "補發失敗：" + innerErr.toString() });
      }
    }

    // ==========================================
    // 桌位管理與分桌 API 元件
    // ==========================================

    // 取得或自動建立分桌資料分頁
    function getTableSheet(ss) {
      var s = ss.getSheetByName("分桌資料");
      if (!s) {
        s = ss.insertSheet("分桌資料");
        var headers = ["桌位ID", "桌暱稱", "修改密碼", "人員1 Email", "人員2 Email", "人員3 Email", "人員4 Email", "人員5 Email", "人員6 Email", "人員7 Email", "人員8 Email", "人員9 Email", "人員10 Email"];
        s.getRange(1, 1, 1, headers.length).setValues([headers]);
        // 預設建立 30 桌
        var rows = [];
        for (var idx = 1; idx <= 30; idx++) {
          rows.push([idx.toString(), "", "", "", "", "", "", "", "", "", "", "", ""]);
        }
        s.getRange(2, 1, rows.length, headers.length).setValues(rows);
        SpreadsheetApp.flush();
      }
      return s;
    }

    // 新增：獲取已付款且尚未被分配桌位的所有學員名單，供前端快速選取
    if (action === "getPaidUnassignedMembers") {
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
        var tableSheet = getTableSheet(ss);

        // 1. 蒐集已經被分配到桌位的人的 Email (轉小寫)
        var assignedEmails = {};
        var tableData = tableSheet.getDataRange().getValues();
        for (var i = 1; i < tableData.length; i++) {
          for (var col = 3; col <= 12; col++) { // D到M欄 (人員1到10)
            var mEmail = tableData[i][col];
            if (mEmail) {
              assignedEmails[mEmail.toString().trim().toLowerCase()] = true;
            }
          }
        }

        // 2. 撈取報名名單中所有「已完成繳費」且「未退出」且「尚未分桌」的人
        var regData = sheet.getDataRange().getValues();
        var list = [];
        for (var i = 1; i < regData.length; i++) {
          var regEmail = regData[i][3] ? regData[i][3].toString().trim() : "";
          var regPhone = regData[i][4] ? regData[i][4].toString().trim() : ""; // E欄：手機後四碼
          var regName = regData[i][2] ? regData[i][2].toString().trim() : "";  // C欄：姓名
          var paymentStatus = regData[i][7] ? regData[i][7].toString().trim() : ""; // H欄：付款狀態
          var withdrawalStatus = regData[i][11] ? regData[i][11].toString().trim() : ""; // L欄：退出活動

          if (!regEmail || !regName) continue;

          var isPaid = (paymentStatus.indexOf("已完成") > -1 || paymentStatus.indexOf("已確認") > -1);
          var isWithdrawn = !!withdrawalStatus;
          var isAssigned = !!assignedEmails[regEmail.toLowerCase()];

          if (isPaid && !isWithdrawn && !isAssigned) {
            list.push({
              name: regName,
              email: regEmail,
              phoneLast4: regPhone
            });
          }
        }

        lock.releaseLock();
        return toJSON(e, { status: "success", members: list });
      } catch (err) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "讀取名單失敗：" + err.toString() });
      }
    }

    // A. 讀取所有桌位列表
    if (action === "getTableList") {
      var tableSheet = getTableSheet(ss);
      var tableData = tableSheet.getDataRange().getValues();
      var tables = [];
      for (var i = 1; i < tableData.length; i++) {
        var row = tableData[i];
        var tableId = row[0] ? row[0].toString().trim() : "";
        if (!tableId) continue;

        var nickname = row[1] ? row[1].toString().trim() : "";

        var memberCount = 0;
        for (var j = 3; j <= 12; j++) {
          if (row[j] && row[j].toString().trim()) {
            memberCount++;
          }
        }
        tables.push({
          id: tableId,
          nickname: nickname,
          memberCount: memberCount
        });
      }
      return toJSON(e, { status: "success", tables: tables });
    }

    // B. 查詢單一報名成員 (輸入 Email 與電話，驗證已付款，驗證未被其他桌佔用)
    if (action === "verifyMember") {
      var email = params.email ? params.email.trim() : "";
      var phone = params.phone ? params.phone.trim() : "";
      var currentTableId = params.currentTableId ? params.currentTableId.toString().trim() : "";

      if (!email || !phone) {
        return toJSON(e, { status: "error", message: "請輸入 Email 與手機後四碼！" });
      }

      var regData = sheet.getDataRange().getValues();
      var foundUser = null;
      for (var i = 1; i < regData.length; i++) {
        var regEmail = regData[i][3] ? regData[i][3].toString().trim().toLowerCase() : "";
        var regPhone = regData[i][4] ? regData[i][4].toString().replace(/^'/, "").trim() : "";
        if (regEmail === email.toLowerCase() && regPhone === phone) {
          foundUser = {
            name: regData[i][2] ? regData[i][2].toString().trim() : "",
            paymentStatus: regData[i][7] ? regData[i][7].toString().trim() : ""
          };
          break;
        }
      }

      if (!foundUser) {
        return toJSON(e, { status: "error", message: "查無此報名資料，請確認輸入是否正確。" });
      }

      var isPaid = (foundUser.paymentStatus.indexOf("已確認") > -1 || foundUser.paymentStatus.indexOf("已完成") > -1);
      if (!isPaid) {
        return toJSON(e, { status: "error", message: "此報名尚未完成對帳/付款，無法加入分桌。" });
      }

      var tableSheet = getTableSheet(ss);
      var tableData = tableSheet.getDataRange().getValues();
      for (var i = 1; i < tableData.length; i++) {
        var tableId = tableData[i][0] ? tableData[i][0].toString().trim() : "";
        if (tableId === currentTableId) continue;
        for (var j = 3; j <= 12; j++) {
          if (tableData[i][j] && tableData[i][j].toString().trim().toLowerCase() === email.toLowerCase()) {
            return toJSON(e, { status: "error", message: "此人已被分配在第 " + tableId + " 桌 (" + (tableData[i][1] || (tableId + "桌")) + ")，不可重複加入！" });
          }
        }
      }
      return toJSON(e, { status: "success", name: foundUser.name });
    }

    // 新增：批次查詢報名成員 (輸入一個 JSON 陣列，回傳每個成員的驗證結果，免除多次連線造成的擁塞)
    if (action === "verifyBatchMembers") {
      var batchJson = params.batch ? params.batch.trim() : "";
      var currentTableId = params.currentTableId ? params.currentTableId.toString().trim() : "";

      if (!batchJson) {
        return toJSON(e, { status: "error", message: "缺乏批次參數！" });
      }

      var queries = [];
      try {
        queries = JSON.parse(batchJson);
      } catch (err) {
        return toJSON(e, { status: "error", message: "參數 JSON 格式錯誤！" });
      }

      var regData = sheet.getDataRange().getValues();
      var tableSheet = getTableSheet(ss);
      var tableData = tableSheet.getDataRange().getValues();

      var results = [];

      for (var q = 0; q < queries.length; q++) {
        var qIdx = queries[q].index;
        var email = queries[q].email ? queries[q].email.trim() : "";
        var phone = queries[q].phone ? queries[q].phone.trim() : "";

        if (!email || !phone) {
          results.push({ index: qIdx, status: "error", message: "Email或手機未填" });
          continue;
        }

        var foundUser = null;
        for (var i = 1; i < regData.length; i++) {
          var regEmail = regData[i][3] ? regData[i][3].toString().trim().toLowerCase() : "";
          var regPhone = regData[i][4] ? regData[i][4].toString().replace(/^'/, "").trim() : "";
          if (regEmail === email.toLowerCase() && regPhone === phone) {
            foundUser = {
              name: regData[i][2] ? regData[i][2].toString().trim() : "",
              paymentStatus: regData[i][7] ? regData[i][7].toString().trim() : ""
            };
            break;
          }
        }

        if (!foundUser) {
          results.push({ index: qIdx, status: "error", message: "查無此報名資料" });
          continue;
        }

        var isPaid = (foundUser.paymentStatus.indexOf("已確認") > -1 || foundUser.paymentStatus.indexOf("已完成") > -1);
        if (!isPaid) {
          results.push({ index: qIdx, status: "error", message: "此報名尚未完成對帳/付款" });
          continue;
        }

        // 檢查是否被其他桌佔用
        var isAssigned = false;
        var assignedMsg = "";
        for (var i = 1; i < tableData.length; i++) {
          var tableId = tableData[i][0] ? tableData[i][0].toString().trim() : "";
          if (tableId === currentTableId) continue;
          for (var j = 3; j <= 12; j++) {
            if (tableData[i][j] && tableData[i][j].toString().trim().toLowerCase() === email.toLowerCase()) {
              isAssigned = true;
              assignedMsg = "此人已被分配在第 " + tableId + " 桌 (" + (tableData[i][1] || (tableId + "桌")) + ")";
              break;
            }
          }
          if (isAssigned) break;
        }

        if (isAssigned) {
          results.push({ index: qIdx, status: "error", message: assignedMsg });
          continue;
        }

        results.push({ index: qIdx, status: "success", name: foundUser.name });
      }

      return toJSON(e, { status: "success", results: results });
    }

    // C. 驗證密碼載入桌位資料
    if (action === "verifyTablePassword") {
      var tableId = params.tableId ? params.tableId.toString().trim() : "";
      var password = params.password ? params.password.trim() : "";
      if (!tableId || !password) {
        return toJSON(e, { status: "error", message: "請提供桌位 ID 與密碼！" });
      }

      var tableSheet = getTableSheet(ss);
      var tableData = tableSheet.getDataRange().getValues();
      var foundRow = null;
      for (var i = 1; i < tableData.length; i++) {
        if (tableData[i][0] && tableData[i][0].toString().trim() === tableId) {
          foundRow = tableData[i];
          break;
        }
      }

      if (!foundRow) {
        return toJSON(e, { status: "error", message: "找不到此桌位 ID，請確認是否輸入正確。" });
      }

      var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
      if (!verifyPassword(password, dbPassword)) {
        return toJSON(e, { status: "error", message: "密碼不正確，請重新輸入。" });
      }

      var nickname = foundRow[1] ? foundRow[1].toString().trim() : "";
      var regData = sheet.getDataRange().getValues();
      var members = [];
      for (var j = 3; j <= 12; j++) {
        var emailStr = foundRow[j] ? foundRow[j].toString().trim() : "";
        if (!emailStr) {
          members.push({ email: "", phone: "", name: "" });
          continue;
        }
        var memberName = "";
        var memberPhone = "";
        for (var k = 1; k < regData.length; k++) {
          if (regData[k][3] && regData[k][3].toString().trim().toLowerCase() === emailStr.toLowerCase()) {
            memberName = regData[k][2] ? regData[k][2].toString().trim() : "";
            memberPhone = regData[k][4] ? regData[k][4].toString().replace(/^'/, "").trim() : "";
            break;
          }
        }
        members.push({ email: emailStr, phone: memberPhone, name: memberName });
      }
      return toJSON(e, { status: "success", data: { tableId: tableId, nickname: nickname, members: members } });
    }

    // D. 修改單人欄位 (即時更新)
    if (action === "updateTableMember") {
      var tableId = params.tableId ? params.tableId.toString().trim() : "";
      var password = params.password ? params.password.trim() : "";
      var memberIndex = params.memberIndex ? parseInt(params.memberIndex, 10) : -1;
      var email = params.email ? params.email.trim() : "";
      var phone = params.phone ? params.phone.trim() : "";

      if (!tableId || !password || memberIndex < 1 || memberIndex > 10) {
        return toJSON(e, { status: "error", message: "參數錯誤！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var tableSheet = getTableSheet(ss);
        var tableData = tableSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < tableData.length; i++) {
          if (tableData[i][0] && tableData[i][0].toString().trim() === tableId) {
            foundRowIndex = i + 1;
            foundRow = tableData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此桌位 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，修改遭拒絕。" });
        }

        var tableNickname = foundRow[1] ? foundRow[1].toString().trim() : (tableId + "桌");
        var oldEmail = foundRow[3 + memberIndex - 1] ? foundRow[3 + memberIndex - 1].toString().trim() : "";
        var isRemoving = (!email);
        var memberName = "";

        if (!isRemoving) {
          var regData = sheet.getDataRange().getValues();
          var regFound = null;
          for (var k = 1; k < regData.length; k++) {
            var regEmail = regData[k][3] ? regData[k][3].toString().trim().toLowerCase() : "";
            var regPhone = regData[k][4] ? regData[k][4].toString().replace(/^'/, "").trim() : "";
            if (regEmail === email.toLowerCase() && regPhone === phone) {
              regFound = {
                name: regData[k][2] ? regData[k][2].toString().trim() : "",
                paymentStatus: regData[k][7] ? regData[k][7].toString().trim() : ""
              };
              break;
            }
          }
          if (!regFound) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "新成員的 Email 或手機後四碼不正確，請確認已完成報名。" });
          }

          if (email.toLowerCase() !== oldEmail.toLowerCase()) {
            var isPaid = (regFound.paymentStatus.indexOf("已確認") > -1 || regFound.paymentStatus.indexOf("已完成") > -1);
            if (!isPaid) {
              lock.releaseLock();
              return toJSON(e, { status: "error", message: "新成員尚未完成對帳付款，無法加入分桌。" });
            }
            for (var r = 1; r < tableData.length; r++) {
              var tId = tableData[r][0] ? tableData[r][0].toString().trim() : "";
              if (tId === tableId) {
                for (var c = 3; c <= 12; c++) {
                  if (c === (3 + memberIndex - 1)) continue;
                  if (tableData[r][c] && tableData[r][c].toString().trim().toLowerCase() === email.toLowerCase()) {
                    lock.releaseLock();
                    return toJSON(e, { status: "error", message: "此人已被填寫在此桌其他位置，同桌成員不可重複！" });
                  }
                }
              } else {
                for (var c = 3; c <= 12; c++) {
                  if (tableData[r][c] && tableData[r][c].toString().trim().toLowerCase() === email.toLowerCase()) {
                    lock.releaseLock();
                    return toJSON(e, { status: "error", message: "此人已被分配在第 " + tId + " 桌 (" + (tableData[r][1] || (tId + "桌")) + ")，不可重複加入！" });
                  }
                }
              }
            }
          }
          memberName = regFound.name;
        }

        if (oldEmail) {
          var regData = sheet.getDataRange().getValues();
          for (var k = 1; k < regData.length; k++) {
            if (regData[k][3] && regData[k][3].toString().trim().toLowerCase() === oldEmail.toLowerCase()) {
              sheet.getRange(k + 1, 9).setValue("");
              sheet.getRange(k + 1, 10).setValue("");
              break;
            }
          }
        }

        var colIndex = 3 + memberIndex;
        tableSheet.getRange(foundRowIndex, colIndex).setValue(isRemoving ? "" : email);

        if (!isRemoving) {
          var regData = sheet.getDataRange().getValues();
          for (var k = 1; k < regData.length; k++) {
            if (regData[k][3] && regData[k][3].toString().trim().toLowerCase() === email.toLowerCase()) {
              sheet.getRange(k + 1, 9).setValue("'" + tableId);
              sheet.getRange(k + 1, 10).setValue("'" + tableNickname);
              break;
            }
          }
        }

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: isRemoving ? "人員已成功移出空位！" : "人員修改成功！", name: memberName });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "更新分桌人員失敗：" + innerErr.toString() });
      }
    }

    // E. 修改桌暱稱與密碼
    if (action === "updateTableInfo") {
      var tableId = params.tableId ? params.tableId.toString().trim() : "";
      var password = params.password ? params.password.trim() : "";
      var newNickname = params.newNickname ? params.newNickname.trim() : "";
      var newPassword = params.newPassword ? params.newPassword.trim() : "";

      if (!tableId || !password || !newNickname || !newPassword) {
        return toJSON(e, { status: "error", message: "請輸入暱稱與密碼！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var tableSheet = getTableSheet(ss);
        var tableData = tableSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < tableData.length; i++) {
          if (tableData[i][0] && tableData[i][0].toString().trim() === tableId) {
            foundRowIndex = i + 1;
            foundRow = tableData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此桌位 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，修改遭拒絕。" });
        }

        var hashedNewPassword = hashPassword(newPassword);
        tableSheet.getRange(foundRowIndex, 2).setValue("'" + newNickname);
        tableSheet.getRange(foundRowIndex, 3).setValue("'" + hashedNewPassword);

        var memberEmails = [];
        for (var j = 3; j <= 12; j++) {
          if (foundRow[j] && foundRow[j].toString().trim()) {
            memberEmails.push(foundRow[j].toString().trim().toLowerCase());
          }
        }

        if (memberEmails.length > 0) {
          var regData = sheet.getDataRange().getValues();
          for (var k = 1; k < regData.length; k++) {
            var regEmail = regData[k][3] ? regData[k][3].toString().trim().toLowerCase() : "";
            if (regEmail && memberEmails.indexOf(regEmail) > -1) {
              sheet.getRange(k + 1, 10).setValue("'" + newNickname);
            }
          }
        }

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "桌位名稱與密碼修改成功！" });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "修改桌位資料失敗：" + innerErr.toString() });
      }
    }

    // F. 解散桌位
    if (action === "disbandTable") {
      var tableId = params.tableId ? params.tableId.toString().trim() : "";
      var password = params.password ? params.password.trim() : "";
      if (!tableId || !password) {
        return toJSON(e, { status: "error", message: "參數錯誤！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var tableSheet = getTableSheet(ss);
        var tableData = tableSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < tableData.length; i++) {
          if (tableData[i][0] && tableData[i][0].toString().trim() === tableId) {
            foundRowIndex = i + 1;
            foundRow = tableData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此桌位 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，解散遭拒絕。" });
        }

        var emailsToClear = [];
        for (var j = 3; j <= 12; j++) {
          if (foundRow[j] && foundRow[j].toString().trim()) {
            emailsToClear.push(foundRow[j].toString().trim().toLowerCase());
          }
        }

        if (emailsToClear.length > 0) {
          var regData = sheet.getDataRange().getValues();
          for (var k = 1; k < regData.length; k++) {
            var regEmail = regData[k][3] ? regData[k][3].toString().trim().toLowerCase() : "";
            if (regEmail && emailsToClear.indexOf(regEmail) > -1) {
              sheet.getRange(k + 1, 9).setValue("");
              sheet.getRange(k + 1, 10).setValue("");
            }
          }
        }

        var clearedRow = [tableId, "", "", "", "", "", "", "", "", "", "", "", ""];
        tableSheet.getRange(foundRowIndex, 1, 1, clearedRow.length).setValues([clearedRow]);

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "桌位已成功解散且清空！" });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "解散桌位失敗：" + innerErr.toString() });
      }
    }

    // G. 建立全新桌位 (一次寫入 10 人)
    if (action === "saveTable") {
      var tableId = params.tableId ? params.tableId.toString().trim() : "";
      var nickname = params.nickname ? params.nickname.trim() : "";
      var password = params.password ? params.password.trim() : "";
      var membersStr = params.members ? params.members : "";

      if (!tableId || !nickname || !password || !membersStr) {
        return toJSON(e, { status: "error", message: "參數缺少！" });
      }

      var members = [];
      try {
        members = JSON.parse(membersStr);
      } catch (err) {
        return toJSON(e, { status: "error", message: "成員資料解析錯誤！" });
      }

      if (members.length !== 10) {
        return toJSON(e, { status: "error", message: "分桌必須包含剛好 10 位成員！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var tableSheet = getTableSheet(ss);
        var tableData = tableSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < tableData.length; i++) {
          if (tableData[i][0] && tableData[i][0].toString().trim() === tableId) {
            foundRowIndex = i + 1;
            foundRow = tableData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此桌位 ID，請確認後台是否已手動預載。" });
        }

        var dbNickname = foundRow[1] ? foundRow[1].toString().trim() : "";
        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (dbNickname || dbPassword) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "此桌位剛剛已被他人佔用，請重新整理頁面取得新的空桌 ID。" });
        }

        var inputEmails = [];
        for (var m = 0; m < members.length; m++) {
          var mEmail = members[m].email ? members[m].email.trim().toLowerCase() : "";
          var mPhone = members[m].phone ? members[m].phone.trim() : "";
          if (!mEmail || !mPhone) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員資料不得有空白！" });
          }
          if (inputEmails.indexOf(mEmail) > -1) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "同桌成員不可重複加入 (" + mEmail + ")！" });
          }
          inputEmails.push(mEmail);
        }

        var regData = sheet.getDataRange().getValues();
        var emailNameMap = {};
        for (var m = 0; m < members.length; m++) {
          var mEmail = members[m].email.trim().toLowerCase();
          var mPhone = members[m].phone.trim();
          var foundReg = null;
          for (var r = 1; r < regData.length; r++) {
            var regEmail = regData[r][3] ? regData[r][3].toString().trim().toLowerCase() : "";
            var regPhone = regData[r][4] ? regData[r][4].toString().replace(/^'/, "").trim() : "";
            if (regEmail === mEmail && regPhone === mPhone) {
              foundReg = {
                name: regData[r][2] ? regData[r][2].toString().trim() : "",
                paymentStatus: regData[r][7] ? regData[r][7].toString().trim() : ""
              };
              break;
            }
          }
          if (!foundReg) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員 Email: " + mEmail + " 手機後四碼不符或未完成報名！" });
          }
          var isPaid = (foundReg.paymentStatus.indexOf("已確認") > -1 || foundReg.paymentStatus.indexOf("已完成") > -1);
          if (!isPaid) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員 " + foundReg.name + " (" + mEmail + ") 尚未完成付款對帳！" });
          }
          emailNameMap[mEmail] = foundReg.name;
        }

        for (var r = 1; r < tableData.length; r++) {
          var tId = tableData[r][0] ? tableData[r][0].toString().trim() : "";
          for (var c = 3; c <= 12; c++) {
            if (tableData[r][c]) {
              var occupiedEmail = tableData[r][c].toString().trim().toLowerCase();
              if (inputEmails.indexOf(occupiedEmail) > -1) {
                var name = emailNameMap[occupiedEmail] || occupiedEmail;
                lock.releaseLock();
                return toJSON(e, { status: "error", message: "成員 " + name + " 剛剛已被分配在第 " + tId + " 桌，請重新整理並更換人員。" });
              }
            }
          }
        }

        var hashedNewPassword = hashPassword(password);
        var newRow = ["'" + tableId, "'" + nickname, "'" + hashedNewPassword];
        for (var m = 0; m < members.length; m++) {
          newRow.push(members[m].email.trim());
        }
        tableSheet.getRange(foundRowIndex, 1, 1, newRow.length).setValues([newRow]);

        for (var m = 0; m < members.length; m++) {
          var mEmail = members[m].email.trim().toLowerCase();
          for (var k = 1; k < regData.length; k++) {
            if (regData[k][3] && regData[k][3].toString().trim().toLowerCase() === mEmail) {
              sheet.getRange(k + 1, 9).setValue("'" + tableId);
              sheet.getRange(k + 1, 10).setValue("'" + nickname);
              break;
            }
          }
        }

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "桌位建立成功！" });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "建立桌位失敗：" + innerErr.toString() });
      }
    }

    // ==========================================
    // 揪桌友資料 API 元件
    // ==========================================

    // 取得或自動建立揪桌友資料分頁
    function getGroupTableSheet(ss) {
      var s = ss.getSheetByName("揪桌友資料");
      if (!s) {
        s = ss.insertSheet("揪桌友資料");
        var headers = ["流水ID", "揪桌友暱稱", "修改密碼",
          "人員1 Email", "人員1 暱稱",
          "人員2 Email", "人員2 暱稱",
          "人員3 Email", "人員3 暱稱",
          "人員4 Email", "人員4 暱稱",
          "人員5 Email", "人員5 暱稱",
          "人員6 Email", "人員6 暱稱",
          "人員7 Email", "人員7 暱稱",
          "人員8 Email", "人員8 暱稱",
          "人員9 Email", "人員9 暱稱",
          "人員10 Email", "人員10 暱稱"];
        s.getRange(1, 1, 1, headers.length).setValues([headers]);
        SpreadsheetApp.flush();
      }
      // 強制將 A 欄（流水ID）格式設為純文字，確保 001 等前導零不會被轉換成 1
      s.getRange("A:A").setNumberFormat("@");
      return s;
    }

    // 密碼 SHA-256 雜湊加密
    function hashPassword(password) {
      if (!password) return "";
      var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
      var hashStr = "";
      for (var i = 0; i < rawHash.length; i++) {
        var byteVal = rawHash[i];
        if (byteVal < 0) byteVal += 256;
        var byteString = byteVal.toString(16);
        if (byteString.length == 1) byteString = "0" + byteString;
        hashStr += byteString;
      }
      return hashStr;
    }

    // 驗證密碼，相容 64 位 SHA-256 密碼與手動/歷史明文密碼
    function verifyPassword(inputPassword, storedPassword) {
      if (!storedPassword) return false;
      var cleanStored = storedPassword.toString().trim();
      var cleanInput = inputPassword ? inputPassword.trim() : "";
      if (cleanStored.length === 64) {
        return hashPassword(cleanInput) === cleanStored;
      }
      return cleanInput === cleanStored;
    }

    // 格式化 ID 輔助函式，強制將 numeric 形式轉換成 3 位補零格式，如 3 -> 003
    function formatGroupTableId(rawId) {
      if (!rawId) return "";
      var idStr = rawId.toString().trim();
      if (idStr.indexOf("G") === 0) {
        return idStr; // 保持 G1, G2 等歷史 ID
      }
      var num = parseInt(idStr, 10);
      if (!isNaN(num)) {
        return ("00" + num).slice(-3); // 3 位補零
      }
      return idStr;
    }

    function isMemberAssignedAnywhere(ss, email, currentGroupTableId) {
      if (!email) return false;
      var emailClean = email.trim().toLowerCase();
      
      // 檢查此人 Email 是否已出現在「揪桌友資料」的其他桌中
      var groupSheet = ss.getSheetByName("揪桌友資料");
      if (groupSheet) {
        var groupData = groupSheet.getDataRange().getValues();
        for (var i = 1; i < groupData.length; i++) {
          var gId = groupData[i][0] ? formatGroupTableId(groupData[i][0]) : "";
          var curGroupTableIdNorm = formatGroupTableId(currentGroupTableId);
          if (gId === curGroupTableIdNorm) continue;
          var emailCols = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
          for (var c = 0; c < emailCols.length; c++) {
            var colIndex = emailCols[c];
            if (groupData[i][colIndex] && groupData[i][colIndex].toString().trim().toLowerCase() === emailClean) {
              return "此人已加入揪桌友 " + gId + " (" + (groupData[i][1] || ("揪桌友" + gId)) + ")";
            }
          }
        }
      }
      return null;
    }

    // A. 讀取所有揪桌友清單
    if (action === "getGroupTableList") {
      var groupSheet = getGroupTableSheet(ss);
      var groupData = groupSheet.getDataRange().getValues();
      var tables = [];
      for (var i = 1; i < groupData.length; i++) {
        var row = groupData[i];
        var tableId = row[0] ? formatGroupTableId(row[0]) : "";
        if (!tableId) continue;

        var nickname = row[1] ? row[1].toString().trim() : "";

        var memberCount = 0;
        var emailCols = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
        for (var c = 0; c < emailCols.length; c++) {
          if (row[emailCols[c]] && row[emailCols[c]].toString().trim()) {
            memberCount++;
          }
        }
        tables.push({
          id: tableId,
          nickname: nickname,
          memberCount: memberCount
        });
      }

      var flagSheet = getFeatureFlagsSheet(ss);
      var flagData = flagSheet.getDataRange().getValues();
      var minLimit = 5;
      for (var i = 1; i < flagData.length; i++) {
        var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
        if (flagName === "揪桌友最少人數下限") {
          var val = parseInt(flagData[i][1], 10);
          if (!isNaN(val)) minLimit = val;
          break;
        }
      }

      return toJSON(e, { status: "success", tables: tables, minLimit: minLimit });
    }

    // B. 驗證單一成員是否符合條件
    if (action === "verifyMemberForGroup") {
      var email = params.email ? params.email.trim() : "";
      var phone = params.phone ? params.phone.trim() : "";
      var currentTableId = params.currentTableId ? params.currentTableId.toString().trim() : "";

      if (!email || !phone) {
        return toJSON(e, { status: "error", message: "請輸入 Email 與手機後四碼！" });
      }

      var regData = sheet.getDataRange().getValues();
      var foundUser = null;
      for (var i = 1; i < regData.length; i++) {
        var regEmail = regData[i][3] ? regData[i][3].toString().trim().toLowerCase() : "";
        var regPhone = regData[i][4] ? regData[i][4].toString().replace(/^'/, "").trim() : "";
        if (regEmail === email.toLowerCase() && regPhone === phone) {
          foundUser = {
            name: regData[i][2] ? regData[i][2].toString().trim() : "",
            paymentStatus: regData[i][7] ? regData[i][7].toString().trim() : ""
          };
          break;
        }
      }

      if (!foundUser) {
        return toJSON(e, { status: "error", message: "查無此報名資料，請確認輸入是否正確。" });
      }

      var isPaid = (foundUser.paymentStatus.indexOf("已確認") > -1 || foundUser.paymentStatus.indexOf("已完成") > -1);
      if (!isPaid) {
        return toJSON(e, { status: "error", message: "此報名尚未完成對帳/付款，無法加入揪桌友。" });
      }

      var assignedError = isMemberAssignedAnywhere(ss, email, currentTableId);
      if (assignedError) {
        return toJSON(e, { status: "error", message: assignedError });
      }

      return toJSON(e, { status: "success", name: foundUser.name });
    }

    // C. 批次驗證成員是否符合條件
    if (action === "verifyBatchMembersForGroup") {
      var batchJson = params.batch ? params.batch.trim() : "";
      var currentTableId = params.currentTableId ? params.currentTableId.toString().trim() : "";

      if (!batchJson) {
        return toJSON(e, { status: "error", message: "缺乏批次參數！" });
      }

      var queries = [];
      try {
        queries = JSON.parse(batchJson);
      } catch (err) {
        return toJSON(e, { status: "error", message: "參數 JSON 格式錯誤！" });
      }

      var regData = sheet.getDataRange().getValues();
      var results = [];

      for (var q = 0; q < queries.length; q++) {
        var qIdx = queries[q].index;
        var email = queries[q].email ? queries[q].email.trim() : "";
        var phone = queries[q].phone ? queries[q].phone.trim() : "";

        if (!email || !phone) {
          results.push({ index: qIdx, status: "error", message: "Email或手機未填" });
          continue;
        }

        var foundUser = null;
        for (var i = 1; i < regData.length; i++) {
          var regEmail = regData[i][3] ? regData[i][3].toString().trim().toLowerCase() : "";
          var regPhone = regData[i][4] ? regData[i][4].toString().replace(/^'/, "").trim() : "";
          if (regEmail === email.toLowerCase() && regPhone === phone) {
            foundUser = {
              name: regData[i][2] ? regData[i][2].toString().trim() : "",
              paymentStatus: regData[i][7] ? regData[i][7].toString().trim() : ""
            };
            break;
          }
        }

        if (!foundUser) {
          results.push({ index: qIdx, status: "error", message: "查無此報名資料" });
          continue;
        }

        var isPaid = (foundUser.paymentStatus.indexOf("已確認") > -1 || foundUser.paymentStatus.indexOf("已完成") > -1);
        if (!isPaid) {
          results.push({ index: qIdx, status: "error", message: "此報名尚未完成對帳/付款" });
          continue;
        }

        var assignedError = isMemberAssignedAnywhere(ss, email, currentTableId);
        if (assignedError) {
          results.push({ index: qIdx, status: "error", message: assignedError });
          continue;
        }

        results.push({ index: qIdx, status: "success", name: foundUser.name });
      }

      return toJSON(e, { status: "success", results: results });
    }

    // D. 驗證密碼載入揪桌友詳細資料
    if (action === "verifyGroupTablePassword") {
      var tableId = params.tableId ? formatGroupTableId(params.tableId) : "";
      var password = params.password ? params.password.trim() : "";
      if (!tableId || !password) {
        return toJSON(e, { status: "error", message: "請提供揪桌友 ID 與密碼！" });
      }

      var groupSheet = getGroupTableSheet(ss);
      var groupData = groupSheet.getDataRange().getValues();
      var foundRow = null;
      for (var i = 1; i < groupData.length; i++) {
        var currentId = groupData[i][0] ? formatGroupTableId(groupData[i][0]) : "";
        if (currentId === tableId) {
          foundRow = groupData[i];
          break;
        }
      }

      if (!foundRow) {
        return toJSON(e, { status: "error", message: "找不到此揪桌友 ID，請確認是否輸入正確。" });
      }

      var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
      if (!verifyPassword(password, dbPassword)) {
        return toJSON(e, { status: "error", message: "密碼不正確，請重新輸入。" });
      }

      var nickname = foundRow[1] ? foundRow[1].toString().trim() : "";
      var regData = sheet.getDataRange().getValues();
      var members = [];
      var emailCols = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
      for (var c = 0; c < emailCols.length; c++) {
        var colIndex = emailCols[c];
        var emailStr = foundRow[colIndex] ? foundRow[colIndex].toString().trim() : "";
        if (!emailStr) {
          members.push({ email: "", phone: "", name: "" });
          continue;
        }
        var memberName = "";
        var memberPhone = "";
        for (var k = 1; k < regData.length; k++) {
          if (regData[k][3] && regData[k][3].toString().trim().toLowerCase() === emailStr.toLowerCase()) {
            memberName = regData[k][2] ? regData[k][2].toString().trim() : "";
            memberPhone = regData[k][4] ? regData[k][4].toString().replace(/^'/, "").trim() : "";
            break;
          }
        }
        members.push({ email: emailStr, phone: memberPhone, name: memberName });
      }
      return toJSON(e, { status: "success", data: { tableId: tableId, nickname: nickname, members: members } });
    }

    // E. 建立全新揪桌友資料 (流水ID自動遞增)
    if (action === "saveGroupTable") {
      var nickname = params.nickname ? params.nickname.trim() : "";
      var password = params.password ? params.password.trim() : "";
      var membersStr = params.members ? params.members : "";

      if (!nickname || !password || !membersStr) {
        return toJSON(e, { status: "error", message: "參數缺少！" });
      }

      var members = [];
      try {
        members = JSON.parse(membersStr);
      } catch (err) {
        return toJSON(e, { status: "error", message: "成員資料解析錯誤！" });
      }

      if (members.length > 10) {
        return toJSON(e, { status: "error", message: "揪桌友最多包含 10 位成員！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var flagSheet = getFeatureFlagsSheet(ss);
        var flagData = flagSheet.getDataRange().getValues();
        var minLimit = 5;
        for (var i = 1; i < flagData.length; i++) {
          var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
          if (flagName === "揪桌友最少人數下限") {
            var val = parseInt(flagData[i][1], 10);
            if (!isNaN(val)) minLimit = val;
            break;
          }
        }

        var validMembers = [];
        for (var m = 0; m < members.length; m++) {
          if (members[m].email && members[m].email.trim()) {
            validMembers.push(members[m]);
          }
        }

        if (validMembers.length < minLimit) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "輸入人數不可以低於此人數（" + minLimit + "人）！" });
        }

        var inputEmails = [];
        for (var m = 0; m < validMembers.length; m++) {
          var mEmail = validMembers[m].email.trim().toLowerCase();
          var mPhone = validMembers[m].phone ? validMembers[m].phone.trim() : "";
          if (!mEmail || !mPhone) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員資料不得有空白！" });
          }
          if (inputEmails.indexOf(mEmail) > -1) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "同桌成員不可重複加入 (" + mEmail + ")！" });
          }
          inputEmails.push(mEmail);
        }

        var regData = sheet.getDataRange().getValues();
        var emailNameMap = {};
        for (var m = 0; m < validMembers.length; m++) {
          var mEmail = validMembers[m].email.trim().toLowerCase();
          var mPhone = validMembers[m].phone.trim();
          var foundReg = null;
          for (var r = 1; r < regData.length; r++) {
            var regEmail = regData[r][3] ? regData[r][3].toString().trim().toLowerCase() : "";
            var regPhone = regData[r][4] ? regData[r][4].toString().replace(/^'/, "").trim() : "";
            if (regEmail === mEmail && regPhone === mPhone) {
              foundReg = {
                name: regData[r][2] ? regData[r][2].toString().trim() : "",
                paymentStatus: regData[r][7] ? regData[r][7].toString().trim() : ""
              };
              break;
            }
          }
          if (!foundReg) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員 Email: " + mEmail + " 手機後四碼不符或未完成報名！" });
          }
          var isPaid = (foundReg.paymentStatus.indexOf("已確認") > -1 || foundReg.paymentStatus.indexOf("已完成") > -1);
          if (!isPaid) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "成員 " + foundReg.name + " (" + mEmail + ") 尚未完成付款對帳！" });
          }
          emailNameMap[mEmail] = foundReg.name;

          var assignedError = isMemberAssignedAnywhere(ss, mEmail, "");
          if (assignedError) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: assignedError });
          }
        }

        var groupSheet = getGroupTableSheet(ss);
        var groupData = groupSheet.getDataRange().getValues();
        var maxIdNum = 0;
        for (var i = 1; i < groupData.length; i++) {
          var idStr = groupData[i][0] ? groupData[i][0].toString().trim() : "";
          var num = 0;
          if (idStr.indexOf("G") === 0) {
            num = parseInt(idStr.substring(1), 10);
          } else {
            num = parseInt(idStr, 10);
          }
          if (!isNaN(num) && num > maxIdNum) {
            maxIdNum = num;
          }
        }
        var nextIdNum = maxIdNum + 1;
        var tableId = ("00" + nextIdNum).slice(-3);

        var hashedNewPassword = hashPassword(password);
        var newRow = ["'" + tableId, "'" + nickname, "'" + hashedNewPassword];
        for (var m = 0; m < 10; m++) {
          if (m < validMembers.length) {
            var mEmail = validMembers[m].email.trim();
            var mName = emailNameMap[mEmail.toLowerCase()] || "";
            newRow.push(mEmail, mName);
          } else {
            newRow.push("", "");
          }
        }

        groupSheet.appendRow(newRow);

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "揪桌友建立成功！", tableId: tableId });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "建立揪桌友失敗：" + innerErr.toString() });
      }
    }

    // F. 修改單一揪桌友成員
    if (action === "updateGroupTableMember") {
      var tableId = params.tableId ? formatGroupTableId(params.tableId) : "";
      var password = params.password ? params.password.trim() : "";
      var memberIndex = params.memberIndex ? parseInt(params.memberIndex, 10) : -1;
      var email = params.email ? params.email.trim() : "";
      var phone = params.phone ? params.phone.trim() : "";

      if (!tableId || !password || memberIndex < 1 || memberIndex > 10) {
        return toJSON(e, { status: "error", message: "參數錯誤！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var groupSheet = getGroupTableSheet(ss);
        var groupData = groupSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < groupData.length; i++) {
          var currentId = groupData[i][0] ? formatGroupTableId(groupData[i][0]) : "";
          if (currentId === tableId) {
            foundRowIndex = i + 1;
            foundRow = groupData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此揪桌友 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，修改遭拒絕。" });
        }

        var flagSheet = getFeatureFlagsSheet(ss);
        var flagData = flagSheet.getDataRange().getValues();
        var minLimit = 5;
        for (var i = 1; i < flagData.length; i++) {
          var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
          if (flagName === "揪桌友最少人數下限") {
            var val = parseInt(flagData[i][1], 10);
            if (!isNaN(val)) minLimit = val;
            break;
          }
        }

        var groupNickname = foundRow[1] ? foundRow[1].toString().trim() : ("揪桌友" + tableId);

        var activeHeadcount = 0;
        var emailCols = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
        for (var c = 0; c < emailCols.length; c++) {
          var colIdx = emailCols[c];
          var slotIndex = c + 1;
          if (slotIndex === memberIndex) continue;
          if (foundRow[colIdx] && foundRow[colIdx].toString().trim()) {
            activeHeadcount++;
          }
        }

        var isRemoving = (!email);
        if (isRemoving) {
          if (activeHeadcount < minLimit) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "移除此人將導致同桌人數低於下限值（" + minLimit + "人），無法移除！" });
          }
        }

        var oldEmailColIndex = 3 + (memberIndex - 1) * 2;
        var oldEmail = foundRow[oldEmailColIndex] ? foundRow[oldEmailColIndex].toString().trim() : "";
        var memberName = "";

        if (!isRemoving) {
          var regData = sheet.getDataRange().getValues();
          var regFound = null;
          for (var k = 1; k < regData.length; k++) {
            var regEmail = regData[k][3] ? regData[k][3].toString().trim().toLowerCase() : "";
            var regPhone = regData[k][4] ? regData[k][4].toString().replace(/^'/, "").trim() : "";
            if (regEmail === email.toLowerCase() && regPhone === phone) {
              regFound = {
                name: regData[k][2] ? regData[k][2].toString().trim() : "",
                paymentStatus: regData[k][7] ? regData[k][7].toString().trim() : ""
              };
              break;
            }
          }
          if (!regFound) {
            lock.releaseLock();
            return toJSON(e, { status: "error", message: "新成員的 Email 或手機後四碼不正確，請確認已完成報名。" });
          }

          if (email.toLowerCase() !== oldEmail.toLowerCase()) {
            var isPaid = (regFound.paymentStatus.indexOf("已確認") > -1 || regFound.paymentStatus.indexOf("已完成") > -1);
            if (!isPaid) {
              lock.releaseLock();
              return toJSON(e, { status: "error", message: "新成員尚未完成對帳付款，無法加入揪桌友。" });
            }

            var assignedError = isMemberAssignedAnywhere(ss, email, tableId);
            if (assignedError) {
              lock.releaseLock();
              return toJSON(e, { status: "error", message: assignedError });
            }

            for (var c = 0; c < emailCols.length; c++) {
              var colIdx = emailCols[c];
              var slotIndex = c + 1;
              if (slotIndex === memberIndex) continue;
              if (foundRow[colIdx] && foundRow[colIdx].toString().trim().toLowerCase() === email.toLowerCase()) {
                lock.releaseLock();
                return toJSON(e, { status: "error", message: "此人已被填寫在同桌其他位置，同桌成員不可重複！" });
              }
            }
          }
          memberName = regFound.name;
        }

        var emailColIndex = 3 + (memberIndex - 1) * 2 + 1;
        groupSheet.getRange(foundRowIndex, emailColIndex).setValue(isRemoving ? "" : email);
        groupSheet.getRange(foundRowIndex, emailColIndex + 1).setValue(isRemoving ? "" : memberName);

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: isRemoving ? "人員已移出揪桌友！" : "人員修改成功！", name: memberName });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "更新人員失敗：" + innerErr.toString() });
      }
    }

    // G. 修改揪桌友暱稱與密碼
    if (action === "updateGroupTableInfo") {
      var tableId = params.tableId ? formatGroupTableId(params.tableId) : "";
      var password = params.password ? params.password.trim() : "";
      var newNickname = params.newNickname ? params.newNickname.trim() : "";
      var newPassword = params.newPassword ? params.newPassword.trim() : "";

      if (!tableId || !password || !newNickname || !newPassword) {
        return toJSON(e, { status: "error", message: "請輸入暱稱與密碼！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var groupSheet = getGroupTableSheet(ss);
        var groupData = groupSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < groupData.length; i++) {
          var currentId = groupData[i][0] ? formatGroupTableId(groupData[i][0]) : "";
          if (currentId === tableId) {
            foundRowIndex = i + 1;
            foundRow = groupData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此揪桌友 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，修改遭拒絕。" });
        }

        var hashedNewPassword = hashPassword(newPassword);
        groupSheet.getRange(foundRowIndex, 2).setValue("'" + newNickname);
        groupSheet.getRange(foundRowIndex, 3).setValue("'" + hashedNewPassword);

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "揪桌友暱稱與密碼修改成功！" });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "修改揪桌友資料失敗：" + innerErr.toString() });
      }
    }

    // H. 解散揪桌友 (刪除該列)
    if (action === "disbandGroupTable") {
      var tableId = params.tableId ? formatGroupTableId(params.tableId) : "";
      var password = params.password ? params.password.trim() : "";
      if (!tableId || !password) {
        return toJSON(e, { status: "error", message: "參數錯誤！" });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (err) {
        return toJSON(e, { status: "error", message: "系統繁忙，請稍後重試。" });
      }

      try {
        var groupSheet = getGroupTableSheet(ss);
        var groupData = groupSheet.getDataRange().getValues();
        var foundRowIndex = -1;
        var foundRow = null;
        for (var i = 1; i < groupData.length; i++) {
          var currentId = groupData[i][0] ? formatGroupTableId(groupData[i][0]) : "";
          if (currentId === tableId) {
            foundRowIndex = i + 1;
            foundRow = groupData[i];
            break;
          }
        }

        if (foundRowIndex === -1) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "找不到此揪桌友 ID！" });
        }

        var dbPassword = foundRow[2] ? foundRow[2].toString().trim() : "";
        if (!verifyPassword(password, dbPassword)) {
          lock.releaseLock();
          return toJSON(e, { status: "error", message: "密碼不正確，解散遭拒絕。" });
        }

        // 刪除該行
        groupSheet.deleteRow(foundRowIndex);

        SpreadsheetApp.flush();
        lock.releaseLock();
        return toJSON(e, { status: "success", message: "揪桌友已成功解散且清空！" });
      } catch (innerErr) {
        lock.releaseLock();
        return toJSON(e, { status: "error", message: "解散揪桌友失敗：" + innerErr.toString() });
      }
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

/**
 * 產生精美 HTML QR Code 票券信件內文 (中英雙語)
 */
function buildQRCodeEmailBody(name, email, transportation) {
  var qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(email) + "&color=0f3057";

  var html = `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, 'Microsoft JhengHei', sans-serif; background-color: #f4f7f6; padding: 30px 15px; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="background-color: #1A4B82; padding: 30px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">浪熊 Bear Wave</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8; text-transform: uppercase;">Tamsui Farm Summer Bear Fest</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px 24px; color: #2d3748; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">哈囉 <strong>${name}</strong>，</p>
        <p style="font-size: 14px; color: #4a5568;">
          您的付款已核對完成！以下是您專屬的活動入場票券 **QR Code**。請將此 QR Code 妥善保存於手機中，以利現場進行核銷。
        </p>
        <p style="font-size: 14px; color: #4a5568; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
          Your payment has been verified! Here is your exclusive event entry **QR Code**. Please save it on your phone for on-site scanning.
        </p>
        
        <!-- Info Box -->
        <div style="background-color: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 25px; border: 1px solid #edf2f7; font-size: 14px;">
          <div style="margin-bottom: 8px;"><strong>活動名稱 / Event:</strong> 暮夏浪熊祭 (Tamsui Farm Summer Bear Fest)</div>
          <div style="margin-bottom: 8px;"><strong>姓名 / Name:</strong> ${name}</div>
          <div style="margin-bottom: 8px;"><strong>信箱 / Email:</strong> <span style="font-family: monospace; font-weight: bold; color: #1a4b82;">${email}</span></div>
          <div><strong>交通方式 / Transportation:</strong> ${transportation}</div>
        </div>
        
        <!-- QR Code Container -->
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrCodeUrl}" width="220" height="220" alt="Ticket QR Code" style="display: block; margin: 0 auto; border: 2px dashed #1A4B82; padding: 8px; border-radius: 12px; background: #ffffff;" />
          <div style="font-size: 12px; color: #a0aec0; margin-top: 8px;">QR Code 內容為您的報名信箱 / QR Code contains your email</div>
        </div>
        
        <!-- Instructions -->
        <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #718096;">
          <h3 style="margin: 0 0 8px 0; color: #1A4B82; font-size: 14px;">💡 現場核銷指引 / Scanning Instructions</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>上車檢查</strong>：搭乘西門/台中/新竹遊覽車時，請向隨車工作人員出示此 QR Code 掃描上車。</li>
            <li><strong>入場檢查</strong>：抵達淡江農場活動入口簽到處時，請出示此 QR Code 掃描入場。</li>
            <li style="color: #e53e3e;"><strong>安全提醒</strong>：此條碼即為您的入場憑證，請勿將本信或條碼轉寄給他人，以防重複掃描導致權益受損。</li>
          </ul>
          
          <hr style="border: 0; border-top: 1px dashed #e2e8f0; margin: 15px 0;" />
          
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Boarding Check</strong>: Show this QR Code to the staff when boarding the shuttle bus.</li>
            <li><strong>Admission Check</strong>: Present this QR Code at the registration desk of Tamsui Farm to complete check-in.</li>
            <li style="color: #e53e3e;"><strong>Notice</strong>: This barcode is your entry ticket. Do not forward this email/code to others to prevent duplicate scan issues.</li>
          </ul>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #edf2f7; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
        此信件為系統自動發送，請勿直接回信。<br>
        This is an automated email. Please do not reply.
      </div>
    </div>
  </div>
  `;
  return html;
}

/**
 * 取得或自動建立功能旗標分頁 (自我修復與容錯防禦)
 */
function getFeatureFlagsSheet(ss) {
  var s = ss.getSheetByName("功能旗標");
  if (!s) {
    s = ss.insertSheet("功能旗標");
    var headers = ["旗標名稱", "設定值"];
    s.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 預設寫入旗標
    var defaultFlags = [
      ["自動發送 QR Code 門票", "OFF"],
      ["車位報名-停止", "OFF"],
      ["活動報名-停止", "OFF"],
      ["揪桌友最少人數下限", "5"],
      ["西門遊覽車滿額停售", "OFF"]
    ];
    s.getRange(2, 1, defaultFlags.length, 2).setValues(defaultFlags);
    SpreadsheetApp.flush();
  } else {
    // 檢查是否已包含特定旗標，若無則自動補上
    var data = s.getDataRange().getValues();
    var hasGroupFlag = false;
    var hasBusFlag = false;
    var hasRegStopFlag = false;
    var hasParkingStopFlag = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        var flagName = data[i][0].toString().trim();
        if (flagName === "揪桌友最少人數下限") {
          hasGroupFlag = true;
        }
        if (flagName === "西門遊覽車滿額停售") {
          hasBusFlag = true;
        }
        if (flagName === "活動報名-停止") {
          hasRegStopFlag = true;
        }
        if (flagName === "車位報名-停止") {
          hasParkingStopFlag = true;
        }
      }
    }
    var needsFlush = false;
    if (!hasGroupFlag) {
      s.appendRow(["揪桌友最少人數下限", "5"]);
      needsFlush = true;
    }
    if (!hasBusFlag) {
      s.appendRow(["西門遊覽車滿額停售", "OFF"]);
      needsFlush = true;
    }
    if (!hasRegStopFlag) {
      s.appendRow(["活動報名-停止", "OFF"]);
      needsFlush = true;
    }
    if (!hasParkingStopFlag) {
      s.appendRow(["車位報名-停止", "OFF"]);
      needsFlush = true;
    }
    if (needsFlush) {
      SpreadsheetApp.flush();
    }
  }
  return s;
}

/**
 * 每日定時自動發送 QR Code 信件的入口函式 (由 Trigger 呼叫)
 */
function sendBulkQRCodesAuto() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 鎖前檢查：取得「功能旗標」分頁並判斷開關是否啟用
  var flagSheet = getFeatureFlagsSheet(ss);
  var flagData = flagSheet.getDataRange().getValues();
  var isEnabled = false;

  for (var i = 1; i < flagData.length; i++) {
    var flagName = flagData[i][0] ? flagData[i][0].toString().trim() : "";
    var flagValue = flagData[i][1] ? flagData[i][1].toString().trim().toUpperCase() : "";

    if (flagName === "自動發送 QR Code 門票" && flagValue === "OK") {
      isEnabled = true;
      break;
    }
  }

  if (!isEnabled) {
    console.log("自動排程發信未啟用。請在「功能旗標」工作表中，將「自動發送 QR Code 門票」的設定值改為 OK 以啟用。");
    return;
  }

  // 2. 獲取寫入鎖 (保證高併發排隊)
  var sheet = ss.getSheetByName("報名名單") || ss.getSheetByName("工作表1") || ss.getSheets()[0];
  if (!sheet) {
    console.error("Auto trigger error: Cannot find registration sheet.");
    return;
  }

  var data = sheet.getDataRange().getValues();
  var sentCount = 0;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    console.error("Auto trigger lock wait timeout: " + err.toString());
    return;
  }

  try {
    var pendingRows = [];
    for (var i = 1; i < data.length; i++) {
      var paymentStatus = data[i][7] ? data[i][7].toString().trim() : "";
      var qrStatus = data[i][14] ? data[i][14].toString().trim() : "";
      var email = data[i][3] ? data[i][3].toString().trim() : "";

      if (email && paymentStatus.indexOf("已完成") > -1 && !qrStatus) {
        pendingRows.push({
          rowIndex: i + 1,
          name: data[i][2],
          email: email,
          transportation: data[i][5] || "自行前往"
        });
      }
    }

    if (pendingRows.length === 0) {
      lock.releaseLock();
      console.log("Auto trigger: No pending paid records found.");
      return;
    }

    for (var k = 0; k < pendingRows.length; k++) {
      var remainingQuota = MailApp.getRemainingDailyQuota();
      if (remainingQuota <= 0) {
        lock.releaseLock();
        console.warn("Auto trigger stopped: Daily email quota exceeded. Sent: " + sentCount);
        return;
      }

      var person = pendingRows[k];
      var htmlBody = buildQRCodeEmailBody(person.name, person.email, person.transportation);
      MailApp.sendEmail({
        to: person.email,
        subject: "【浪熊 Bear Wave】您的活動入場票券 QR Code / Your Event Ticket QR Code",
        htmlBody: htmlBody
      });

      sheet.getRange(person.rowIndex, 15).setValue("done"); // 標記為 done 表示已發送
      SpreadsheetApp.flush();
      sentCount++;
    }

    lock.releaseLock();
    console.log("Auto trigger successfully sent " + sentCount + " QR code emails.");

  } catch (err) {
    lock.releaseLock();
    console.error("Auto trigger error: " + err.toString());
  }
}
