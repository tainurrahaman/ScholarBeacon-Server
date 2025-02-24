require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xtebx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userCollection = client.db("ScholarBeaconDB").collection("users");
const scholarshipCollection = client
  .db("ScholarBeaconDB")
  .collection("scholarships");
const reviewCollection = client.db("ScholarBeaconDB").collection("reviews");
const applicationCollection = client
  .db("ScholarBeaconDB")
  .collection("applications");

async function run() {
  try {
    // Users API
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });

    // Scholarships API
    app.get("/scholarships", async (req, res) => {
      const result = await scholarshipCollection.find().toArray();
      res.send(result);
    });

    app.get("/scholarships/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
    });

    // Application DB

    // Read application data using user id from DB

    app.get("/applications/:user_id", async (req, res) => {
      try {
        const userId = req.params.user_id;
        const query = { user_id: userId };

        const applications = await applicationCollection.find(query).toArray();
        const user = await userCollection.findOne({
          _id: new ObjectId(userId),
        });

        const applicationsWithDetails = await Promise.all(
          applications.map(async (application) => {
            const scholarship = await scholarshipCollection.findOne({
              _id: new ObjectId(application.scholarship_id),
            });

            return {
              ...application,
              scholarship_name: scholarship
                ? scholarship.subject_name
                : "Unknown",
              university_name: scholarship
                ? scholarship.university_name
                : "Unknown",
              scholarship_category: scholarship
                ? scholarship.university_name
                : "Unknown",
              subject_name: scholarship ? scholarship.subject_name : "Unknown",
            };
          })
        );

        res.json(applicationsWithDetails);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Review DB

    app.get("/reviews/:scholarship_id", async (req, res) => {
      try {
        const id = req.params.scholarship_id;
        const query = { scholarship_id: id };

        const reviews = await reviewCollection.find(query).toArray();

        const reviewsWithUserDetails = await Promise.all(
          reviews.map(async (review) => {
            const user = await userCollection.findOne({
              _id: new ObjectId(review.reviewer_id),
            });
            return {
              ...review,
              reviewer_name: user ? user.name : "Unknown",
              reviewer_image: user ? user.image : "default.jpg",
            };
          })
        );

        res.json(reviewsWithUserDetails);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/reviews/r_id/:reviewer_id", async (req, res) => {
      try {
        const reviewerId = req.params.reviewer_id;
        const query = { reviewer_id: reviewerId };

        const reviews = await reviewCollection.find(query).toArray();

        const reviewsWithDetails = await Promise.all(
          reviews.map(async (review) => {
            const scholarship = await scholarshipCollection.findOne({
              _id: new ObjectId(review.scholarship_id),
            });

            return {
              scholarship_name: scholarship
                ? scholarship.subject_name
                : "Unknown",
              university_name: scholarship
                ? scholarship.university_name
                : "Unknown",
              review_comments: review.reviewer_comments,
              review_date: review.review_date,
            };
          })
        );

        res.json(reviewsWithDetails);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Scholarship is coming soon");
});

app.listen(port, () => {
  console.log("Port is running on", port);
});
