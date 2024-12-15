require('dotenv').config()
const cors = require('cors');  // middleware to handle CORS requests
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Middleware to handle CORS requests and json files configurations.
app.use(cors());
app.use(express.json());

app.get("/", (req, res)=>{
    res.send("hello world!");
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.eywn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // jobs related apis 
    const jobsCollection = client.db("jobPortal").collection("jobs");
    const jobApplicationCollection = client.db("jobPortal").collection("applications");

    //// get the all data *********************

    app.get("/jobs", async(req, res)=>{
      const result = await jobsCollection.find().toArray();
      res.send(result);
    })

    /// get the single  data in the server ****************

    app.get("/jobs/:id", async(req, res)=>{
      const id = req.params.id;
      const result = await jobsCollection.findOne({_id: new ObjectId(id)});
      res.send(result);
    })

    
    /// user already applied data showing the email  address in database**********************

    app.get("/apply", async(req, res)=>{
      const email =  req.query.email;      //// kono ekta unique email khujbo bole query use kora hoyse
      const query = { applicant_email: email };   /// applicant email er sate jodi amader pathano email match kore tahole amra sei ta query er mordhe set kortesi
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);
    })

    /// post the applly data on in the server ************

    app.post("/apply", async(req, res)=>{
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
        res.send(result);
         
    })
  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir); 


app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})