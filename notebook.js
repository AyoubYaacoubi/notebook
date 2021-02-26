// some requirements:
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const sanitizeHTML = require('sanitize-html')
const marked = require('marked')
const csrf = require('csurf')
const notebook = express()

notebook.use(express.json())
notebook.use(express.urlencoded({extended: false}))

notebook.use('/api', require('./router-api'))


// setting up the sessions:
let sessionOptions = session({
    secret: 'javaScript is sooso cooool',
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 500000*599999, httpOnly: true}
})
// using sessions and flash:
notebook.use(sessionOptions)
notebook.use(flash())

// making some info availiable within our templates:
notebook.use(function(req, res, next){
    // the fillter for the user input:
    res.locals.filterHTML = function(content){
        return sanitizeHTML(marked(content), {allowedAttributes:{}, allowedTags:['p', 'br', 'i', 'bold', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ol', 'ul', 'li']})
    }
    // make the session availible:
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')
    // give the users an id:
    if(req.session.user){req.visitorId = req.session.user.id}else{req.visitorId = 0}
    // make the sessions availiable withing our template:
    res.locals.user = req.session.user
    next()
})


const router = require('./router')


// some important configs:
notebook.use(express.static('public'))


notebook.set('views', 'views')
notebook.set('view engine', 'ejs')

// avoiding cross site attackes

notebook.use(csrf())

notebook.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken()
    next()
})

notebook.use('/', router)

notebook.use(function(err, req, res, next){
    if(err){
        if(err.code == "EBADCSRFTOKEN"){
            req.flash('errors', "Cross site request forgery detected!")
            req.session.save(()=>res.redirect('/'))
        }else{
            res.render('404')
        }
    }
})
// /===================Socket.IO===============

const server = require("http").createServer(notebook)

const io = require('socket.io')(server)

// hard code
io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

// socket requests:
io.on('connection', function(socket){
    if(socket.request.session.user){
        // saveing the session data:
        let user = socket.request.session.user
        // sending the avatar of the current user:
        socket.emit('welcome', {avatar: user.avatar})
        // broadcasting with the session data in mind.
        socket.on('messageFromBrowser', function(data){
            socket.broadcast.emit("messageFromServer", {message: sanitizeHTML(data.message, {allowedAttributes:{}, allowedTags: []}), username: user.username, avatar: user.avatar})
        })
    }
})

module.exports = server