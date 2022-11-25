const express = require('express');
const cors = require('cors');
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

const run = async () => {
    try{
        const productCollection = client.db('atlasMobile').collection('products');

        app.get('/products' , async(req , res ) => {
            const query = {} ;
            const products = await productCollection.find(query).toArray();
            res.send(products)
        })
    }
    finally{

    }
}
run().catch(e => console.error(e))


app.get('/' , (req , res ) => {
    res.send('atlas-mobile-server ready')
})

app.listen(port , () => {
    console.log(`server running on port ${port}`);
})