let currentTerms = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAllTerms();
});

// 1. ดึงเทอมทั้งหมดจาก Database
async function loadAllTerms() {
    try {
        const response = await fetch('/api/terms');
        currentTerms = await response.json();
        
        const container = document.getElementById('class-list-container');
        
        if (currentTerms.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color:#888;">
                    <p>No terms found. Please click "Add Term" to start.</p>
                </div>`;
            return;
        }

        updateTermDropdowns();

        // ดึงสถานะเทอมล่าสุดที่เลือกไว้จาก Session
        const lastActive = sessionStorage.getItem('adminActiveTerm');
        const termSelector = document.getElementById('term-selector');
        
        if (lastActive && currentTerms.some(t => t.name === lastActive)) {
            termSelector.value = lastActive;
        } else {
            termSelector.value = currentTerms[0].name;
        }
        
        fetchClasses();
    } catch (err) {
        console.error("Load terms failed:", err);
    }
}

// 2. อัปเดต Dropdown
function updateTermDropdowns() {
    const mainSelect = document.getElementById('term-selector');
    const modalSelect = document.getElementById('target-term');
    
    const optionsHtml = currentTerms.map(t => {
        let [sem, year] = t.name.split('/');
        return `<option value="${t.name}">Semester ${sem} / ${year}</option>`;
    }).join('');
    
    mainSelect.innerHTML = optionsHtml;
    modalSelect.innerHTML = optionsHtml;
}

// 3. ดึงวิชาตามเทอม (ใช้ข้อมูลจริงจาก DB)
async function fetchClasses() {
    const term = document.getElementById('term-selector').value;
    if (!term) return;

    sessionStorage.setItem('adminActiveTerm', term); 
    
    const container = document.getElementById('class-list-container');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Loading classes...</p>';

    try {
        const response = await fetch(`/api/subjects/${encodeURIComponent(term)}`);
        const subjects = await response.json();

        if(subjects.length > 0) {
            container.innerHTML = subjects.map(sub => `
                <div class="class-card">
                    <div class="class-info" onclick="window.location.href='admin-process.html?term=${term}&subject_id=${sub.subjectId}'">
                        <span style="font-size:12px; color:#666;">${sub.subjectId}</span>
                        <h3>${sub.subjectName}</h3>
                    </div>
                    <div class="admin-controls" style="display: flex; gap: 15px; align-items: center; padding-right: 20px;">
                        <button onclick="openEditSubjectModal('${sub._id}', '${sub.subjectId}', '${sub.subjectName}')" 
                                style="background:none; border:none; color:#1A365D; cursor:pointer; font-weight:bold; font-size:14px;">Edit</button>
                        <button onclick="deleteSubject('${sub._id}')" 
                                style="background:none; border:none; color:#E53E3E; cursor:pointer; font-size:16px;"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; border: 2px dashed #DDD; border-radius: 12px; color:#888;">
                    <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px;"></i>
                    <p>No subjects found for this term. Click "Add Subject" to create one.</p>
                </div>`;
        }
    } catch (err) {
        container.innerHTML = '<p style="text-align:center; color:red;">Error loading classes.</p>';
    }
}

// 4. ลบวิชา (คุยกับ MongoDB)
async function deleteSubject(mongoId) {
    if (!confirm("คุณต้องการลบรายวิชานี้ใช่หรือไม่? ข้อมูลทั้งหมดในวิชานี้จะหายไป")) return;

    try {
        const response = await fetch(`/api/subjects/${mongoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchClasses(); // รีโหลดรายการวิชาใหม่
        } else {
            alert("ไม่สามารถลบได้");
        }
    } catch (err) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
}

// 5. แก้ไขวิชา
let editingSubjectId = null; 
function openEditSubjectModal(mongoId, id, name) {
    editingSubjectId = mongoId;
    document.getElementById('new-subject-id').value = id;
    document.getElementById('new-subject-name').value = name;
    
    const modal = document.getElementById('subjectModal');
    modal.querySelector('h3').innerText = "Edit Subject";
    const confirmBtn = modal.querySelector('.btn-confirm');
    confirmBtn.innerText = "Save Changes";
    confirmBtn.onclick = updateSubject; // เปลี่ยน function เมื่อกดบันทึก
    
    toggleModal('subjectModal');
}

async function updateSubject() {
    const subjectId = document.getElementById('new-subject-id').value.trim();
    const subjectName = document.getElementById('new-subject-name').value.trim();

    try {
        const response = await fetch(`/api/subjects/${editingSubjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId, subjectName })
        });

        if (response.ok) {
            toggleModal('subjectModal');
            resetSubjectModal();
            fetchClasses();
        }
    } catch (err) {
        alert("แก้ไขไม่สำเร็จ");
    }
}

// 6. บันทึกเทอมใหม่
async function saveNewTerm() {
    const sem = document.getElementById('new-semester').value;
    const year = document.getElementById('new-year').value.trim();
    if(!year) return alert('Please enter academic year!');
    
    const termName = `${sem}/${year}`;

    try {
        const response = await fetch('/api/terms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: termName })
        });

        if (response.ok) {
            toggleModal('termModal');
            loadAllTerms();
        } else {
            const err = await response.json();
            alert(err.error || 'Term exists');
        }
    } catch (err) {
        alert('Server failed');
    }
}

// 7. บันทึกวิชาใหม่
async function saveNewSubject() {
    const term = document.getElementById('target-term').value;
    const subjectId = document.getElementById('new-subject-id').value.trim();
    const subjectName = document.getElementById('new-subject-name').value.trim();

    if(!subjectId || !subjectName) return alert('Please fill details!');

    try {
        const response = await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, subjectId, subjectName })
        });

        if (response.ok) {
            toggleModal('subjectModal');
            document.getElementById('new-subject-id').value = '';
            document.getElementById('new-subject-name').value = '';
            fetchClasses();
        }
    } catch (err) {
        alert('Failed');
    }
}

// Helper Functions
function resetSubjectModal() {
    const modal = document.getElementById('subjectModal');
    modal.querySelector('h3').innerText = "Add New Subject";
    const confirmBtn = modal.querySelector('.btn-confirm');
    confirmBtn.innerText = "Add Subject";
    confirmBtn.onclick = saveNewSubject;
    document.getElementById('new-subject-id').value = '';
    document.getElementById('new-subject-name').value = '';
    editingSubjectId = null;
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        if(modalId === 'subjectModal') resetSubjectModal();
    } else {
        modal.style.display = 'flex';
        if(modalId === 'termModal') {
            document.getElementById('new-year').value = new Date().getFullYear();
        }
        if(modalId === 'subjectModal') {
            document.getElementById('target-term').value = document.getElementById('term-selector').value;
        }
    }
}
// --- 1. ฟังก์ชันสำหรับลบวิชา (เพิ่มเข้าไปใหม่) ---
async function deleteSubject(mongoId) {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
        const response = await fetch(`/api/subjects/${mongoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Deleted successfully");
            fetchClasses(); // โหลดรายการใหม่ทันที
        } else {
            alert("Delete failed");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Server connection failed");
    }
}

// --- 2. ฟังก์ชันแก้ไขวิชา (ปรับปรุงจากเดิม) ---
async function updateSubject() {
    const subjectId = document.getElementById('new-subject-id').value.trim();
    const subjectName = document.getElementById('new-subject-name').value.trim();

    if (!editingSubjectId) return;

    try {
        const response = await fetch(`/api/subjects/${editingSubjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                subjectId: subjectId, 
                subjectName: subjectName 
            })
        });

        if (response.ok) {
            alert("Updated successfully");
            toggleModal('subjectModal');
            resetSubjectModal();
            fetchClasses();
        } else {
            alert("Update failed");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Failed to connect to server");
    }
}