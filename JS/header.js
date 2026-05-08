// header.js
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
});

async function loadHeader() {
    try {
        // 1. โหลดไฟล์ header.html มาใส่ใน div ที่เตรียมไว้
        const response = await fetch('header.html');
        if (!response.ok) throw new Error("Network response was not ok");
        
        const headerHtml = await response.text();
        document.getElementById('header-container').innerHTML = headerHtml;

        // 2. จำลองการดึงข้อมูลจาก Backend เพื่อเช็คว่ามีแจ้งเตือนใหม่ไหม
        // ถ้ามีให้โชว์จุดสีแดงที่กระดิ่ง
        checkNotifications();

    } catch (error) {
        console.error("Error loading the header:", error);
    }
}

function checkNotifications() {
    // สมมติว่ายิง API ไปเช็คหลังบ้าน แล้วพบว่ามีแจ้งเตือนที่ยังไม่ได้อ่าน
    const hasUnread = true; // เปลี่ยนเป็น false เพื่อซ่อนจุดแดง

    if (hasUnread) {
        const badge = document.getElementById('noti-badge');
        if (badge) {
            badge.style.display = 'block';
        }
    }
}