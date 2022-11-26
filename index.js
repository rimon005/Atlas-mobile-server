const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion } = require('mongodb');
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