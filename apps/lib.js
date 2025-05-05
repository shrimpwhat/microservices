import redis from "redis";
import neo4j from "neo4j-driver";
import { Client as Elastic } from "@elastic/elasticsearch";
import { Client as Postgres } from "pg";

const redisClient = redis.createClient({
  url: "redis://redis:6379",
});

const neo4jDriver = neo4j.driver("bolt://neo4j:7687");
const neo4jSession = neo4jDriver.session();

const elasticClient = new Elastic({
  node: "http://elasticsearch:9200",
});

const postgres = new Postgres({
  user: "postgres",
  host: "postgres",
  database: "postgres",
  port: 5432,
});

await postgres.connect();
await redisClient.connect();

export async function getAttendance(idStudents, idScheds) {
  const query = `
    SELECT id_stud, COUNT(*)
    FROM attendance_partitioned 
    WHERE id_stud = ANY($1) 
      AND id_sched = ANY($2)
    GROUP BY id_stud
  `;

  const result = await postgres.query(query, [idStudents, idScheds]);

  const attendanceMap = {};
  for (const row of result.rows) {
    attendanceMap[row.id_stud] = parseInt(row.count);
  }

  return attendanceMap;
}

export async function getStudentById(id, percent = null, attendance = null) {
  const res = await redisClient.hGetAll(`student:${id}`);

  if (percent !== null) {
    res.percent = percent.toString() + "%";
  }

  if (attendance !== null) {
    res.attended_hours = attendance * 2;
  }

  return res;
}

export { redisClient, neo4jSession, elasticClient, postgres };
