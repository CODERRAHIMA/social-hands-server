import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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
const joinedEventsCollection = db.collection("joinedEvents");


app.get("/", (req, res) => {
  res.send("Server is running");
});

// create event
app.post("/add-event", async (req, res) => {
  const data = req.body;
  const result = await eventsCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

// read events
app.get("/upcoming-events", async (req, res) => {
  const result = await eventsCollection.find({}).toArray();
  res.send(result);
});

// read single event
app.get("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const result = await eventsCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

// edit event
app.patch("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
});

// delete event
app.delete("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// join event 
app.post("/joined-events", async (req, res) => {
  const data = req.body;
  const result = await joinedEventsCollection.insertOne(data);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
