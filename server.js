import express from 'express';
import * as dotenv from 'dotenv'
dotenv.config();

import indexRouter from './routes/index.js'

import './config/passport.js'
import './config/database.js'

const app = express();

// // static files
// // need __dirname manually, since it is only available in CommonJS, and we changed to ES6 modules
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// app.use(express.static(baseUrlFrontend  || path.join(__dirname, '../frontend/build')));

app.use(express.json());

app.use('/', indexRouter);

app.use((err, req, res, next) => {
  console.log('catch-all error handler');
  res.status(err.status || 500);
  res.json({
    error: {
      ...err, // spreads manually-set properties only (error obj only spread these)
      message: err.message, // then specify error-native properties, so that they are also included
    }
  });
});

const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});