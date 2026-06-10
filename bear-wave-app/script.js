document.addEventListener('DOMContentLoaded', () => {

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Generate Floating Bubbles
    const bubblesContainer = document.getElementById('bubblesContainer');
    if (bubblesContainer) {
        for (let i = 0; i < 30; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 60 + 20; // 20px to 80px
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.animationDuration = `${Math.random() * 10 + 10}s`; // 10s to 20s
            // 使用負數的 delay，讓泡泡一開始就散佈在畫面上
            bubble.style.animationDelay = `-${Math.random() * 20}s`;
            bubblesContainer.appendChild(bubble);
        }
    }

    // Custom Animated Cursor Logic
    const cursorWrapper = document.getElementById('cursor-wrapper');
    const customCursor = document.getElementById('custom-cursor');

    if (cursorWrapper && customCursor) {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            cursorWrapper.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        });

        // Add recoil effect on click
        document.addEventListener('click', () => {
            customCursor.classList.add('recoil');
            setTimeout(() => {
                customCursor.classList.remove('recoil');
            }, 100);
        });
    }

    // Water Gun Click Effect
    document.addEventListener('click', (e) => {
        // Create 3 to 5 water drops per click
        const numDrops = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numDrops; i++) {
            createWaterDrop(e.clientX, e.clientY);
        }
    });

    function createWaterDrop(x, y) {
        const drop = document.createElement('div');
        drop.className = 'water-drop';

        // Spawn EXACTLY at the mouse tip (where the nozzle is)
        drop.style.left = `${x - 5}px`; // -5 to center the 10x10 particle
        drop.style.top = `${y - 5}px`;

        document.body.appendChild(drop);

        // Direction: exactly top-left (angle around PI * 1.25)
        const angle = Math.PI * 1.25 + (Math.random() - 0.5) * 0.4; // 225 degrees +/- some spread
        const velocity = Math.random() * 60 + 40;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;

        drop.style.setProperty('--dx', `${dx}px`);
        drop.style.setProperty('--dy', `${dy}px`);

        // Remove element after animation (0.5s)
        setTimeout(() => {
            drop.remove();
        }, 500);
    }

    // Panorama Drag to Scroll
    const panorama = document.getElementById('tamsuiPanorama');
    if (panorama) {
        let isDown = false;
        let startX;
        let scrollLeft;

        panorama.addEventListener('mousedown', (e) => {
            isDown = true;
            panorama.style.cursor = 'grabbing';
            startX = e.pageX - panorama.offsetLeft;
            scrollLeft = panorama.scrollLeft;
            e.preventDefault(); // Prevent native browser drag/text selection
        });

        window.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            panorama.style.cursor = 'grab';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - panorama.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            panorama.scrollLeft = scrollLeft - walk;
        });

        // Center panorama & Auto Adjust Aspect Ratio on load
        const img = panorama.querySelector('.panorama-img');
        const panoramaContainer = document.querySelector('.panorama-container');
        const panoramaOverlay = document.querySelector('.panorama-overlay');

        const adjustAndCenter = () => {
            if (!img) return;
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;

            if (naturalWidth && naturalHeight && panoramaContainer) {
                const imgRatio = naturalWidth / naturalHeight;

                // 🟢 情況 A：如果這是一張超寬全景圖 (寬高比大於 1.8) -> 啟動拖曳與提示
                if (imgRatio > 1.8) {
                    panoramaContainer.style.paddingBottom = "56.25%"; // 固定 16:9 比例
                    panoramaContainer.style.height = "0";

                    panorama.style.overflowX = "auto";
                    panorama.style.cursor = "grab";

                    img.style.height = "100%";
                    img.style.width = "auto";

                    if (panoramaOverlay) panoramaOverlay.style.display = "block";

                    // 執行水平置中
                    panorama.scrollLeft = (panorama.scrollWidth - panorama.clientWidth) / 2;
                } else {
                    // 🔴 情況 B：如果這是一張普通照片 (寬高比小於等於 1.8) -> 完整呈現，關閉拖曳
                    panoramaContainer.style.paddingBottom = "0"; // 移除 16:9 固定高度
                    panoramaContainer.style.height = "auto";

                    panorama.style.position = "relative";
                    panorama.style.overflowX = "hidden";
                    panorama.style.cursor = "default";

                    img.style.width = "100%";
                    img.style.height = "auto";

                    // 隱藏左右拖曳提示
                    if (panoramaOverlay) panoramaOverlay.style.display = "none";
                }
            }
        };

        if (img) {
            if (img.complete) {
                adjustAndCenter();
            } else {
                img.addEventListener('load', adjustAndCenter);
            }
        }

        // Handle window resize to keep it responsive
        window.addEventListener('resize', adjustAndCenter);
    }

    // ==========================================
    // Register & Inquiry Hub (活動報名處串接)
    // ==========================================
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycby3lHPs1qd6CxDp_1qTIh1Ipvo-z9oiIg1WlTl6ksoRoXbsK0jZ1Fvi1jjLxisqtjs_/exec";

    // 萬能 JSONP 請求發送器：徹底解決 Google Apps Script 302 重導向帶來的 CORS 假性網路錯誤
    function requestJSONP(url, successCallback, errorCallback) {
        const callbackName = 'gasCallback_' + Math.round(100000 * Math.random());

        // 全域掛載回呼函式
        window[callbackName] = function (data) {
            successCallback(data);
            // 執行後清理，避免佔用記憶體
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };

        // 建立動態 script 標籤繞過 CORS
        const script = document.createElement('script');
        const separator = url.includes('?') ? '&' : '?';
        script.src = `${url}${separator}callback=${callbackName}`;

        // 異常處理
        script.onerror = function () {
            errorCallback();
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };

        document.body.appendChild(script);
    }

    // 分頁切換功能 (掛載到 window 以供 HTML onclick 呼叫)
    window.switchTab = function (tabName) {
        const tabs = ['reg', 'pay', 'query'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`tab-${tab}`);
            const content = document.getElementById(`content-${tab}`);
            if (btn && content) {
                if (tab === tabName) {
                    btn.classList.add('active');
                    content.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    content.classList.add('hidden');
                }
            }
        });
        hideMessage();
    };

    function showMessage(text, isError = false) {
        const msgDiv = document.getElementById('hub-message');
        if (msgDiv) {
            msgDiv.innerText = text;
            msgDiv.className = `hub-message ${isError ? 'error' : 'success'}`;
            msgDiv.classList.remove('hidden');
        }
    }

    function hideMessage() {
        const msgDiv = document.getElementById('hub-message');
        if (msgDiv) {
            msgDiv.classList.add('hidden');
        }
    }

    // 複製匯款帳號
    window.copyBankAccount = function () {
        const accountNum = document.getElementById('bank-account-num');
        if (accountNum) {
            // 動態複製文字內容，並移除非數字字元以提供乾淨的帳號供匯款使用
            const textToCopy = accountNum.innerText.replace(/-/g, '').trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                const isEn = document.body.classList.contains('lang-en');
                alert(isEn ? "Remittance account copied successfully!" : "活動匯款帳號已成功複製到剪貼簿！");
            }).catch(err => {
                console.error("複製失敗：", err);
            });
        }
    };

    // 關閉自訂彈出視窗並進行超體貼的 Tab 自動跳轉
    window.closeModal = function (type) {
        if (type === 'reg') {
            const modal = document.getElementById('reg-success-modal');
            if (modal) modal.classList.add('hidden');

            const regNationality = document.getElementById('reg-nationality');
            const isDomestic = regNationality ? (regNationality.value === '本國人') : true;

            if (isDomestic) {
                // 本國人自動將 Tabs 切換至「2. 匯款登記」
                switchTab('pay');

                // 自動把剛才報名的 Email 填入登記欄位
                const regEmail = document.getElementById('reg-email');
                const payEmail = document.getElementById('pay-email');
                if (regEmail && payEmail) {
                    payEmail.value = regEmail.value;
                }
            } else {
                // 外國人直接跳轉至「3. 狀態查詢」，避免多餘的匯款登記動作
                switchTab('query');

                // 自動把 Email 填入查詢欄位
                const regEmail = document.getElementById('reg-email');
                const queryEmail = document.getElementById('query-email');
                if (regEmail && queryEmail) {
                    queryEmail.value = regEmail.value;
                }
            }
        } else if (type === 'pay') {
            const modal = document.getElementById('pay-success-modal');
            if (modal) modal.classList.add('hidden');

            // 自動將 Tabs 切換至「3. 狀態查詢」
            switchTab('query');

            // 自動把 Email 帶入查詢輸入框
            const payEmail = document.getElementById('pay-email');
            const queryEmail = document.getElementById('query-email');
            if (payEmail && queryEmail) {
                queryEmail.value = payEmail.value;
            }
        }
    };

    // 當國籍選擇「外國人」時，動態更新交通方式的選項
    const regNationality = document.getElementById('reg-nationality');
    const regTransportation = document.getElementById('reg-transportation');

    if (regNationality && regTransportation) {
        const updateTransportationOptions = () => {
            const currentValue = regTransportation.value;
            regTransportation.innerHTML = '';

            if (regNationality.value === '外國人') {
                // 外國人選項：自行前往、西門交通車(遊覽車)
                const optSelf = document.createElement('option');
                optSelf.value = '自行前往';
                optSelf.text = 'Self-drive (NT$1,000)';

                const optXimen = document.createElement('option');
                optXimen.value = '西門遊覽車'; // 寫入資料庫為 '西門遊覽車'
                optXimen.text = 'Event Fee (NT$1,000) & Ximen Bus (NT$250)';

                regTransportation.add(optSelf);
                regTransportation.add(optXimen);

                if (currentValue === '自行前往' || currentValue === '西門遊覽車') {
                    regTransportation.value = currentValue;
                } else {
                    regTransportation.value = '自行前往';
                }
            } else {
                // 本國人選項：自行前往、台中遊覽車、新竹遊覽車、西門遊覽車
                const optSelf = document.createElement('option');
                optSelf.value = '自行前往';
                optSelf.text = '自行前往 (NT$1,000) / Self-drive (NT$1,000)';

                const optTaichung = document.createElement('option');
                optTaichung.value = '台中遊覽車';
                optTaichung.text = '台中出發遊覽車 (NT$1,400) / Taichung Bus (NT$1,400)';

                const optHsinchu = document.createElement('option');
                optHsinchu.value = '新竹遊覽車';
                optHsinchu.text = '新竹出發遊覽車 (NT$1,300) / Hsinchu Bus (NT$1,300)';

                const optXimen = document.createElement('option');
                optXimen.value = '西門遊覽車';
                optXimen.text = '西門出發遊覽車 (NT$1,250) / Ximen Bus (NT$1,250)';

                regTransportation.add(optSelf);
                regTransportation.add(optTaichung);
                regTransportation.add(optHsinchu);
                regTransportation.add(optXimen);

                if (['自行前往', '台中遊覽車', '新竹遊覽車', '西門遊覽車'].includes(currentValue)) {
                    regTransportation.value = currentValue;
                } else {
                    regTransportation.value = '自行前往';
                }
            }
        };
        regNationality.addEventListener('change', updateTransportationOptions);
        updateTransportationOptions(); // 初始化狀態判定
    }

    // 1. 活動報名表單串接 (送出 暱稱、Email、國籍、交通方式)
    const hubRegForm = document.getElementById('form-registration');
    if (hubRegForm) {
        hubRegForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideMessage();

            const submitBtn = document.getElementById('btn-reg-submit');
            const originalText = submitBtn.innerHTML;
            const isEn = document.body.classList.contains('lang-en');

            submitBtn.disabled = true;
            submitBtn.innerHTML = isEn ? '<i class="ph ph-spinner ph-spin"></i> Registering...' : '<i class="ph ph-spinner ph-spin"></i> 報名資料傳送中...';

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const nationality = document.getElementById('reg-nationality').value;
            const transportation = document.getElementById('reg-transportation').value;

            const requestUrl = `${GAS_API_URL}?action=register` +
                `&name=${encodeURIComponent(name)}` +
                `&email=${encodeURIComponent(email)}` +
                `&phone=${encodeURIComponent(phone)}` +
                `&nationality=${encodeURIComponent(nationality)}` +
                `&transportation=${encodeURIComponent(transportation)}`;

            requestJSONP(requestUrl, (result) => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                if (result.status === 'success') {
                    // 直接彈出精美的成功 Modal
                    const successModal = document.getElementById('reg-success-modal');
                    if (successModal) {
                        successModal.classList.remove('hidden');

                        // 根據國籍動態隱藏/顯示匯款箱與提示
                        const isDomestic = (nationality === '本國人');
                        const descDomestic = document.getElementById('reg-success-desc-domestic');
                        const descInternational = document.getElementById('reg-success-desc-international');
                        const bankBox = document.getElementById('reg-success-bank-box');
                        const alertBox = document.getElementById('reg-success-alert-box');
                        const btnTextDomestic = successModal.querySelectorAll('.btn-text-domestic');
                        const btnTextInternational = successModal.querySelectorAll('.btn-text-international');

                        if (isDomestic) {
                            successModal.classList.remove('force-en');
                            if (descDomestic) descDomestic.classList.remove('hidden');
                            if (descInternational) descInternational.classList.add('hidden');
                            if (bankBox) bankBox.classList.remove('hidden');
                            if (alertBox) alertBox.classList.remove('hidden');
                            btnTextDomestic.forEach(el => el.classList.remove('hidden'));
                            btnTextInternational.forEach(el => el.classList.add('hidden'));

                            // 寫入回傳的匯款帳號資訊
                            const bankName = document.getElementById('bank-name');
                            const bankAccName = document.getElementById('bank-account-name');
                            const bankAccNum = document.getElementById('bank-account-num');
                            if (bankName) bankName.innerText = result.data.bankInfo.bankName;
                            if (bankAccName) bankAccName.innerText = result.data.bankInfo.accountName;
                            if (bankAccNum) bankAccNum.innerText = result.data.bankInfo.accountNumber;
                        } else {
                            successModal.classList.add('force-en');
                            if (descDomestic) descDomestic.classList.add('hidden');
                            if (descInternational) descInternational.classList.remove('hidden');
                            if (bankBox) bankBox.classList.add('hidden');
                            if (alertBox) alertBox.classList.add('hidden');
                            btnTextDomestic.forEach(el => el.classList.add('hidden'));
                            btnTextInternational.forEach(el => el.classList.remove('hidden'));
                        }
                    }
                } else {
                    showMessage(result.message, true);
                }
            }, () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                showMessage(isEn ? "Connection error. Please try again." : "網路通訊異常，請稍後重試，或聯繫客服人員。", true);
            });
        });
    }

    // 2. 匯款後五碼登記表單串接 (自動串接「銀行代碼-後五碼」後送出)
    const hubPayForm = document.getElementById('form-payment');
    if (hubPayForm) {
        hubPayForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideMessage();

            const submitBtn = document.getElementById('btn-pay-submit');
            const originalText = submitBtn.innerHTML;
            const isEn = document.body.classList.contains('lang-en');

            submitBtn.disabled = true;
            submitBtn.innerHTML = isEn ? '<i class="ph ph-spinner ph-spin"></i> Submitting...' : '<i class="ph ph-spinner ph-spin"></i> 匯款紀錄對帳中...';

            const email = document.getElementById('pay-email').value;
            const bankCode = document.getElementById('pay-bank-code').value;
            const digits = document.getElementById('pay-digits').value;

            // 串接格式：銀行代碼-後五碼 (如 822-12345)
            const concatenatedDigits = `${bankCode}-${digits}`;

            const requestUrl = `${GAS_API_URL}?action=submitPayment` +
                `&email=${encodeURIComponent(email)}` +
                `&lastFiveDigits=${encodeURIComponent(concatenatedDigits)}`;

            requestJSONP(requestUrl, (result) => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                if (result.status === 'success') {
                    // 直接彈出精美成功 Modal
                    const successModal = document.getElementById('pay-success-modal');
                    if (successModal) {
                        successModal.classList.remove('hidden');
                    }
                } else {
                    showMessage(result.message, true);
                }
            }, () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                showMessage(isEn ? "Failed to connect to the database. Please try again." : "網路連線失敗，請確認網路狀態後重新送出。", true);
            });
        });
    }

    // 3. 狀態與座位查詢表單串接 (新增國籍與交通方式展示，支援雙語狀態映射)
    const hubQueryForm = document.getElementById('form-query');
    if (hubQueryForm) {
        hubQueryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideMessage();

            const submitBtn = document.getElementById('btn-query-submit');
            const originalText = submitBtn.innerHTML;
            const resultCard = document.getElementById('query-result-card');
            const isEn = document.body.classList.contains('lang-en');

            if (resultCard) resultCard.classList.add('hidden');

            submitBtn.disabled = true;
            submitBtn.innerHTML = isEn ? '<i class="ph ph-spinner ph-spin"></i> Searching...' : '<i class="ph ph-spinner ph-spin"></i> 資料庫檢索中...';

            const email = document.getElementById('query-email').value;
            const requestUrl = `${GAS_API_URL}?action=queryStatus&email=${encodeURIComponent(email)}`;

            requestJSONP(requestUrl, (result) => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                if (result.status === 'success') {
                    const qName = document.getElementById('q-result-name');
                    const qNationality = document.getElementById('q-result-nationality');
                    const qEmail = document.getElementById('q-result-email');
                    const qPhone = document.getElementById('q-result-phone');
                    const qTransportation = document.getElementById('q-result-transportation');
                    const qDigits = document.getElementById('q-result-digits');
                    const qStatus = document.getElementById('q-result-status');
                    const qTable = document.getElementById('q-result-table');

                    const isCurrentEn = document.body.classList.contains('lang-en');

                    // 填入基礎資料
                    if (qName) qName.innerText = result.data.name;
                    if (qEmail) qEmail.innerText = result.data.email;
                    if (qPhone) qPhone.innerText = result.data.phone || (isCurrentEn ? 'None' : '無');
                    if (qDigits) qDigits.innerText = result.data.lastFiveDigits || (isCurrentEn ? 'Not registered' : '尚未登記');

                    // 填入國籍與交通方式 (新增項目)
                    if (qNationality) {
                        const nat = result.data.nationality || '本國人';
                        qNationality.innerText = isCurrentEn ? (nat === '本國人' ? 'Domestic' : 'International') : nat;
                    }
                    if (qTransportation) {
                        const trans = result.data.transportation || '自行前往';
                        const nat = result.data.nationality || '本國人';
                        let transText = trans;
                        if (isCurrentEn) {
                            if (trans === '自行前往') transText = 'Self-drive';
                            else if (trans === '台中遊覽車') transText = 'Taichung Bus';
                            else if (trans === '新竹遊覽車') transText = 'Hsinchu Bus';
                            else if (trans === '西門遊覽車') {
                                transText = (nat === '外國人') ? 'Ximen Shuttle Bus' : 'Ximen Bus';
                            }
                        } else {
                            if (trans === '西門遊覽車' && nat === '外國人') {
                                transText = '西門交通車(遊覽車)';
                            }
                        }
                        qTransportation.innerText = transText;
                    }

                    // 匯款狀態對照翻譯
                    if (qStatus) {
                        let statusText = result.data.paymentStatus;
                        if (isCurrentEn) {
                            if (statusText === '未匯款') statusText = 'Unpaid';
                            else if (statusText === '已登記(待對帳)') statusText = 'Awaiting Reconciliation';
                            else if (statusText === '已確認收款') statusText = 'Confirmed';
                        }
                        qStatus.innerText = statusText;

                        // 清除舊有的 status-xxx class，並加上對應顏色的 class
                        qStatus.className = 'badge';
                        qStatus.classList.add(`status-${result.data.paymentStatus.split('(')[0]}`);
                    }

                    // 桌次分配翻譯
                    if (qTable) {
                        let tableText = result.data.tableNumber || '尚未分配';
                        if (isCurrentEn && tableText === '尚未分配') {
                            tableText = 'Not Assigned';
                        }
                        qTable.innerText = tableText;
                    }

                    if (resultCard) resultCard.classList.remove('hidden');
                } else {
                    showMessage(result.message, true);
                }
            }, () => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                showMessage(isEn ? "Failed to retrieve status. Please try again." : "網路查詢異常，請重新嘗試。", true);
            });
        });
    }

    // ==========================================
    // 中英雙語切換功能 (Bilingual Language Switcher)
    // ==========================================
    const langToggleBtn = document.getElementById('lang-toggle');

    // 銀行代碼中英文名稱對照表 (Major banks translations)
    const bankTranslations = {
        "zh": {
            "004": "臺灣銀行", "005": "土地銀行", "006": "合作金庫商業銀行", "007": "第一商業銀行",
            "008": "華南商業銀行", "009": "彰化商業銀行", "011": "上海商業儲蓄銀行", "012": "台北富邦商業銀行",
            "013": "國泰世華商業銀行", "016": "高雄銀行", "017": "兆豐國際商業銀行", "018": "全國農業金庫",
            "020": "日商瑞穗實業銀行", "021": "花旗(台灣)商業銀行", "022": "美商美國銀行", "023": "泰國盤谷銀行",
            "039": "澳商澳盛銀行", "048": "王道商業銀行", "050": "台灣中小企業銀行", "052": "渣打國際商業銀行",
            "053": "台中商業銀行", "054": "京城商業銀行", "081": "匯豐(台灣)商業銀行", "101": "瑞興商業銀行",
            "102": "華泰商業銀行", "103": "臺灣新光商業銀行", "108": "陽信商業銀行", "118": "板信商業銀行",
            "147": "三信商業銀行", "600": "農漁會資金", "700": "中華郵政", "803": "聯邦商業銀行",
            "805": "遠東國際商業銀行", "806": "元大商業銀行", "807": "永豐商業銀行", "808": "玉山商業銀行",
            "809": "凱基商業銀行", "810": "星展(台灣)商業銀行", "812": "台新國際商業銀行", "816": "安泰商業銀行",
            "822": "中國信託商業銀行", "823": "將來商業銀行", "824": "連線商業銀行 (LINE Bank)", "826": "樂天國際商業銀行",
            "950": "樂天信用卡", "999": "其他銀行/信用合作社"
        },
        "en": {
            "004": "Bank of Taiwan", "005": "Land Bank of Taiwan", "006": "Taiwan Cooperative Bank", "007": "First Commercial Bank",
            "008": "Hua Nan Commercial Bank", "009": "Chang Hwa Commercial Bank", "011": "Shanghai Commercial & Savings Bank", "012": "Taipei Fubon Bank",
            "013": "Cathay United Bank", "016": "Bank of Kaohsiung", "017": "Mega International Commercial Bank", "018": "Agricultural Bank of Taiwan",
            "020": "Mizuho Bank", "021": "Citibank Taiwan", "022": "Bank of America", "023": "Bangkok Bank",
            "039": "ANZ Bank", "048": "O-Bank", "050": "Taiwan Business Bank", "052": "Standard Chartered Bank",
            "053": "Taichung Commercial Bank", "054": "King's Town Bank", "081": "HSBC Bank Taiwan", "101": "Taipei Star Bank (瑞興)",
            "102": "Hwatai Bank", "103": "Shin Kong Commercial Bank", "108": "Sunny Bank", "118": "Bank of Panshin",
            "147": "Cota Commercial Bank", "600": "Farmers & Fishermen Association", "700": "Chunghwa Post", "803": "Union Bank of Taiwan",
            "805": "Far Eastern International Bank", "806": "Yuanta Commercial Bank", "807": "Bank SinoPac", "808": "E.SUN Commercial Bank",
            "809": "KGI Bank", "810": "DBS Bank Taiwan", "812": "Taishin International Bank", "816": "Entie Commercial Bank",
            "822": "CTBC Bank", "823": "Next Bank", "824": "LINE Bank", "826": "Rakuten International Bank",
            "950": "Rakuten Card", "999": "Other Bank/Credit Cooperative"
        }
    };

    function setLanguage(lang) {
        if (lang === 'en') {
            document.body.classList.add('lang-en');
            if (langToggleBtn) langToggleBtn.innerText = '中';
            updatePlaceholders('en');
        } else {
            document.body.classList.remove('lang-en');
            if (langToggleBtn) langToggleBtn.innerText = 'EN';
            updatePlaceholders('zh');
        }
        localStorage.setItem('bearwave-lang', lang);

        // 翻譯銀行代碼下拉選單 (Translate bank options)
        const bankSelect = document.getElementById('pay-bank-code');
        if (bankSelect) {
            Array.from(bankSelect.options).forEach(opt => {
                const code = opt.value;
                if (bankTranslations[lang] && bankTranslations[lang][code]) {
                    opt.text = `${code} - ${bankTranslations[lang][code]}`;
                } else if (lang === 'en') {
                    // 針對地方信用合作社/農會信用部做關鍵字英文替代
                    let name = opt.text;
                    name = name.replace("信用合作社", " Credit Co.");
                    name = name.replace("信合社", " Credit Co.");
                    name = name.replace("農會", " Farmers Assoc.");
                    name = name.replace("漁會", " Fishermen Assoc.");
                    name = name.replace("辦事處", " Office");
                    opt.text = name;
                } else if (lang === 'zh') {
                    // 若是切換回中文，但因開源JSON自帶中文所以無須再次回復，主要的銀行代碼在上面第一個if會被回復為 bankTranslations['zh'][code]
                }
            });
        }

        // 如果查詢結果票卡目前是打開的，強制重新觸發查詢欄位翻譯
        const resultCard = document.getElementById('query-result-card');
        if (resultCard && !resultCard.classList.contains('hidden')) {
            const qStatus = document.getElementById('q-result-status');
            const qTable = document.getElementById('q-result-table');
            const qDigits = document.getElementById('q-result-digits');
            const qNationality = document.getElementById('q-result-nationality');
            const qPhone = document.getElementById('q-result-phone');
            const qTransportation = document.getElementById('q-result-transportation');

            const isEnNow = (lang === 'en');

            // 語系切換時動態轉譯票卡文字
            if (qPhone && (qPhone.innerText === '無' || qPhone.innerText === 'None')) {
                qPhone.innerText = isEnNow ? 'None' : '無';
            }
            if (qDigits && (qDigits.innerText === '尚未登記' || qDigits.innerText === 'Not registered')) {
                qDigits.innerText = isEnNow ? 'Not registered' : '尚未登記';
            }
            if (qNationality) {
                const natVal = qNationality.innerText;
                if (isEnNow && natVal === '本國人') qNationality.innerText = 'Domestic';
                else if (isEnNow && natVal === '外國人') qNationality.innerText = 'International';
                else if (!isEnNow && natVal === 'Domestic') qNationality.innerText = '本國人';
                else if (!isEnNow && natVal === 'International') qNationality.innerText = '外國人';
            }
            if (qTransportation) {
                const transVal = qTransportation.innerText;
                const natVal = qNationality ? qNationality.innerText : '';
                const isForeigner = (natVal === '外國人' || natVal === 'International');

                if (isEnNow) {
                    if (transVal === '自行前往') qTransportation.innerText = 'Self-drive';
                    else if (transVal === '台中遊覽車') qTransportation.innerText = 'Taichung Bus';
                    else if (transVal === '新竹遊覽車') qTransportation.innerText = 'Hsinchu Bus';
                    else if (transVal === '西門遊覽車' || transVal === '西門交通車(遊覽車)') {
                        qTransportation.innerText = isForeigner ? 'Ximen Shuttle Bus' : 'Ximen Bus';
                    }
                } else {
                    if (transVal === 'Self-drive') qTransportation.innerText = '自行前往';
                    else if (transVal === 'Taichung Bus') qTransportation.innerText = '台中遊覽車';
                    else if (transVal === 'Hsinchu Bus') qTransportation.innerText = '新竹遊覽車';
                    else if (transVal === 'Ximen Bus') qTransportation.innerText = '西門遊覽車';
                    else if (transVal === 'Ximen Shuttle Bus') qTransportation.innerText = '西門交通車(遊覽車)';
                }
            }
            if (qStatus) {
                const statVal = qStatus.innerText;
                if (isEnNow) {
                    if (statVal === '未匯款') qStatus.innerText = 'Unpaid';
                    else if (statVal === '已登記(待對帳)') qStatus.innerText = 'Awaiting Reconciliation';
                    else if (statVal === '已確認收款') qStatus.innerText = 'Confirmed';
                } else {
                    if (statVal === 'Unpaid') qStatus.innerText = '未匯款';
                    else if (statVal === 'Awaiting Reconciliation') qStatus.innerText = '已登記(待對帳)';
                    else if (statVal === 'Confirmed') qStatus.innerText = '已確認收款';
                }
            }
            if (qTable && (qTable.innerText === '尚未分配' || qTable.innerText === 'Not Assigned')) {
                qTable.innerText = isEnNow ? 'Not Assigned' : '尚未分配';
            }
        }
    }

    function updatePlaceholders(lang) {
        const regName = document.getElementById('reg-name');
        const regEmail = document.getElementById('reg-email');
        const regPhone = document.getElementById('reg-phone');
        const payEmail = document.getElementById('pay-email');
        const payDigits = document.getElementById('pay-digits');
        const queryEmail = document.getElementById('query-email');

        if (lang === 'en') {
            if (regName) regName.placeholder = 'Please enter your nickname';
            if (regEmail) regEmail.placeholder = 'Please enter your email';
            if (regPhone) regPhone.placeholder = 'Enter last 4 digits of your phone';
            if (payEmail) payEmail.placeholder = 'Please enter your registered email';
            if (payDigits) payDigits.placeholder = 'Please enter last 5 digits';
            if (queryEmail) queryEmail.placeholder = 'Please enter your registered email';
        } else {
            if (regName) regName.placeholder = '請輸入您的暱稱';
            if (regEmail) regEmail.placeholder = '請輸入您的 Email';
            if (regPhone) regPhone.placeholder = '請輸入您的手機後四碼';
            if (payEmail) payEmail.placeholder = '請輸入您報名時填寫的 Email';
            if (payDigits) payDigits.placeholder = '請輸入 5 位數字';
            if (queryEmail) queryEmail.placeholder = '請輸入您報名時的 Email';
        }
    }

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const currentLang = document.body.classList.contains('lang-en') ? 'zh' : 'en';
            setLanguage(currentLang);
        });
    }

    // 從 localStorage 載入儲存的語系偏好，若無則預設為中文
    const savedLang = localStorage.getItem('bearwave-lang') || 'zh';
    setLanguage(savedLang);

    // Toggle Terms & Conditions Accordion
    const btnToggleTerms = document.getElementById('btn-toggle-terms');
    const accordionTerms = document.getElementById('accordion-terms');
    const termsArrow = document.getElementById('terms-arrow');

    if (btnToggleTerms && accordionTerms && termsArrow) {
        btnToggleTerms.addEventListener('click', () => {
            const isHidden = accordionTerms.classList.contains('hidden');
            if (isHidden) {
                accordionTerms.classList.remove('hidden');
                termsArrow.classList.add('rotated');
            } else {
                accordionTerms.classList.add('hidden');
                termsArrow.classList.remove('rotated');
            }
        });
    }

});
