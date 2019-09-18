const express = require('express');
const app = express();

const path = require('path');

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');

const url = require('url');

const { body, validationResult, matchedData } = require('express-validator');

const axios = require('axios');
const ss = require('socket.io-stream');

const session = require('express-session');
const cookieParser = require('cookie-parser');

const config = require('./config/index');

const { passport } = require('./passport');

const rc = require('./controllers/rooms');

const port = 3000;

const sessionMiddleware = session({
  secret: "!QA@WS3ED!",
  resave: false,
  saveUninitialized: false
});

io.use(function(socket, next){
  sessionMiddleware(socket.request, {}, next);
})
.on('connection', function(socket){
  const from = url.parse( socket.handshake.headers.referer);
  socket.join(from.pathname).on('chat message', async function(message){
    if (!socket.request.session.passport || !socket.request.session.passport.user)
      return;
    const user = await passport.getUserByObjectId(socket.request.session.passport.user);
    try
    {
      await rc.addMessage({
        room: decodeURIComponent(from.pathname.substring(1)),
        author: user.username,
        message
      });
    }
    catch(err) {
      console.log(err);
    }
    io.to(from.pathname).emit('chat message', { message, user: user.username });
    try
    {
      const response = await axios({
        method: 'post',
        headers: {
          'Accept': 'audio/wav'
        },
        data: {
          text: message
        },
        baseURL: config.ttsURL,
        auth: { username: 'apikey', password: config.ttsAPIKEY },
        responseType: 'stream'
      });

      const stream = ss.createStream();
      ss(socket).emit('audio-stream', stream, { message });
      response.data.pipe(stream);
    }
    catch(err) {
      console.log(err);
    }
  });
});

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.json()); // for parsing application/json

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(cookieParser());

app.use(sessionMiddleware);

app.use(passport.initialize());

app.use(passport.session());

function wrapAsync(fn) {
  return function wrapper(req, res, next) {
    fn(req, res, next).catch(next);
  };
}

app.get('/auth/facebook', (req, res, next) => { req.session.returnUrl = req.headers.referer; next(); }, passport.authenticate('facebook'));

app.get('/auth/facebook/callback', function(req, res, next) {
  passport.authenticate('facebook', {
    scope: ['public_profile']
  },
  function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect(req.session.returnUrl || '/'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect(req.session.returnUrl || '/');
    });
  })(req, res, next);
});

app.get('/signup', (req, res, next) => { req.session.returnUrl = req.session.returnUrl || req.headers.referer; next(); }, (req, res) => res.render('signup'));

app.post('/signup', wrapAsync(async (req, res, next) => {
  const user = await passport.registerLocalUser(req.body.email, req.body.passwd);
  req.logIn(user, function(err) {
    if (err) { return next(err); }
    return res.redirect(req.session.returnUrl || '/');
  });
}));

app.get('/login', (req, res, next) => { req.session.returnUrl = req.headers.referer; next(); }, (req, res) => res.render('login'));

app.post('/login', function(req, res, next) {
  passport.authenticate('local',
    function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect(req.session.returnUrl || '/'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect(req.session.returnUrl || '/');
    });
  })(req, res, next);
});

app.get('/', wrapAsync(async (req, res) => {
  const rooms = await rc.getRooms();
  res.render('index', {
    rooms,
    isAuthenticated: req.isAuthenticated()
  });
}));

app.post('/', body('rname').trim().not().isEmpty(), wrapAsync(async (req, res) => {
  const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${param}: ${msg}`;
  };
  const result = validationResult(req).formatWith(errorFormatter);
  if (!result.isEmpty()) {
    res.render('index', {
      rooms,
      isAuthenticated: true,
      errors: result.array()
    });
    return;
  }
  const data = matchedData(req);
  await rc.addRoom(data.rname);
  const rooms = await rc.getRooms();
  res.render('index', {
    rooms,
    isAuthenticated: true
  });
}));













app.get('/:rname', wrapAsync(async (req, res) => {
  const room = await rc.getRoomByName(req.params.rname);
  if (!room) {
    throw {
      status: 404,
      title: '404',
      error: '404',
      message: 'Room not found'
    };
  }


  const history = await rc.getRoomMessages(room._id);
  history.reverse();
  res.render('room', {
    room,
    history,
    isAuthenticated: req.isAuthenticated()
  });
}));

app.all('*', (req, res) => {
  res.status(404).render('error', {
    title: '404',
    error: '404',
    message: 'Page not found'
  });
});

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(err.status || 500).render('error', {
      title: err.title || '500',
      error: err.error || '500',
      message: err.message
  });
});

http.listen(port, () => console.log(`YetAnotherChat is listening on port ${port}`));
