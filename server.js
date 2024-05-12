import express from 'express';
import process from 'process';
import routes from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
