const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SK);

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
        const paymentsCollection = client.db('atlasMobile').collection('payments');

        const verifyAdmin = async (req , res , next) => {
            const decodedEmail = req.decoded.email;
            const query = { email : decodedEmail};
            const user = await usersCollection.find(query);
            if(user?.role !== 'admin'){
                res.status(403).send({ message: "forbidden access" })
            }
            next()
        }

        app.get('/products', async (req, res) => {
            let query = {};
            if(req.query.categoryName){
                query = {
                    categoryName : req.query.categoryName
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

        app.get('/users' , async(req , res) => {
            let query = {}
            if(req.query.role){
                query = {
                    role : req.query.role
                }
            }
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        app.put('/users/admin/:id' ,verifyJWT,  verifyAdmin, async(req , res) => {
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

        app.get('/bookings/:id' , async(req , res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const booking = await bookingsCollection.findOne(query);
            res.send(booking)
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


        app.post('/payments' , async (req , res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id:ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid : true
                }
            }

            const updatedResult = await bookingsCollection.updateOne(filter , updatedDoc);
            res.send(result)

        })


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const productPrice = booking.productPrice;
            const amount = productPrice * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            })

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

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