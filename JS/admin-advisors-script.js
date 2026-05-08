// 1. ตัวแปรเก็บข้อมูลหลัก
let advisors = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAdvisors();
});

async function loadAdvisors() {
    try {
        const response = await fetch('/api/advisors');
        advisors = await response.json();
        renderTable(advisors);
    } catch (error) {
        console.error("Failed to load advisors:", error);
    }
}

// 2. ฟังก์ชันวาดตาราง (แก้ไขให้การแสดงผลถูกต้อง)
function renderTable(data) {
    const tbody = document.getElementById('advisorTableBody');
    tbody.innerHTML = ''; 

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color:#999;">No advisors found.</td></tr>`;
        return;
    }

    data.forEach(a => {
        // ตรวจสอบให้แน่ใจว่าแต่ละคอลัมน์แยก <td> กันชัดเจน
        tbody.innerHTML += `
            <tr>
                <td>${a.id}</td>
                <td style="font-weight: 700; color: var(--primary);">${a.groupId || '-'}</td>
                <td>${a.prefix || '-'}</td>
                <td>${a.fname} ${a.lname}</td>
                <td class="hide-mobile" style="color:#666;">${a.gmail}</td>
                <td>
                    <div class="action-cell">
                        <button class="btn-edit-text" onclick="openEditModal('${a.id}')">Edit</button>
                        <button class="btn-delete-icon" onclick="deleteAdvisor('${a.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// 3. ฟังก์ชันลบข้อมูล
async function deleteAdvisor(id) {
    const confirmDelete = confirm(`คุณยืนยันที่จะลบข้อมูลอาจารย์ รหัส: ${id} หรือไม่?`);
    if (confirmDelete) {
        try {
            const response = await fetch(`/api/advisors/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("ลบข้อมูลสำเร็จ");
                loadAdvisors();
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }
}

// 4. ส่วนของ Modal ควบคุม
function toggleEditModal(show) {
    document.getElementById('editModal').style.display = show ? 'flex' : 'none';
}

function toggleModal(show) {
    const modal = document.getElementById('importModal');
    modal.style.display = show ? 'flex' : 'none';
}

function switchModalTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// 5. แก้ไขข้อมูล (ดึงค่า Group ID มาใส่ใน Modal Edit)
function openEditModal(id) {
    const adv = advisors.find(a => a.id === id);
    if (!adv) return;

    document.getElementById('edit-id').value = adv.id;
    document.getElementById('edit-group-id').value = adv.groupId || ''; // ดึงค่า Group ID
    document.getElementById('edit-prefix').value = adv.prefix;
    document.getElementById('edit-fname').value = adv.fname;
    document.getElementById('edit-lname').value = adv.lname;
    document.getElementById('edit-gmail').value = adv.gmail;
    
    toggleEditModal(true);
}

async function saveEditAdvisor() {
    const id = document.getElementById('edit-id').value;
    const groupId = document.getElementById('edit-group-id').value; // รับค่า Group ID
    const prefix = document.getElementById('edit-prefix').value;
    const fname = document.getElementById('edit-fname').value;
    const lname = document.getElementById('edit-lname').value;
    const gmail = document.getElementById('edit-gmail').value;

    if (!fname || !lname || !groupId) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    const updatedData = { id, groupId, prefix, fname, lname, gmail };

    try {
        const response = await fetch(`/api/advisors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert("อัปเดตข้อมูลเรียบร้อย");
            toggleEditModal(false);
            loadAdvisors();
        }
    } catch (error) {
        console.error("Update failed:", error);
    }
}

// 6. เพิ่มข้อมูลใหม่ (Manual Import พร้อม Group ID)
async function saveManualAdvisor() {
    const id = document.getElementById('new-id').value;
    const groupId = document.getElementById('new-group-id').value; // รับค่า Group ID
    const prefix = document.getElementById('new-prefix').value;
    const fname = document.getElementById('new-fname').value;
    const lname = document.getElementById('new-lname').value;
    const gmail = document.getElementById('new-gmail').value;

    if (!id || !groupId || !prefix || !fname || !lname) return alert("Please fill all required fields");

    const newAdvisorData = { 
        id, 
        groupId, // ส่งไปยัง backend
        prefix, 
        fname, 
        lname, 
        gmail: gmail || '-' 
    };

    try {
        const response = await fetch('/api/advisors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdvisorData)
        });

        if (response.ok) {
            alert("บันทึกข้อมูลลงฐานข้อมูลเรียบร้อย!");
            toggleModal(false);
            loadAdvisors();
            // ล้างค่าในช่อง Input ทั้งหมด
            document.querySelectorAll('#manual .custom-input').forEach(i => i.value = ''); 
        } else {
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    } catch (error) {
        console.error("Save failed:", error);
    }
}

// 7. ระบบค้นหา (เพิ่มการค้นหาด้วย Group ID)
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = advisors.filter(a => 
        a.id.toLowerCase().includes(query) || 
        (a.groupId && a.groupId.toLowerCase().includes(query)) || // ค้นหาด้วย Group ID
        a.prefix.toLowerCase().includes(query) ||
        a.fname.toLowerCase().includes(query) || 
        a.lname.toLowerCase().includes(query)
    );
    renderTable(filtered);
}
// เพิ่มฟังก์ชันนี้ต่อท้ายไฟล์ หรือวางแทนที่ simulateExcelImport เดิม
async function processExcelImport() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    if (!file) return alert("Please select an Excel or CSV file first!");

    const formData = new FormData();
    formData.append('file', file);

    const btn = document.querySelector('.btn-confirm.secondary');
    const originalText = btn.innerText;

    try {
        btn.innerText = "Processing...";
        btn.disabled = true;

        const response = await fetch('/api/advisors/import', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert("Success: " + result.message);
            toggleModal(false);
            loadAdvisors(); // รีโหลดตารางใหม่
            fileInput.value = ''; // ล้างค่า input
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error("Import failed:", error);
        alert("Server connection failed.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}