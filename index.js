const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xzkge.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri);

function verifyJWTToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("refrigerator_tools").collection("tools");
    const bookingCollection = client
      .db("refrigerator_tools")
      .collection("bookings");
    const userCollection = client.db("refrigerator_tools").collection("users");
    const userProfileCollection = client
      .db("refrigerator_tools")
      .collection("userProfile");

    app.get("/tool", verifyJWTToken, async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    app.get("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });

    // bookingCollection
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = bookingCollection.insertOne(booking);
      res.send(result);
    });

    // booking by particular id
    app.get("/booking/:id", verifyJWTToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    });

    // get booking orders
    app.get("/booking", verifyJWTToken, async (req, res) => {
      const email = req.query.email;
      // const authorization = req.headers.authorization;
      // console.log(authorization);
      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    // delete booking orders
    app.delete("/booking", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingCollection.deleteOne(query);
      res.send(bookings);
    });

    //showing my profile information there will be all user
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });

    // admin nh tader access korte dibo nh
    app.get("/admins/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // make user admin
    app.put("/user/admin/:email", verifyJWTToken, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
    // get user data by email
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });

    // get all user
    app.get("/allusers", verifyJWTToken, async (req, res) => {
      const query = {};
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });

    // delete data from all user
    app.delete("/alluserr/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // user profile
    app.post("/userProfile", async (req, res) => {
      const userProfile = req.body;
      const result = await userProfileCollection.insertOne(userProfile);
      res.send(result);
    });

    // manage all orders
    app.get("/bookingOrder", verifyJWTToken, async (req, res) => {
      const query = {};
      const cursor = await bookingCollection.find(query).toArray();
      res.send(cursor);
    });
    app.delete("/bookingOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // delete from manageProducts
    app.delete("/manage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    // add new product
    app.post("/addItem", verifyJWTToken, async (req, res) => {
      const newItem = req.body;
      const result = await toolsCollection.insertOne(newItem);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From refriggttgvggghghtor menutacter!");
});

app.listen(port, () => {
  console.log(`Hello Fhhttyuyyhggvb menutacter port is running ${port}`);
});
