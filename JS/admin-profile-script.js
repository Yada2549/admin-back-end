document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://localhost:3000/api';

    // 1. โหลดข้อมูล Profile และจัดการการอัปเดต
    async function loadAdminProfile() {
        try {
            const response = await fetch(`${API_URL}/admin/profile`);
            const data = await response.json();
            if (data) {
                document.getElementById('admin-id-input').value = data.adminId || "";
                document.getElementById('admin-fname-input').value = data.fname || "";
                document.getElementById('admin-lname-input').value = data.lname || "";
                document.getElementById('admin-email-input').value = data.gmail || "";
                if (data.profilePic) document.getElementById('profile-preview').src = data.profilePic;
            }
        } catch (err) { console.error("Error loading profile:", err); }
    }

    document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const updateData = {
        adminId: document.getElementById('admin-id-input').value, // ต้องตรงกับ Schema
        fname: document.getElementById('admin-fname-input').value,
        lname: document.getElementById('admin-lname-input').value,
        gmail: document.getElementById('admin-email-input').value
    };

    // ตรวจสอบว่ามีข้อมูลเบื้องต้นไหมก่อนส่ง
    if(!updateData.adminId) return alert("กรุณาใส่ Admin ID");

    const res = await fetch(`http://localhost:3000/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });

    if (res.ok) {
        alert("บันทึกข้อมูลลง MongoDB เรียบร้อยแล้ว!");
    } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
    }
});
    // 2. ดึงข้อมูล Term และ Subject จากหน้า Home มาใส่ใน Modal
    async function loadAcademicOptions() {
        try {
            // ดึงเทอม
            const termRes = await fetch(`${API_URL}/terms`);
            const terms = await termRes.json();
            const termSelect = document.getElementById('event-term');
            termSelect.innerHTML = terms.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

            // ฟังก์ชันดึงวิชาตามเทอม
            const updateSubjects = async (termName) => {
                const subRes = await fetch(`${API_URL}/subjects/${encodeURIComponent(termName)}`);
                const subjects = await subRes.json();
                const subSelect = document.getElementById('event-subject');
                subSelect.innerHTML = '<option value="ALL">All Subjects</option>' + 
                    subjects.map(s => `<option value="${s.subjectId}">${s.subjectId} - ${s.subjectName}</option>`).join('');
            };

            termSelect.addEventListener('change', (e) => updateSubjects(e.target.value));
            if(terms.length > 0) updateSubjects(terms[0].name);

        } catch (err) { console.error("Error loading academic data:", err); }
    }

    // 3. จัดการปฏิทิน และฟังก์ชัน "ลบ"
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        height: 550,
        events: `${API_URL}/events`,
        eventClick: function(info) {
            const eventId = info.event.id;
            const date = info.event.start.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
            const time = info.event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            document.getElementById('detail-modal-body').innerHTML = `
                <div class="event-detail-item"><i class="fas fa-info-circle"></i>
                <div><span class="detail-label">Event Topic</span><div class="detail-value">${info.event.title}</div></div></div>
                <div class="event-detail-item"><i class="far fa-calendar-alt" style="color: #F59E0B;"></i>
                <div><span class="detail-label">Date</span><div class="detail-value">${date}</div></div></div>
                <div class="event-detail-item"><i class="far fa-clock" style="color: #3B82F6;"></i>
                <div><span class="detail-label">Time</span><div class="detail-value">${time}</div></div></div>
                <button id="btn-delete-event" class="btn-confirm" style="background: #ef4444; margin-top: 15px;">Delete Event</button>
            `;

            document.getElementById('btn-delete-event').onclick = async () => {
                if(confirm("Are you sure you want to delete this event?")) {
                    const res = await fetch(`${API_URL}/events/${eventId}`, { method: 'DELETE' });
                    if(res.ok) { calendar.refetchEvents(); document.getElementById('calendar-modal').style.display = 'none'; }
                }
            };
            document.getElementById('calendar-modal').style.display = 'flex';
        }
    });
    calendar.render();

    // ส่วนเปิด/ปิด Modal และบันทึก Event ใหม่ (คงเดิม)
    document.getElementById('btn-add-event').addEventListener('click', () => document.getElementById('add-event-modal').style.display = 'flex');
    document.getElementById('close-add-modal').onclick = () => document.getElementById('add-event-modal').style.display = 'none';
    document.getElementById('close-detail-modal').onclick = () => document.getElementById('calendar-modal').style.display = 'none';
    document.getElementById('btn-ok-detail').onclick = () => document.getElementById('calendar-modal').style.display = 'none';

    document.getElementById('btn-save-event').addEventListener('click', async () => {
        const eventData = {
            subject: document.getElementById('event-subject').value,
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            backgroundColor: document.getElementById('event-subject').value === 'ALL' ? '#111' : '#5D9C96'
        };
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        if(res.ok) { calendar.refetchEvents(); document.getElementById('add-event-modal').style.display = 'none'; }
    });

   // เริ่มการทำงาน
    // loadAdminProfile(); // <--- ปิดส่วนนี้ไว้ เพื่อไม่ให้มันไปดึงข้อมูลเก่ามาใส่ในช่อง Input
    loadAcademicOptions();   // ส่วนนี้ยังต้องรันอยู่ เพื่อให้ Dropdown วิชา/เทอม ดึงข้อมูลจากหน้า Home มาได้
});