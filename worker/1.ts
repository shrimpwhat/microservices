import express from "express";
import redis from "redis";
import neo4j from "neo4j-driver";
import { Client } from "@elastic/elasticsearch";
import "dotenv/config";

const PORT = process.env.PORT || 3000;
const app = express();

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

const neo4jClient = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "12345678")
);

const elasticClient = new Client({
  node: "http://localhost:9200",
});

async function run() {
  await redisClient.connect();
  const neo4jSession = neo4jClient.session();

  app.get("/redis", async (req, res) => {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).send("No id provided");
      return;
    }
    const value = await redisClient.get(String(id));
    res.send(value);
  });

  app.get("/neo4j", async (req, res) => {
    const result = await neo4jSession.run("MATCH (n) RETURN n");
    res.json(result.records[1]);
  });

  app.get("/elastic", async (req, res) => {
    const result = await elasticClient.get({
      index: "lessons_materials",
      id: "1",
    });
    const source = result._source as { text: string };
    res.json(source.text);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

run();
