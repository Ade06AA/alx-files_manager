import express from 'express';
import process from 'process';
import routes from './routes/index';
import cookie_parser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 5000;
const NoAuth = ["/status", "/stats", "/users", "/connect"];
const NeedsAuth = (path) => {
  if (NoAuth.includes(path)){
    return false
  }
  return true
};

app.use(cookie_parser());

// user session authentication
app.use((req, res, next) => {
  if (NeedsAuth(req.path)){
    const sessionToken = req.headers["x-token"];
    if (!sessionToken){
          res.status(401).json({ "error": "Unauthorized"});
    }
    (async ()=>{
      try {
        const userId = await redisClient.get(`auth_${sessionToken}`);
        if (!userId){
          res.status(401).json({"error": "Unauthorized"});
        }
        req.userid = userId;
        next();
      } catch (error) {
        res.status(401).json({"error": "Unauthorized"});
      }
    })();
  } else{
    next();
  }
});

app.use(express.json()); // allow access to the res body object

app.use('/', routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
