// admin-header.js
document.addEventListener("DOMContentLoaded", () => {
    loadAdminHeader();
});

async function loadAdminHeader() {
    try {
        // ดึงไฟล์ admin-header.html มาแสดง
        const response = await fetch('../HTML/admin-header.html'); 
        
        if (!response.ok) {
            throw new Error("Could not find admin-header.html file");
        }
        
        const headerHtml = await response.text();
        const headerContainer = document.getElementById('header-container');
        
        if (headerContainer) {
            headerContainer.innerHTML = headerHtml;
            // สำหรับแอดมินไม่ต้องรัน checkNotifications ครับ
        }

    } catch (error) {
        console.error("Error loading the admin header:", error);
    }
}