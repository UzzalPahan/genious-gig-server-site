const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5001;
const app = express();

//firewall
app.use(cors({
  origin: ['https://genious-gig.web.app', 'https://genious-gig.firebaseapp.com'],
  credentials: true,

}));
app.use(express.json());
app.use(cookieParser())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1llhv9e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares
const logger = async (req, res, next) => {
  console.log('called:', req.host, req.originalUrl)
  next();
}
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.PRIVATE_SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'verify failed' })
      }
      console.log('decoded user', decoded);
      req.user = decoded;
      next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

     //Database And Database Table Start 
     const userColletion = client.db('geniousGig');
     const category = userColletion.collection('category');
     const jobs = userColletion.collection('jobs');
     const mybids = userColletion.collection('mybids');
     const bidsrequest = userColletion.collection('bidsrequest');
     //Database And Database Table End 

     //read category list start
     app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.PRIVATE_SECRET_KEY, {
          expiresIn: '1h'
      });
      // res.send(token)
      res
          .cookie('token', token, {
              httpOnly: true,
              secure: true,
              sameSite: "none"
          })
          .send({ success: true })
  })
     
     app.get('/category', async(res, req)=>{
        const categoryList = category.find();
        const result = await categoryList.toArray();
        req.send(result)
     })
     //read category list end

     //Insert Job to the Database Start
    app.post('/job', async(req, res)=>{
        const job = req.body;
        const result = await jobs.insertOne(job)
        res.send(result)
      })
      //Insert Job to the Database End

      //Insert bids to the Database Start
    app.post('/bidlist', async(req, res)=>{
      const bid = req.body;
      const result = await mybids.insertOne(bid)
      res.send(result)
    })
    //Insert bids to the Database End


      //Insert bidsrequest to the Database Start
      app.post('/bidrequest', async(req, res)=>{
        const bid = req.body;
        const result = await bidsrequest.insertOne(bid)
        res.send(result)
      })
      //Insert bidsrequest to the Database End

      //read mybids data start
    app.get('/bidrequest', async(req, res)=>{
      const cart = bidsrequest.find();
      const result = await cart.toArray();
      res.send(result);
      
    })
    //read mybids data end 

    //read mybids data start
    app.get('/mybids',logger, verifyToken, async(req, res)=>{
      console.log('ttttt token', req.cookies.token)
      console.log('user in the valid token', req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
    }
      
      let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await mybids.find(query).toArray();
            res.send(result);
    })
    //read mybids data end 

      //read job data start
      app.get('/job',verifyToken, async(req, res)=>{
        console.log('ttttt job token ', req.cookies.token)
      console.log('user in the valid token', req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
    }

        let query = {};
        if (req.query?.email) {
            query = { email: req.query.email }
        }
        const result = await jobs.find(query).toArray();
        res.send(result);

      })
      //read job data end 

      // fetch single data start 
      app.get('/updatepostedjob/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const user = await jobs.findOne(query)
        res.send(user)
    })
    //fetch single data end

    // fetch jobdetail data start 
    app.get('/jobdetail/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const user = await jobs.findOne(query)
      res.send(user)
  })
  //fetch jobdetail data end

      //Update Prducts data Start
    app.put('/updatepostedjob/:id', async(req, res)=>{
        const id = req.params.id;
        const job = req.body;  
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true}
        const updateUser = {
            $set: {
                job_title: job.job_title,
                deadline: job.deadline,
                description: job.description,
                categoryValue: job.categoryValue,
                min_price: job.min_price,
                max_price: job.max_price
            }
        }
        const result = await jobs.updateOne(filter, updateUser, options);
        res.send(result)
    })
      //Update Prducts data End


       //cart items removed start
    app.delete('/mypostedjob/:id', async(req,res)=>{
        const id = req.params.id;  
        const query = {_id: new ObjectId(id)}
        const result = await jobs.deleteOne(query);
        res.send(result);
  
    })
      //cart items removed end

      app.get('/alljobs', async (req, res) => {
        const cart = jobs.find();
      const result = await cart.toArray();
      res.send(result);

      
    });
    
    

      //read job data with category name start
      app.get('/:category',async(req, res)=>{
      // console.log('ttttt token category', req.cookies.token)
          const categoryes = req.params.category;
        const result = await jobs.aggregate([
          {
          $match: { "categoryValue": categoryes }
          }
          ]).toArray();
        res.send(result)
      })
      //read job data with category name end



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//server created and running code start 
app.get('/',(res,req)=>{
    req.send('server is working')
})

app.listen(port, ()=>{
    console.log(`port running on ${port}`);
})
//server created and running code end
