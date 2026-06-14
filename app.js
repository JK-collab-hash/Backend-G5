const express = require('express');
const session = require('express-session');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app  = express();
const PORT = 3000;

// CORS — permite que el frontend (puerto 3001) llame al backend
app.use(cors({
  origin: 'http://localhost:3001', credentials: true   // necesario para que las cookies de sesión funcionen
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secreto_dev', resave: false, saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
    sameSite: 'lax'   // necesario para cookies entre puertos
  }
}));

// Ya NO hay express.static ni res.sendFile — solo API
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log('El backend está en funcionamiento');
});