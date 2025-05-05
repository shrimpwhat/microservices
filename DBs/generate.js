import { MongoClient } from "mongodb";
import { Client as Postgres } from "pg";
import redis from "redis";
import neo4j from "neo4j-driver";
import { Client as ElasticSearch } from "@elastic/elasticsearch";

const postgres = new Postgres({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  port: 5432,
});
const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});
const neo4jDriver = neo4j.driver("bolt://localhost:7687");
const elasticClient = new ElasticSearch({
  node: "http://localhost:9200",
});

await postgres.connect();

async function generateMongo() {
  const uri = "mongodb://localhost:27017";
  const mongo = new MongoClient(uri);
  const dbName = "education";
  await mongo.connect();

  const db = mongo.db(dbName);
  const universitiesCollection = db.collection("universities");

  const { rows: universities } = await postgres.query(
    "SELECT id, name FROM universities"
  );

  for (const university of universities) {
    const { rows: institutes } = await postgres.query(
      "SELECT id, name FROM institutes WHERE id_univ = $1",
      [university.id]
    );

    for (const institute of institutes) {
      const { rows: departments } = await postgres.query(
        "SELECT id, name FROM departments WHERE id_inst = $1",
        [institute.id]
      );

      institute.departments = departments;
    }
    university.institutes = institutes;
  }

  await universitiesCollection.insertMany(universities);
  await mongo.close();
}

async function generateRedis() {
  await redisClient.connect();
  const { rows: students } = await postgres.query(
    "SELECT * FROM get_students_details();"
  );

  for (const student of students) {
    const id = student.student_id;
    delete student.student_id;

    await redisClient.hSet(`student:${id}`, student);
  }

  await redisClient.quit();
}

async function generateNeo4j() {
  const session = neo4jDriver.session();

  const { rows: students } = await postgres.query("SELECT * FROM students");
  const { rows: groups } = await postgres.query("SELECT * FROM groups");

  for (const group of groups) {
    const { rows: scheduleData } = await postgres.query(
      `
        SELECT s.id, id_lesson, date, l.name as lesson_name
        FROM schedules_partitioned s
        JOIN lessons l ON l.id = id_lesson
        WHERE id_group = $1
        AND id_lesson IS NOT NULL
      `,
      [group.id]
    );

    const schedules = scheduleData.map((s) => ({
      ...s,
      date: s.date.toISOString().split("T")[0],
    }));

    const query = `
        UNWIND $schedules AS schedule
        MERGE (g:GROUP {id: $group.id, name: $group.name})
        MERGE (l:LESSON {id: schedule.id_lesson, name: schedule.lesson_name})
        -[:SCHEDULE {date: schedule.date, id: schedule.id}]->(g)
      `;

    await session.run(query, {
      schedules,
      group,
    });
  }

  for (const student of students) {
    await session.run(
      `
        CREATE (s:STUDENT {id: $student.id, name: $student.name})
        WITH s
        MATCH (g:GROUP {id: $student.id_group})
        CREATE (s)-[r:IN_GROUP]->(g)
      `,
      { student }
    );
  }

  await session.close();
  await neo4jDriver.close();
}

async function generateElasticsearch() {
  const indexName = "lessons";
  await elasticClient.indices.create({ index: indexName });

  const { rows: materials } = await postgres.query("SELECT * FROM materials");

  const operations = [];

  for (const material of materials) {
    operations.push({ index: { _index: indexName, _id: material.id } });
    operations.push({
      id_lesson: material.id_lesson,
      text: material.lesson_text,
    });
  }

  await elasticClient.bulk({ body: operations });
  await elasticClient.close();
}

Promise.all([
  generateMongo(),
  generateRedis(),
  generateNeo4j(),
  generateElasticsearch(),
]).finally(() => {
  postgres.end();
});
