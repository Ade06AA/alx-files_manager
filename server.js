import express from 'express';
import process from 'process';

const app = express();
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
