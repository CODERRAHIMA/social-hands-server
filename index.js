import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

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

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (err) {
    return res.status(500).send({ message: "Server Error!" });
  }
};

app.get("/", (req, res) => {
  res.send("Server is running");
});

// create event
app.post("/add-event", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await eventsCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

// read all events
app.get("/upcoming-events", async (req, res) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const result = await eventsCollection
    .find({ eventDate: { $gt: today } })
    .sort({ eventDate: 1 })
    .toArray();

  res.send(result);
});

// read recent upcoming 6 events
app.get("/recent-events", async (req, res) => {
  const result = await eventsCollection.find({}).sort({ eventDate: 1 }).limit(6).toArray();
  res.send(result);
});

// read single event detail
app.get("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const result = await eventsCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

// edit event detail
app.patch("/upcoming-events/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData },
  );
  res.send(result);
});

// delete event
app.delete("/upcoming-events/:id", async (req, res) => {
  const id = req.params.id;
  const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// join on event
app.post("/joined-events", async (req, res) => {
  const { _id, email, username, userimage, ...eventDataWithoutId } = req.body;
  const targetEventId = new ObjectId(_id);

  const existingJoin = await joinedEventsCollection.findOne({
    email,
    eventId: targetEventId,
  });

  if (existingJoin) {
    await joinedEventsCollection.deleteOne({ email, eventId: targetEventId });
    return res.send({ joined: false, message: "Successfully left the event!" });
  } else {
    const finalDataToSave = {
      username,
      email,
      userimage,
      ...eventDataWithoutId,
      eventId: targetEventId,
    };
    await joinedEventsCollection.insertOne(finalDataToSave);
    return res.send({
      joined: true,
      message: "Successfully joined the event!",
    });
  }
});

// read joined events by emails
app.get("/joined-events/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await joinedEventsCollection
    .find({ email: email })
    .sort({ eventDate: 1 })
    .toArray();
  res.send(result);
});

// read managed events by email
app.get("/manage-events/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await eventsCollection.find({ creatorEmail: email }).toArray();
  res.send(result);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;