const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/report');
const projectRoutes = require('./routes/project');
const { connectMongo } = require('./db/db')

app.use(express.json());

// routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/projects', projectRoutes);

// connect database
connectMongo()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`APP LISTENING ON PORT ${PORT}`);
})

