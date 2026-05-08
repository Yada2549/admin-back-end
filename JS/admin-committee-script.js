let committees = [];
let editId = null; // ใช้เก็บ _id จาก MongoDB เพื่อใช้อ้างอิงตอนแก้ไข/ลบ

// 1. ดึงข้อมูลจาก Database ทันทีที่เปิดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    loadCommittees(); // ต้องมีบรรทัดนี้ ข้อมูลถึงจะเด้งขึ้นมาตอนเปิดหน้า
});

async function loadCommittees() {
    try {
        const response = await fetch('/api/committees');
        committees = await response.json();
        renderTable(committees);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

// 2. ฟังก์ชันวาดตาราง (ใช้ _id ของ MongoDB)
function renderTable(data) {
    const tbody = document.getElementById('committeeTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:50px; color:#999;">No committee groups found.</td></tr>`;
        return;
    }

    data.forEach((group) => {
        const memberItems = group.members.map(m => `<li class="member-item">${m.pref} ${m.fname} ${m.lname}</li>`).join('');
        tbody.innerHTML += `
            <tr>
                <td class="group-id-badge">${group.groupId}</td>
                <td><ul class="member-list">${memberItems}</ul></td>
                <td>
                    <div class="action-cell">
                        <button class="btn-edit-text" onclick="openEditModal('${group._id}')">Edit</button>
                        <button class="btn-delete-icon" onclick="deleteCommittee('${group._id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });
}

// 3. ฟังก์ชันบันทึกข้อมูล (CREATE & UPDATE)
// แก้ไขฟังก์ชันบันทึกข้อมูล (CREATE & UPDATE)
async function saveCommittee() {
    const groupId = document.getElementById('group-id').value.trim();
    if (!groupId) return alert('Please enter Group ID');

    const rows = document.querySelectorAll('.committee-input-row');
    const members = [];
    rows.forEach(row => {
        const pref = row.querySelector('.pref').value.trim();
        const fname = row.querySelector('.fname').value.trim();
        const lname = row.querySelector('.lname').value.trim();
        if (fname && lname) members.push({ pref, fname, lname });
    });

    if (members.length === 0) return alert('Please add at least one member');

    const committeeData = { groupId, members };
    
    // --- จุดสำคัญ: แยกแยะระหว่างเพิ่มใหม่ (POST) กับ แก้ไข (PUT) ---
    const url = editId ? `/api/committees/${editId}` : '/api/committees';
    const method = editId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(committeeData)
        });

        if (response.ok) {
            alert(editId ? "Updated successfully!" : "Saved successfully!");
            toggleModal(false);
            editId = null; // คืนค่าเป็น null ทุกครั้งหลังเซฟสำเร็จ
            loadCommittees(); // รีโหลดข้อมูลใหม่จาก DB มาแสดง
        } else {
            const err = await response.json();
            alert("Error: " + (err.error || "Failed to save"));
        }
    } catch (error) {
        console.error("Save failed:", error);
    }
}

// 4. ฟังก์ชันเปิด Modal แก้ไข
function openEditModal(id) {
    const group = committees.find(c => c._id === id);
    if (!group) return;

    editId = id;
    document.getElementById('modalTitle').innerText = "Edit Committee Group";
    document.getElementById('group-id').value = group.groupId;
    
    const container = document.getElementById('members-input-container');
    container.innerHTML = '<label>Committee Members</label>';
    
    group.members.forEach((m, i) => {
        const row = document.createElement('div');
        row.className = 'committee-input-row';
        row.innerHTML = `
            <input type="text" placeholder="Prefix" class="custom-input pref" style="width: 80px;" value="${m.pref}">
            <input type="text" placeholder="First Name" class="custom-input fname" value="${m.fname}">
            <input type="text" placeholder="Last Name" class="custom-input lname" value="${m.lname}">
            ${i === 0 ? '<span style="width:38px; display:inline-block;"></span>' : 
            '<button class="btn-delete-icon" onclick="this.parentElement.remove()" style="padding:5px;"><i class="fa-solid fa-circle-minus" style="color: #FF4D4D;"></i></button>'}
        `;
        container.appendChild(row);
    });
    toggleModal(true);
}

// 5. ฟังก์ชันลบข้อมูล
async function deleteCommittee(id) {
    if (confirm('Are you sure you want to delete this committee group?')) {
        try {
            const response = await fetch(`/api/committees/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadCommittees();
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }
}

// --- Helper Functions ---

function toggleModal(show) {
    const modal = document.getElementById('committeeModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    if (!show) {
        resetForm();
        editId = null; 
        document.getElementById('modalTitle').innerText = "Set Up Committee";
    }
}

function addMemberInputRow() {
    const container = document.getElementById('members-input-container');
    const newRow = document.createElement('div');
    newRow.className = 'committee-input-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Prefix" class="custom-input pref" style="width: 80px;">
        <input type="text" placeholder="First Name" class="custom-input fname">
        <input type="text" placeholder="Last Name" class="custom-input lname">
        <button class="btn-delete-icon" onclick="this.parentElement.remove()" style="padding:5px;">
            <i class="fa-solid fa-circle-minus" style="color: #FF4D4D;"></i>
        </button>
    `;
    container.appendChild(newRow);
}

function resetForm() {
    document.getElementById('group-id').value = '';
    document.getElementById('members-input-container').innerHTML = `
        <label>Committee Members</label>
        <div class="committee-input-row">
            <input type="text" placeholder="Prefix" class="custom-input pref" style="width: 80px;">
            <input type="text" placeholder="First Name" class="custom-input fname">
            <input type="text" placeholder="Last Name" class="custom-input lname">
            <span style="width: 38px; display:inline-block;"></span>
        </div>`;
}

function handleSearch() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const filtered = committees.filter(g => 
        g.groupId.toLowerCase().includes(q) || 
        g.members.some(m => 
            (m.fname + " " + m.lname).toLowerCase().includes(q)
        )
    );
    renderTable(filtered);
}