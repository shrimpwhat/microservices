import express from "express";
import {
  elasticClient,
  neo4jSession,
  getAttendance,
  getStudentById,
} from "./lib.js";

const PORT = 3001;
const app = express();
app.use(express.json());

const searchByTerm = async (searchTerm) => {
  const response = await elasticClient.search({
    index: "lessons",
    query: {
      match: {
        text: {
          query: searchTerm,
        },
      },
    },
  });

  if (response.hits) {
    return response.hits.hits.map((result) => result._source?.id_lesson);
  }

  return [];
};

async function getStudentsByLessonsIds(lessonsIds, startDate, endDate) {
  const result = await neo4jSession.run(
    `UNWIND $lessonsIds AS x 
       MATCH (l:LESSON {id: x})-[sc:SCHEDULE]-(g:GROUP)-[:IN_GROUP]-(s:STUDENT)
       WHERE DATE(sc.date) > DATE($startDate) AND DATE(sc.date) < DATE($endDate) 
       RETURN DISTINCT s.id, sc.id`,
    {
      lessonsIds,
      startDate,
      endDate,
    }
  );

  const pairs = result.records.map((record) => ({
    id_stud: record.get("s.id"),
    id_sched: record.get("sc.id"),
  }));

  const students = new Set();
  const scheds = new Set();
  const scheduleByStudent = {};

  for (const pair of pairs) {
    students.add(pair.id_stud);
    scheds.add(pair.id_sched);

    if (!scheduleByStudent[pair.id_stud]) {
      scheduleByStudent[pair.id_stud] = 0;
    }
    scheduleByStudent[pair.id_stud] += 1;
  }

  return {
    students: Array.from(students),
    scheds: Array.from(scheds),
    scheduleByStudent,
  };
}

app.get("/", async (req, res) => {
  const { searchTerm, startDate, endDate } = req.query;

  if (!searchTerm || !startDate || !endDate) {
    return res
      .status(400)
      .send("searchTerm, startDate, and endDate are required");
  }

  const lessonsIds = await searchByTerm(searchTerm);

  const { students, scheds, scheduleByStudent } = await getStudentsByLessonsIds(
    lessonsIds,
    startDate,
    endDate
  );

  const attendanceData = await getAttendance(
    Array.from(students),
    Array.from(scheds)
  );

  const result = [];
  for (const [studentId, scheduleCount] of Object.entries(scheduleByStudent)) {
    const actualAttendance = attendanceData[studentId] || 0;
    const percent = (actualAttendance / scheduleCount) * 100;
    result.push({ studentId, percent });
  }

  result.sort((a, b) => a.percent - b.percent);
  const leastAttendance = result.slice(0, 10);

  const studentInfoQueries = leastAttendance.map(
    async ({ studentId, percent }) => getStudentById(studentId, percent)
  );

  const studentInfos = await Promise.all(studentInfoQueries);
  return res.json({ students: studentInfos });
});

app.listen(PORT, () => {
  console.log(`App 1 is running on ${PORT}`);
});
