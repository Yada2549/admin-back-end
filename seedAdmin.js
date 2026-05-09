const mongoose = require('mongoose');

// 1. เชื่อมต่อฐานข้อมูล (ใช้ URL เดียวกับใน server.js)
mongoose.connect('mongodb://localhost:27017/acslab_db')
    .then(() => console.log('Connected to MongoDB for seeding...'))
    .catch(err => console.error('Could not connect:', err));

// 2. นิยาม Model (ต้องตรงกับ AdminProfile ใน server.js)
const AdminProfile = mongoose.model('AdminProfile', {
    adminId: { type: String, default: "AD67001" },
    fname: String,
    lname: String,
    gmail: String,
    profilePic: String
});

// 3. ฟังก์ชันสำหรับ Seed ข้อมูล
async function seedAdmin() {
    try {
        // ล้างข้อมูลเก่าออกก่อน (Optional)
        await AdminProfile.deleteMany({});

        const defaultAdmin = new AdminProfile({
            adminId: "AD67001",
            fname: "Admin",
            lname: "System",
            gmail: "admin@kmutt.ac.th",
            profilePic: "" // หรือใส่ URL รูปภาพเริ่มต้น
        });

        await defaultAdmin.save();
        console.log('Admin data seeded successfully!');
        
        // ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

seedAdmin();