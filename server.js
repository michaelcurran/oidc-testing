require('dotenv').config()

const express = require('express');
const hbs = require('hbs');

const indexRouter = require('./routes/index')
const loginRouter = require('./routes/login')

const port = process.env.PORT || 3000;
const app = express();

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

app.use('/', indexRouter);
app.use('/login', loginRouter)

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
