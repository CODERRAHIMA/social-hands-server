import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import 'dotenv/config'

const port = process.env.PORT || 5000;

const app = express();
// app.use(cors());

app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const db = await connectToMongoDB();

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/test", (req, res) => {
  res.json({ message: "hello world" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
