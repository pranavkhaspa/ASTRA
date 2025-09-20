const express = require('express');
const connectDB = require('./Config/connectDb');
const sessionRoutes = require('./Routes/sessionRoutes');
const agentsRoutes = require('./Routes/agentRoutes');
const userRoutes = require('./Routes/userRoutes');
const infoAPI = require("./Config/infoAPI")
const cors = require('cors'); // Import the cors middleware
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

app.use("/api", infoAPI)
app.use('/api/session', sessionRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Multi-Agent AI Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
