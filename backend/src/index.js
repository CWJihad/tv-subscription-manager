// const mongoose = require("mongoose");
// const app = require("./app");
// const config = require("./config/config");
// const logger = require("./config/logger");
// const jobs = require("./jobs");

// let server;

// const listenArgs = config.host ? [config.port, config.host] : [config.port];

// mongoose
//   .connect(config.mongoose.url, config.mongoose.options)
//   .then(() => {
//     logger.info("Connected to MongoDB");
//     server = app.listen(...listenArgs, () => {
//       logger.info(`Listening on ${config.host}:${config.port}`);
//       jobs.start();
//     });
//   })
//   .catch((error) => {
//     logger.error(error);
//     process.exit(1);
//   });

// const exitHandler = () => {
//   jobs.stop();
//   if (server) {
//     server.close(() => {
//       logger.info("Server closed");
//       process.exit(1);
//     });
//   } else {
//     process.exit(1);
//   }
// };

// const unexpectedErrorHandler = (error) => {
//   logger.error(error);
//   exitHandler();
// };

// process.on("uncaughtException", unexpectedErrorHandler);
// process.on("unhandledRejection", unexpectedErrorHandler);

// process.on("SIGTERM", () => {
//   logger.info("SIGTERM received");
//   jobs.stop();
//   if (server) {
//     server.close(() => process.exit(0));
//   } else {
//     process.exit(0);
//   }
// });

// gemini for deployment
const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const jobs = require("./jobs");

let isConnected = false;

async function connectDb() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  isConnected = true;
  logger.info("Connected to MongoDB");
}

// Ensure DB connection is ready on Vercel serverless requests
if (!process.env.VERCEL) {
  connectDb().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}

let server;

if (require.main === module) {
  const listenArgs = config.host ? [config.port, config.host] : [config.port];
  connectDb()
    .then(() => {
      server = app.listen(...listenArgs, () => {
        logger.info(`Listening on ${config.host}:${config.port}`);
        if (config.jobsEnabled) {
          jobs.start();
        }
      });
    })
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

module.exports = app;