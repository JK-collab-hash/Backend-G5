const express = require('express');
const session = require('express-session');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secreto_dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
    sameSite: 'lax'
  }
}));

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log('El backend está en funcionamiento');
});
