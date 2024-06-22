import express from 'express';
import process from 'process';
import cookieParser from 'cookie-parser';
import redisClient from './utils/redis';
import routes from './routes/index';

const app = express();
const port = process.env.PORT || 5000;
const NoAuth = ['/status', '/stats', '/users', '/connect'];
const NeedsAuth = (path) => {
  if (NoAuth.includes(path)) {
    return false;
  }
  return true;
};

const notSpecial = (req) => {
  // to ignoref GET /files/:id/data
  if (req.method !== 'GET') {
    return true;
  }
  const parts = req.path.split('/');
  if (parts.length === 4) {
    if (parts[1] === 'files' && parts[-1] === 'data') {
      return false;
    }
  }
  return true;
};
app.use(cookieParser());
// user session authentication
app.use((req, res, next) => {
  if (NeedsAuth(req.path) && notSpecial(req)) {
    const sessionToken = req.headers['x-token'];
    if (!sessionToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    (async () => {
      try {
        const userId = await redisClient.get(`auth_${sessionToken}`);
        if (!userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        req.userid = userId;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Unauthorized' }); // temp
      }
    })();
  } else {
    next();
  }
});

app.use(express.json()); // allow access to the res body object

app.use('/', routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
