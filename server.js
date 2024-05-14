import express from 'express';
import process from 'process';
import routes from './routes/index';
import cookie_parser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 5000;

app.use(cookie_parser())
app.use(express.json()); // allow access to the res body object
app.use('/', routes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
