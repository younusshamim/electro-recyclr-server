const express = require("express");
const cors = require("cors");
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
    strict: false,
    deprecationErrors: true,
  },
});

// connect to MongoDB and start server
async function startServer() {
  try {
    const userCollection = client.db("electroRecyclr").collection("users");
    const categoryCollection = client
      .db("electroRecyclr")
      .collection("categories");
    const productCollection = client
      .db("electroRecyclr")
      .collection("products");

    // categories api's
    app.get("/categories", async (req, res) => {
      const cursor = categoryCollection.find({});
      const categories = await cursor.toArray();
      res.send(categories);
    });

    // products api's
    app.post("/products", async (req, res) => {
      const payload = { postedTime: new Date().toUTCString(), ...req.body };
      const result = await productCollection.insertOne(payload);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const { district, categoryId } = req.query;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      if (district) query.district = district;
      if (categoryId) query.categoryId = categoryId;
      const cursor = productCollection.find(query).sort({ _id: -1 });
      const products = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(products);
    });

    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    // users api's
    app.get("/users", async (req, res) => {
      const { status, search } = req.query;
      const query = {};
      if (status) query.status = status;
      if (search) query.email = { $regex: search, $options: "i" };
      const cursor = userCollection.find(query).sort({ _id: -1 });
      const users = await cursor.toArray();
      res.send(users);
    });

    app.get("/users/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

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

    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: req.body };
      const option = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    app.put("/users/status/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.query;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: status } };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/", (req, res) => res.send("Server Started!"));
    app.listen(port, () => console.log("Server listening on port", port));
  } finally {
  }
}

startServer().catch(console.dir);
