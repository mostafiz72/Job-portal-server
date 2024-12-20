require('dotenv').config()
const cors = require('cors');  // middleware to handle CORS requests
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser =  require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

// Middleware to handle CORS requests and json files configurations.
app.use(cors({
  origin: ['http://localhost:5173'],  //// amader ai server theke jwt asbe &&&&& ai site thke request ta asbe
  credentials: true,   /// ata amader sate communication er permition dibo /// cookie tuki ja kicu dibe sei gula ami appept korbo
}));
app.use(express.json());
app.use(cookieParser());

/// why to use loger----------
// amara jodi kono jaigai dhoka and kono api call korar somoy onno kono api k call korte chai taile logger use kora hoy. Example: VeryFiy korar somoy
const logger = (req, res, next) => {  /// amara j khane loger use korbo sei khane loger call hobe &&& amader age loger er kaj korbe then next() er merdhome abar jei jaigei logger use kora hoyse seita call hobe
  console.log('inside the logger data');
  next(); /// next use kora hoy jano ai kaj ta ses hoytar por abar tar por j kaj ta korte chai sei ta jno call hoy
  
}

// R ekta middleWare use kora holo --------------- Ai middle ware er mordhe amar ja ischa tai accesskorte pari------------------------------------------------------------------
const verifyToken = (req, res, next) => { 
  console.log("inside the verify token middleware data", req.cookies);
  const token = req?.cookies?.token;
  if (!token) {  // token jodi na thake taile amra take jaite dibo na tare amara error message diye dibo
    return res.status(401).send({ message: 'No token provided.' }); /// amader jodi token na thake taile amra ai error ta show koraibo
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{ /// encoded mane == token k hijibi kore rakha R decoded mane == hijibiji token k solid kore rakha
     if(err){
      return res.status(401).send({message: "UnAuthorized access"})
     }
     req.user = decoded;
     next();
  })
  
}

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

    //// Auth releted APIService------------------
    //// Jsob Web token Strting points here -------------------

    app.post('/jwt', async(req, res)=>{
      const user = req.body;   /// ai api er mordhe ja kicu pathabo tai pabo
      const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "1h"}) //// ata jsob web token theke nauya hoyse /// and token create kora hoyse ai line er mardhome
      res.cookie('token', token, {   /// cookie te save korar jonno res.cookie use kora hoyse tar proterty name  token and value j token ashe seita 
        httpOnly: true,   /// only http use kora jabe sei kotha bola hoyse 
        secure: false   //// secure nai sei ta bola hoyse
      })
      .send({success: true});
    })

    // jobs related apis 
    const jobsCollection = client.db("jobPortal").collection("jobs");
    const jobApplicationCollection = client.db("jobPortal").collection("applications");

    //// get the all data *********************

    app.get("/jobs", logger, async(req, res)=>{
      console.log("now inside the logger api call back");
      
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

    app.get("/apply", verifyToken, async(req, res)=>{
      const email =  req.query.email;      //// kono ekta unique email khujbo bole query use kora hoyse
      const query = { applicant_email: email };   /// applicant email er sate jodi amader pathano email match kore tahole amra sei ta query er mordhe set kortesi
      if(req.user.email !== req.query.email){
        return res.status(401).send({message: 'Unauthorized access'});  // amader jodi amader email match na kore tahole amra ai error ta show koraibo
      }
      const result = await jobApplicationCollection.find(query).toArray();

      /// ami amar data and ami kon jaigai apply korsi seita thke kicu data nibo  and ekta array te convert korbo

      for(const application of result){  // result er mordhe joto data ase sob ek ek kore application er mordhe rekhe ditesi
        // console.log(application.job_id);  /// ekta ekta kore koto job_id ase seita print koretesi
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

    // view applications user *************************************

    app.get('/apply/jobs/:job_id', async(req, res)=>{
        const jobId =  req.params.job_id;  // Amra jokhon URL er mardhome kono data khujbo tokhon amra [---params ----] use korbo. and amara jokhon kono data er thek kono data alada korbo tokhon amar query use korbo <<<<<< example:- Filtering, searching, sorting...... er somoy query use korbo.
        const query = { job_id: jobId };   /// job_id er sate jodi amader pathano job_id match kore tahole amra sei ta query er mordhe set kortesi
        const result = await jobApplicationCollection.find(query).toArray();
        res.send(result);
    })

    /// post the applly data on in the server ************

    app.post("/apply", async(req, res)=>{
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);

        /// amra ekhon amader job a koyjon aply korse sei count ta dekhte chitesi &&&& amara muloto kon job a apply kortesi and koyjon apply korsi seitar ekta count kortesi

        const id = application.job_id;   //// application er mordhe theke amra job-id ta niye id variable er mordhe rekhe dilam
        const query = { _id: new ObjectId(id)}  //// data base er mordhe amra id deye search korebo
        const job = await jobsCollection.findOne(query);
        let count = 0;
        if(job.applicationCount){
          count = job.applicationCount + 1;
        }
        else{
          count = 1;
        }

        //// now updata the job info 
        const filter = {  _id: new ObjectId(id) };
        const updatedDoc = {
          $set: { applicationCount: count }  /// jobsCollection er mordhe application count name ekta porperty set kore dilam jar value hobe count
        }

        const updatedResult = await jobsCollection.updateOne(filter, updatedDoc);

        res.send(result);
    })


    // delete job application functionality starting ***************************

    app.delete("/delete-application/:id", async(req, res)=>{
        const id = req.params.id;
        const result = await jobApplicationCollection.deleteOne({_id: new ObjectId(id)});
        res.send(result);
    })

    // Winers user added the database --------------------------

    app.patch("/apply/:id", async(req, res)=>{
      const id = req.params.id;  /// j id te click korsi sei id ta pailam
      const data = req.body;   /// font end theke ja kicu asbe ta sob data er mordhe rakhe dibo
      const filter = { _id: new ObjectId(id)};  /// jeita match korse sei data ta amra filter er mordhe rekhe dibo
      const updatedDoc = {
        $set: {
          status: data.status  //// data base er mdrdhe status name property set hobe and tar value hobe data.status er mordh ja asbe tai
        }
      }
      const results = await jobApplicationCollection.updateOne(filter, updatedDoc);
      res.send(results);
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