const express = require('express');
const connectDB = require('./Config/connectDb');
const sessionRoutes = require('./Routes/sessionRoutes');
const agentsRoutes = require('./Routes/agentRoutes');
const userRoutes = require('./Routes/userRoutes');
const infoAPI = require("./Config/infoAPI");
const cors = require('cors'); 
const cookieParser = require('cookie-parser'); 
const summarizer=require("./Routes/sumarizer")
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Setup CORS properly
const allowedOrigins = [
  "http://localhost:5174",        // Local frontend for development
  "https://astra-two-delta.vercel.app",
  "https://astra001.vercel.app",// Deployed frontend (replace with your real domain)
  // Add other allowed origins here if needed
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // This is needed to handle cookies, authorization headers
};

app.use(cors(corsOptions));

// Routes
app.use("/api", infoAPI);
app.use('/api/session', sessionRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/users', userRoutes);
app.use("/api/summarize",summarizer);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the Multi-Agent AI Backend!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
