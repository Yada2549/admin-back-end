let currentType = 'assignment';
let editId = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ตรวจสอบโหมดแก้ไข (Edit Mode)
    const urlParams = new URLSearchParams(window.location.search);
    editId = urlParams.get('id'); 

    if (editId) {
        document.querySelector('.page-title-center').innerText = "Edit Assignment";
        const postBtn = document.getElementById('post-btn'); 
        if (postBtn) postBtn.innerText = "Update Now";
        
        try {
            const response = await fetch(`/api/assignments/${editId}`);
            const data = await response.json();

            document.getElementById('topic-name').value = data.topicName;
            document.getElementById('description').value = data.description;
            
            toggleType(data.type);

            if (data.dueDateTime) {
                const date = new Date(data.dueDateTime);
                document.getElementById('due-date').value = date.toISOString().split('T')[0];
                document.getElementById('due-time').value = date.toTimeString().slice(0, 5);
            }
        } catch (err) {
            console.error("Load edit data failed:", err);
        }
    }

    // 🌟 2. วางโค้ดจัดการแสดงรายการไฟล์ (File Preview) ตรงนี้ครับ 🌟
    const fileInput = document.getElementById('file-upload');
    const fileListDisplay = document.getElementById('file-list-display');

    if (fileInput && fileListDisplay) {
        fileInput.addEventListener('change', function() {
            fileListDisplay.innerHTML = ''; // ล้างรายการเก่าออกก่อน

            // วนลูปสร้าง UI สำหรับแต่ละไฟล์ที่เลือก
            Array.from(this.files).forEach((file, index) => {
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card'; // ใช้ Style ที่มีอยู่แล้วใน CSS
                fileCard.innerHTML = `
                    <div class="file-name-part" style="border-right: none;">${file.name}</div>
                    <div class="file-actions-part">
                        <div class="action-icon-btn" onclick="this.parentElement.parentElement.remove()" style="color: #FF4D4D;">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                `;
                fileListDisplay.appendChild(fileCard);
            });
        });
    }

    renderSubmissions();
});

// ฟังก์ชันอื่นๆ (toggleType, handlePost, renderSubmissions) ยังคงอยู่เหมือนเดิมด้านล่าง...

// ฟังก์ชันสลับประเภท (Assignment / Announcement)
function toggleType(type) {
    currentType = type;
    const isAssignment = (type === 'assignment');
    
    document.getElementById('type-assignment').classList.toggle('active', isAssignment);
    document.getElementById('type-announcement').classList.toggle('active', !isAssignment);
    
    document.getElementById('due-date-section').style.display = isAssignment ? 'block' : 'none';
    document.getElementById('tracking-section').style.display = isAssignment ? 'block' : 'none';
}

// 🌟 ฟังก์ชันโพสต์ที่รองรับทั้งสร้างใหม่ (POST) และแก้ไข (PUT)
async function handlePost() {
    const topicName = document.getElementById('topic-name').value;
    const fileInput = document.getElementById('file-upload'); 
    
    if(!topicName) return alert("Please fill Topic Name before posting.");

    const formData = new FormData();
    formData.append('type', currentType);
    formData.append('topicName', topicName);
    formData.append('description', document.getElementById('description').value);
    formData.append('publishDate', document.getElementById('publish-date').value);
    formData.append('publishTime', document.getElementById('publish-time').value);
    
    if (currentType === 'assignment') {
        formData.append('dueDate', document.getElementById('due-date').value);
        formData.append('dueTime', document.getElementById('due-time').value);
    }

    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
    }

    try {
        // เลือก URL และ Method ตามโหมดการทำงาน
        const url = editId ? `/api/assignments/${editId}` : '/api/assignments';
        const method = editId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            body: formData 
        });

        if (response.ok) {
            alert(editId ? "อัปเดตข้อมูลเรียบร้อย!" : "บันทึกเรียบร้อย!");
            window.location.href = 'admin-process.html'; // กลับไปหน้ารวมงาน
        } else {
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    } catch (error) {
        console.error("Post failed:", error);
    }
}


// ฟังก์ชัน Render ข้อมูลกลุ่มนักศึกษา (ใช้โค้ดเดิมของคุณ)
async function renderSubmissions() {
    const container = document.getElementById('submission-list');
    if (!container) return;

    try {
        const response = await fetch('/api/submissions');
        const data = await response.json();

        container.innerHTML = data.map(group => `
            <div class="tracking-item">
                <div class="tracking-header-row" onclick="toggleAccordion(this)">
                    <div class="group-info">
                        <h4>${group.groupName}</h4>
                        <div class="project-names">
                            ${group.projects.map(p => `<span>- ${p}</span>`).join('')}
                        </div>
                    </div>
                    <div class="status-section">
                        <div class="submit-time">
                            <i class="fa-regular fa-clock"></i> ${group.submitTime}
                        </div>
                        <span class="status-badge ${group.status}">${group.status.toUpperCase()}</span>
                        <i class="fa-solid fa-chevron-down chevron-icon"></i>
                    </div>
                </div>
                <div class="tracking-body">
                    <div class="body-label">Members</div>
                    <div class="member-list">${group.members.join(', ')}</div>
                    
                    <div class="body-label">Submitted Files</div>
                    <div class="file-row">
                        ${group.files.map(file => `
                            <div class="file-card">
                                <div class="file-name-part">${file}</div>
                                <div class="file-actions-part">
                                    <div class="action-icon-btn view"><i class="fa-solid fa-eye"></i></div>
                                    <div class="action-icon-btn"><i class="fa-solid fa-download"></i></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load submissions:", error);
    }
}
// ฟังก์ชันเปิด-ปิด Accordion
function toggleAccordion(element) {
    element.closest('.tracking-item').classList.toggle('active');
}