const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, `\nError : ${err}`);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {})
  .then(() => {
    console.log('db connection success!!!');
  })
  .catch((err) => {
    if (err) {
      console.log('There was some error!!!🥵');
      console.log(err.message);
    }
  });

// console.log(app.get('env'));
// console.log(process.env);

const port = process.env.PORT || 8080;
const host = '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`App is up and running at : http://${host}:${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION😫');
  server.close(() => {
    process.exit(1);
  });
});
