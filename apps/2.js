import express from "express";
import { postgres, neo4jSession } from "./lib.js";

const PORT = 3002;
const app = express();
app.use(express.json());

async function getListenersCountPerLesson(lessonsIds, date1, date2) {
  const result = await neo4jSession.run(
    `
      UNWIND $lessonsIds as x 
      MATCH (l:LESSON {id: x})-[sc:SCHEDULE]-(g:GROUP)--(s:STUDENT) 
      WHERE DATE(sc.date) > DATE($date1) AND DATE(sc.date) < DATE($date2) 
      RETURN l.id, COUNT(DISTINCT s) AS count, sc.date
    `,
    {
      lessonsIds,
      date1,
      date2,
    }
  );

  const mappedData = result.records.map((record) => ({
    lessonId: record.get("l.id"),
    studentCount: record.get("count").toNumber(),
    scheduleDate: record.get("sc.date"),
  }));

  const lessonData = {};
  for (const el of mappedData) {
    lessonData[el.lessonId] = {
      studentCount: el.studentCount,
      scheduleDate: el.scheduleDate,
    };
  }

  return lessonData;
}

app.get("/", async (req, res) => {
  const { courseName, year, semester, isPractise = false } = req.query;

  if (!courseName || !year || !semester) {
    return res
      .status(400)
      .json({ error: "courseName, year and semester are required" });
  }

  const [startYear, endYear] = year.split("-");
  let date1, date2;
  if (semester == 1) {
    date1 = new Date(`${startYear}-09-01`);
    date2 = new Date(`${endYear}-01-31`);
  } else if (semester == 2) {
    date1 = new Date(`${endYear}-02-01`);
    date2 = new Date(`${endYear}-06-30`);
  }
  const date1String = date1.toISOString().split("T")[0];
  const date2String = date2.toISOString().split("T")[0];

  const { rows: courses } = await postgres.query(
    "SELECT * FROM courses WHERE name = $1",
    [courseName]
  );

  if (courses.length === 0) {
    return res.status(404).json({ error: "Course not found" });
  }
  const course = courses[0];

  const { rows: lessons } = await postgres.query(
    "SELECT id, name, description, is_practise FROM lessons WHERE id_course = $1 AND is_practise = $2",
    [course.id, isPractise]
  );
  const lessonIds = lessons.map((lesson) => lesson.id);

  const lessonsData = await getListenersCountPerLesson(
    lessonIds,
    date1String,
    date2String
  );

  const lessonsInfo = [];
  const result = {
    name: course.name,
    description: course.description,
  };

  for (const lesson of lessons) {
    const data = lessonsData[lesson.id];

    if (data.studentCount !== 0) {
      lessonsInfo.push({ ...lesson, ...data });
    }
  }

  result.lessons = lessonsInfo;
  result.period = `${date1String} - ${date2String}`;

  const { rows: specialities } = await postgres.query(
    "SELECT name FROM specialities WHERE id = $1",
    [course.id_spec]
  );

  result.speciality = specialities[0]?.name ?? null;

  return res.json(result);
});

app.listen(PORT, () => {
  console.log(`App 2 is running on ${PORT}`);
});
