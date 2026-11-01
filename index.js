import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import 'dotenv/config'

const port = process.env.PORT || 8000;

const app = express();
app.use(cors());

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

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("socialHands");
const eventsCollection = db.collection("events");


app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/add-event", async (req, res) => {
  const data = req.body;
  const result = await eventsCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
