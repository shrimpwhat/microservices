import express from "express";
import {
  postgres,
  neo4jSession,
  getAttendance,
  getStudentById,
} from "./lib.js";

const PORT = 3003;
const app = express();
app.use(express.json());

async function getScheduleByGroup(lessonsIds, groupId) {
  const result = await neo4jSession.run(
    `
    UNWIND $lessonsIds as lessonId
    MATCH (l:LESSON {id: lessonId})-[sc:SCHEDULE]-(g:GROUP {id: $groupId})--(s:STUDENT)
    RETURN sc.id as scheduleId, s.id as studentId
    `,
    {
      lessonsIds,
      groupId,
    }
  );

  const schedulesWithStudents = result.records.map((record) => ({
    id_sched: record.get("scheduleId"),
    id_stud: record.get("studentId"),
  }));

  const students = new Set();
  const schedules = new Set();

  for (const item of schedulesWithStudents) {
    students.add(item.id_stud);
    schedules.add(item.id_sched);
  }

  const studentsIds = Array.from(students);
  const schedulesIds = Array.from(schedules);

  return { studentsIds, schedulesIds };
}

app.get("/", async (req, res) => {
  const { group } = req.query;

  if (!group) {
    return res.status(400).json({ error: "group is required" });
  }

  const { rows: groups } = await postgres.query(
    "SELECT id FROM groups WHERE name = $1",
    [group]
  );
  if (groups.length === 0) {
    return res.status(404).json({ error: "Group not found" });
  }
  const groupId = groups[0].id;

  const { rows: lessons } = await postgres.query(
    "SELECT * FROM lessons WHERE id_course IN (SELECT id FROM courses s WHERE id_depart = (SELECT id_depart FROM groups WHERE id = $1))",
    [groupId]
  );

  const { rows: courses } = await postgres.query(
    "SELECT * FROM courses WHERE id_depart = (SELECT id_depart FROM groups WHERE id = $1)",
    [groupId]
  );

  const lessonsIds = lessons.map((lesson) => lesson.id);

  const { studentsIds, schedulesIds } = await getScheduleByGroup(
    lessonsIds,
    groupId
  );

  const attendance = await getAttendance(studentsIds, schedulesIds);

  const studentInfoPromises = Object.entries(attendance).map(
    ([studentId, attendanceCount]) =>
      getStudentById(studentId, null, attendanceCount)
  );

  const studentsInfo = await Promise.all(studentInfoPromises);

  const result = {
    name: group,
    planned_hours: schedulesIds.length * 2,
    courses: courses.map((course) => course.name),
    students: studentsInfo,
  };

  return res.json(result);
});

app.listen(PORT, () => {
  console.log(`App 3 is running on ${PORT}`);
});
