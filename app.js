const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRouter = require('./routes/authRoutes');
const invitationRouter = require('./routes/invitationRoutes');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const contactRouter = require('./routes/contactRoutes');
const reservationRouter = require('./routes/reservationRoutes');
const errorController = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

// MIDDLEWARES
// Secure HTTP headers
app.use(helmet());
// Request logging
app.use(morgan('dev'));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(limiter);
// Body parsing
app.use(express.json({ limit: '10kb' }));
// Data sanitization (NoSQL Queries)
app.use(mongoSanitize());
// Data sanitization (XSS)
app.use(xss());
// Parameter pollution
app.use(hpp());
// Enable CORS
app.use(cors());
// TODO: add whitelist
// app.use('/search', hpp({ whitelist: [ 'filter' ] })); -- WHITELISTING
// Parse cookies
app.use(cookieParser());

// ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/invitations', invitationRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/contacts', contactRouter);
app.use('/api/v1/reservations', reservationRouter);
// Invalid route
app.use('*', (req, res, next) =>
  next(new AppError('Route does not exist!', 404))
);

// Error handling
app.use(errorController);

module.exports = app;
