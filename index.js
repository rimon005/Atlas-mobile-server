const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()

// port 
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wkops72.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })

}

const run = async () => {
    try {
        const productCollection = client.db('atlasMobile').collection('products');
        const usersCollection = client.db('atlasMobile').collection('users');
        const bookingsCollection = client.db('atlasMobile').collection('bookings');

        app.get('/products', async (req, res) => {
            let query = {};
            if(req.query.categoryId){
                query = {
                    categoryId : req.query.categoryId
                }
            }
            const products = await productCollection.find(query).toArray();
            res.send(products)
        })

        
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.get('/users/buyer' , async(req , res) => {
            let query = {}
            if(req.query.role){
                query = {
                    role : req.query.role
                }
            }
            console.log(query);
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        app.put('/users/admin/:id' , async(req , res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set : {
                    role : 'admin'
                }
            }
            const users = await usersCollection.updateOne(query , updatedDoc , options);
            res.send(users)
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        app.get('/users' , async(req , res ) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        app.post('/bookings' , async(req , res ) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.get('/bookings' , verifyJWT,  async(req , res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = {email : email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings)
        })
        // Jwt toke 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            console.log(user);
            res.status(403).send({ accessToken: ' ' })
        })
    }
    finally {

    }
}
run().catch(e => console.error(e))


app.get('/', (req, res) => {
    res.send('atlas-mobile-server ready')
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})