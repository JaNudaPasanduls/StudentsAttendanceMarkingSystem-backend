const router = require('express').Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

router.post('/create', auth, async (req, res) => {
    try {
        console.log(req)
        const { class_id, fname, lname, tel_number, nic, grade, Class, profilePic } = req.body;
        const check_id = await Student.findOne({ classId: class_id, class: Class });
        if (check_id) {
            throw new Error('Class Id already exist');
        }
        const check_nic = await Student.findOne({ nic: nic, grade: grade });
        if (check_nic) {
            throw new Error('NIC number already exists');
        }
        const check_number = await Student.findOne({ tel_number: tel_number, grade: grade });
        if (check_number) {
            throw new Error('Mobile number already exists');
        }

        const student = {
            classId: class_id,
            fname: fname,
            lname: lname,
            tel_number: tel_number,
            nic: nic,
            grade: grade,
            class: Class,
            profilePic: profilePic
        };

        const newStudent = new Student(student);
        await newStudent.save();
        res.status(200).send({ status: 'Student created', student: newStudent });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/get', auth, async (req, res) => {
    try {
        const { grade, Class, ClassId, Attendance } = req.body;
        console.log(req.body)
        const list = [grade, Class, ClassId, Attendance];
        function set_find() {
            let find = {};
            let i = 0;
            while (i < list.length) {
                if (i == 0) {
                    if (grade == "" || grade == undefined) { } else {
                        find.grade = grade
                    }
                }
                if (i == 1) {
                    if (Class == "" || Class == undefined) { } else {
                        find.class = Class
                    }
                }
                if (i == 2) {
                    if (ClassId == "" || ClassId == undefined) { } else {
                        find.classId = ClassId
                    }
                }
                if (i == 3) {
                    if (Attendance == "" || Attendance == undefined) { } else {
                        find.attendance = Attendance
                    }
                    return find;
                }
                i++;
            };
        }
        const stu_info = await set_find();
        console.log(stu_info)
        const student = await Student.find(stu_info);
        console.log(student);
        if (!student) {
            throw new Error('Student not found');
        }
        res.status(200).send({ status: 'Student Fetched', student: student });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/get/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const student = await Student.findById(id);
        if (!student) {
            throw new Error('Student not found');
        }
        res.status(200).send({ status: 'Student Fetched', student: student });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/get/attendance', auth, async (req, res) => {
    try {
        if (req.user.admin) {
            const { grade, Class, ClassId, type, Date } = req.body;
            const list = [grade, Class, ClassId, type, Date];
            console.log(list)
            function set_find() {
                let find = {};
                let i = 0;
                while (i < list.length) {
                    if (i == 0) {
                        find.grade = grade;
                    }
                    if (i == 1) {
                        find.class = Class;
                    }
                    if (i == 2) {
                        if (ClassId == "" || ClassId == undefined) { } else {
                            find.classId = ClassId;
                        }
                    }
                    if (i == 3) {
                        if ((type == "" || type == undefined) || type == "ALL") {  } else {
                            find.attendance = type;
                        }
                    }
                    if (i == 4) {
                        if (Date == "" || Date == undefined) { return find; } else {
                            find.date = Date;
                            return find;
                        } 
                    }
                    i++;
                };
            }
            const aten_info = await set_find();
            console.log(aten_info)
            const attendance = await Attendance.find(aten_info);
            if (!attendance) {
                throw new Error('Attendance not found');
            }
            res.status(200).send({ status: 'Attendance Fetched', attendance: attendance });
        } else {
            throw new Error('Only Admin Function.');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/get/payment', auth, async (req, res) => {
    try {
        if (req.user.admin) {
            const { grade, Class, ClassId, Date } = req.body;
            const list = [grade, Class, ClassId, Date];
            console.log(list)
            function set_find() {
                let find = {};
                let i = 0;
                while (i < list.length) {
                    if (i == 0) {
                        find.grade = grade;
                    }
                    if (i == 1) {
                        find.class = Class;
                    }
                    if (i == 2) {
                        if (ClassId == "" || ClassId == undefined) { } else {
                            find.classId = ClassId;
                        }
                    }
                    if (i == 3) {
                        if (Date == "" || Date == undefined) { return find; } else {
                            find.date = Date;
                            return find;
                        } 
                    }
                    i++;
                };
            }
            const payment_info = await set_find();
            console.log(payment_info);
            const payments = await Attendance.find(payment_info);
            console.log(payments)
            if (!payments) {
                throw new Error('Payments not found');
            }
            res.status(200).send({ status: 'Payments Fetched', payments:payments });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch('/mark/:id', auth, async (req, res) => {
    try {
        const studentID = req.params.id;
        const { paid, date } = req.body;
        const student = await Student.findById(studentID);
        if (!student) {
            throw new Error('Student not found');
        }
        if (student.status == "Inactive") {
            throw new Error('Student account has been inactivated');
        }
        if (student.attendance == "PRESENT") {
            throw new Erro('Student already marked');
        }
        const mark_student = await Student.findByIdAndUpdate(studentID, { attendance: 'PRESENT' });
        const at_student = {
            fname: student.fname,
            lname: student.lname,
            class: student.class,
            grade: student.grade,
            classId: student.classId,
            date: date,
            attendance: 'PRESENT'
        };
        const at_attendance = new Attendance(at_student);
        await at_attendance.save();
        if (paid) {
            const paid_student = {
                fname: student.fname,
                lname: student.lname,
                class: student.class,
                grade: student.grade,
                classId: student.classId,
                date: date
            };
            const pa_payment = new Payment(paid_student);
            await pa_payment.save();
        }
        res.status(200).send({ status: 'Student marked', phone: student.tel_number });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch('/update/:id', auth, async (req, res) => {
    try {
        const studentID = req.params.id;
        const { fname, lname, tel_number, nic, profilePic } = req.body;
        const stu = await Student.findById(studentID);
        const check_nic = await Student.findOne({ nic });
        console.log(JSON.stringify(stu._id));
        console.log(JSON.stringify(check_nic._id))
        if (check_nic) {
            if (JSON.stringify(check_nic._id) !== JSON.stringify(stu._id)) {
                throw new Error('NIC number already exists');
            }
        }
        const check_number = await Student.findOne({ tel_number });
        if (check_number) {
            if (JSON.stringify(check_number._id) !== JSON.stringify(stu._id)) {
                throw new Error('Mobile number already exists');
            }
        }

        const student = {
            fname: fname,
            lname: lname,
            tel_number: tel_number,
            nic: nic,
            profilePic: profilePic
        };
        const updateStudent = await Student.findByIdAndUpdate(studentID, student);
        res.status(200).send({ status: 'Student updated', updated_student: student });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.patch('/changestatus/:id', auth, async (req, res) => {
    try {
        if (req.user.admin) {
            const studentID = req.params.id;
            const student = await Student.findById(studentID);
            const updateStudent = await Student.findByIdAndUpdate(studentID, { status: (student.status == "Active") ? "Inactive" : "Active", absent_count: 0 });
            res.status(200).send({ message: `${(student.status == "Active") ? "Inactive" : "Active"}` });
        } else {
            throw new Error('Only Admin Function.');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/absent', auth, async (req, res) => {
    try {
        if (req.user.admin) {
            const { Class, grade, date } = req.body;
            let absent_students = await Student.find({ grade: grade, class: Class, attendance: 'ABSENT' });
            console.log(absent_students)
            for (let i = 0;i<absent_students.length;i++) {
                await Student.findByIdAndUpdate(absent_students[i].id, { absent_count: absent_students[i].absent_count += 1 });
                const at_student = {
                    fname: absent_students[i].fname,
                    lname: absent_students[i].lname,
                    class: absent_students[i].class,
                    grade: absent_students[i].grade,
                    classId: absent_students[i].classId,
                    date: date,
                    attendance: 'ABSENT'
                };
                const at_attendance = new Attendance(at_student);
                await at_attendance.save();
            };
            let deactivating = await Student.find({ grade: grade, class: Class });
            console.log(deactivating);
            let count = 0;
            for (let i = 0;i<deactivating.length;i++) {
                if (deactivating[i].absent_count > 2) {
                    await Student.findByIdAndUpdate(deactivating[i].id, { status: 'Inactive' });
                    count += 1;
                }
            }
            let students = await Student.find({ grade: grade, class: Class, attendance: 'PRESENT' });
            for (let i = 0;i<students.length;i++) {
                await Student.findByIdAndUpdate(students[i].id, { attendance: 'ABSENT' });
            }
            console.log(count)
            res.status(200).send({ message: 'Student Data Updated', absent: absent_students.length, deactivated: count });
        } else {
            throw new Error('only Admin Function.');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const studentID = req.params.id;
        const student_delete = await Student.findByIdAndDelete(studentID);
        res.status(200).send({ status: 'Student deleted' })
    } catch (err) {
        res.status(500).send(err.message);
    }
});


router.patch('/upgrade', auth, async (req, res) => {
    try {
        if (req.user.admin) {
            const senior = await Student.find({ grade: 11 });
            for (let i = 0;i<senior.length;i++) {
                await Student.findByIdAndRemove(senior[i].id);
            }

            for (let i = 6;i<=11;i++) {
                const attendance = await Attendance.find({ grade: i });
                const payments = await Payment.find({ grade: i });
                if (attendance.length != 0) {
                    let a = 0;
                    while (a<=attendance.length) {
                        try {
                            await Attendance.findByIdAndRemove(attendance[a].id);
                        } catch (err) {
                            console.log(err);
                        }
                        a += 1;
                    }
                }
                if (payments.length != 0) {
                    let a = 0;
                    while (a<=payments.length) {
                        try {
                            await Payment.findByIdAndRemove(payments[a].id);
                        } catch (err) {
                            console.log(err);
                        }
                        a += 1;
                    }
                }
            }
            for (let i = 6;i<=10;i++) {
                const students = await Student.find({ grade: i });
                console.log(students.length)
                if (students.length != 0) {
                    let a = 0;
                    while (a<=students.length) {
                        if (students[a]) {
                            const grade = students[a].grade;
                            const id = students[a].id;
                            await Student.findByIdAndUpdate(id, { grade: grade+1 });   
                        }
                        a += 1;
                    }
                }
            }
        } else {
            throw new Error('Only Admin Function.')
        }
        res.status(200).send({ message: 'Students Are Upgraded' });
    } catch (err) {
        console.log(err)
        res.status(500).send(err.message);
    }
});


module.exports = router;