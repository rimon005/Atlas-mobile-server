const express = require('express');
const cors = require('cors');
const app = express();

// port 
const port = process.env.PORT || 5000;



// middleware 
app.use(cors());
app.use(express.json());



app.get('/' , (req , res ) => {
    res.send('atlas-mobile-server ready')
})

app.listen(port , () => {
    console.log(`server running on port ${port}`);
})