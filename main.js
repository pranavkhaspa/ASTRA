const express = require('express');
const connectDB = require('./Config/connectDb');
const sessionRoutes = require('./Routes/sessionRoutes');
const agentsRoutes = require('./Routes/agentRoutes');
const userRoutes = require('./Routes/userRoutes');
const infoAPI = require("./Config/infoAPI");
const cors = require('cors'); 
const cookieParser = require('cookie-parser'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Setup CORS properly for cookies
const allowedOrigins = [
  "http://localhost:5174",        // local frontend
  "https://your-frontend-domain.com" // deployed frontend (replace with real domain)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 👈 allow cookies, authorization headers
  })
);

// Routes
app.use("/api", infoAPI);
app.use('/api/session', sessionRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/users', userRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the Multi-Agent AI Backend!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
