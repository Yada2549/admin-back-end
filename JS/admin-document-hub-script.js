let rawFilesData = []; // เก็บข้อมูลดิบจาก DB

document.addEventListener("DOMContentLoaded", () => {
    loadDocuments();

    // Event Listeners สำหรับการ Search และ Sort
    document.getElementById('search-input').addEventListener('input', renderDocuments);
    document.getElementById('sort-select').addEventListener('change', renderDocuments);
});

// 1. ดึงข้อมูลจริงจาก Database
async function loadDocuments() {
    const container = document.getElementById('file-list-container');
    container.innerHTML = '<p style="text-align: center; padding: 50px;">Loading documents...</p>';

    try {
        const response = await fetch('/api/all-documents');
        rawFilesData = await response.json();
        renderDocuments();
    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = '<p style="text-align: center; color: red;">Failed to load documents.</p>';
    }
}

// 2. ฟังก์ชันแสดงผล + Search + Sort
function renderDocuments() {
    const container = document.getElementById('file-list-container');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    // กรองข้อมูล (Search)
    let filtered = rawFilesData.filter(f => 
        f.name.toLowerCase().includes(searchTerm) || 
        f.uploader.toLowerCase().includes(searchTerm)
    );

    // จัดเรียง (Sort)
    filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        // newest = ใหม่ไปเก่า (B-A), oldest = เก่าไปใหม่ (A-B)
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="no-data-msg">No files match your search.</div>`;
        return;
    }

    container.innerHTML = filtered.map(file => `
        <div class="file-card-large">
            <div class="file-info-main">
                <span class="file-name">${file.name}</span>
                <div class="file-meta">
                    <span><i class="fa-solid fa-user-circle"></i> Uploaded by: ${file.uploader}</span>
                    <span><i class="fa-regular fa-clock"></i> ${new Date(file.date).toLocaleString()}</span>
                </div>
            </div>
            <div class="file-actions-main">
                <div class="action-icon-btn" onclick="viewFile('${file.name}')" title="Preview"><i class="fa-regular fa-eye"></i></div>
                <div class="action-icon-btn" onclick="downloadFile('${file.name}')" title="Download"><i class="fa-solid fa-download"></i></div>
            </div>
        </div>
    `).join('');
}

// 3. ฟังก์ชันเปิดดูและดาวน์โหลดไฟล์จริง
function viewFile(name) {
    window.open(`/uploads/${name}`, '_blank');
}

function downloadFile(name) {
    window.location.href = `/download/${name}`;
}