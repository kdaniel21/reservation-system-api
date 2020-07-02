const dotenv = require('dotenv');
const chalk = require('chalk');
// Dotenv setup
dotenv.config({ path: `${__dirname}/config.env` });

// Uncaught Exception listener
process.on('uncaughtException', (err) => {
  console.log(chalk.bgRed(err.name));
  console.log(err.message);
  console.log(err.stack);

  process.exit(1);
});

const mongoose = require('mongoose');
const app = require('./app');

// Connect MongoDB
mongoose
  .connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(chalk.bgGreen('Successfully connected to the DB!')))
  .catch((err) =>
    console.log(chalk.bgRed('Could not connect to the DB!', err))
  );

// Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(chalk.bgGreen(`Server is running on port ${port}`))
);

// Error listeners
process.on('unhandledRejection', (err) => {
  console.log(chalk.bgRed(err.name));
  console.log(err.message);
  console.log(err.stack);

  server.close(() => process.exit(1));
});
