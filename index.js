const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// database setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kflgpze.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// connect to MongoDB and start server
async function startServer() {
  try {
    const userCollection = client.db("electroRecyclr").collection("users");

    // get user info
    app.get("/users/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    // Create a new user
    app.post("/users", async (req, res) => {
      const { email } = req.body;
      const query = { email };
      const existUser = await userCollection.findOne(query);
      if (existUser) {
        return res.status(400).send(`User with email ${email} already exists.`);
      }
      const result = await userCollection.insertOne(req.body);
      res.send(result);
    });

    // Update a user
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = { $set: req.body };
      const option = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    // make admin
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const option = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    app.get("/", (req, res) => res.send("Server Started!"));
    app.listen(port, () => console.log("Server listening on port", port));
  } finally {
  }
}

startServer().catch(console.dir);
