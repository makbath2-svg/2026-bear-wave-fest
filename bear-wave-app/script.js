document.addEventListener('DOMContentLoaded', () => {

    // 全域自訂 Toast 提示系統 (取代瀏覽器原生 alert，防範水槍滑鼠圖示消失)
    window.showToast = function (message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 10000; display: flex; flex-direction: column; gap: 12px; pointer-events: none;';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconHtml = '<i class="ph ph-info" style="font-size:1.25rem; vertical-align:middle; margin-right:8px;"></i>';
        let bgStyle = 'rgba(255, 255, 255, 0.95)';
        let borderStyle = '4px solid var(--bear-rust)';
        let colorStyle = 'var(--text-main)';
        
        if (type === 'success') {
            iconHtml = '<i class="ph ph-check-circle" style="font-size:1.25rem; vertical-align:middle; margin-right:8px;"></i>';
            bgStyle = 'rgba(232, 245, 233, 0.96)';
            borderStyle = '4px solid #4caf50';
            colorStyle = '#1b5e20';
        } else if (type === 'error') {
            iconHtml = '<i class="ph ph-x-circle" style="font-size:1.25rem; vertical-align:middle; margin-right:8px;"></i>';
            bgStyle = 'rgba(255, 235, 235, 0.96)';
            borderStyle = '4px solid #ef5350';
            colorStyle = '#c62828';
        } else if (type === 'warning') {
            iconHtml = '<i class="ph ph-warning" style="font-size:1.25rem; vertical-align:middle; margin-right:8px;"></i>';
            bgStyle = 'rgba(255, 248, 225, 0.96)';
            borderStyle = '4px solid #ffca28';
            colorStyle = '#e65100';
        }
        
        toast.style.cssText = `
            background: ${bgStyle};
            border-left: ${borderStyle};
            color: ${colorStyle};
            padding: 14px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            font-weight: 600;
            font-size: 0.95rem;
            pointer-events: auto;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(0,0,0,0.05);
            border-left: ${borderStyle};
        `;
        
        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        container.appendChild(toast);
        
        // 動畫顯示
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // 3.5秒後淡出移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    };
    
    // 全域覆寫 window.alert，串接自訂 Toast 通知
    window.alert = function (message) {
        let type = 'info';
        if (message.indexOf('成功') > -1 || message.indexOf('Success') > -1 || message.indexOf('建立') > -1 || message.indexOf('核銷') > -1) {
            type = 'success';
        } else if (message.indexOf('失敗') > -1 || message.indexOf('錯誤') > -1 || message.indexOf('不正確') > -1 || message.indexOf('空白') > -1 || message.indexOf('重複') > -1 || message.indexOf('Error') > -1 || message.indexOf('無效') > -1 || message.indexOf('未通過') > -1) {
            type = 'error';
        } else if (message.indexOf('警告') > -1 || message.indexOf('提醒') > -1 || message.indexOf('注意') > -1 || message.indexOf('先前已') > -1) {
            type = 'warning';
        }
        window.showToast(message, type);
    };

    // 在 Modal 底部按紐左側顯示錯誤訊息，取代原本的彈窗 (對應用戶需求)
    window.showModalError = function (message) {
        let errorSpan = null;
        const groupModal = document.getElementById("group-table-editor-modal");
        if (groupModal && !groupModal.classList.contains("hidden")) {
            errorSpan = document.getElementById("group-editor-error-msg");
        } else {
            errorSpan = document.getElementById("editor-error-msg");
        }

        if (errorSpan) {
            errorSpan.innerText = message;
            errorSpan.style.display = "inline";
            
            // 4 秒後自動消失
            if (window.modalErrorTimeout) clearTimeout(window.modalErrorTimeout);
            window.modalErrorTimeout = setTimeout(() => {
                errorSpan.style.display = "none";
            }, 4000);
        } else {
            // 降級處理
            window.showToast(message, "error");
        }
    };

    // 精美自訂確認視窗 (代替原生 confirm，解決滑鼠水槍消失問題)
    window.showCustomConfirm = function (message, onConfirm, onCancel) {
        // 1. 防重複防卡死：若畫面上已有自訂確認視窗，先將其移除
        const existing = document.getElementById("custom-confirm-overlay");
        if (existing) {
            existing.remove();
        }

        // 2. 移除當前觸發按鈕的焦點，避免按 Enter 時重複觸發點擊
        if (document.activeElement) {
            document.activeElement.blur();
        }

        const overlay = document.createElement("div");
        overlay.id = "custom-confirm-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 12000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.2s ease;
        `;
        
        const card = document.createElement("div");
        card.className = "modal-card modal-card-small";
        card.style.cssText = `
            background: #ffffff;
            border-radius: 16px;
            padding: 28px;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.2s ease;
            border: 1px solid var(--border-color);
        `;
        
        const isEn = document.body.classList.contains("lang-en");
        card.innerHTML = `
            <div style="font-size: 3rem; color: var(--bear-rust); margin-bottom: 16px; line-height: 1;">
                <i class="ph ph-warning-circle"></i>
            </div>
            <h4 style="margin: 0 0 12px 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main);">
                ${isEn ? "Action Confirmation" : "請確認此操作"}
            </h4>
            <p style="margin: 0 0 24px 0; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; white-space: pre-line;">
                ${message}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button type="button" id="custom-confirm-btn-yes" class="btn" style="background: #d32f2f; border-color: #d32f2f; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    ${isEn ? "Confirm" : "確定"}
                </button>
                <button type="button" id="custom-confirm-btn-no" class="btn btn-outline" style="padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted);">
                    ${isEn ? "Cancel" : "取消"}
                </button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = "1";
            card.style.transform = "scale(1)";
        }, 10);
        
        const closeConfirm = () => {
            overlay.style.opacity = "0";
            card.style.transform = "scale(0.9)";
            document.removeEventListener("keydown", keyHandler, true);
            setTimeout(() => {
                overlay.remove();
            }, 200);
        };
        
        // 3. 鍵盤事件監聽：按 Enter 鍵確定、按 Esc 鍵取消
        const keyHandler = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                closeConfirm();
                if (onConfirm) onConfirm();
            } else if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeConfirm();
                if (onCancel) onCancel();
            }
        };
        document.addEventListener("keydown", keyHandler, true);
        
        document.getElementById("custom-confirm-btn-yes").onclick = () => {
            closeConfirm();
            if (onConfirm) onConfirm();
        };
        
        document.getElementById("custom-confirm-btn-no").onclick = () => {
            closeConfirm();
            if (onCancel) onCancel();
        };
    };

    // --- 快速選擇已付款學員選單系統 (解決輸入繁瑣問題 & 兼顧個資防盜拉人安全) ---
    let pickerTargetIndex = -1;
    let pickerIsEdit = false;
    window.unassignedMembers = []; // 快取未分桌的已付款人員名單

    // 開啟選人對話框
    window.openMemberPicker = function (index, isEdit = false) {
        pickerTargetIndex = index;
        pickerIsEdit = isEdit;
        
        const isEn = document.body.classList.contains("lang-en");
        const listContainer = document.getElementById("member-picker-list");
        const searchInput = document.getElementById("member-picker-search");
        
        if (searchInput) searchInput.value = "";
        
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="ph ph-spinner ph-spin" style="font-size: 1.5rem; display: block; margin: 0 auto 8px auto;"></i>
                    <span>${isEn ? "Fetching members..." : "讀取未分桌名單中..."}</span>
                </div>
            `;
        }
        
        // 顯示 Modal
        const pickerModal = document.getElementById("member-picker-modal");
        if (pickerModal) pickerModal.classList.remove("hidden");
        
        // 向後端 API 獲取最新已付款未分桌名單
        const requestUrl = `${GAS_API_URL}?action=getPaidUnassignedMembers`;
        requestJSONP(requestUrl, (result) => {
            if (result.status === "success") {
                window.unassignedMembers = result.members;
                renderPickerMembers();
            } else {
                if (listContainer) listContainer.innerHTML = `<div style="text-align:center; color:#d32f2f; padding:20px;">${result.message}</div>`;
            }
        }, () => {
            if (listContainer) listContainer.innerHTML = `<div style="text-align:center; color:#d32f2f; padding:20px;">${isEn ? "Network Error" : "網路載入失敗"}</div>`;
        });
    };

    // 渲染選人清單 (隱藏手機尾數，防止個資洩漏)
    window.renderPickerMembers = function (filterKeyword = "") {
        const listContainer = document.getElementById("member-picker-list");
        if (!listContainer) return;
        
        const isEn = document.body.classList.contains("lang-en");
        listContainer.innerHTML = "";
        
        // 蒐集目前 Modal 裡已經被選取/填入的 Email (防止同一次操作重複選擇同一個人)
        const currentInputs = {};
        for (let j = 1; j <= 10; j++) {
            const elCreate = document.getElementById(`email-field-${j}`);
            if (elCreate && elCreate.value.trim()) {
                currentInputs[elCreate.value.trim().toLowerCase()] = true;
            }
            const elEdit = document.getElementById(`edit-email-${j}`);
            if (elEdit && elEdit.value.trim()) {
                currentInputs[elEdit.value.trim().toLowerCase()] = true;
            }
        }
        
        const keyword = filterKeyword.trim().toLowerCase();
        const filtered = window.unassignedMembers.filter(m => {
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.email.toLowerCase().indexOf(keyword) > -1;
        });
        
        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${isEn ? "No match found" : "查無符合條件的學員"}</div>`;
            return;
        }
        
        filtered.forEach(member => {
            const isAlreadyChosen = !!currentInputs[member.email.toLowerCase()];
            
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "member-picker-item";
            btn.style.cssText = `
                width: 100%;
                text-align: left;
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: ${isAlreadyChosen ? '#f9f9f9' : '#ffffff'};
                cursor: ${isAlreadyChosen ? 'not-allowed' : 'pointer'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
                opacity: ${isAlreadyChosen ? '0.6' : '1'};
                border-left: 4px solid ${isAlreadyChosen ? 'var(--border-color)' : 'var(--bear-rust)'};
            `;
            
            if (!isAlreadyChosen) {
                btn.onmouseenter = () => {
                    btn.style.borderColor = 'var(--bear-rust)';
                    btn.style.background = 'rgba(255, 127, 80, 0.03)';
                };
                btn.onmouseleave = () => {
                    btn.style.borderColor = 'var(--border-color)';
                    btn.style.background = '#ffffff';
                };
                btn.onclick = () => {
                    selectPickerMember(member.email);
                };
            }
            
            btn.innerHTML = `
                <div style="text-align: left;">
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(member.name)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace; margin-top: 2px;">${escapeHtml(member.email)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.8rem; background: rgba(46, 125, 50, 0.08); color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-weight:600;">已繳費已對帳</span>
                    ${isAlreadyChosen ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">${isEn ? 'Added' : '已在名單中'}</span>` : ''}
                </div>
            `;
            
            listContainer.appendChild(btn);
        });
    };

    // 關鍵字搜尋過濾
    window.filterPickerMembers = function () {
        const searchInput = document.getElementById("member-picker-search");
        if (searchInput) {
            renderPickerMembers(searchInput.value);
        }
    };

    // 點選學員自動帶入 Email，清空手機並讓使用者手動輸入 (兼顧個資與方便性)
    window.selectPickerMember = function (email) {
        const prefix = pickerIsEdit ? "edit-email-" : "email-field-";
        const phonePrefix = pickerIsEdit ? "edit-phone-" : "phone-field-";
        const nameDisplayPrefix = pickerIsEdit ? "edit-name-display-" : "name-display-";
        
        const emailField = document.getElementById(`${prefix}${pickerTargetIndex}`);
        const phoneField = document.getElementById(`${phonePrefix}${pickerTargetIndex}`);
        const nameDisplay = document.getElementById(`${nameDisplayPrefix}${pickerTargetIndex}`);
        const row = document.getElementById(`member-row-${pickerTargetIndex}`);
        
        if (emailField) emailField.value = email;
        if (phoneField) {
            phoneField.value = ""; // 清空，要求使用者手動輸入
            phoneField.setAttribute("data-last-phone", "");
        }
        if (emailField) emailField.setAttribute("data-last-email", email);
        
        // 重置為提示輸入手機狀態
        const isEn = document.body.classList.contains("lang-en");
        if (nameDisplay) {
            nameDisplay.innerText = isEn ? "Enter Phone Last 4" : "請輸入手機後四碼";
            nameDisplay.style.color = "var(--bear-rust)";
        }
        if (row) {
            row.classList.remove("row-success", "row-error");
        }
        
        // 關閉選取器
        closeMemberPicker();
        
        // 自動聚焦至手機後四碼輸入框，方便流暢填寫
        if (phoneField) {
            setTimeout(() => {
                phoneField.focus();
            }, 100);
        }
    };

    // 關閉選人對話框
    window.closeMemberPicker = function () {
        const pickerModal = document.getElementById("member-picker-modal");
        if (pickerModal) pickerModal.classList.add("hidden");
    };

    // --- 批次貼上名單系統 (針對一般學員最推薦的快速排桌法) ---
    window.toggleBatchPaste = function (e) {
        if (e) e.preventDefault();
        const container = document.getElementById("batch-paste-container");
        const toggleBtn = document.getElementById("batch-paste-toggle-btn");
        if (container) {
            const isHidden = container.classList.contains("hidden");
            if (isHidden) {
                container.classList.remove("hidden");
                if (toggleBtn) toggleBtn.innerText = "收合選單 / Collapse";
            } else {
                container.classList.add("hidden");
                if (toggleBtn) toggleBtn.innerText = "展開選單 / Expand";
            }
        }
    };

    // 輔助函式：智慧解析單行資料，提取 Email 與 手機後四碼
    function parseLineToEmailAndPhone(line) {
        line = line.trim();
        if (!line) return null;
        
        let email = "";
        let phone = "";
        
        // 1. 嘗試用常見的分隔符號分割 (半/全形逗號、分號、Tab、斜線、直線、減號)
        let parts = line.split(/[,，;；\t/|\\-]/);
        if (parts.length < 2) {
            // 嘗試用空白分割
            parts = line.split(/\s+/);
        }
        
        if (parts.length >= 2) {
            // 掃描所有分割出來的部分，尋找符合 Email 與 4位手機尾數格式的內容 (順序無妨)
            for (let part of parts) {
                part = part.trim();
                if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(part)) {
                    email = part;
                } else if (/^\d{4}$/.test(part)) {
                    phone = part;
                }
            }
        }
        
        // 2. 如果沒找齊 Email 或手機 (例如完全沒有分隔符號的 friend@mail.com1234)，使用正則強行匹配
        if (!email || !phone) {
            const regex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\D*(\d{4})/;
            const match = line.match(regex);
            if (match) {
                email = match[1];
                phone = match[2];
            }
        }
        
        if (email && phone) {
            return { email, phone };
        }
        return null;
    }

    window.applyBatchPaste = function () {
        const textarea = document.getElementById("batch-paste-textarea");
        if (!textarea) return;
        
        const text = textarea.value;
        const lines = text.split("\n");
        const isEn = document.body.classList.contains("lang-en");
        
        let count = 0;
        let slotIndex = 1;
        const batchQueries = [];
        
        lines.forEach(line => {
            if (!line.trim()) return;
            
            const parsed = parseLineToEmailAndPhone(line);
            if (parsed) {
                const email = parsed.email;
                const phone = parsed.phone;
                
                // 尋找下一個可以填入的新建模式欄位
                while (slotIndex <= 10) {
                    const emailField = document.getElementById(`email-field-${slotIndex}`);
                    const phoneField = document.getElementById(`phone-field-${slotIndex}`);
                    
                    if (emailField && phoneField) {
                        // 填入資料並清除快取
                        emailField.value = email;
                        phoneField.value = phone;
                        emailField.setAttribute("data-last-email", "");
                        phoneField.setAttribute("data-last-phone", "");
                        
                        batchQueries.push({ index: slotIndex, email: email, phone: phone });
                        
                        slotIndex++;
                        count++;
                        break;
                    }
                    slotIndex++;
                }
            }
        });
        
        if (count > 0) {
            // 1. 先為所有匯入的欄位開啟載入中狀態 (Spinners)
            batchQueries.forEach(q => {
                const spinner = document.getElementById(`spinner-${q.index}`);
                if (spinner) spinner.classList.remove("hidden");
                const nameDisplay = document.getElementById(`name-display-${q.index}`);
                if (nameDisplay) {
                    nameDisplay.innerText = "-";
                    nameDisplay.style.color = "var(--text-muted)";
                }
                const row = document.getElementById(`member-row-${q.index}`);
                if (row) row.classList.remove("row-success", "row-error");
            });
            
            // 2. 發送單一批次查詢網路請求 (徹底避免擁塞問題)
            const requestUrl = `${GAS_API_URL}?action=verifyBatchMembers&currentTableId=${encodeURIComponent(activeTableId)}&batch=${encodeURIComponent(JSON.stringify(batchQueries))}`;
            requestJSONP(requestUrl, (result) => {
                if (result.status === "success") {
                    result.results.forEach(res => {
                        const spinner = document.getElementById(`spinner-${res.index}`);
                        if (spinner) spinner.classList.add("hidden");
                        
                        const nameDisplay = document.getElementById(`name-display-${res.index}`);
                        const emailField = document.getElementById(`email-field-${res.index}`);
                        const phoneField = document.getElementById(`phone-field-${res.index}`);
                        const row = document.getElementById(`member-row-${res.index}`);
                        
                        if (res.status === "success") {
                            if (nameDisplay) {
                                nameDisplay.innerText = res.name;
                                nameDisplay.style.color = "var(--ocean-dark)";
                            }
                            if (row) row.classList.add("row-success");
                            
                            // 儲存快取
                            if (emailField) emailField.setAttribute("data-last-email", emailField.value.trim());
                            if (phoneField) phoneField.setAttribute("data-last-phone", phoneField.value.trim());
                        } else {
                            if (nameDisplay) {
                                nameDisplay.innerText = res.message;
                                nameDisplay.style.color = "#d32f2f";
                            }
                            if (row) row.classList.add("row-error");
                        }
                    });
                } else {
                    // 整批失敗
                    batchQueries.forEach(q => {
                        const spinner = document.getElementById(`spinner-${q.index}`);
                        if (spinner) spinner.classList.add("hidden");
                        const nameDisplay = document.getElementById(`name-display-${q.index}`);
                        if (nameDisplay) {
                            nameDisplay.innerText = result.message || "批次驗證失敗";
                            nameDisplay.style.color = "#d32f2f";
                        }
                        const row = document.getElementById(`member-row-${q.index}`);
                        if (row) row.classList.add("row-error");
                    });
                }
            }, () => {
                // 網路失敗
                batchQueries.forEach(q => {
                    const spinner = document.getElementById(`spinner-${q.index}`);
                    if (spinner) spinner.classList.add("hidden");
                    const nameDisplay = document.getElementById(`name-display-${q.index}`);
                    if (nameDisplay) {
                        nameDisplay.innerText = isEn ? "Network Error" : "網路查詢失敗";
                        nameDisplay.style.color = "#d32f2f";
                    }
                    const row = document.getElementById(`member-row-${q.index}`);
                    if (row) row.classList.add("row-error");
                });
            });
            
            window.showToast(isEn ? `Successfully imported ${count} members!` : `成功導入 ${count} 位成員資料！`, "success");
            // 收合文字框
            const container = document.getElementById("batch-paste-container");
            const toggleBtn = document.getElementById("batch-paste-toggle-btn");
            if (container) container.classList.add("hidden");
            if (toggleBtn) toggleBtn.innerText = "展開選單 / Expand";
            textarea.value = "";
        } else {
            window.showModalError(isEn ? "No valid data. Format: Email, Phone" : "未偵測到有效的成員資料。格式應為：Email, 手機後四碼");
        }
    };

    // Smooth scrolling for navigation links (排除新分頁開啟的連結)
    document.querySelectorAll('a[href^="#"]:not([target="_blank"])').forEach(anchor => {
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
        const tabRegBtn = document.getElementById('tab-reg');
        if (tabName === 'reg' && tabRegBtn && (tabRegBtn.disabled || tabRegBtn.classList.contains('tab-disabled') || isRegStopped)) {
            const isEn = document.body.classList.contains('lang-en');
            alert(isEn ? "Event registration closed on August 15th! Please use '3. Status' to check your status and table." : "本活動已於 8 月 15 日正式截止報名！已報名者請切換至「3. 狀態查詢」查看對帳狀態與桌次。");
            tabName = 'query'; // 強制導向狀態查詢
        }
        const tabs = ['reg', 'pay', 'query', 'table', 'group'];
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
        if (tabName === 'table') {
            loadTablesGrid();
        } else if (tabName === 'group') {
            loadGroupTablesGrid();
        }
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

            // 自動切換至「3. 狀態查詢」，因為不論是轉帳或線上繳費，最終均至狀態查詢確認狀態
            switchTab('query');

            // 自動把剛才報名的 Email 填入「2. 匯款登記」與「3. 狀態查詢」的欄位中，以方便使用者後續操作
            const regEmail = document.getElementById('reg-email');
            if (regEmail && regEmail.value) {
                const payEmail = document.getElementById('pay-email');
                const queryEmail = document.getElementById('query-email');
                if (payEmail) payEmail.value = regEmail.value;
                if (queryEmail) queryEmail.value = regEmail.value;
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

    // 關閉確認資料彈窗
    window.closeConfirmModal = function () {
        const confirmModal = document.getElementById('reg-confirm-modal');
        if (confirmModal) {
            confirmModal.classList.add('hidden');
        }
    };

    // 確認無誤後，正式送出報名 API
    window.submitConfirmedRegistration = function () {
        window.closeConfirmModal();

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

                    const isDomestic = (nationality === '本國人');
                    if (isDomestic) {
                        successModal.classList.remove('force-en');
                    } else {
                        successModal.classList.add('force-en');
                    }

                    // 顯示報名信箱，方便使用者確認前往收信
                    document.querySelectorAll('.reg-success-email-display').forEach(el => {
                        el.innerText = email;
                    });
                }
            } else {
                showMessage(result.message, true);
            }
        }, () => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            showMessage(isEn ? "Connection error. Please try again." : "網路通訊異常，請稍後重試，或聯繫客服人員。", true);
        });
    };

    // 當國籍選擇「外國人」時，動態更新交通方式的選項
    const regNationality = document.getElementById('reg-nationality');
    const regTransportation = document.getElementById('reg-transportation');

    let ximenBusSoldOut = false; // 西門遊覽車滿額停售旗標
    let hsinchuBusSoldOut = true; // 新竹中壢遊覽車滿額停售旗標
    let taichungBusSoldOut = true; // 台中遊覽車滿額停售旗標
    let flagsLoaded = false;
    let isRegStopped = false; // 活動報名暫停旗標

    const regSubmitBtn = document.getElementById('btn-reg-submit');
    if (regSubmitBtn) {
        regSubmitBtn.disabled = true;
        regSubmitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> <span class="lang-zh">檢查報名狀態中...</span><span class="lang-en">Checking status...</span>';
    }

    const updateRegistrationStoppedUI = (stopped) => {
        flagsLoaded = true;
        isRegStopped = stopped;
        const regNotice = document.getElementById('reg-stopped-notice');
        const regForm = document.getElementById('form-registration');
        const tabRegBtn = document.getElementById('tab-reg');
        const topBanner = document.getElementById('reg-closed-top-banner');

        if (stopped) {
            if (regNotice) regNotice.classList.remove('hidden');
            if (regForm) regForm.classList.add('hidden');
            if (tabRegBtn) {
                tabRegBtn.disabled = true;
                tabRegBtn.classList.add('tab-disabled');
            }
            if (topBanner) topBanner.classList.remove('hidden');
        } else {
            // 若未停止（或當前預設狀態）
            if (regNotice) regNotice.classList.add('hidden');
            if (regForm) regForm.classList.remove('hidden');
            if (regSubmitBtn) {
                regSubmitBtn.disabled = false;
                regSubmitBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> <span class="lang-zh">立即報名</span><span class="lang-en">Submit Registration</span>';
            }
        }
    };

    if (regNationality && regTransportation) {
        const makeStrikethrough = (text) => {
            return '~~' + text + '~~';
        };

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
                if (ximenBusSoldOut) {
                    optXimen.text = makeStrikethrough('Ximen Bus Sold Out');
                    optXimen.disabled = true;
                    optXimen.classList.add('sold-out-option');
                    optXimen.style.color = '#ff4d4f';
                    optXimen.style.textDecoration = 'line-through';
                } else {
                    optXimen.text = 'Event Fee & Ximen Bus (NT$1,250)';
                }

                regTransportation.add(optSelf);
                regTransportation.add(optXimen);

                if (currentValue === '自行前往' || (currentValue === '西門遊覽車' && !ximenBusSoldOut)) {
                    regTransportation.value = currentValue;
                } else {
                    regTransportation.value = '自行前往';
                }
            } else {
                // 本國人選項：自行前往、西門遊覽車、新竹中壢遊覽車、台中遊覽車
                const optSelf = document.createElement('option');
                optSelf.value = '自行前往';
                optSelf.text = '自行前往 (NT$1,000) / Self-drive (NT$1,000)';

                const optXimen = document.createElement('option');
                optXimen.value = '西門遊覽車';
                if (ximenBusSoldOut) {
                    optXimen.text = makeStrikethrough('西門遊覽車滿額停售');
                    optXimen.disabled = true;
                    optXimen.classList.add('sold-out-option');
                    optXimen.style.color = '#ff4d4f';
                    optXimen.style.textDecoration = 'line-through';
                } else {
                    optXimen.text = '西門出發遊覽車 (NT$1,250) / Ximen Bus (NT$1,250)';
                }

                const optHsinchu = document.createElement('option');
                optHsinchu.value = '新竹中壢遊覽車';
                if (hsinchuBusSoldOut) {
                    optHsinchu.text = makeStrikethrough('新竹中壢遊覽車滿額停售');
                    optHsinchu.disabled = true;
                    optHsinchu.classList.add('sold-out-option');
                    optHsinchu.style.color = '#ff4d4f';
                    optHsinchu.style.textDecoration = 'line-through';
                } else {
                    optHsinchu.text = '新竹中壢出發遊覽車 (NT$1,300) / Hsinchu/Zhongli Bus (NT$1,300)';
                }

                const optTaichung = document.createElement('option');
                optTaichung.value = '台中遊覽車';
                if (taichungBusSoldOut) {
                    optTaichung.text = makeStrikethrough('台中遊覽車滿額停售');
                    optTaichung.disabled = true;
                    optTaichung.classList.add('sold-out-option');
                    optTaichung.style.color = '#ff4d4f';
                    optTaichung.style.textDecoration = 'line-through';
                } else {
                    optTaichung.text = '台中出發遊覽車 (NT$1,400) / Taichung Bus (NT$1,400)';
                }

                regTransportation.add(optSelf);
                regTransportation.add(optXimen);
                regTransportation.add(optHsinchu);
                regTransportation.add(optTaichung);

                if (['自行前往', '西門遊覽車', '新竹中壢遊覽車', '台中遊覽車'].includes(currentValue)) {
                    if ((currentValue === '西門遊覽車' && ximenBusSoldOut) ||
                        (currentValue === '新竹中壢遊覽車' && hsinchuBusSoldOut) ||
                        (currentValue === '台中遊覽車' && taichungBusSoldOut)) {
                        regTransportation.value = '自行前往';
                    } else {
                        regTransportation.value = currentValue;
                    }
                } else {
                    regTransportation.value = '自行前往';
                }
            }
        };
        regNationality.addEventListener('change', updateTransportationOptions);
        updateTransportationOptions(); // 初始化狀態判定

        // 異步向 GAS API 獲取最新的功能旗標設定
        const loadFeatureFlags = () => {
            const requestUrl = `${GAS_API_URL}?action=getFeatureFlags`;
            requestJSONP(requestUrl, (result) => {
                if (result.status === 'success' && result.flags) {
                    // 1. 各遊覽車滿額停售旗標
                    const flagXimen = result.flags['西門遊覽車滿額停售'];
                    if (flagXimen !== undefined) ximenBusSoldOut = (flagXimen.toString().trim().toUpperCase() === 'ON');

                    const flagHsinchu = result.flags['新竹中壢遊覽車滿額停售'];
                    if (flagHsinchu !== undefined) hsinchuBusSoldOut = (flagHsinchu.toString().trim().toUpperCase() === 'ON');

                    const flagTaichung = result.flags['台中遊覽車滿額停售'];
                    if (flagTaichung !== undefined) taichungBusSoldOut = (flagTaichung.toString().trim().toUpperCase() === 'ON');

                    updateTransportationOptions();

                    // 2. 活動報名暫停
                    const regStopVal = result.flags['活動報名-停止'];
                    const stopped = (regStopVal && regStopVal.toString().trim().toUpperCase() === 'ON');
                    updateRegistrationStoppedUI(stopped);
                } else {
                    flagsLoaded = true;
                    if (regSubmitBtn) {
                        regSubmitBtn.disabled = false;
                        regSubmitBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> <span class="lang-zh">立即報名</span><span class="lang-en">Submit Registration</span>';
                    }
                }
            }, (err) => {
                console.error('Failed to load feature flags:', err);
                flagsLoaded = true;
                if (regSubmitBtn) {
                    regSubmitBtn.disabled = false;
                    regSubmitBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> <span class="lang-zh">立即報名</span><span class="lang-en">Submit Registration</span>';
                }
            });
        };
        loadFeatureFlags();
    }

    // 1. 活動報名表單監聽 (觸發確認彈窗)
    const hubRegForm = document.getElementById('form-registration');
    if (hubRegForm) {
        hubRegForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideMessage();

            if (!flagsLoaded) {
                const isEn = document.body.classList.contains('lang-en');
                alert(isEn ? "Loading system status, please try again in a moment." : "系統正在驗證報名狀態中，請稍候再試。");
                return;
            }

            if (isRegStopped) {
                const isEn = document.body.classList.contains('lang-en');
                alert(isEn 
                    ? "Due to enthusiastic response and high demand, registration is temporarily paused while we coordinate related arrangements. Friends who have not yet completed registration are kindly invited to register after August 1st. We apologize for any inconvenience and thank you for your support and patience!" 
                    : "因目前報名人數踴躍，我們將暫時停止受理報名，並積極協調相關安排。尚未完成報名的朋友，敬請於 8 月 1 日後再行報名。造成不便，敬請見諒，也感謝大家的支持與耐心等候！");
                return;
            }

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const nationality = document.getElementById('reg-nationality').value;
            const transportation = document.getElementById('reg-transportation').value;

            // 寫入確認彈窗的文字
            const confirmName = document.getElementById('confirm-name');
            const confirmEmail = document.getElementById('confirm-email');
            const confirmPhone = document.getElementById('confirm-phone');
            const confirmNationality = document.getElementById('confirm-nationality');
            const confirmTransportation = document.getElementById('confirm-transportation');

            if (confirmName) confirmName.innerText = name;
            if (confirmEmail) confirmEmail.innerText = email;
            if (confirmPhone) confirmPhone.innerText = phone;

            const isEn = document.body.classList.contains('lang-en');
            if (confirmNationality) {
                confirmNationality.innerText = isEn ? (nationality === '本國人' ? 'Domestic' : 'International') : nationality;
            }

            if (confirmTransportation) {
                let transText = transportation;
                if (isEn) {
                    if (transportation === '自行前往') transText = 'Self-drive';
                    else if (transportation === '台中遊覽車') transText = 'Taichung Bus';
                    else if (transportation === '新竹中壢遊覽車') transText = 'Hsinchu/Zhongli Bus';
                    else if (transportation === '西門遊覽車') transText = 'Ximen Bus';
                } else {
                    if (transportation === '西門遊覽車' && nationality === '外國人') {
                        transText = '西門交通車(遊覽車)';
                    }
                }
                confirmTransportation.innerText = transText;
            }

            // 顯示確認彈窗
            const confirmModal = document.getElementById('reg-confirm-modal');
            if (confirmModal) {
                confirmModal.classList.remove('hidden');
            }
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
                            else if (trans === '新竹中壢遊覽車') transText = 'Hsinchu/Zhongli Bus';
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

                    // 桌暱稱展示
                    const qTableNickname = document.getElementById('q-result-table-nickname');
                    if (qTableNickname) {
                        let nicknameText = result.data.tableNickname || '尚未分配';
                        if (isCurrentEn && nicknameText === '尚未分配') {
                            nicknameText = 'Not Assigned';
                        }
                        qTableNickname.innerText = nicknameText;
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
                    else if (transVal === '新竹中壢遊覽車') qTransportation.innerText = 'Hsinchu/Zhongli Bus';
                    else if (transVal === '西門遊覽車' || transVal === '西門交通車(遊覽車)') {
                        qTransportation.innerText = isForeigner ? 'Ximen Shuttle Bus' : 'Ximen Bus';
                    }
                } else {
                    if (transVal === 'Self-drive') qTransportation.innerText = '自行前往';
                    else if (transVal === 'Taichung Bus') qTransportation.innerText = '台中遊覽車';
                    else if (transVal === 'Hsinchu/Zhongli Bus') qTransportation.innerText = '新竹中壢遊覽車';
                    else if (transVal === 'Ximen Bus') qTransportation.innerText = '西門遊覽車';
                    else if (transVal === 'Ximen Shuttle Bus') qTransportation.innerText = '西門交通車(遊覽車)';
                }
            }
            if (qStatus) {
                const statVal = qStatus.innerText;
                if (isEnNow) {
                    if (statVal === '未匯款') qStatus.innerText = 'Unpaid';
                    else if (statVal === '已登記(待對帳)') qStatus.innerText = 'Awaiting Reconciliation';
                    else if (statVal === '已完成繳費' || statVal === '已確認收款' || statVal === '已對帳') qStatus.innerText = 'Confirmed';
                } else {
                    if (statVal === 'Unpaid') qStatus.innerText = '未匯款';
                    else if (statVal === 'Awaiting Reconciliation') qStatus.innerText = '已登記(待對帳)';
                    else if (statVal === 'Confirmed') qStatus.innerText = '已完成繳費';
                }
            }
            if (qTable && (qTable.innerText === '尚未分配' || qTable.innerText === 'Not Assigned')) {
                qTable.innerText = isEnNow ? 'Not Assigned' : '尚未分配';
            }
            const qTableNickname = document.getElementById('q-result-table-nickname');
            if (qTableNickname && (qTableNickname.innerText === '尚未分配' || qTableNickname.innerText === 'Not Assigned')) {
                qTableNickname.innerText = isEnNow ? 'Not Assigned' : '尚未分配';
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

    // ==========================================
    // 10人分桌功能前端邏輯元件
    // ==========================================
    
    let activeTableId = "";
    
    // A. 載入並渲染 Tab 4 的所有桌位卡片
    window.loadTablesGrid = function () {
        const grid = document.getElementById("tables-grid");
        if (!grid) return;
        
        const isEn = document.body.classList.contains("lang-en");
        
        // 顯示載入中動畫
        grid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); width: 100%;">
                <i class="ph ph-spinner ph-spin" style="font-size: 2rem; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;"></i>
                <span>${isEn ? "Loading tables..." : "載入桌位資料中..."}</span>
            </div>
        `;
        
        const requestUrl = `${GAS_API_URL}?action=getTableList`;
        requestJSONP(requestUrl, (result) => {
            if (result.status === "success") {
                window.allTablesList = result.tables;
                grid.innerHTML = "";
                result.tables.forEach(table => {
                    const card = document.createElement("div");
                    card.className = "table-card";
                    card.setAttribute("data-id", table.id);
                    
                    const isUnused = (!table.nickname);
                    const displayName = escapeHtml(table.nickname) || (isEn ? `Table ${table.id} (Unused)` : `${table.id}桌 (未使用)`);
                    const statusText = isUnused 
                        ? (isEn ? "Empty" : "未使用") 
                        : (isEn ? `Occupied: ${table.memberCount}/10` : `已使用：${table.memberCount}/10 人`);
                    
                    card.innerHTML = `
                        <div class="table-card-header">
                            <div class="table-card-title">
                                <i class="ph ph-hash" style="color: var(--bear-rust);"></i>
                                <span>${isEn ? "Table " : "桌位 "}${table.id}</span>
                            </div>
                            <span class="table-card-status badge ${isUnused ? 'status-unpaid' : 'status-confirmed'}">${statusText}</span>
                        </div>
                        <div class="table-card-body">
                            <div class="table-card-nickname">${displayName}</div>
                        </div>
                        <div class="table-card-footer">
                            ${isUnused 
                                ? `<button type="button" class="btn btn-primary btn-full" onclick="openCreateTable('${table.id}')">
                                     <i class="ph ph-plus-circle" style="margin-right: 4px; vertical-align: middle;"></i>${isEn ? "Create Table" : "建立桌位"}
                                   </button>`
                                : `<button type="button" class="btn btn-outline btn-full" onclick="openVerifyPassword('${table.id}')">
                                     <i class="ph ph-pencil-simple" style="margin-right: 4px; vertical-align: middle;"></i>${isEn ? "Modify Table" : "修改桌位資料"}
                                   </button>`
                            }
                        </div>
                    `;
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = `<div class="error-text" style="text-align: center; padding: 20px; color: #d32f2f;">${result.message}</div>`;
            }
        }, () => {
            grid.innerHTML = `<div class="error-text" style="text-align: center; padding: 20px; color: #d32f2f;">${isEn ? "Failed to connect to spreadsheet." : "連線試算表失敗，請重試。"}</div>`;
        });
    };

    // B. 開啟新建桌位模式 (模式 A)
    window.openCreateTable = function (tableId) {
        activeTableId = tableId;
        window.currentTableData = { tableId: tableId, password: "", nickname: `${tableId}桌`, members: [] };
        
        const isEn = document.body.classList.contains("lang-en");
        
        // 設定 Header 與基本欄位預設值
        const idDisplay = document.getElementById("editor-table-id-display");
        const idDisplayEn = document.getElementById("editor-table-id-display-en");
        if (idDisplay) idDisplay.innerText = tableId;
        if (idDisplayEn) idDisplayEn.innerText = tableId;
        
        const nicknameInput = document.getElementById("editor-table-nickname");
        const passwordInput = document.getElementById("editor-table-password");
        if (nicknameInput) nicknameInput.value = isEn ? `Table ${tableId}` : `${tableId}桌`;
        if (passwordInput) passwordInput.value = "";
        
        // 隱藏單項變更按鈕 (模式 A 不需要單獨儲存)
        const btnNick = document.getElementById("btn-save-table-nickname");
        const btnPass = document.getElementById("btn-save-table-password");
        if (btnNick) btnNick.classList.add("hidden");
        if (btnPass) btnPass.classList.add("hidden");
        
        // 顯示全表單送出按鈕，隱藏解散按鈕
        const btnCreate = document.getElementById("btn-create-table-submit");
        const btnDisband = document.getElementById("btn-disband-table");
        if (btnCreate) btnCreate.classList.remove("hidden");
        if (btnDisband) btnDisband.classList.add("hidden");
        
        // 顯示批次貼上區塊 (僅在新建模式)
        const batchSection = document.getElementById("batch-paste-section");
        if (batchSection) batchSection.style.display = "block";
        const batchContainer = document.getElementById("batch-paste-container");
        if (batchContainer) batchContainer.classList.add("hidden"); // 預設收合
        
        // 渲染 10 列可編輯欄位
        renderEditorRows(null, true);
        
        // 顯示 Modal
        const editorModal = document.getElementById("table-editor-modal");
        if (editorModal) editorModal.classList.remove("hidden");
    };

    // C. 開啟密碼驗證視窗
    window.openVerifyPassword = function (tableId) {
        const table = (window.allTablesList || []).find(t => t.id.toString() === tableId.toString());
        const nickname = table ? table.nickname : "";
        
        const verifyId = document.getElementById("verify-table-id");
        const verifyNameZh = document.getElementById("verify-table-name-display");
        const verifyNameEn = document.getElementById("verify-table-name-display-en");
        const verifyPassInput = document.getElementById("verify-table-pass");
        
        if (verifyId) verifyId.value = tableId;
        if (verifyNameZh) verifyNameZh.innerText = nickname || `${tableId}桌`;
        if (verifyNameEn) verifyNameEn.innerText = nickname || `Table ${tableId}`;
        if (verifyPassInput) verifyPassInput.value = "";
        
        const modal = document.getElementById("table-password-modal");
        if (modal) modal.classList.remove("hidden");
    };

    // D. 關閉分桌相關 Modals
    window.closeTableModal = function (modalType) {
        if (modalType === 'password') {
            const modal = document.getElementById("table-password-modal");
            if (modal) modal.classList.add("hidden");
        } else if (modalType === 'editor') {
            const modal = document.getElementById("table-editor-modal");
            if (modal) modal.classList.add("hidden");
            // 隱藏底部錯誤提示
            const errorSpan = document.getElementById("editor-error-msg");
            if (errorSpan) errorSpan.style.display = "none";
            // 關閉編輯時重新載入清單
            loadTablesGrid();
        }
    };

    // E. 提交密碼驗證
    window.submitTablePassword = function (event) {
        event.preventDefault();
        const tableId = document.getElementById("verify-table-id").value;
        const password = document.getElementById("verify-table-pass").value;
        
        const isEn = document.body.classList.contains("lang-en");
        const submitBtn = document.getElementById("btn-password-submit");
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${isEn ? "Verifying..." : "密碼驗證中..."}`;
        
        const requestUrl = `${GAS_API_URL}?action=verifyTablePassword&tableId=${encodeURIComponent(tableId)}&password=${encodeURIComponent(password)}`;
        requestJSONP(requestUrl, (result) => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            if (result.status === "success") {
                // 關閉驗證視窗
                closeTableModal('password');
                
                // 紀錄當前桌位資料與密碼
                window.currentTableData = {
                    tableId: tableId,
                    password: password,
                    nickname: result.data.nickname,
                    members: result.data.members
                };
                activeTableId = tableId;
                
                // 開啟編輯視窗 (模式 B - 修改模式)
                openTableModificationEditor(result.data);
            } else {
                alert(result.message);
            }
        }, () => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            alert(isEn ? "Failed to verify. Please try again." : "密碼驗證失敗，請稍後重試。");
        });
    };

    // F. 開啟修改桌位模式 (模式 B)
    function openTableModificationEditor(data) {
        const idDisplay = document.getElementById("editor-table-id-display");
        const idDisplayEn = document.getElementById("editor-table-id-display-en");
        if (idDisplay) idDisplay.innerText = data.tableId;
        if (idDisplayEn) idDisplayEn.innerText = data.tableId;
        
        const nicknameInput = document.getElementById("editor-table-nickname");
        const passwordInput = document.getElementById("editor-table-password");
        if (nicknameInput) nicknameInput.value = data.nickname;
        if (passwordInput) passwordInput.value = window.currentTableData.password;
        
        // 顯示單項變更按鈕 (模式 B 支援即時變更暱稱/密碼)
        const btnNick = document.getElementById("btn-save-table-nickname");
        const btnPass = document.getElementById("btn-save-table-password");
        if (btnNick) btnNick.classList.remove("hidden");
        if (btnPass) btnPass.classList.remove("hidden");
        
        // 隱藏全表單送出按鈕，顯示解散按鈕
        const btnCreate = document.getElementById("btn-create-table-submit");
        const btnDisband = document.getElementById("btn-disband-table");
        if (btnCreate) btnCreate.classList.add("hidden");
        if (btnDisband) btnDisband.classList.remove("hidden");
        
        // 隱藏批次貼上區塊
        const batchSection = document.getElementById("batch-paste-section");
        if (batchSection) batchSection.style.display = "none";
        
        // 渲染 10 列唯讀成員資料，並附帶修改按鈕
        renderEditorRows(data.members, false);
        
        const editorModal = document.getElementById("table-editor-modal");
        if (editorModal) editorModal.classList.remove("hidden");
    }

    // G. 渲染 10 人編輯名單
    function renderEditorRows(members, isNew) {
        const container = document.getElementById("members-list-container");
        if (!container) return;
        
        container.innerHTML = "";
        const isEn = document.body.classList.contains("lang-en");
        
        for (let i = 1; i <= 10; i++) {
            const memberRow = document.createElement("div");
            memberRow.className = "member-row";
            memberRow.setAttribute("id", `member-row-${i}`);
            
            const labelZh = (i === 1) ? "人員1<br><span style='font-size: 0.75rem; font-weight: normal; opacity: 0.85; display: block; margin-top: 2px;'>聯絡窗口</span>" : `人員${i}`;
            const labelEn = (i === 1) ? "Member 1<br><span style='font-size: 0.75rem; font-weight: normal; opacity: 0.85; display: block; margin-top: 2px;'>Contact</span>" : `Member ${i}`;
            
            if (isNew) {
                // 新建模式：直接呈現可填寫的輸入框
                memberRow.innerHTML = `
                    <div class="member-index-badge">
                        <span class="lang-zh">${labelZh}</span>
                        <span class="lang-en">${labelEn}</span>
                    </div>
                    <div class="member-inputs">
                        <div class="member-input-group">
                            <label>Email Address</label>
                            <input type="email" class="member-email" id="email-field-${i}" onblur="verifyMemberInput(${i})" placeholder="example@mail.com" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                        <div class="member-input-group">
                            <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                            <input type="text" class="member-phone" id="phone-field-${i}" onblur="verifyMemberInput(${i})" maxlength="4" placeholder="1234" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                        <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <label>${isEn ? "Real Name" : "報名姓名"}</label>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="member-name-display" id="name-display-${i}" style="font-weight:600; color:var(--text-muted);">-</span>
                                <span id="spinner-${i}" class="hidden"><i class="ph ph-spinner ph-spin" style="color:var(--bear-rust);"></i></span>
                            </div>
                        </div>
                    </div>
                    <div class="member-action-col"></div>
                `;
            } else {
                // 修改模式：預設唯讀，右側提供修改按鈕
                const member = (members && members[i - 1]) ? members[i - 1] : { email: "", phone: "", name: "" };
                const emailVal = member.email || "";
                const phoneVal = member.phone || "";
                const nameVal = member.name || "";
                
                if (emailVal && nameVal) {
                    memberRow.classList.add("row-success");
                }
                
                // 遮罩個資處理
                const maskedEmail = emailVal ? maskEmail(emailVal) : "-";
                const maskedPhone = phoneVal ? `***${phoneVal.slice(-1)}` : "-";
                const displayName = nameVal || (isEn ? "Empty Slot" : "空位（尚未分配）");
                
                const maskedEmailEscaped = escapeHtml(maskedEmail);
                const maskedPhoneEscaped = escapeHtml(maskedPhone);
                const displayNameEscaped = escapeHtml(displayName);
                
                memberRow.innerHTML = `
                    <div class="member-index-badge">
                        <span class="lang-zh">${labelZh}</span>
                        <span class="lang-en">${labelEn}</span>
                    </div>
                    <div class="member-inputs" id="inputs-view-${i}">
                        <div class="member-input-group">
                            <label>Email Address</label>
                            <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedEmailEscaped}</span>
                        </div>
                        <div class="member-input-group">
                            <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                            <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedPhoneEscaped}</span>
                        </div>
                        <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <label>${isEn ? "Real Name" : "報名姓名"}</label>
                            <span style="font-weight:700; color:${nameVal ? 'var(--ocean-dark)' : 'var(--text-muted)'};">${displayNameEscaped}</span>
                        </div>
                    </div>
                    <div class="member-action-col" id="action-view-${i}">
                        <button type="button" class="btn btn-outline btn-small" onclick="enableRowEdit(${i})">
                            <i class="ph ph-pencil-simple" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Edit" : "修改"}
                        </button>
                    </div>
                `;
            }
            container.appendChild(memberRow);
        }
    }

    // 遮蔽 Email 個資的輔助函式
    function maskEmail(email) {
        const parts = email.split("@");
        if (parts.length !== 2) return email;
        const name = parts[0];
        const domain = parts[1];
        if (name.length <= 2) {
            return `*@${domain}`;
        }
        return `${name.substring(0, 2)}***@${domain}`;
    }

    // HTML 逸出輔助函式 (防範單引號/雙引號語法中斷與 XSS)
    function escapeHtml(str) {
        if (!str) return "";
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // H. 即時在前端調用 API 驗證單一成員是否符合條件
    window.verifyMemberInput = function (index, retryCount) {
        let currentRetry = (typeof retryCount === 'number') ? retryCount : 0;
        const emailField = document.getElementById(`email-field-${index}`);
        const phoneField = document.getElementById(`phone-field-${index}`);
        const nameDisplay = document.getElementById(`name-display-${index}`);
        const spinner = document.getElementById(`spinner-${index}`);
        const row = document.getElementById(`member-row-${index}`);
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        // 4. 輸入值不變，且目前是綠色成功狀態，就不要重新抓資料 (避免驗證失敗後卡在錯誤狀態)
        const lastEmail = emailField.getAttribute("data-last-email") || "";
        const lastPhone = phoneField.getAttribute("data-last-phone") || "";
        const isGreen = row && row.classList.contains("row-success");
        if (email === lastEmail && phone === lastPhone && isGreen && (email !== "" || phone !== "")) {
            return;
        }
        
        // 重置狀態 (第一次才重置，重試時不重置以防止閃爍)
        if (currentRetry === 0) {
            nameDisplay.innerText = "-";
            nameDisplay.style.color = "var(--text-muted)";
            if (row) {
                row.classList.remove("row-success", "row-error");
            }
        }
        
        if (!email && !phone) {
            emailField.setAttribute("data-last-email", "");
            phoneField.setAttribute("data-last-phone", "");
            return;
        }
        
        // 2. 重複人員檢查 (本地)
        let isDuplicate = false;
        for (let j = 1; j <= 10; j++) {
            if (j === index) continue;
            const otherEmailField = document.getElementById(`email-field-${j}`);
            if (otherEmailField && otherEmailField.value.trim().toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        if (isDuplicate) {
            nameDisplay.innerText = isEn ? "Duplicate member!" : "同桌成員不可重複！";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        // 電子郵件基本正則校驗
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            nameDisplay.innerText = isEn ? "Invalid Email" : "Email 格式錯誤";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        // 手機後四碼正則校驗
        const phonePattern = /^\d{4}$/;
        if (!phonePattern.test(phone)) {
            nameDisplay.innerText = isEn ? "Must be 4 digits" : "手機須為4位數字";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        // 顯示載入動畫
        if (spinner) spinner.classList.remove("hidden");
        
        const requestUrl = `${GAS_API_URL}?action=verifyMember&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&currentTableId=${encodeURIComponent(activeTableId)}`;
        requestJSONP(requestUrl, (result) => {
            if (spinner) spinner.classList.add("hidden");
            if (result.status === "success") {
                nameDisplay.innerText = result.name;
                nameDisplay.style.color = "var(--ocean-dark)";
                if (row) {
                    row.classList.add("row-success");
                }
                // 快取已核銷的正確數值
                emailField.setAttribute("data-last-email", email);
                phoneField.setAttribute("data-last-phone", phone);
            } else {
                nameDisplay.innerText = result.message;
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        }, () => {
            // 連線失敗，啟動自動重試機制
            const maxRetries = 2;
            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                nameDisplay.innerText = isEn 
                    ? `Connection abnormal. Retrying (${nextRetry}/${maxRetries})...` 
                    : `連線異常，正在重試 (${nextRetry}/${maxRetries})...`;
                nameDisplay.style.color = "orange";
                
                setTimeout(() => {
                    // 發送重試前檢查：輸入值是否未變，且輸入欄位依然存在
                    const currentEmailField = document.getElementById(`email-field-${index}`);
                    const currentPhoneField = document.getElementById(`phone-field-${index}`);
                    if (currentEmailField && currentPhoneField) {
                        const currentEmail = currentEmailField.value.trim();
                        const currentPhone = currentPhoneField.value.trim();
                        if (currentEmail === email && currentPhone === phone) {
                            window.verifyMemberInput(index, nextRetry);
                        } else {
                            if (spinner) spinner.classList.add("hidden");
                        }
                    } else {
                        if (spinner) spinner.classList.add("hidden");
                    }
                }, 2500);
            } else {
                if (spinner) spinner.classList.add("hidden");
                nameDisplay.innerText = isEn ? "Network Error" : "網路查詢失敗";
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        });
    };

    // I. 修改模式下，點選「修改人員」將該列切換為編輯輸入框
    window.enableRowEdit = function (index) {
        const viewDiv = document.getElementById(`inputs-view-${index}`);
        const actionDiv = document.getElementById(`action-view-${index}`);
        if (!viewDiv || !actionDiv) return;
        
        const isEn = document.body.classList.contains("lang-en");
        const member = (window.currentTableData && window.currentTableData.members[index - 1]) 
            ? window.currentTableData.members[index - 1] 
            : { email: "", phone: "", name: "" };
        const email = member.email || "";
        const phone = member.phone || "";
        const name = member.name || "";
        
        const emailEscaped = escapeHtml(email);
        const phoneEscaped = escapeHtml(phone);
        const nameEscaped = escapeHtml(name);
        
        // 切換輸入框 HTML
        viewDiv.innerHTML = `
            <div class="member-input-group">
                <label>Email Address</label>
                <input type="email" class="member-email" id="edit-email-${index}" value="${emailEscaped}" data-last-email="${emailEscaped}" onblur="verifyEditInput(${index})" placeholder="example@mail.com" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border-color);">
            </div>
            <div class="member-input-group">
                <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                <input type="text" class="member-phone" id="edit-phone-${index}" value="${phoneEscaped}" data-last-phone="${phoneEscaped}" onblur="verifyEditInput(${index})" maxlength="4" placeholder="1234" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border-color);">
            </div>
            <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                <label>${isEn ? "Real Name" : "報名姓名"}</label>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="member-name-display" id="edit-name-display-${index}" style="font-weight:700; color:${name ? 'var(--ocean-dark)' : 'var(--text-muted)'};">${nameEscaped || "-"}</span>
                    <span id="edit-spinner-${index}" class="hidden"><i class="ph ph-spinner ph-spin" style="color:var(--bear-rust);"></i></span>
                </div>
            </div>
        `;
        
        // 切換按鈕 HTML (確認變更、取消)
        actionDiv.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <button type="button" class="btn btn-primary btn-small" id="btn-save-member-${index}" onclick="saveSingleMember(${index})" style="background:linear-gradient(135deg, var(--bear-rust), var(--bear-gold));">
                    <i class="ph ph-check" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Confirm" : "確認"}
                </button>
                <button type="button" class="btn btn-outline btn-small" onclick="cancelRowEdit(${index})">
                    ${isEn ? "Cancel" : "取消"}
                </button>
            </div>
        `;
    };

    // 點選編輯時的即時欄位查詢驗證
    window.verifyEditInput = function (index, retryCount) {
        let currentRetry = (typeof retryCount === 'number') ? retryCount : 0;
        const emailField = document.getElementById(`edit-email-${index}`);
        const phoneField = document.getElementById(`edit-phone-${index}`);
        const nameDisplay = document.getElementById(`edit-name-display-${index}`);
        const spinner = document.getElementById(`edit-spinner-${index}`);
        const row = document.getElementById(`member-row-${index}`);
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        // 4. 輸入值不變，且目前是綠色成功狀態，就不要重新抓資料 (避免驗證失敗後卡在錯誤狀態)
        const lastEmail = emailField.getAttribute("data-last-email") || "";
        const lastPhone = phoneField.getAttribute("data-last-phone") || "";
        const isGreen = row && row.classList.contains("row-success");
        if (email === lastEmail && phone === lastPhone && isGreen && (email !== "" || phone !== "")) {
            return;
        }
        
        // 漏洞 4 自己替換自己過濾 (Email 且 手機後四碼皆未改變時才過濾)
        const oldMember = (window.currentTableData && window.currentTableData.members[index - 1]) 
            ? window.currentTableData.members[index - 1] 
            : { email: "", phone: "", name: "" };
            
        if (email.toLowerCase() === (oldMember.email || "").toLowerCase() && 
            phone === (oldMember.phone || "") && 
            email !== "") {
            nameDisplay.innerText = oldMember.name;
            nameDisplay.style.color = "var(--ocean-dark)";
            if (row) {
                row.classList.remove("row-error");
                row.classList.add("row-success");
            }
            emailField.setAttribute("data-last-email", email);
            phoneField.setAttribute("data-last-phone", phone);
            return;
        }
        
        // 重置狀態 (第一次才重置)
        if (currentRetry === 0) {
            nameDisplay.innerText = "-";
            nameDisplay.style.color = "var(--text-muted)";
            if (row) {
                row.classList.remove("row-success", "row-error");
            }
        }
        
        if (!email && !phone) {
            // 允許清除為空位
            nameDisplay.innerText = isEn ? "Empty Slot" : "空位（確認後將移除此人）";
            nameDisplay.style.color = "var(--text-muted)";
            emailField.setAttribute("data-last-email", "");
            phoneField.setAttribute("data-last-phone", "");
            return;
        }
        
        if (!email || !phone) {
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        // 2. 重複人員檢查 (本地)
        let isDuplicate = false;
        // 檢查同桌其他列 (唯讀模式下的 members 快取)
        const tableMembers = window.currentTableData.members;
        for (let j = 0; j < 10; j++) {
            if (j === (index - 1)) continue;
            if (tableMembers[j] && tableMembers[j].email.toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        // 也檢查同桌其他正在編輯中的輸入框 (防止同時修改為重複 of email)
        for (let j = 1; j <= 10; j++) {
            if (j === index) continue;
            const otherEmailField = document.getElementById(`edit-email-${j}`);
            if (otherEmailField && otherEmailField.value.trim().toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        if (isDuplicate) {
            nameDisplay.innerText = isEn ? "Duplicate member!" : "同桌成員不可重複！";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            nameDisplay.innerText = isEn ? "Invalid Email" : "Email 格式錯誤";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        const phonePattern = /^\d{4}$/;
        if (!phonePattern.test(phone)) {
            nameDisplay.innerText = isEn ? "Must be 4 digits" : "手機後四碼須為4位";
            nameDisplay.style.color = "#d32f2f";
            if (row) {
                row.classList.add("row-error");
            }
            return;
        }
        
        if (spinner) spinner.classList.remove("hidden");
        
        const requestUrl = `${GAS_API_URL}?action=verifyMember&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&currentTableId=${encodeURIComponent(activeTableId)}`;
        requestJSONP(requestUrl, (result) => {
            if (spinner) spinner.classList.add("hidden");
            if (result.status === "success") {
                nameDisplay.innerText = result.name;
                nameDisplay.style.color = "var(--ocean-dark)";
                if (row) {
                    row.classList.add("row-success");
                }
                // 快取已核銷的正確數值
                emailField.setAttribute("data-last-email", email);
                phoneField.setAttribute("data-last-phone", phone);
            } else {
                nameDisplay.innerText = result.message;
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        }, () => {
            // 連線失敗，啟動自動重試機制
            const maxRetries = 2;
            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                nameDisplay.innerText = isEn 
                    ? `Connection abnormal. Retrying (${nextRetry}/${maxRetries})...` 
                    : `連線異常，正在重試 (${nextRetry}/${maxRetries})...`;
                nameDisplay.style.color = "orange";
                
                setTimeout(() => {
                    // 發送重試前檢查：輸入值是否未變，且該輸入欄位依然在編輯狀態中
                    const currentEmailField = document.getElementById(`edit-email-${index}`);
                    const currentPhoneField = document.getElementById(`edit-phone-${index}`);
                    if (currentEmailField && currentPhoneField) {
                        const currentEmail = currentEmailField.value.trim();
                        const currentPhone = currentPhoneField.value.trim();
                        if (currentEmail === email && currentPhone === phone) {
                            window.verifyEditInput(index, nextRetry);
                        } else {
                            if (spinner) spinner.classList.add("hidden");
                        }
                    } else {
                        if (spinner) spinner.classList.add("hidden");
                    }
                }, 2500);
            } else {
                if (spinner) spinner.classList.add("hidden");
                nameDisplay.innerText = isEn ? "Network Error" : "網路查詢失敗";
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        });
    };

    // J. 取消該列修改，回復唯讀狀態
    window.cancelRowEdit = function (index) {
        const viewDiv = document.getElementById(`inputs-view-${index}`);
        const actionDiv = document.getElementById(`action-view-${index}`);
        if (!viewDiv || !actionDiv) return;
        
        const isEn = document.body.classList.contains("lang-en");
        const member = (window.currentTableData && window.currentTableData.members[index - 1]) 
            ? window.currentTableData.members[index - 1] 
            : { email: "", phone: "", name: "" };
        const email = member.email || "";
        const phone = member.phone || "";
        const name = member.name || "";
        
        // 恢復外框的 Class 狀態 (清除修改時產生的錯誤框)
        const row = document.getElementById(`member-row-${index}`);
        if (row) {
            row.classList.remove("row-error");
            if (email && name) {
                row.classList.add("row-success");
            } else {
                row.classList.remove("row-success");
            }
        }
        
        const maskedEmail = email ? maskEmail(email) : "-";
        const maskedPhone = phone ? `***${phone.slice(-1)}` : "-";
        const displayName = name || (isEn ? "Empty Slot" : "空位（尚未分配）");
        
        const maskedEmailEscaped = escapeHtml(maskedEmail);
        const maskedPhoneEscaped = escapeHtml(maskedPhone);
        const displayNameEscaped = escapeHtml(displayName);
        
        viewDiv.innerHTML = `
            <div class="member-input-group">
                <label>Email Address</label>
                <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedEmailEscaped}</span>
            </div>
            <div class="member-input-group">
                <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedPhoneEscaped}</span>
            </div>
            <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                <label>${isEn ? "Real Name" : "報名姓名"}</label>
                <span style="font-weight:700; color:${name ? 'var(--ocean-dark)' : 'var(--text-muted)'};">${displayNameEscaped}</span>
            </div>
        `;
        
        actionDiv.innerHTML = `
            <button type="button" class="btn btn-outline btn-small" onclick="enableRowEdit(${index})">
                <i class="ph ph-pencil-simple" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Edit" : "修改"}
            </button>
        `;
    };

    // K. 修改模式下，送出單一成員的修改/替換/清除 API
    window.saveSingleMember = function (index) {
        const emailField = document.getElementById(`edit-email-${index}`);
        const phoneField = document.getElementById(`edit-phone-${index}`);
        const nameDisplay = document.getElementById(`edit-name-display-${index}`);
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        
        const isEn = document.body.classList.contains("lang-en");
        
        // 1. 若要清除此成員
        const isRemoving = (!email && !phone);
        if (!isRemoving) {
            // 本地防重複校驗 (漏洞 2)：不能與同桌其他人 Email 重複
            const tableMembers = window.currentTableData.members;
            for (let i = 0; i < 10; i++) {
                if (i === (index - 1)) continue; // 跳過自己當前欄位
                if (tableMembers[i] && tableMembers[i].email.toLowerCase() === email.toLowerCase()) {
                    alert(isEn ? "This member is already present in this table!" : "此人已出現在本桌其他位置，不可重複加入！");
                    return;
                }
            }
            
            // 姓名必須正確帶出 (查無報名或驗證未過時阻止)
            const row = document.getElementById(`member-row-${index}`);
            const hasSuccess = row && row.classList.contains("row-success");
            if (!hasSuccess || nameDisplay.innerText === "-" || nameDisplay.innerText === "") {
                alert(isEn ? "Invalid member details. Cannot save." : "成員驗證未通過，無法送出修改！");
                return;
            }
        }
        
        const saveBtn = document.getElementById(`btn-save-member-${index}`);
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        
        const tableId = window.currentTableData.tableId;
        const password = window.currentTableData.password;
        
        const requestUrl = `${GAS_API_URL}?action=updateTableMember` +
            `&tableId=${encodeURIComponent(tableId)}` +
            `&password=${encodeURIComponent(password)}` +
            `&memberIndex=${index}` +
            `&email=${encodeURIComponent(email)}` +
            `&phone=${encodeURIComponent(phone)}`;
            
        requestJSONP(requestUrl, (result) => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            
            if (result.status === "success") {
                // 更新本機端狀態數據
                window.currentTableData.members[index - 1] = {
                    email: isRemoving ? "" : email,
                    phone: isRemoving ? "" : phone,
                    name: isRemoving ? "" : result.name
                };
                
                // 還原為唯讀顯示狀態
                cancelRowEdit(index);
                window.showToast(result.message, "success");
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            window.showModalError(isEn ? "Network error. Failed to save." : "網路傳送失敗，請稍後重試。");
        });
    };

    // L. 修改模式下，即時變更桌暱稱與密碼
    window.updateTableNicknameAndPassword = function () {
        const nickname = document.getElementById("editor-table-nickname").value.trim();
        const newPassword = document.getElementById("editor-table-password").value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        if (!nickname || !newPassword) {
            window.showModalError(isEn ? "Nickname and Password cannot be empty!" : "桌暱稱與密碼皆不能為空白！");
            return;
        }
        
        const tableId = window.currentTableData.tableId;
        const password = window.currentTableData.password;
        
        // 取得變更按鈕 (任一觸發皆一併送出修改)
        const btnNick = document.getElementById("btn-save-table-nickname");
        const btnPass = document.getElementById("btn-save-table-password");
        const origTextNick = btnNick.innerHTML;
        const origTextPass = btnPass.innerHTML;
        
        btnNick.disabled = true;
        btnPass.disabled = true;
        btnNick.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        btnPass.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        
        const requestUrl = `${GAS_API_URL}?action=updateTableInfo` +
            `&tableId=${encodeURIComponent(tableId)}` +
            `&password=${encodeURIComponent(password)}` +
            `&newNickname=${encodeURIComponent(nickname)}` +
            `&newPassword=${encodeURIComponent(newPassword)}`;
            
        requestJSONP(requestUrl, (result) => {
            btnNick.disabled = false;
            btnPass.disabled = false;
            btnNick.innerHTML = origTextNick;
            btnPass.innerHTML = origTextPass;
            
            if (result.status === "success") {
                // 更新本地密碼與暱稱
                window.currentTableData.password = newPassword;
                window.currentTableData.nickname = nickname;
                window.showToast(result.message, "success");
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            btnNick.disabled = false;
            btnPass.disabled = false;
            btnNick.innerHTML = origTextNick;
            btnPass.innerHTML = origTextPass;
            window.showModalError(isEn ? "Network error. Save failed." : "網路傳送失敗，請稍後重試。");
        });
    };

    // M. 新建模式下，驗證並一次送出 10 人整桌存檔 API
    window.submitNewTable = function () {
        const nickname = document.getElementById("editor-table-nickname").value.trim();
        const password = document.getElementById("editor-table-password").value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        if (!nickname || !password) {
            window.showModalError(isEn ? "Nickname and Password are required!" : "桌暱稱與密碼皆不能空白！");
            return;
        }
        
        if (password.length < 4) {
            window.showModalError(isEn ? "Password must be at least 4 digits!" : "修改密碼長度須為 4 位以上！");
            return;
        }
        
        // 收集 10 位成員資料
        const members = [];
        const uniqueEmails = [];
        for (let i = 1; i <= 10; i++) {
            const email = document.getElementById(`email-field-${i}`).value.trim();
            const phone = document.getElementById(`phone-field-${i}`).value.trim();
            const nameDisplay = document.getElementById(`name-display-${i}`);
            
            if (!email || !phone) {
                window.showModalError(isEn ? `Member ${i} is incomplete!` : `人員 ${i} 的資料尚未填寫完整！`);
                return;
            }
            
            // 姓名檢核，確保名單驗證通過 (沒有紅色查無狀態)
            const nameColor = window.getComputedStyle(nameDisplay).color;
            if (nameColor === "rgb(211, 47, 47)" || nameDisplay.innerText === "-" || nameDisplay.innerText === "") {
                window.showModalError(isEn ? `Member ${i} verification failed. Check email and phone.` : `人員 ${i} 驗證未通過，無法建立桌位！`);
                return;
            }
            
            // 本地同桌防重複檢查 (漏洞 2)
            if (uniqueEmails.indexOf(email.toLowerCase()) > -1) {
                window.showModalError(isEn ? `Duplicate member found: ${email}` : `同桌成員不可重複填寫相同的人員 (${email})！`);
                return;
            }
            
            uniqueEmails.push(email.toLowerCase());
            members.push({ email: email, phone: phone });
        }
        
        const submitBtn = document.getElementById("btn-create-table-submit");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${isEn ? "Creating..." : "建立中..."}`;
        
        const requestUrl = `${GAS_API_URL}?action=saveTable` +
            `&tableId=${encodeURIComponent(activeTableId)}` +
            `&nickname=${encodeURIComponent(nickname)}` +
            `&password=${encodeURIComponent(password)}` +
            `&members=${encodeURIComponent(JSON.stringify(members))}`;
            
        requestJSONP(requestUrl, (result) => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            if (result.status === "success") {
                window.showToast(result.message, "success");
                // 關閉 Modal
                closeTableModal('editor');
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            window.showModalError(isEn ? "Network error. Creation failed." : "建立分桌連線失敗，請重試。");
        });
    };

    // N. 徹底解散桌位 (清空) API
    window.disbandTable = function () {
        const isEn = document.body.classList.contains("lang-en");
        const confirmMsg = isEn 
            ? "Are you sure you want to DISBAND this table? All members will be cleared!" 
            : "確定要解散此桌嗎？\n這將會清除此桌所有同桌名單、密碼並退回未使用狀態！";
            
        window.showCustomConfirm(confirmMsg, () => {
            const disbandBtn = document.getElementById("btn-disband-table");
            const originalText = disbandBtn.innerHTML;
            disbandBtn.disabled = true;
            disbandBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
            
            const tableId = window.currentTableData.tableId;
            const password = window.currentTableData.password;
            
            const requestUrl = `${GAS_API_URL}?action=disbandTable&tableId=${encodeURIComponent(tableId)}&password=${encodeURIComponent(password)}`;
            requestJSONP(requestUrl, (result) => {
                disbandBtn.disabled = false;
                disbandBtn.innerHTML = originalText;
                
                if (result.status === "success") {
                    window.showToast(result.message, "success");
                    // 關閉 Modal
                    closeTableModal('editor');
                } else {
                    window.showModalError(result.message);
                }
            }, () => {
                disbandBtn.disabled = false;
                disbandBtn.innerHTML = originalText;
                window.showModalError(isEn ? "Failed to disband table. Please check network." : "網路解散連線失敗，請稍後重試。");
            });
        });
    };


    // ==========================================
    // 揪桌友看板前端邏輯元件
    // ==========================================
    
    let activeGroupTableId = "";
    let groupMinLimit = 5;
    
    // A. 載入並渲染 揪桌友看板 (content-group)
    window.loadGroupTablesGrid = function () {
        const grid = document.getElementById("group-tables-grid");
        if (!grid) return;
        
        const isEn = document.body.classList.contains("lang-en");
        
        grid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted); width: 100%;">
                <i class="ph ph-spinner ph-spin" style="font-size: 2rem; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;"></i>
                <span>${isEn ? "Loading group tables..." : "載入揪桌友資料中..."}</span>
            </div>
        `;
        
        const requestUrl = `${GAS_API_URL}?action=getGroupTableList`;
        requestJSONP(requestUrl, (result) => {
            if (result.status === "success") {
                window.allGroupTablesList = result.tables;
                groupMinLimit = result.minLimit || 5;
                
                // 更新提示訊息中的限制人數
                const limitDisp = document.getElementById("group-min-limit-display");
                const limitDispEn = document.getElementById("group-min-limit-display-en");
                if (limitDisp) limitDisp.innerText = groupMinLimit;
                if (limitDispEn) limitDispEn.innerText = groupMinLimit;
                
                grid.innerHTML = "";
                
                // 如果沒有揪桌友資料，顯示預設提示
                if (result.tables.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: rgba(0, 0, 0, 0.02); border-radius: 12px; border: 1px dashed var(--border-color);">
                            <i class="ph ph-chats-teardrop" style="font-size: 3rem; color: var(--bear-gold); margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;"></i>
                            <h4 style="margin: 0 0 8px 0; color: var(--text-main); font-weight: 700;">
                                ${isEn ? "No Group Tables Yet" : "目前尚無人發起揪桌友"}
                            </h4>
                            <p style="margin: 0; font-size: 0.9rem;">
                                ${isEn ? "Be the first to create one by clicking the button above!" : "快來點擊右上方「建立新揪桌資料」按鈕當第一個發起人吧！"}
                            </p>
                        </div>
                    `;
                    return;
                }
                
                result.tables.forEach(table => {
                    const card = document.createElement("div");
                    card.className = "table-card";
                    card.setAttribute("data-id", table.id);
                    
                    const displayName = escapeHtml(table.nickname) || `揪桌友 ${table.id}`;
                    const isFull = (table.memberCount >= 10);
                    
                    const progressPercent = Math.min(100, (table.memberCount / 10) * 100);
                    const progressColor = table.memberCount >= groupMinLimit ? "#2e7d32" : "#ff9800";
                    
                    const statusText = isFull
                        ? (isEn ? "Full (10/10)" : "已額滿 (10/10人)")
                        : (isEn ? `Recruiting: ${table.memberCount}/10` : `徵求中：${table.memberCount}/10人`);
                        
                    card.innerHTML = `
                        <div class="table-card-header">
                            <div class="table-card-title">
                                <i class="ph ph-chats-teardrop" style="color: var(--bear-rust);"></i>
                                <span>ID: ${table.id}</span>
                            </div>
                            <span class="table-card-status badge ${isFull ? 'status-confirmed' : 'status-unpaid'}">${statusText}</span>
                        </div>
                        <div class="table-card-body" style="padding: 16px 20px;">
                            <div class="table-card-nickname" style="font-size: 1.35rem; font-weight: 800; margin-bottom: 12px; color: var(--bear-rust); letter-spacing: 0.5px;">${displayName}</div>
                            
                            <!-- 進度條 -->
                            <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
                                <div style="background: ${progressColor}; width: ${progressPercent}%; height: 100%; border-radius: 4px; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="table-card-footer" style="padding: 12px 20px 20px 20px;">
                            <button type="button" class="btn btn-outline btn-full" onclick="openGroupVerifyPassword('${table.id}')">
                                <i class="ph ph-pencil-simple" style="margin-right: 4px; vertical-align: middle;"></i>
                                ${isEn ? "Manage / Join" : "管理或加入此桌"}
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                });
                
                // 如果目前搜尋欄位有輸入，自動進行過濾
                if (typeof window.filterGroupTables === "function") {
                    window.filterGroupTables();
                }
            } else {
                grid.innerHTML = `<div class="error-text" style="text-align: center; padding: 20px; color: #d32f2f;">${result.message}</div>`;
            }
        }, () => {
            grid.innerHTML = `<div class="error-text" style="text-align: center; padding: 20px; color: #d32f2f;">${isEn ? "Failed to connect to spreadsheet." : "連線試算表失敗，請重試。"}</div>`;
        });
    };

    // B. 開啟新建揪桌友模式
    window.openNewGroupTableModal = function () {
        activeGroupTableId = "自動遞增";
        window.currentGroupTableData = { tableId: "自動遞增", password: "", nickname: "", members: [] };
        
        const isEn = document.body.classList.contains("lang-en");
        
        const idDisplay = document.getElementById("editor-group-table-id-display");
        const idDisplayEn = document.getElementById("editor-group-table-id-display-en");
        if (idDisplay) idDisplay.innerText = isEn ? "Auto Increment" : "自動遞增";
        if (idDisplayEn) idDisplayEn.innerText = "Auto Increment";
        
        const nicknameInput = document.getElementById("editor-group-table-nickname");
        const passwordInput = document.getElementById("editor-group-table-password");
        if (nicknameInput) nicknameInput.value = "";
        if (passwordInput) passwordInput.value = "";
        
        // 隱藏單項變更按鈕 (新建模式不需要)
        const btnNick = document.getElementById("btn-save-group-table-nickname");
        const btnPass = document.getElementById("btn-save-group-table-password");
        if (btnNick) btnNick.classList.add("hidden");
        if (btnPass) btnPass.classList.add("hidden");
        
        // 顯示全表單送出按鈕，隱藏解散按鈕
        const btnCreate = document.getElementById("btn-create-group-table-submit");
        const btnDisband = document.getElementById("btn-disband-group-table");
        if (btnCreate) btnCreate.classList.remove("hidden");
        if (btnDisband) btnDisband.classList.add("hidden");
        
        // 顯示批次貼上區塊 (僅在新建模式)
        const batchSection = document.getElementById("group-batch-paste-section");
        if (batchSection) batchSection.classList.remove("hidden");
        
        const batchToggle = document.getElementById("group-batch-paste-toggle-btn");
        if (batchToggle) batchToggle.innerText = isEn ? "Expand" : "展開選單";
        const batchContainer = document.getElementById("group-batch-paste-container");
        if (batchContainer) batchContainer.classList.add("hidden");
        
        const batchTextarea = document.getElementById("group-batch-paste-textarea");
        if (batchTextarea) batchTextarea.value = "";
        
        const errorMsg = document.getElementById("group-editor-error-msg");
        if (errorMsg) errorMsg.style.display = "none";
        
        // 渲染 10 個空的輸入框
        renderGroupEditorRows(null, true);
        
        const editorModal = document.getElementById("group-table-editor-modal");
        if (editorModal) {
            editorModal.classList.remove("hidden");
            const scrollBody = editorModal.querySelector(".modal-body-scroll");
            if (scrollBody) scrollBody.scrollTop = 0;
        }
    };

    // C. 開啟揪桌友管理密碼驗證彈窗
    window.openGroupVerifyPassword = function (tableId) {
        activeGroupTableId = tableId;
        const isEn = document.body.classList.contains("lang-en");
        
        const nameDisp = document.getElementById("verify-group-table-name-display");
        const nameDispEn = document.getElementById("verify-group-table-name-display-en");
        
        let nickname = `揪桌友 ${tableId}`;
        if (window.allGroupTablesList) {
            const t = window.allGroupTablesList.find(x => x.id === tableId);
            if (t && t.nickname) nickname = t.nickname;
        }
        
        if (nameDisp) nameDisp.innerText = nickname;
        if (nameDispEn) nameDispEn.innerText = nickname;
        
        const passInput = document.getElementById("verify-group-table-pass");
        if (passInput) passInput.value = "";
        
        const passwordModal = document.getElementById("group-table-password-modal");
        if (passwordModal) passwordModal.classList.remove("hidden");
    };

    // D. 驗證密碼送出
    window.submitGroupTablePassword = function (event) {
        if (event) event.preventDefault();
        
        const password = document.getElementById("verify-group-table-pass").value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        if (!password) {
            window.showToast(isEn ? "Please enter password!" : "請輸入管理密碼！", "error");
            return;
        }
        
        const submitBtn = document.getElementById("btn-group-password-submit");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${isEn ? "Verifying..." : "驗證中..."}`;
        
        const requestUrl = `${GAS_API_URL}?action=verifyGroupTablePassword&tableId=${encodeURIComponent(activeGroupTableId)}&password=${encodeURIComponent(password)}`;
        
        requestJSONP(requestUrl, (result) => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            if (result.status === "success") {
                // 儲存目前編輯中的桌位快取
                window.currentGroupTableData = result.data;
                window.currentGroupTableData.password = password; // 記錄密碼供之後的變更與解散使用
                
                openGroupTableEditor(result.data, password);
            } else {
                window.showToast(result.message, "error");
            }
        }, () => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            window.showToast(isEn ? "Network error. Verification failed." : "驗證連線失敗，請重試。", "error");
        });
    };

    // E. 開啟管理模式編輯器
    function openGroupTableEditor(data, password) {
        const isEn = document.body.classList.contains("lang-en");
        
        const idDisplay = document.getElementById("editor-group-table-id-display");
        const idDisplayEn = document.getElementById("editor-group-table-id-display-en");
        if (idDisplay) idDisplay.innerText = data.tableId;
        if (idDisplayEn) idDisplayEn.innerText = data.tableId;
        
        const nicknameInput = document.getElementById("editor-group-table-nickname");
        const passwordInput = document.getElementById("editor-group-table-password");
        if (nicknameInput) nicknameInput.value = data.nickname;
        if (passwordInput) passwordInput.value = password;
        
        // 顯示單項變更按鈕 (編輯模式可各自更新暱稱/密碼)
        const btnNick = document.getElementById("btn-save-group-table-nickname");
        const btnPass = document.getElementById("btn-save-group-table-password");
        if (btnNick) btnNick.classList.remove("hidden");
        if (btnPass) btnPass.classList.remove("hidden");
        
        // 隱藏新建按鈕，顯示解散按鈕
        const btnCreate = document.getElementById("btn-create-group-table-submit");
        const btnDisband = document.getElementById("btn-disband-group-table");
        if (btnCreate) btnCreate.classList.add("hidden");
        if (btnDisband) btnDisband.classList.remove("hidden");
        
        // 隱藏批次貼上區塊 (僅在新建模式下開放)
        const batchSection = document.getElementById("group-batch-paste-section");
        if (batchSection) batchSection.classList.add("hidden");
        
        const errorMsg = document.getElementById("group-editor-error-msg");
        if (errorMsg) errorMsg.style.display = "none";
        
        // 渲染 10 位名單 (可獨立編輯 / 刪除)
        renderGroupEditorRows(data.members, false);
        
        const passwordModal = document.getElementById("group-table-password-modal");
        if (passwordModal) passwordModal.classList.add("hidden");
        
        const editorModal = document.getElementById("group-table-editor-modal");
        if (editorModal) {
            editorModal.classList.remove("hidden");
            const scrollBody = editorModal.querySelector(".modal-body-scroll");
            if (scrollBody) scrollBody.scrollTop = 0;
        }
    }

    // F. 關閉揪桌 Modal
    window.closeGroupTableModal = function (modalType) {
        if (modalType === 'password') {
            const modal = document.getElementById("group-table-password-modal");
            if (modal) modal.classList.add("hidden");
        } else if (modalType === 'editor') {
            const modal = document.getElementById("group-table-editor-modal");
            if (modal) {
                modal.classList.add("hidden");
                const scrollBody = modal.querySelector(".modal-body-scroll");
                if (scrollBody) scrollBody.scrollTop = 0;
            }
            // 重新整理卡片
            loadGroupTablesGrid();
        }
    };

    // G. 渲染 10 位揪桌名單
    function renderGroupEditorRows(members, isNew) {
        const container = document.getElementById("group-members-list-container");
        if (!container) return;
        
        container.innerHTML = "";
        const isEn = document.body.classList.contains("lang-en");
        
        for (let i = 1; i <= 10; i++) {
            const memberRow = document.createElement("div");
            memberRow.className = "member-row";
            memberRow.setAttribute("id", `group-member-row-${i}`);
            
            const labelZh = (i === 1) ? "人員1<br><span style='font-size: 0.75rem; font-weight: normal; opacity: 0.85; display: block; margin-top: 2px;'>發起人</span>" : `人員${i}`;
            const labelEn = (i === 1) ? "Member 1<br><span style='font-size: 0.75rem; font-weight: normal; opacity: 0.85; display: block; margin-top: 2px;'>Creator</span>" : `Member ${i}`;
            
            if (isNew) {
                // 新建模式下，每個 slot 可以呼叫選人 picker，或手動填入
                memberRow.innerHTML = `
                    <div class="member-index-badge">
                        <span class="lang-zh">${labelZh}</span>
                        <span class="lang-en">${labelEn}</span>
                    </div>
                    <div class="member-inputs">
                        <div class="member-input-group">
                            <label>Email Address</label>
                            <input type="email" class="member-email" id="group-email-field-${i}" onblur="verifyGroupMemberInput(${i})" placeholder="example@mail.com" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                        <div class="member-input-group">
                            <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                            <input type="text" class="member-phone" id="group-phone-field-${i}" onblur="verifyGroupMemberInput(${i})" maxlength="4" placeholder="1234" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                        <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <label>${isEn ? "Real Name" : "報名姓名"}</label>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="member-name-display" id="group-name-display-${i}" style="font-weight:600; color:var(--text-muted);">-</span>
                                <span id="group-spinner-${i}" class="hidden"><i class="ph ph-spinner ph-spin" style="color:var(--bear-rust);"></i></span>
                            </div>
                        </div>
                    </div>
                    <div class="member-action-col"></div>
                `;
            } else {
                // 修改模式：預設唯讀
                const member = (members && members[i - 1]) ? members[i - 1] : { email: "", phone: "", name: "" };
                const emailVal = member.email || "";
                const phoneVal = member.phone || "";
                const nameVal = member.name || "";
                
                if (emailVal && nameVal) {
                    memberRow.classList.add("row-success");
                }
                
                const maskedEmail = emailVal ? maskEmail(emailVal) : "-";
                const maskedPhone = phoneVal ? `***${phoneVal.slice(-1)}` : "-";
                const displayName = nameVal || (isEn ? "Empty Slot" : "空位（尚未加入）");
                
                const maskedEmailEscaped = escapeHtml(maskedEmail);
                const maskedPhoneEscaped = escapeHtml(maskedPhone);
                const displayNameEscaped = escapeHtml(displayName);
                
                memberRow.innerHTML = `
                    <div class="member-index-badge">
                        <span class="lang-zh">${labelZh}</span>
                        <span class="lang-en">${labelEn}</span>
                    </div>
                    <div class="member-inputs" id="group-inputs-view-${i}">
                        <div class="member-input-group">
                            <label>Email Address</label>
                            <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedEmailEscaped}</span>
                        </div>
                        <div class="member-input-group">
                            <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                            <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${maskedPhoneEscaped}</span>
                        </div>
                        <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <label>${isEn ? "Real Name" : "報名姓名"}</label>
                            <span style="font-weight:700; color:${nameVal ? 'var(--ocean-dark)' : 'var(--text-muted)'};">${displayNameEscaped}</span>
                        </div>
                    </div>
                    <div class="member-action-col" id="group-action-view-${i}">
                        ${emailVal 
                            ? `<div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                                 <button type="button" class="btn btn-outline btn-small" onclick="enableGroupRowEdit(${i})" style="border-color: var(--bear-rust); color: var(--bear-rust);">
                                   <i class="ph ph-note-pencil" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Edit" : "修改"}
                                 </button>
                                 ${i === 1 
                                     ? "" 
                                     : `<button type="button" id="btn-group-remove-member-${i}" class="btn btn-outline btn-small" onclick="removeGroupMember(${i})" style="color:#d32f2f; border-color:#d32f2f;">
                                          <i class="ph ph-trash" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Remove" : "移出"}
                                        </button>`
                                 }
                               </div>`
                            : `<button type="button" class="btn btn-outline btn-small" onclick="enableGroupRowEdit(${i})">
                                 <i class="ph ph-plus" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Join" : "加入"}
                               </button>`
                        }
                    </div>
                `;
            }
            container.appendChild(memberRow);
        }
    }

    // H. 新建模式下，輸入框失去焦點自動查詢付款狀態
    window.verifyGroupMemberInput = function (index, retryCount) {
        let currentRetry = (typeof retryCount === 'number') ? retryCount : 0;
        const emailField = document.getElementById(`group-email-field-${index}`);
        const phoneField = document.getElementById(`group-phone-field-${index}`);
        const nameDisplay = document.getElementById(`group-name-display-${index}`);
        const spinner = document.getElementById(`group-spinner-${index}`);
        const row = document.getElementById(`group-member-row-${index}`);
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        const lastEmail = emailField.getAttribute("data-last-email") || "";
        const lastPhone = phoneField.getAttribute("data-last-phone") || "";
        const isGreen = row && row.classList.contains("row-success");
        if (email === lastEmail && phone === lastPhone && isGreen && (email !== "" || phone !== "")) {
            return;
        }
        
        if (currentRetry === 0) {
            nameDisplay.innerText = "-";
            nameDisplay.style.color = "var(--text-muted)";
            if (row) {
                row.classList.remove("row-success", "row-error");
            }
        }
        
        if (!email && !phone) {
            nameDisplay.innerText = "-";
            emailField.setAttribute("data-last-email", "");
            phoneField.setAttribute("data-last-phone", "");
            return;
        }
        
        if (!email || !phone) {
            return; // 尚有未輸入欄位，不執行 API
        }
        
        // 檢查同桌其他正在填寫的欄位，防重複 (本地)
        let isDuplicate = false;
        for (let j = 1; j <= 10; j++) {
            if (j === index) continue;
            const otherEmailField = document.getElementById(`group-email-field-${j}`);
            if (otherEmailField && otherEmailField.value.trim().toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        if (isDuplicate) {
            nameDisplay.innerText = isEn ? "Duplicate email!" : "同桌成員不可重複！";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            return;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            nameDisplay.innerText = isEn ? "Invalid Email" : "Email 格式錯誤";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            return;
        }
        
        const phonePattern = /^\d{4}$/;
        if (!phonePattern.test(phone)) {
            nameDisplay.innerText = isEn ? "Must be 4 digits" : "手機後四碼須為4位";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            return;
        }
        
        if (spinner) spinner.classList.remove("hidden");
        
        const requestUrl = `${GAS_API_URL}?action=verifyMemberForGroup&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&currentTableId=${encodeURIComponent(activeGroupTableId)}`;
        requestJSONP(requestUrl, (result) => {
            if (spinner) spinner.classList.add("hidden");
            if (result.status === "success") {
                nameDisplay.innerText = result.name;
                nameDisplay.style.color = "var(--ocean-dark)";
                if (row) {
                    row.classList.add("row-success");
                }
                emailField.setAttribute("data-last-email", email);
                phoneField.setAttribute("data-last-phone", phone);
            } else {
                nameDisplay.innerText = result.message;
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        }, () => {
            const maxRetries = 2;
            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                nameDisplay.innerText = isEn 
                    ? `Connection abnormal. Retrying (${nextRetry}/${maxRetries})...` 
                    : `連線異常，正在重試 (${nextRetry}/${maxRetries})...`;
                nameDisplay.style.color = "orange";
                
                setTimeout(() => {
                    const currentEmailField = document.getElementById(`group-email-field-${index}`);
                    const currentPhoneField = document.getElementById(`group-phone-field-${index}`);
                    if (currentEmailField && currentPhoneField) {
                        const currentEmail = currentEmailField.value.trim();
                        const currentPhone = currentPhoneField.value.trim();
                        if (currentEmail === email && currentPhone === phone) {
                            window.verifyGroupMemberInput(index, nextRetry);
                        } else {
                            if (spinner) spinner.classList.add("hidden");
                        }
                    } else {
                        if (spinner) spinner.classList.add("hidden");
                    }
                }, 2500);
            } else {
                if (spinner) spinner.classList.add("hidden");
                nameDisplay.innerText = isEn ? "Network Error" : "網路查詢失敗";
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
            }
        });
    };

    // I. 管理模式下，點擊「加入」或新增成員
    window.enableGroupRowEdit = function (index) {
        const viewDiv = document.getElementById(`group-inputs-view-${index}`);
        const actionDiv = document.getElementById(`group-action-view-${index}`);
        if (!viewDiv || !actionDiv) return;
        
        const isEn = document.body.classList.contains("lang-en");
        const member = (window.currentGroupTableData && window.currentGroupTableData.members && window.currentGroupTableData.members[index - 1]) 
            ? window.currentGroupTableData.members[index - 1] 
            : { email: "", phone: "", name: "" };
            
        const email = member.email || "";
        const phone = member.phone || "";
        const name = member.name || "";
        
        const emailEscaped = escapeHtml(email);
        const phoneEscaped = escapeHtml(phone);
        const nameEscaped = escapeHtml(name);
        
        viewDiv.innerHTML = `
            <div class="member-input-group">
                <label>Email Address</label>
                <input type="email" class="member-email" id="group-edit-email-${index}" value="${emailEscaped}" data-last-email="${emailEscaped}" oninput="disableGroupSaveBtn(${index})" onblur="verifyGroupEditInput(${index})" placeholder="example@mail.com" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border-color);">
            </div>
            <div class="member-input-group">
                <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                <input type="text" class="member-phone" id="group-edit-phone-${index}" value="${phoneEscaped}" data-last-phone="${phoneEscaped}" oninput="disableGroupSaveBtn(${index})" onblur="verifyGroupEditInput(${index})" maxlength="4" placeholder="1234" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border-color);">
            </div>
            <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                <label>${isEn ? "Real Name" : "報名姓名"}</label>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="member-name-display" id="group-edit-name-display-${index}" style="font-weight:600; color:${name ? 'var(--ocean-dark)' : 'var(--text-muted)'};">${nameEscaped || "-"}</span>
                    <span id="group-edit-spinner-${index}" class="hidden"><i class="ph ph-spinner ph-spin" style="color:var(--bear-rust);"></i></span>
                </div>
            </div>
        `;
        
        const isVerified = (email !== "");
        actionDiv.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <button type="button" class="btn btn-primary btn-small" id="btn-group-save-member-${index}" onclick="saveSingleGroupMember(${index})" style="background:linear-gradient(135deg, var(--bear-rust), var(--bear-gold));" ${isVerified ? "" : "disabled"}>
                    <i class="ph ph-check" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Confirm" : "確認"}
                </button>
                <button type="button" class="btn btn-outline btn-small" onclick="cancelGroupRowEdit(${index})">
                    ${isEn ? "Cancel" : "取消"}
                </button>
            </div>
        `;
    };

    // J. 管理模式下，編輯狀態輸入框失去焦點查詢
    window.verifyGroupEditInput = function (index, retryCount) {
        let currentRetry = (typeof retryCount === 'number') ? retryCount : 0;
        const emailField = document.getElementById(`group-edit-email-${index}`);
        const phoneField = document.getElementById(`group-edit-phone-${index}`);
        const nameDisplay = document.getElementById(`group-edit-name-display-${index}`);
        const spinner = document.getElementById(`group-edit-spinner-${index}`);
        const row = document.getElementById(`group-member-row-${index}`);
        const saveBtn = document.getElementById(`btn-group-save-member-${index}`);
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        const lastEmail = emailField.getAttribute("data-last-email") || "";
        const lastPhone = phoneField.getAttribute("data-last-phone") || "";
        const isGreen = row && row.classList.contains("row-success");
        if (email === lastEmail && phone === lastPhone && isGreen && (email !== "" || phone !== "")) {
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
        
        if (currentRetry === 0) {
            nameDisplay.innerText = "-";
            nameDisplay.style.color = "var(--text-muted)";
            if (row) {
                row.classList.remove("row-success", "row-error");
            }
        }
        
        if (!email && !phone) {
            nameDisplay.innerText = isEn ? "Empty Slot" : "空位";
            nameDisplay.style.color = "var(--text-muted)";
            emailField.setAttribute("data-last-email", "");
            phoneField.setAttribute("data-last-phone", "");
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        if (!email || !phone) {
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        // 檢查重複 (本地)
        let isDuplicate = false;
        const tableMembers = window.currentGroupTableData.members;
        for (let j = 0; j < 10; j++) {
            if (j === (index - 1)) continue;
            if (tableMembers[j] && tableMembers[j].email.toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        for (let j = 1; j <= 10; j++) {
            if (j === index) continue;
            const otherEmailField = document.getElementById(`group-edit-email-${j}`);
            if (otherEmailField && otherEmailField.value.trim().toLowerCase() === email.toLowerCase() && email !== "") {
                isDuplicate = true;
                break;
            }
        }
        if (isDuplicate) {
            nameDisplay.innerText = isEn ? "Duplicate member!" : "同桌成員不可重複！";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            nameDisplay.innerText = isEn ? "Invalid Email" : "Email 格式錯誤";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        const phonePattern = /^\d{4}$/;
        if (!phonePattern.test(phone)) {
            nameDisplay.innerText = isEn ? "Must be 4 digits" : "手機後四碼須為4位";
            nameDisplay.style.color = "#d32f2f";
            if (row) row.classList.add("row-error");
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        if (spinner) spinner.classList.remove("hidden");
        if (saveBtn) saveBtn.disabled = true; // 查詢中，暫時停用
        
        const requestUrl = `${GAS_API_URL}?action=verifyMemberForGroup&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&currentTableId=${encodeURIComponent(activeGroupTableId)}`;
        requestJSONP(requestUrl, (result) => {
            if (spinner) spinner.classList.add("hidden");
            if (result.status === "success") {
                nameDisplay.innerText = result.name;
                nameDisplay.style.color = "var(--ocean-dark)";
                if (row) {
                    row.classList.add("row-success");
                }
                emailField.setAttribute("data-last-email", email);
                phoneField.setAttribute("data-last-phone", phone);
                if (saveBtn) saveBtn.disabled = false; // 驗證成功，啟用確認按鈕
            } else {
                nameDisplay.innerText = result.message;
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
                if (saveBtn) saveBtn.disabled = true; // 驗證失敗，停用確認按鈕
            }
        }, () => {
            const maxRetries = 2;
            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                nameDisplay.innerText = isEn 
                    ? `Connection abnormal. Retrying (${nextRetry}/${maxRetries})...` 
                    : `連線異常，正在重試 (${nextRetry}/${maxRetries})...`;
                nameDisplay.style.color = "orange";
                
                setTimeout(() => {
                    const currentEmailField = document.getElementById(`group-edit-email-${index}`);
                    const currentPhoneField = document.getElementById(`group-edit-phone-${index}`);
                    if (currentEmailField && currentPhoneField) {
                        const currentEmail = currentEmailField.value.trim();
                        const currentPhone = currentPhoneField.value.trim();
                        if (currentEmail === email && currentPhone === phone) {
                            window.verifyGroupEditInput(index, nextRetry);
                        } else {
                            if (spinner) spinner.classList.add("hidden");
                        }
                    } else {
                        if (spinner) spinner.classList.add("hidden");
                    }
                }, 2500);
            } else {
                if (spinner) spinner.classList.add("hidden");
                nameDisplay.innerText = isEn ? "Network Error" : "網路查詢失敗";
                nameDisplay.style.color = "#d32f2f";
                if (row) {
                    row.classList.add("row-error");
                }
                if (saveBtn) saveBtn.disabled = true;
            }
        });
    };

    // 編輯欄位打字時的即時防呆：立即停用確認鈕、清除綠色成功樣式
    window.disableGroupSaveBtn = function (index) {
        const saveBtn = document.getElementById(`btn-group-save-member-${index}`);
        const row = document.getElementById(`group-member-row-${index}`);
        const nameDisplay = document.getElementById(`group-edit-name-display-${index}`);
        
        if (saveBtn) saveBtn.disabled = true;
        if (row) {
            row.classList.remove("row-success", "row-error");
        }
        if (nameDisplay) {
            nameDisplay.innerText = "-";
            nameDisplay.style.color = "var(--text-muted)";
        }
    };

    // K. 取消單行編輯
    window.cancelGroupRowEdit = function (index) {
        const viewDiv = document.getElementById(`group-inputs-view-${index}`);
        const actionDiv = document.getElementById(`group-action-view-${index}`);
        if (!viewDiv || !actionDiv) return;
        
        const isEn = document.body.classList.contains("lang-en");
        const member = (window.currentGroupTableData && window.currentGroupTableData.members[index - 1]) 
            ? window.currentGroupTableData.members[index - 1] 
            : { email: "", phone: "", name: "" };
            
        const isUnused = (!member.email);
        
        viewDiv.innerHTML = isUnused 
            ? `<div class="member-input-group">
                 <label>Email Address</label>
                 <span style="font-weight:500; color:var(--text-muted);">-</span>
               </div>
               <div class="member-input-group">
                 <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                 <span style="font-weight:500; color:var(--text-muted);">-</span>
               </div>
               <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                 <label>${isEn ? "Real Name" : "報名姓名"}</label>
                 <span style="font-weight:700; color:var(--text-muted);">${isEn ? "Empty Slot" : "空位（尚未加入）"}</span>
               </div>`
            : `<div class="member-input-group">
                 <label>Email Address</label>
                 <span style="font-weight:500; font-family:monospace; color:var(--text-main);">${escapeHtml(maskEmail(member.email))}</span>
               </div>
               <div class="member-input-group">
                 <label>${isEn ? "Phone (Last 4)" : "手機後四碼"}</label>
                 <span style="font-weight:500; font-family:monospace; color:var(--text-main);">***${escapeHtml(member.phone.slice(-1))}</span>
               </div>
               <div class="member-input-group member-name-group" style="display:flex; flex-direction:column; justify-content:center;">
                 <label>${isEn ? "Real Name" : "報名姓名"}</label>
                 <span style="font-weight:700; color:var(--ocean-dark);">${escapeHtml(member.name)}</span>
               </div>`;
               
        actionDiv.innerHTML = isUnused
            ? `<button type="button" class="btn btn-outline btn-small" onclick="enableGroupRowEdit(${index})">
                 <i class="ph ph-plus" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Join" : "加入"}
               </button>`
            : `<div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                 <button type="button" class="btn btn-outline btn-small" onclick="enableGroupRowEdit(${index})" style="border-color: var(--bear-rust); color: var(--bear-rust);">
                   <i class="ph ph-note-pencil" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Edit" : "修改"}
                 </button>
                 ${index === 1 
                     ? "" 
                     : `<button type="button" id="btn-group-remove-member-${index}" class="btn btn-outline btn-small" onclick="removeGroupMember(${index})" style="color:#d32f2f; border-color:#d32f2f;">
                          <i class="ph ph-trash" style="margin-right:2px; vertical-align:middle;"></i>${isEn ? "Remove" : "移出"}
                        </button>`
                 }
               </div>`;
               
        const row = document.getElementById(`group-member-row-${index}`);
        if (row) {
            row.classList.remove("row-error");
            if (isUnused) {
                row.classList.remove("row-success");
            } else {
                row.classList.add("row-success");
            }
        }
    };

    // L. 儲存單一揪桌人員變更 (管理模式)
    window.saveSingleGroupMember = function (index) {
        const emailField = document.getElementById(`group-edit-email-${index}`);
        const phoneField = document.getElementById(`group-edit-phone-${index}`);
        const nameDisplay = document.getElementById(`group-edit-name-display-${index}`);
        const row = document.getElementById(`group-member-row-${index}`);
        const isEn = document.body.classList.contains("lang-en");
        
        if (!emailField || !phoneField || !nameDisplay) return;
        
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();
        
        // 姓名欄位判定防呆
        const isGreen = row && row.classList.contains("row-success");
        if (!isGreen || nameDisplay.innerText === "-" || nameDisplay.innerText === "") {
            window.showModalError(isEn ? "Please verify member information first!" : "請先完成人員資料的查詢與驗證！");
            return;
        }
        
        const saveBtn = document.getElementById(`btn-group-save-member-${index}`);
        const origText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        
        const requestUrl = `${GAS_API_URL}?action=updateGroupTableMember` +
            `&tableId=${encodeURIComponent(activeGroupTableId)}` +
            `&password=${encodeURIComponent(window.currentGroupTableData.password)}` +
            `&memberIndex=${index}` +
            `&email=${encodeURIComponent(email)}` +
            `&phone=${encodeURIComponent(phone)}`;
            
        requestJSONP(requestUrl, (result) => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origText;
            
            if (result.status === "success") {
                window.showToast(result.message, "success");
                
                // 更新本機快取
                window.currentGroupTableData.members[index - 1] = {
                    email: email,
                    phone: phone,
                    name: result.name
                };
                
                // 回復唯讀狀態
                cancelGroupRowEdit(index);
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origText;
            window.showModalError(isEn ? "Failed to save. Please try again." : "網路傳送失敗，請稍後重試。");
        });
    };

    // M. 移出單一成員 (管理模式)
    window.removeGroupMember = function (index) {
        const isEn = document.body.classList.contains("lang-en");
        
        if (index === 1) {
            window.showToast(isEn ? "Creator (Member 1) cannot be removed!" : "發起人（人員1）不可被移出！", "error");
            return;
        }
        
        const confirmMsg = isEn 
            ? "Are you sure you want to remove this member from the table?" 
            : "確定要將此人移出桌位嗎？";
            
        window.showCustomConfirm(confirmMsg, () => {
            const row = document.getElementById(`group-member-row-${index}`);
            
            // 計算目前有效成員
            let activeCount = 0;
            const members = window.currentGroupTableData.members;
            for (let j = 0; j < 10; j++) {
                if (members[j] && members[j].email) activeCount++;
            }
            
            if (activeCount <= groupMinLimit) {
                window.showToast(isEn ? `Cannot remove member. Minimum table size is ${groupMinLimit}!` : `無法移出！揪桌人數不能低於最少人數下限（${groupMinLimit}人）！`, "error");
                return;
            }
            
            const removeBtn = document.getElementById(`btn-group-remove-member-${index}`);
            let origText = "";
            if (removeBtn) {
                origText = removeBtn.innerHTML;
                removeBtn.disabled = true;
                removeBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
            }
            
            const requestUrl = `${GAS_API_URL}?action=updateGroupTableMember` +
                `&tableId=${encodeURIComponent(activeGroupTableId)}` +
                `&password=${encodeURIComponent(window.currentGroupTableData.password)}` +
                `&memberIndex=${index}` +
                `&email=` +
                `&phone=`;
                
            requestJSONP(requestUrl, (result) => {
                if (removeBtn) {
                    removeBtn.disabled = false;
                    removeBtn.innerHTML = origText;
                }
                if (result.status === "success") {
                    window.showToast(result.message, "success");
                    
                    // 清空快取中此欄位
                    window.currentGroupTableData.members[index - 1] = { email: "", phone: "", name: "" };
                    
                    cancelGroupRowEdit(index);
                } else {
                    window.showToast(result.message, "error");
                }
            }, () => {
                if (removeBtn) {
                    removeBtn.disabled = false;
                    removeBtn.innerHTML = origText;
                }
                window.showToast(isEn ? "Failed to remove member. Network error." : "網路傳送失敗，請稍後重試。", "error");
            });
        });
    };

    // N. 編輯模式下，一鍵變更桌暱稱或密碼
    window.updateGroupTableNicknameAndPassword = function () {
        const nickname = document.getElementById("editor-group-table-nickname").value.trim();
        const password = document.getElementById("editor-group-table-password").value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        if (!nickname || !password) {
            window.showModalError(isEn ? "Nickname and Password cannot be empty!" : "揪桌友暱稱與密碼皆不能空白！");
            return;
        }
        
        if (password.length < 4) {
            window.showModalError(isEn ? "Password must be at least 4 digits!" : "修改密碼長度須為 4 位以上！");
            return;
        }
        
        const btnNick = document.getElementById("btn-save-group-table-nickname");
        const btnPass = document.getElementById("btn-save-group-table-password");
        const origTextNick = btnNick.innerHTML;
        const origTextPass = btnPass.innerHTML;
        
        btnNick.disabled = true;
        btnPass.disabled = true;
        btnNick.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        btnPass.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
        
        const requestUrl = `${GAS_API_URL}?action=updateGroupTableInfo` +
            `&tableId=${encodeURIComponent(activeGroupTableId)}` +
            `&password=${encodeURIComponent(window.currentGroupTableData.password)}` +
            `&newNickname=${encodeURIComponent(nickname)}` +
            `&newPassword=${encodeURIComponent(password)}`;
            
        requestJSONP(requestUrl, (result) => {
            btnNick.disabled = false;
            btnPass.disabled = false;
            btnNick.innerHTML = origTextNick;
            btnPass.innerHTML = origTextPass;
            
            if (result.status === "success") {
                window.showToast(result.message, "success");
                window.currentGroupTableData.nickname = nickname;
                window.currentGroupTableData.password = password;
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            btnNick.disabled = false;
            btnPass.disabled = false;
            btnNick.innerHTML = origTextNick;
            btnPass.innerHTML = origTextPass;
            window.showModalError(isEn ? "Network error. Save failed." : "網路傳送失敗，請稍後重試。");
        });
    };

    // O. 新建模式下，驗證並一次送出 10 人整桌存檔 API
    window.submitNewGroupTable = function () {
        const nickname = document.getElementById("editor-group-table-nickname").value.trim();
        const password = document.getElementById("editor-group-table-password").value.trim();
        const isEn = document.body.classList.contains("lang-en");
        
        if (!nickname || !password) {
            window.showModalError(isEn ? "Group Name and Password are required!" : "揪桌友暱稱與密碼皆不能空白！");
            return;
        }
        
        if (password.length < 4) {
            window.showModalError(isEn ? "Password must be at least 4 digits!" : "修改密碼長度須為 4 位以上！");
            return;
        }
        
        // 檢查發起人（人員 1）是否填寫且驗證成功
        const email1 = document.getElementById("group-email-field-1").value.trim();
        const phone1 = document.getElementById("group-phone-field-1").value.trim();
        const name1 = document.getElementById("group-name-display-1").innerText;
        const row1 = document.getElementById("group-member-row-1");
        const isGreen1 = row1 && row1.classList.contains("row-success");
        if (!email1 || !phone1 || !isGreen1 || name1 === "-" || name1 === "") {
            window.showModalError(isEn ? "Creator (Member 1) information is required and must be verified!" : "發起人（人員1）資料為必填，且必須完成驗證！");
            return;
        }
        
        // 收集成員資料並校對
        const members = [];
        const uniqueEmails = [];
        let validCount = 0;
        
        for (let i = 1; i <= 10; i++) {
            const emailField = document.getElementById(`group-email-field-${i}`);
            const phoneField = document.getElementById(`group-phone-field-${i}`);
            const nameDisplay = document.getElementById(`group-name-display-${i}`);
            const row = document.getElementById(`group-member-row-${i}`);
            
            if (!emailField || !phoneField) continue;
            
            const email = emailField.value.trim();
            const phone = phoneField.value.trim();
            
            // 只要填了其中一個，就必須填寫完整
            if (email || phone) {
                if (!email || !phone) {
                    window.showModalError(isEn ? `Member ${i} is incomplete!` : `人員 ${i} 的資料尚未填寫完整！`);
                    return;
                }
                
                // 檢查是否驗證通過
                const isGreen = row && row.classList.contains("row-success");
                if (!isGreen || nameDisplay.innerText === "-" || nameDisplay.innerText === "") {
                    window.showModalError(isEn ? `Member ${i} verification failed. Check email and phone.` : `人員 ${i} 驗證未通過，無法建立揪桌友！`);
                    return;
                }
                
                if (uniqueEmails.indexOf(email.toLowerCase()) > -1) {
                    window.showModalError(isEn ? `Duplicate member found: ${email}` : `同桌成員不可重複填寫相同的人員 (${email})！`);
                    return;
                }
                
                uniqueEmails.push(email.toLowerCase());
                members.push({ email: email, phone: phone });
                validCount++;
            }
        }
        
        // 人數下限檢查 (含發起人)
        if (validCount < groupMinLimit) {
            window.showModalError(isEn ? `Input headcount cannot be lower than ${groupMinLimit} people!` : `輸入人數不可以低於此人數（${groupMinLimit}人）！`);
            return;
        }
        
        const submitBtn = document.getElementById("btn-create-group-table-submit");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> ${isEn ? "Creating..." : "發起中..."}`;
        
        const requestUrl = `${GAS_API_URL}?action=saveGroupTable` +
            `&nickname=${encodeURIComponent(nickname)}` +
            `&password=${encodeURIComponent(password)}` +
            `&members=${encodeURIComponent(JSON.stringify(members))}`;
            
        requestJSONP(requestUrl, (result) => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            if (result.status === "success") {
                window.showToast(result.message, "success");
                closeGroupTableModal('editor');
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            window.showModalError(isEn ? "Network error. Creation failed." : "建立揪桌友連線失敗，請重試。");
        });
    };

    // P. 解散揪桌友 API
    window.disbandGroupTable = function () {
        const isEn = document.body.classList.contains("lang-en");
        const confirmMsg = isEn 
            ? "Are you sure you want to DISBAND this table? All members will be cleared!" 
            : "確定要解散並清除此桌嗎？\n這將會清除此桌所有同桌名單、密碼且從看板上移除！";
            
        window.showCustomConfirm(confirmMsg, () => {
            const disbandBtn = document.getElementById("btn-disband-group-table");
            const originalText = disbandBtn.innerHTML;
            disbandBtn.disabled = true;
            disbandBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i>`;
            
            const tableId = window.currentGroupTableData.tableId;
            const password = window.currentGroupTableData.password;
            
            const requestUrl = `${GAS_API_URL}?action=disbandGroupTable&tableId=${encodeURIComponent(tableId)}&password=${encodeURIComponent(password)}`;
            requestJSONP(requestUrl, (result) => {
                disbandBtn.disabled = false;
                disbandBtn.innerHTML = originalText;
                
                if (result.status === "success") {
                    window.showToast(result.message, "success");
                    closeGroupTableModal('editor');
                } else {
                    window.showModalError(result.message);
                }
            }, () => {
                disbandBtn.disabled = false;
                disbandBtn.innerHTML = originalText;
                window.showModalError(isEn ? "Failed to disband table. Please check network." : "網路解散連線失敗，請稍後重試。");
            });
        });
    };

    // Q. 批次貼上匯入成員名單 (揪桌友)
    window.toggleGroupBatchPaste = function (event) {
        if (event) event.preventDefault();
        const container = document.getElementById("group-batch-paste-container");
        const toggleBtn = document.getElementById("group-batch-paste-toggle-btn");
        const isEn = document.body.classList.contains("lang-en");
        
        if (container) {
            const isHidden = container.classList.contains("hidden");
            if (isHidden) {
                container.classList.remove("hidden");
                toggleBtn.innerText = isEn ? "Collapse" : "收合選單";
            } else {
                container.classList.add("hidden");
                toggleBtn.innerText = isEn ? "Expand" : "展開選單";
            }
        }
    };

    window.applyGroupBatchPaste = function () {
        const textarea = document.getElementById("group-batch-paste-textarea");
        const isEn = document.body.classList.contains("lang-en");
        if (!textarea) return;
        
        const rawText = textarea.value;
        if (!rawText.trim()) {
            window.showModalError(isEn ? "Please paste list content!" : "請先貼上名單內容！");
            return;
        }
        
        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
        if (lines.length === 0) return;
        
        // 批次解析
        const queries = [];
        let skippedCount = 0;
        let indexToFill = 1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(/[,\s\t]+/).map(p => p.trim());
            
            if (parts.length >= 2) {
                const email = parts[0];
                const phone = parts[1];
                
                if (indexToFill <= 10) {
                    queries.push({
                        index: indexToFill,
                        email: email,
                        phone: phone
                    });
                    indexToFill++;
                } else {
                    skippedCount++;
                }
            }
        }
        
        if (queries.length === 0) {
            window.showModalError(isEn ? "No valid rows found. Format: email, phone_last_4" : "未偵測到有效列。請確認每列格式為「Email, 手機後四碼」。");
            return;
        }
        
        // 顯示載入動畫
        queries.forEach(q => {
            const nameDisplay = document.getElementById(`group-name-display-${q.index}`);
            const spinner = document.getElementById(`group-spinner-${q.index}`);
            const emailField = document.getElementById(`group-email-field-${q.index}`);
            const phoneField = document.getElementById(`group-phone-field-${q.index}`);
            const row = document.getElementById(`group-member-row-${q.index}`);
            
            if (emailField) emailField.value = q.email;
            if (phoneField) phoneField.value = q.phone;
            
            if (nameDisplay) {
                nameDisplay.innerText = isEn ? "Verifying..." : "正在驗證...";
                nameDisplay.style.color = "orange";
            }
            if (spinner) spinner.classList.remove("hidden");
            if (row) row.classList.remove("row-success", "row-error");
        });
        
        // 批次向後端送出驗證
        const requestUrl = `${GAS_API_URL}?action=verifyBatchMembersForGroup&currentTableId=${encodeURIComponent(activeGroupTableId)}&batch=${encodeURIComponent(JSON.stringify(queries))}`;
        
        requestJSONP(requestUrl, (result) => {
            queries.forEach(q => {
                const spinner = document.getElementById(`group-spinner-${q.index}`);
                if (spinner) spinner.classList.add("hidden");
            });
            
            if (result.status === "success") {
                let successCount = 0;
                let failCount = 0;
                
                result.results.forEach(res => {
                    const nameDisplay = document.getElementById(`group-name-display-${res.index}`);
                    const emailField = document.getElementById(`group-email-field-${res.index}`);
                    const phoneField = document.getElementById(`group-phone-field-${res.index}`);
                    const row = document.getElementById(`group-member-row-${res.index}`);
                    
                    if (res.status === "success") {
                        if (nameDisplay) {
                            nameDisplay.innerText = res.name;
                            nameDisplay.style.color = "var(--ocean-dark)";
                        }
                        if (row) row.classList.add("row-success");
                        if (emailField) emailField.setAttribute("data-last-email", emailField.value.trim());
                        if (phoneField) phoneField.setAttribute("data-last-phone", phoneField.value.trim());
                        successCount++;
                    } else {
                        if (nameDisplay) {
                            nameDisplay.innerText = res.message;
                            nameDisplay.style.color = "#d32f2f";
                        }
                        if (row) row.classList.add("row-error");
                        failCount++;
                    }
                });
                
                let toastMsg = isEn 
                    ? `Imported: ${successCount} successful, ${failCount} failed.` 
                    : `匯入完成：成功 ${successCount} 人，失敗 ${failCount} 人。`;
                if (skippedCount > 0) {
                    toastMsg += isEn ? ` (Skipped ${skippedCount} rows exceeding limit)` : ` (超出10人限制跳過 ${skippedCount} 列)`;
                }
                window.showToast(toastMsg, failCount > 0 ? "error" : "success");
            } else {
                window.showModalError(result.message);
            }
        }, () => {
            queries.forEach(q => {
                const nameDisplay = document.getElementById(`group-name-display-${q.index}`);
                const spinner = document.getElementById(`group-spinner-${q.index}`);
                const row = document.getElementById(`group-member-row-${q.index}`);
                
                if (spinner) spinner.classList.add("hidden");
                if (nameDisplay) {
                    nameDisplay.innerText = isEn ? "Network Error" : "網路驗證失敗";
                    nameDisplay.style.color = "#d32f2f";
                }
                if (row) row.classList.add("row-error");
            });
            window.showModalError(isEn ? "Failed to verify batch. Please try again." : "批次驗證網路連線失敗，請重試。");
        });
    };

    // R. 揪桌友：選人 Picker 前端邏輯
    window.openGroupMemberPicker = function (index, isEdit = false) {
        pickerTargetIndex = index;
        pickerIsEdit = isEdit;
        
        const isEn = document.body.classList.contains("lang-en");
        const listContainer = document.getElementById("group-member-picker-list");
        const searchInput = document.getElementById("group-member-picker-search");
        
        if (searchInput) searchInput.value = "";
        
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="ph ph-spinner ph-spin" style="font-size: 1.5rem; display: block; margin: 0 auto 8px auto;"></i>
                    <span>${isEn ? "Fetching members..." : "讀取未分桌名單中..."}</span>
                </div>
            `;
        }
        
        const pickerModal = document.getElementById("group-member-picker-modal");
        if (pickerModal) pickerModal.classList.remove("hidden");
        
        const requestUrl = `${GAS_API_URL}?action=getPaidUnassignedMembers`;
        requestJSONP(requestUrl, (result) => {
            if (result.status === "success") {
                window.unassignedMembers = result.members;
                renderGroupPickerMembers();
            } else {
                if (listContainer) listContainer.innerHTML = `<div style="text-align:center; color:#d32f2f; padding:20px;">${result.message}</div>`;
            }
        }, () => {
            if (listContainer) listContainer.innerHTML = `<div style="text-align:center; color:#d32f2f; padding:20px;">${isEn ? "Network Error" : "網路載入失敗"}</div>`;
        });
    };

    window.renderGroupPickerMembers = function (filterKeyword = "") {
        const listContainer = document.getElementById("group-member-picker-list");
        if (!listContainer) return;
        
        const isEn = document.body.classList.contains("lang-en");
        listContainer.innerHTML = "";
        
        // 蒐集目前 Modal 裡已經被選取/填入的 Email
        const currentInputs = {};
        for (let j = 1; j <= 10; j++) {
            const elCreate = document.getElementById(`group-email-field-${j}`);
            if (elCreate && elCreate.value.trim()) {
                currentInputs[elCreate.value.trim().toLowerCase()] = true;
            }
            const elEdit = document.getElementById(`group-edit-email-${j}`);
            if (elEdit && elEdit.value.trim()) {
                currentInputs[elEdit.value.trim().toLowerCase()] = true;
            }
        }
        
        const keyword = filterKeyword.trim().toLowerCase();
        const filtered = window.unassignedMembers.filter(m => {
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.email.toLowerCase().indexOf(keyword) > -1;
        });
        
        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">${isEn ? "No match found" : "查無符合條件的學員"}</div>`;
            return;
        }
        
        filtered.forEach(member => {
            const isAlreadyChosen = !!currentInputs[member.email.toLowerCase()];
            
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "member-picker-item";
            btn.style.cssText = `
                width: 100%;
                text-align: left;
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: ${isAlreadyChosen ? '#f9f9f9' : '#ffffff'};
                cursor: ${isAlreadyChosen ? 'not-allowed' : 'pointer'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
                opacity: ${isAlreadyChosen ? '0.6' : '1'};
                border-left: 4px solid ${isAlreadyChosen ? 'var(--border-color)' : 'var(--bear-rust)'};
            `;
            
            if (!isAlreadyChosen) {
                btn.onmouseenter = () => {
                    btn.style.borderColor = 'var(--bear-rust)';
                    btn.style.background = 'rgba(255, 127, 80, 0.03)';
                };
                btn.onmouseleave = () => {
                    btn.style.borderColor = 'var(--border-color)';
                    btn.style.background = '#ffffff';
                };
                btn.onclick = () => {
                    selectGroupPickerMember(member.email);
                };
            }
            
            btn.innerHTML = `
                <div style="text-align: left;">
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(member.name)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace; margin-top: 2px;">${escapeHtml(member.email)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span style="font-size: 0.8rem; background: rgba(46, 125, 50, 0.08); color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-weight:600;">已繳費已對帳</span>
                    ${isAlreadyChosen ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">${isEn ? 'Added' : '已在名單中'}</span>` : ''}
                </div>
            `;
            listContainer.appendChild(btn);
        });
    };

    window.filterGroupPickerMembers = function () {
        const searchInput = document.getElementById("group-member-picker-search");
        if (searchInput) {
            renderGroupPickerMembers(searchInput.value);
        }
    };

    window.selectGroupPickerMember = function (email) {
        const prefix = pickerIsEdit ? "group-edit-email-" : "group-email-field-";
        const phonePrefix = pickerIsEdit ? "group-edit-phone-" : "group-phone-field-";
        const nameDisplayPrefix = pickerIsEdit ? "group-edit-name-display-" : "group-name-display-";
        const rowPrefix = pickerIsEdit ? "group-edit-member-row-" : "group-member-row-";
        
        const emailField = document.getElementById(`${prefix}${pickerTargetIndex}`);
        const phoneField = document.getElementById(`${phonePrefix}${pickerTargetIndex}`);
        const nameDisplay = document.getElementById(`${nameDisplayPrefix}${pickerTargetIndex}`);
        const row = document.getElementById(`${rowPrefix}${pickerTargetIndex}`);
        
        if (emailField) emailField.value = email;
        if (phoneField) {
            phoneField.value = "";
            phoneField.setAttribute("data-last-phone", "");
        }
        if (emailField) emailField.setAttribute("data-last-email", email);
        
        const isEn = document.body.classList.contains("lang-en");
        if (nameDisplay) {
            nameDisplay.innerText = isEn ? "Enter Phone Last 4" : "請輸入手機後四碼";
            nameDisplay.style.color = "var(--bear-rust)";
        }
        if (row) {
            row.classList.remove("row-success", "row-error");
        }
        
        closeGroupMemberPicker();
        if (phoneField) phoneField.focus();
    };

    window.closeGroupMemberPicker = function () {
        const pickerModal = document.getElementById("group-member-picker-modal");
        if (pickerModal) pickerModal.classList.add("hidden");
    };

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

    // 第一次加載時載入清單
    if (localStorage.getItem('bearwave-lang') === 'en') {
        updatePlaceholders('en');
    } else {
        updatePlaceholders('zh');
    }

    // 搜尋與過濾揪桌友看板卡片
    window.filterGroupTables = function () {
        const input = document.getElementById("group-search-input");
        if (!input) return;
        const query = input.value.trim().toLowerCase();
        const cards = document.querySelectorAll("#group-tables-grid .table-card");
        
        cards.forEach(card => {
            const idElement = card.querySelector(".table-card-title span");
            const nicknameElement = card.querySelector(".table-card-nickname");
            
            const idText = idElement ? idElement.innerText.toLowerCase() : "";
            const nicknameText = nicknameElement ? nicknameElement.innerText.toLowerCase() : "";
            
            // 只要 ID 或桌暱稱包含關鍵字，就顯示，否則隱藏
            if (idText.indexOf(query) > -1 || nicknameText.indexOf(query) > -1) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    };
    
    window.clearGroupSearch = function () {
        const input = document.getElementById("group-search-input");
        if (input) {
            input.value = "";
            filterGroupTables();
        }
    };

});
