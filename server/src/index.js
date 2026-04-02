import 'dotenv/config';
import app from './app/app.js';
import { startJobs } from './jobs/index.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} — ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'test') {
    startJobs();
  }
});
