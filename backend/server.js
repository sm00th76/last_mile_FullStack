import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import config from './src/config/env.js';

const startServer = async () => {
  await connectDB();

  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
