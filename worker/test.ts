import express from "express";
const app = express();

app.get("/redis", async (req, res) => {
  res.send("Hello World");
});

app.listen(3000);
