const mongoose                = require("mongoose");
const dotenv                  = require('dotenv');
const express                 = require("express");
const app                     = express();

// Configure Environment
dotenv.config();
console.log(process.env.DB_HOST_DEV);

// config and connect to mongodb
console.log('Starting Journi_App Server...')
console.log('Connecting via Mongoose');
mongoose
  .connect(process.env.DB_HOST_DEV, {
    useNewUrlParser: true, useUnifiedTopology: true
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: Error) => console.log(err))

// Middleware
app.use(express.json());

// Routes
const profileRoute = require('./routes/profile.route');
const programsRoute = require('./routes/programs.route');

// API Routes
app.use("/api/profile", profileRoute);
app.use("/api/programs", programsRoute);
// app.use("/api/ad", adminRoute);

// Listen on PORT
const port = process.env.PORT || 8000;
app.listen(port, 
  () => {
    console.log(`Listening on port ${port}`)
  });

  

export {}
