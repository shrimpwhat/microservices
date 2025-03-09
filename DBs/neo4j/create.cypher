create (l:Lesson {id: "10", name: "Math", course_id: "1" }),
(sc:Schedule {id: "20", start_time: "1740693962", group_id: "35"}), 
(a1:Attendance {id: "30", student_id: "5"}), 
(a2:Attendance {id: "31", student_id: "6"}), 
(sc)-[:SCHEDULE_FOR]->(l),
(a1)-[:ATTENDANCE_FOR]->(sc),
(a2)-[:ATTENDANCE_FOR]->(sc)
