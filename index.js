const express = require('express');
const app = express();
const cors = require('cors');

const port = process.env.PORT || 4444;

app.use(cors());

app.listen(port, () => {
    console.log(`Server listens to port ${port}`);
})