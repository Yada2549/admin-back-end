const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const XLSX = require('xlsx'); // ย้ายมาไว้ส่วนบนสุดรวมกับคนอื่น

const app = express();
const port = 3000;

// --- 1. Database Connection ---
mongoose.connect('mongodb://localhost:27017/acslab_db')
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- 2. Models ---

const Advisor = mongoose.model('Advisor', {
    id: String,
    groupId: String, 
    prefix: String,
    fname: String,
    lname: String,
    gmail: String
});

const Student = mongoose.model('Student', {
    id: { type: String, required: true, unique: true },
    fname: String,
    lname: String,
    gmail: String
});

const Assignment = mongoose.model('Assignment', {
    type: String,
    topicName: String,
    description: String,
    attachments: [String],
    publishDateTime: Date,
    dueDateTime: Date,
    createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    groupName: String,
    projTH: String,
    projEN: String,
    advisor: String,
    status: { type: String, default: 'pending' },
    members: [String],
    files: [String],
    submitTime: { type: Date, default: Date.now }
});

const Term = mongoose.model('Term', {
    name: { type: String, required: true, unique: true }
});

const Subject = mongoose.model('Subject', {
    term: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true }
});

// --- 3. Middleware & Static Files ---
app.use(cors());
app.use(express.json());

app.use('/HTML', express.static(path.join(__dirname, 'HTML')));
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/JS', express.static(path.join(__dirname, 'JS')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'admin-home.html'));
});

// --- 4. File Management (Multer) ---
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- 5. APIs: Advisors ---

// [NEW] API สำหรับ Import Excel/CSV เข้าสู่ฐานข้อมูล
app.post('/api/advisors/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const advisorsToImport = data.map(item => {
            // ฟังก์ชันช่วยหาค่าจาก Key ที่ใกล้เคียง (ไม่สนตัวพิมพ์เล็ก-ใหญ่ และช่องว่าง)
            const getValue = (keys) => {
                const foundKey = Object.keys(item).find(k => 
                    keys.includes(k.trim().toLowerCase().replace(/\s/g, ''))
                );
                return foundKey ? String(item[foundKey]) : null;
            };

            return {
                id: getValue(['id', 'advisorid', 'studentid', 'รหัสอาจารย์']), // รองรับ Student ID จากไฟล์คุณ
                groupId: getValue(['groupid', 'group', 'กลุ่ม']) || '-',
                prefix: getValue(['prefix', 'title', 'คำนำหน้า']) || '',
                fname: getValue(['firstname', 'fname', 'name', 'ชื่อจริง', 'ชื่อ']),
                lname: getValue(['lastname', 'lname', 'surname', 'นามสกุล']),
                gmail: getValue(['gmail', 'gmailaccount', 'email', 'อีเมล'])
            };
        }).filter(adv => adv.id && adv.fname); // เก็บเฉพาะแถวที่มีรหัสและชื่อ

        if (advisorsToImport.length > 0) {
            await Advisor.insertMany(advisorsToImport);
        }

        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Imported ${advisorsToImport.length} advisors successfully` });
    } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ error: "Failed to process file" });
    }
});

app.get('/api/advisors', async (req, res) => {
    try { res.json(await Advisor.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/advisors', async (req, res) => {
    try { 
        await new Advisor(req.body).save(); 
        res.status(201).json({ message: "Saved!" }); 
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/advisors/:id', async (req, res) => {
    try { 
        await Advisor.findOneAndDelete({ id: req.params.id }); 
        res.json({ message: "Deleted" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/advisors/:id', async (req, res) => {
    try { 
        await Advisor.findOneAndUpdate({ id: req.params.id }, req.body); 
        res.json({ message: "Updated" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. APIs: Students ---
app.get('/api/students', async (req, res) => {
    try { res.json(await Student.find().sort({ id: 1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/students', async (req, res) => {
    try {
        const existing = await Student.findOne({ id: req.body.id });
        if (existing) return res.status(400).json({ error: "Duplicate ID" });
        await new Student(req.body).save();
        res.status(201).json({ message: "Added!" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/students/:id', async (req, res) => {
    try { await Student.findOneAndDelete({ id: req.params.id }); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/students/:id', async (req, res) => {
    try { await Student.findOneAndUpdate({ id: req.params.id }, req.body); res.json({ message: "Updated" }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 7. APIs: Assignments ---
app.get('/api/assignments', async (req, res) => {
    try { res.json(await Assignment.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/assignments', upload.array('files', 10), async (req, res) => {
    try {
        const d = req.body;
        const fileNames = req.files.map(f => f.filename);
        const newAssign = new Assignment({
            ...d,
            attachments: fileNames,
            publishDateTime: d.publishDate ? new Date(`${d.publishDate}T${d.publishTime || '00:00'}`) : new Date(),
            dueDateTime: d.dueDate ? new Date(`${d.dueDate}T${d.dueTime || '00:00'}`) : null
        });
        await newAssign.save();
        res.status(201).json({ message: "Saved!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/assignments/:id', async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/assignments/:id', upload.array('files', 10), async (req, res) => {
    try {
        const d = req.body;
        const updateData = { ...d };
        if (req.files && req.files.length > 0) updateData.attachments = req.files.map(f => f.filename);
        await Assignment.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: "Updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 8. APIs: Academic Terms & Subjects ---
app.get('/api/terms', async (req, res) => {
    try { res.json(await Term.find().sort({ name: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/terms', async (req, res) => {
    try {
        const existing = await Term.findOne({ name: req.body.name });
        if (existing) return res.status(400).json({ error: "Exists!" });
        res.status(201).json(await new Term(req.body).save());
    } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/terms/:name', async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        await Term.findOneAndDelete({ name });
        await Subject.deleteMany({ term: name });
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/terms/:oldName', async (req, res) => {
    try {
        const oldName = decodeURIComponent(req.params.oldName);
        const newName = req.body.name;

        // 1. แก้ไขชื่อเทอมใน Collection Term
        const updatedTerm = await Term.findOneAndUpdate({ name: oldName }, { name: newName }, { new: true });
        if (!updatedTerm) return res.status(404).json({ error: "Term not found" });

        // 2. อัปเดตฟิลด์ term ในรายวิชาทั้งหมดที่เคยผูกกับชื่อเก่า ให้เป็นชื่อใหม่
        await Subject.updateMany({ term: oldName }, { term: newName });

        res.json({ message: "Term updated successfully", data: updatedTerm });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/subjects/:term', async (req, res) => {
    try { res.json(await Subject.find({ term: decodeURIComponent(req.params.term) })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/subjects', async (req, res) => {
    try { res.status(201).json(await new Subject(req.body).save()); } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/subjects/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});
// [UPDATE] แก้ไขรายละเอียดวิชา (รหัสวิชา หรือ ชื่อวิชา)
app.put('/api/subjects/:id', async (req, res) => {
    try {
        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        if (!updatedSubject) return res.status(404).json({ error: "Subject not found" });
        res.json({ message: "Subject updated successfully", data: updatedSubject });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 9. APIs: Student Groups (CRUD) ---
app.get('/api/groups', async (req, res) => {
    try { res.json(await Submission.find().sort({ groupName: 1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/groups', async (req, res) => {
    try { res.status(201).json(await new Submission(req.body).save()); } catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/groups/:id', async (req, res) => {
    try { await Submission.findByIdAndUpdate(req.params.id, req.body); res.json({ message: "Updated" }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/groups/:id', async (req, res) => {
    try { await Submission.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- เพิ่ม Model Committee ในส่วน Models ---
const Committee = mongoose.model('Committee', {
    groupId: { type: String, required: true },
    members: [{
        pref: String,
        fname: String,
        lname: String
    }]
});

// --- เพิ่ม APIs สำหรับ Committee ในส่วน Routes ---

// [READ] ดึงข้อมูลทั้งหมด
app.get('/api/committees', async (req, res) => {
    try { 
        res.json(await Committee.find()); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// [CREATE] เพิ่มข้อมูลกลุ่มใหม่
app.post('/api/committees', async (req, res) => {
    try { 
        const newCommittee = new Committee(req.body);
        await newCommittee.save();
        res.status(201).json({ message: "Saved!", data: newCommittee }); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// [UPDATE] แก้ไขข้อมูลตาม ID
app.put('/api/committees/:id', async (req, res) => {
    try { 
        await Committee.findByIdAndUpdate(req.params.id, req.body); 
        res.json({ message: "Updated" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// [DELETE] ลบข้อมูลตาม ID
app.delete('/api/committees/:id', async (req, res) => {
    try { 
        await Committee.findByIdAndDelete(req.params.id); 
        res.json({ message: "Deleted" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- 10. Start Server ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
// --- 11. APIs: Document Hub (ดึงไฟล์ทั้งหมดมาโชว์) ---

app.get('/api/all-documents', async (req, res) => {
    try {
        const assignments = await Assignment.find();
        const submissions = await Submission.find();

        let allFiles = [];

        // ดึงไฟล์จาก Assignments
        assignments.forEach(asg => {
            if (asg.attachments && asg.attachments.length > 0) {
                asg.attachments.forEach(fileName => {
                    allFiles.push({
                        name: fileName,
                        uploader: "Advisor / Admin",
                        date: asg.createdAt
                    });
                });
            }
        });

        // ดึงไฟล์จาก Submissions
        submissions.forEach(sub => {
            if (sub.files && sub.files.length > 0) {
                sub.files.forEach(fileName => {
                    allFiles.push({
                        name: fileName,
                        uploader: sub.groupName || "Student Group",
                        date: sub.submitTime
                    });
                });
            }
        });

        res.json(allFiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API สำหรับ Download ไฟล์จริง
app.get('/download/:filename', (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.filename);
    res.download(file); 
});

// --- 12. Model & APIs สำหรับ Admin Profile & Events ---

// 1. Model สำหรับ System Events
// ตรวจสอบว่ายังไม่มีการประกาศ Model นี้มาก่อนหน้าใน server.js
const SystemEvent = mongoose.models.SystemEvent || mongoose.model('SystemEvent', {
    subject: String,
    title: String,
    date: String,
    time: String,
    backgroundColor: String
});

// 2. Model สำหรับ Admin Profile (ประกาศแค่ครั้งเดียวพอ)
const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', {
    adminId: { type: String, default: "AD67001" },
    fname: String,
    lname: String,
    gmail: String,
    profilePic: String
});

// --- API Routes ---

// [READ] ดึงข้อมูล Admin
app.get('/api/admin/profile', async (req, res) => {
    try {
        // หาข้อมูลอันแรกที่มีใน DB
        const profile = await AdminProfile.findOne();
        res.json(profile || {}); // ถ้าไม่มีให้ส่ง Object ว่างกลับไป
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [UPDATE] บันทึกหรือแก้ไขข้อมูล Admin (ใช้ร่วมกับปุ่ม Update Profile Information)
app.put('/api/admin/profile', async (req, res) => {
    try {
        // upsert: true คือถ้าไม่มีข้อมูล admin อยู่เลย จะสร้างให้ใหม่ทันที
        const updated = await AdminProfile.findOneAndUpdate(
            {}, 
            req.body, 
            { upsert: true, new: true }
        );
        console.log("Admin Updated:", updated); // เช็คใน Terminal ว่าข้อมูลเข้าไหม
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [CREATE] เพิ่มกิจกรรมในปฏิทิน
app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new SystemEvent(req.body);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// [READ] ดึงกิจกรรมทั้งหมดแสดงในปฏิทิน
app.get('/api/events', async (req, res) => {
    try {
        const events = await SystemEvent.find();
        res.json(events.map(e => ({
            id: e._id,
            title: `[${e.subject}] ${e.title}`,
            start: `${e.date}T${e.time}`,
            backgroundColor: e.backgroundColor
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [DELETE] ลบกิจกรรม
app.delete('/api/events/:id', async (req, res) => {
    try {
        await SystemEvent.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});