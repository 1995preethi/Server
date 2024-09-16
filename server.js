const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
const uri =
  "mongodb+srv://sahil_123:Sahil0786@cluster0.tkkjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let userCollection;
let orderCollection;

// Connect to MongoDB first, then start the server
client.connect((err) => {
  if (err) {
    console.error("Failed to connect to the database. Error:", err);
    process.exit(1); // Exit if the database connection fails
  }

  console.log("Database up!\n");

  userCollection = client.db("giftdelivery").collection("users");
  orderCollection = client.db("giftdelivery").collection("orders");

  // Start the server only after a successful database connection
  app.listen(port, () => {
    console.log(
      `Gift Delivery server app listening at http://localhost:${port}`
    );
  });
});

// Home route
app.get("/", (req, res) => {
  res.send("<h3>Welcome to Gift Delivery server app!</h3>");
});

// Get all users
app.get("/users", (req, res) => {
  console.log("GET request received\n");

  userCollection
    .find({}, { projection: { _id: 0 } })
    .toArray(function (err, docs) {
      if (err) {
        console.log("Some error.. " + err + "\n");
        res.status(500).send(err);
      } else {
        console.log(JSON.stringify(docs) + " have been retrieved.\n");
        res.status(200).json(docs);
      }
    });
});

// Get all orders by logged-in user
app.get("/orders", (req, res) => {
  const customerEmail = req.query.customerEmail;

  if (!customerEmail) {
    return res.status(400).json({ error: "Customer email is required" });
  }

  console.log("GET request for orders by user: " + customerEmail + "\n");

  orderCollection
    .find({ customerEmail }, { projection: { _id: 0 } })
    .toArray(function (err, docs) {
      if (err) {
        console.log("Some error.. " + err + "\n");
        res.status(500).send(err);
      } else {
        console.log(
          JSON.stringify(docs) +
            " have been retrieved for " +
            customerEmail +
            ".\n"
        );
        res.status(200).json(docs);
      }
    });
});

// User login
app.post("/users", (req, res) => {
  console.log("POST request received : " + JSON.stringify(req.body) + "\n");

  const loginData = req.body;

  userCollection
    .find(
      { email: loginData.email, password: loginData.password },
      { projection: { _id: 0 } }
    )
    .toArray(function (err, docs) {
      if (err) {
        console.log("Some error.. " + err + "\n");
        res.status(500).send(err);
      } else {
        console.log(JSON.stringify(docs) + " have been retrieved.\n");
        res.status(200).json(docs);
      }
    });
});

// User signup
app.post("/signup", (req, res) => {
  console.log(
    "POST request received for signup: " + JSON.stringify(req.body) + "\n"
  );

  const userData = req.body;

  // Check if the email already exists
  userCollection.findOne({ email: userData.email }, (err, existingUser) => {
    if (err) {
      console.log("Some error.. " + err + "\n");
      res.status(500).send(err);
    } else if (existingUser) {
      console.log("Email already exists.\n");
      res.status(400).json({ message: "Email already exists" });
    } else {
      // Insert new user
      userCollection.insertOne(userData, (err, result) => {
        if (err) {
          console.log("Some error.. " + err + "\n");
          res.status(500).send(err);
        } else {
          console.log("User registered with ID " + result.insertedId + "\n");
          res.status(200).json({ message: "User registered successfully" });
        }
      });
    }
  });
});

// Post order data
app.post("/postOrderData", function (req, res) {
  console.log("POST request received : " + JSON.stringify(req.body) + "\n");

  orderCollection.insertOne(req.body, function (err, result) {
    if (err) {
      console.log("Some error.. " + err + "\n");
      res.status(500).send(err);
    } else {
      console.log(
        "Order record with ID " + result.insertedId + " have been inserted\n"
      );
      res.status(200).json(result);
    }
  });
});

// Delete orders endpoint
app.delete("/deleteOrders", (req, res) => {
  const orderNos = req.body.orderNos; // Array of order numbers to delete

  if (!orderNos || orderNos.length === 0) {
    return res.status(400).json({ error: "No orders selected for deletion" });
  }

  console.log("DELETE request for orders: " + JSON.stringify(orderNos) + "\n");

  orderCollection.deleteMany(
    { orderNo: { $in: orderNos } },
    function (err, result) {
      if (err) {
        console.log("Error deleting orders: " + err + "\n");
        res.status(500).json({ error: "Failed to delete orders" });
      } else {
        console.log(result.deletedCount + " order(s) deleted.\n");
        res.status(200).json({
          message: result.deletedCount + " order(s) deleted successfully",
        });
      }
    }
  );
});
