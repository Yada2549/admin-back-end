document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('subject_id') || 'CSS492';
    const titleElement = document.getElementById('display-subject-name');
    if (titleElement) {
        titleElement.innerText = `${subjectId} - Administration`;
    }

    renderAdminProcesses();
    renderAnnouncements(); 
});

// --- ฟังก์ชันดึงงาน (Assignments) และเพิ่มปุ่ม Edit/Delete ---
async function renderAdminProcesses() {
    try {
        const response = await fetch('/api/assignments');
        const processes = await response.json();

        const ongoingContainer = document.getElementById('ongoing-container');
        const allListContainer = document.getElementById('all-process-list');

        ongoingContainer.innerHTML = '';
        allListContainer.innerHTML = '';

        processes.forEach(proc => {
            let statusHtml = "";
            let itemClass = "process-item";
            let targetPage = `admin-create.html?id=${proc._id}`; // ส่ง ID ไปเพื่อแก้ไข

            const isOngoing = proc.type === 'assignment' && proc.dueDateTime && new Date(proc.dueDateTime) > new Date();

            if (isOngoing) {
                ongoingContainer.innerHTML = `
                    <div class="ongoing-card" onclick="window.location.href='${targetPage}'">
                        <div class="ongoing-info">
                            <span class="task-name">${proc.topicName}</span>
                            <span class="created-at">
                                <i class="fa-solid fa-clock-rotate-left"></i> 
                                Created: ${new Date(proc.createdAt).toLocaleDateString('en-GB')}
                            </span>
                        </div>
                        <div class="ongoing-due">
                            Due Date<br>${new Date(proc.dueDateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                    </div>
                `;
                statusHtml = '<span style="font-size:12px; font-weight:800; color:#94A3B8;">On Going</span>';
            }

            // 🌟 แก้ไขตรงนี้: เพิ่มปุ่ม Edit และ Delete เข้าไปใน HTML
            allListContainer.innerHTML += `
            <div class="${itemClass}">
                <span onclick="window.location.href='${targetPage}'" style="cursor:pointer; flex-grow:1;">
                    ${proc.topicName}
                </span>
                <div class="item-actions" style="display:flex; gap:10px; align-items:center;">
                    ${statusHtml || (proc.type === 'announcement' ? '📢 Announcement' : '<i class="fa-solid fa-circle-check status-icon-green"></i>')}
                    
                    <!-- ปุ่มแก้ไข -->
                    <button class="action-btn edit" onclick="window.location.href='${targetPage}'">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    
                    <!-- ปุ่มลบ -->
                    <button class="action-btn delete" onclick="deleteAssignment('${proc._id}', '${proc.topicName}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        });
    } catch (error) {
        console.error("Error loading assignments:", error);
    }
}

// --- ฟังก์ชันสำหรับลบข้อมูล ---
async function deleteAssignment(id, name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        try {
            const response = await fetch(`/api/assignments/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert("Deleted successfully!");
                location.reload(); // รีเฟรชหน้าเพื่ออัปเดตรายการ
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

// --- ฟังก์ชันดึงประกาศ (Announcements) ---
async function renderAnnouncements() {
    const container = document.getElementById('announcement-list-container');
    try {
        const response = await fetch('/api/assignments');
        const data = await response.json();
        const newsList = data.filter(item => item.type === 'announcement');

        container.innerHTML = newsList.map(news => `
            <div class="announcement-item">
                <div class="announcement-header" onclick="toggleAnnouncement(this)">
                    <div class="announcement-title-group">
                        <h4>${news.topicName}</h4>
                        <span class="announcement-date">
                            <i class="fa-regular fa-calendar"></i> ${new Date(news.createdAt).toLocaleDateString('en-GB')}
                        </span>
                    </div>
                    <div class="announcement-header-right">
                        <i class="fa-solid fa-chevron-down chevron-icon"></i>
                    </div>
                </div>
                <div class="announcement-body">
                    <p>${news.description || 'No description provided.'}</p>
                    <div class="announcement-files">
                        ${news.attachments.map(file => `
                            <div class="file-card">
                                <span class="file-name-part">${file}</span>
                                <div class="file-actions-part">
                                    <a href="/uploads/${file}" target="_blank" class="action-icon-btn"><i class="fa-regular fa-eye"></i></a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`).join('');
    } catch (err) {
        console.error("Load news failed:", err);
    }
}

function toggleAnnouncement(element) {
    element.closest('.announcement-item').classList.toggle('active');
}