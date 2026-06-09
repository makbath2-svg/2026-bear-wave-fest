<USER_REQUEST>
?®å? GAS ç¨‹å?    /**
 * =================================================================
 * æµªç? Bear Wave æ´»å??±å?ç³»çµ± - å¾Œç«¯ API (?€çµ‚å??´ç?)
 * ?©ç”¨æ´»å?ï¼šæ·¡æ°´è¾²?´æš®å¤æµª?Šç¥­
 * 
 * è©¦ç?è¡¨æ?ä½é?åºï?
 * A:?‚é?æ¨™è? | B:?‹ç? | C:å§“å? | D:Email | E:äº¤é€šæ–¹å¼?| F:?¯æ¬¾å¾Œä?ç¢?| G:?¯æ¬¾?€??| H:æ¡Œæ¬¡?Ÿç¢¼ | I:?™è¨» | J:?€?ºæ´»?•\r
 * =================================================================
 */

// ?¯æ¬¾?€è¡Œè?è¨Š\r
const BANK_INFO = {
  bankName: "ä¸­å?ä¿¡è??†æ¥­?€è¡?(822)",
  branch: "è¥¿é??†è?",
  accountNumber: "123-456789-012",
  accountName: "æµªç?å·¥ä?å®¤\"
};

// å¤–å?äººä?æ¬¾é€??
const PAYPAL_LINKS = {
  eventFee: "https://www.paypal.com/ncp/payment/TPQHEXP9JRF4S",     // æ´»å?è²?$1000
  busFee: "https://www.paypal.com/ncp/payment/XLXLAJNBUUJRN"       // å°ˆè?è²?$250
};

/**
 * è¼”åŠ©?½å?ï¼šå?è³‡æ?è½‰ç‚º JSON ?–ç›¸å®¹å?ç«¯ç? JSONP è¼¸å‡ºï¼ˆè§£æ±ºè·¨ç¶²å? CORS ?é?ï¼‰\r
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

// çµ±ä??¥å£ï¼šæ”¯??GET ??POST
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
      return toJSON(e, { status: "error", message: "?¯èª¤ï¼šæœª?‡å? action ?•ä?ï¼\" });
    }
    
    var sheet = SpreadsheetApp.getActiveSpr
<truncated 13250 bytes>
ackground-color: #0070ba; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin-top: 5px;">Pay Bus Fee $250 TWD</a><br/>
            <span style="font-size: 0.85rem; color: #555;">* Note: The round-trip shuttle departs from Taipei/Ximen.</span>
          </p>
          ` : `
          <p style="margin: 18px 0 8px 0; font-size: 0.9rem; color: #555; border-top: 1px solid #d2e4f9; padding-top: 12px;">
            * You selected Self-Drive, so you do not need to pay the Bus Fee.
          </p>
          `}
        </div>
        
        <div style="background-color: #fff9e6; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 0.9rem; color: #663c00; line-height: 1.6;">
          <strong>? ï? Action Required for Payment Verification:</strong><br/>
          Before checking out on PayPal, please <strong>copy your registered email</strong>:<br/>
          <span style="font-family: monospace; font-size: 1.1rem; background: #fff; padding: 2px 6px; border: 1px dashed #ff9800; font-weight: bold;">${email}</span><br/>
          and paste it directly into the <strong>"è«‹å¡«å¯«æ‚¨?±å??„email"</strong> input box on the PayPal checkout screen. This helps us verify your payment.
        </div>
        
        <p style="text-align: center; margin-top: 30px; font-size: 0.85rem; color: #888;">&copy; 2026 æµªç? Bear Wave. All rights reserved.</p>
      </div>
    `;
  }
  
  // ?¼é€é›»å­éƒµä»¶\r
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-08T20:20:32+08:00.

The user's current state is as follows:
Active Document: c:\Users\senat\.gemini\antigravity\scratch\bear-wave-app\event-tamsui.html (LANGUAGE_HTML)
Cursor is on line: 132
Other open documents:
- c:\Users\senat\.gemini\antigravity\scratch\bear-wave-app\event-tamsui.html (LANGUAGE_HTML)
</ADDITIONAL_METADATA>
