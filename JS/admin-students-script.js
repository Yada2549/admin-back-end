// 1. เปลี่ยนตัวแปรหลักให้เป็นอาร์เรย์ว่างเพื่อรอรับข้อมูลจริงจากฐานข้อมูล
let students = [];

document.addEventListener('DOMContentLoaded', () => {
    loadStudents(); // เรียกดึงข้อมูลจาก DB ทันทีที่เปิดหน้า
});

// 2. ฟังก์ชันดึงข้อมูลจาก Server (MongoDB)
async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        students = await response.json();
        renderTable(students);
    } catch (error) {
        console.error("Failed to load students:", error);
    }
}

// 3. ฟังก์ชันวาดตาราง (ใช้โครงสร้างเดิมแต่รับข้อมูลจาก API)
function renderTable(data) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = ''; 

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:50px; color:#999;">No students found.</td></tr>`;
        return;
    }

    data.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>${s.id}</td>
                <td>${s.fname} ${s.lname}</td>
                <td class="hide-mobile" style="color:#666;">${s.gmail}</td>
                <td>
                    <div class="action-cell">
                        <button class="btn-edit-text" onclick="openEditModal('${s.id}')">Edit</button>
                        <button class="btn-delete-icon" onclick="deleteStudent('${s.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// ... (ส่วนต้นของไฟล์เหมือนเดิม)

// 4. ปรับฟังก์ชันลบข้อมูล (เพิ่ม Error Handling)
async function deleteStudent(id) {
    if (confirm(`คุณยืนยันที่จะลบข้อมูลนักศึกษา รหัส: ${id} หรือไม่?`)) {
        try {
            const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert("ลบข้อมูลสำเร็จ");
                loadStudents();
            } else {
                alert("ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่");
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ต");
        }
    }
}

// 6. บันทึกการแก้ไข (เพิ่ม .trim, Check Gmail, Loading State)
async function saveEditStudent() {
    const btn = document.querySelector('#editModal .btn-confirm');
    const id = document.getElementById('edit-id').value;
    const fname = document.getElementById('edit-fname').value.trim();
    const lname = document.getElementById('edit-lname').value.trim();
    const gmail = document.getElementById('edit-gmail').value.trim();

    if (!fname || !lname) return alert("กรุณากรอกชื่อและนามสกุล");
    
    // Check Gmail Format
    if (gmail !== '-' && !gmail.endsWith('@mail.kmutt.ac.th')) {
        return alert("กรุณาใช้ Gmail ของมหาวิทยาลัย (@mail.kmutt.ac.th)");
    }

    try {
        btn.innerText = "Updating..."; // Loading State
        btn.disabled = true;

        const response = await fetch(`/api/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fname, lname, gmail })
        });

        if (response.ok) {
            alert("อัปเดตข้อมูลเรียบร้อย");
            toggleEditModal(false);
            loadStudents();
        } else {
            const err = await response.json();
            alert("แก้ไขไม่สำเร็จ: " + err.error);
        }
    } catch (error) {
        alert("การเชื่อมต่อ Server ล้มเหลว");
    } finally {
        btn.innerText = "Update Changes";
        btn.disabled = false;
    }
}

// 7. เพิ่มข้อมูลใหม่ (เพิ่ม .trim, Check ID, Loading State)
async function saveManualStudent() {
    const btn = document.querySelector('#manual .btn-confirm');
    const id = document.getElementById('new-id').value.trim();
    const fname = document.getElementById('new-fname').value.trim();
    const lname = document.getElementById('new-lname').value.trim();
    const gmail = document.getElementById('new-gmail').value.trim();

    if (!id || !fname || !lname) return alert("กรุณากรอกรหัสและชื่อ-นามสกุล");

    try {
        btn.innerText = "Adding..."; // Loading State
        btn.disabled = true;

        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fname, lname, gmail: gmail || '-' })
        });

        const result = await response.json();

        if (response.ok) {
            alert("บันทึกข้อมูลเรียบร้อย!");
            toggleModal(false);
            loadStudents();
            document.querySelectorAll('.custom-input').forEach(i => i.value = '');
        } else {
            alert("ผิดพลาด: " + result.error); // แจ้งเตือนกรณี ID ซ้ำ
        }
    } catch (error) {
        alert("ไม่สามารถเชื่อมต่อ Server ได้");
    } finally {
        btn.innerText = "Add to List";
        btn.disabled = false;
    }
}
// 8. ระบบค้นหา (Frontend Search)
function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = students.filter(s => 
        s.id.includes(query) || 
        s.fname.toLowerCase().includes(query) || 
        s.lname.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

// 9. ควบคุม Modal หลัก
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

// 10. ระบบจำลองการนำเข้า (สำหรับรอพัฒนา Excel Parser ในอนาคต)
function simulateExcelImport() {
    const file = document.getElementById('fileUpload').files[0];
    if (!file) return alert("Please select a file first");

    alert("ระบบกำลังเตรียมรองรับการนำเข้าไฟล์จริงจาก: " + file.name);
}
// 11. ฟังก์ชันเปิด Modal แก้ไขและดึงข้อมูลเดิมมาแสดง
function openEditModal(id) {
    const student = students.find(s => String(s.id) === String(id));
    if (student) {
        document.getElementById('edit-id').value = student.id;
        document.getElementById('edit-fname').value = student.fname;
        document.getElementById('edit-lname').value = student.lname;
        document.getElementById('edit-gmail').value = student.gmail;
        document.getElementById('editModal').style.display = 'flex';
    }
}

// 12. ฟังก์ชันเปิด/ปิด Modal แก้ไข
function toggleEditModal(show) {
    document.getElementById('editModal').style.display = show ? 'flex' : 'none';
}