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
      const email = req.query.email;
      let query = {};  /// faka ekta query set korlam &&&&&& amara variable ta onno jaigei use korbo bole let use korsi
      if(email){
         query = { hr_Email: email };  /// amader data base a j applicant_email ase tar sate amader email ta k match kortesi
      }
      const result = await jobsCollection.find(query).toArray();   //// amra data base theke query deye data search kortesi jodi email thake taile sei email onusare amader data dibe na hole amader oi khane faka query thakbe R faka thakle amader alll data dibe.
      res.send(result);
    })

    /// get the single  data in the server ****************

    app.get("/jobs/:id", async(req, res)=>{
      const id = req.params.id;
      const result = await jobsCollection.findOne({_id: new ObjectId(id)});
      res.send(result);
    })

    /// post the new data inside the jobs database ************
    app.post('/jobs', async(req, res)=>{
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    })

    
    /// user already applied data showing the email  address in database**********************

    app.get("/apply", async(req, res)=>{
      const email =  req.query.email;      //// kono ekta unique email khujbo bole query use kora hoyse
      const query = { applicant_email: email };   /// applicant email er sate jodi amader pathano email match kore tahole amra sei ta query er mordhe set kortesi
      const result = await jobApplicationCollection.find(query).toArray();

      /// ami amar data and ami kon jaigai apply korsi seita thke kicu data nibo  and ekta array te convert korbo

      for(const application of result){  // result er mordhe joto data ase sob ek ek kore application er mordhe rekhe ditesi
        console.log(application.job_id);  /// ekta ekta kore koto job_id ase seita print koretesi
        const query1 = { _id: new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query1);
        if(job){
          application.title = job.title;  // nutun valu add kortesi
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }

      res.send(result);
    })

    /// post the applly data on in the server ************

    app.post("/apply", async(req, res)=>{
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);
        res.send(result);
    })


    // delete job application functionality starting ***************************

    app.delete("/delete-application/:id", async(req, res)=>{
        const id = req.params.id;
        const result = await jobApplicationCollection.deleteOne({_id: new ObjectId(id)});
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