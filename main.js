const express = require('express');
const connectDB = require('./Config/connectDb');
const sessionRoutes = require('./Routes/sessionRoutes');
const agentsRoutes = require('./Routes/agentRoutes');
const userRoutes = require('./Routes/userRoutes'); // Import the new user routes
const infoAPI=require("./Config/infoAPI")
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.use("/api",infoAPI)
app.use('/api/session', sessionRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/users', userRoutes); // Use the new user routes

app.get('/', (req, res) => {
  res.send('Welcome to the Multi-Agent AI Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});