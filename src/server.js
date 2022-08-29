import express from 'express'
import bcrypt from 'bcrypt'
import session from "express-session"
import passport from 'passport';
import passportLocal from 'passport-local'
import router from '../routes/indexrouts.js';
import hbs from 'express-handlebars'
import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from "fs"
import { Server } from "socket.io";
import config from './config.js';
import yargs  from "yargs" ;
const app = express()

//--------------------------------Agregado para variables------------------->
const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto"
}).default({
    puerto: "8080"
}).argv;

console.log('variables args',args.puerto)
console.log('Variables env',config)
//--------------------------------Fin variables------------------->
const expressServer = app.listen(args.puerto, () => { console.log(`Servidor conectado puerto ${args.puerto}`) })
const io = new Server(expressServer);
import { schema, normalize } from 'normalizr';
import util from 'util';
import {Strategy as LocalStrategy}  from 'passport-local'
//const routes = require("./routes");
import conectarDB from './controllersdb.js'
import User from './models.js'
import routes from './routes.js'
import { engine } from 'express-handlebars';

function print(objeto)
{
    console.log(util.inspect(objeto,false,12,true))
}

function hashPassword(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10))
}

function isvalidpassword(reqPassword,dbPassword){
    return bcrypt.compareSync(reqPassword,dbPassword)
}

app.engine('hbs', engine({
    defaultLayout: path.join(__dirname, '../views/layouts/main.hbs'),
    layoutsDir: path.join(__dirname, '../views/layouts')}))
app.set('view engine', '.hbs');

let ProductosDB = []
let messagesArray = []
fs.writeFileSync(`Messages/appMensajes.txt`,'')
app.use(express.static(path.join(__dirname, '../views')))
app.use(express.json());
app.use('/', router)
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.api.apisecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie:{
        httpOnly:false,
        secure: false,
        maxAge: config.api.tiemposession,
    }
}))

app.use(passport.initialize());
app.use(passport.session());

const registerStrategy = new LocalStrategy({passReqToCallback:true},
    async (req,username,password,done)=>{
        try{
        const existingUser = await User.findOne({username})
        if(existingUser)
        {
            return done(null,null)   
        }

        const newUser = {
            username,
            password: hashPassword(password)
        }

        const createdUser = await User.create(newUser)
        done(null,createdUser)
    } catch(error){
        console.log('error registrando usuerio')
        done(null,null)
    }
    })

    const loginStrategy = new LocalStrategy(async (username,password,done)=>{
        try{
            const user = await User.findOne({username})

            if(!user || !isvalidpassword(password,user.password)){
                return done(null)
            }

            done(null,user)

        }catch(error)
        {
            console.log('error login')
            done('Error login',null)
        }
   })

    passport.use('register',registerStrategy)
    passport.use('login',loginStrategy)

    passport.serializeUser((user,done)=>{
        done(null,user._id)
    })

    passport.deserializeUser((id,done)=>{
        User.findById(id,done)
    })

    app.get("/", routes.getRoot);
//------------------------------Agregado para ruta info--------->
app.get("/info", routes.getInfo);

app.get("/api/randoms", routes.getRandoms);


//  LOGIN
app.get("/login", routes.getLogin);
app.post(
  "/login",
  passport.authenticate("login", { failureRedirect: "/faillogin" }),
  routes.postLogin
);
app.get("/faillogin", routes.getFaillogin);

//  REGISTER
app.get("/register", routes.getSignup);
app.post(
  "/register",
  passport.authenticate("register", { failureRedirect: "/failsignup" }),
  routes.postSignup
);
app.get("/failsignup", routes.getFailsignup);

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/ruta-protegida", checkAuthentication, (req, res) => {
  const { user } = req;
  console.log(user);
  res.send("<h1>Ruta OK!</h1>");
});

//  LOGOUT

app.get("/logout", routes.getLogout);

//  FAIL ROUTE
app.get("*", routes.failRoute);

conectarDB(config.database.dbUrl, (err) => {
  if (err) return console.log("error en conexión de base de datos", err);
  console.log("BASE DE DATOS CONECTADA");
})

io.on('connection', async socket => {
    socket.on('client:product', async productInfo => {
        ProductosDB= productInfo
        io.emit('server:productos', ProductosDB)
    })
    socket.emit('server:productos', ProductosDB)
        //Socket Mensajes
    socket.emit('server:mensajes', messagesArray)
    socket.on('client:menssage', async messageInfo => {
        let MensajesExistentesFile = await fs.promises.readFile(`Messages/appMensajes.txt`)
        
        if(MensajesExistentesFile != '')
        {
            messagesArray = JSON.parse(MensajesExistentesFile)
        }
        messageInfo.id = messagesArray.length+1
        messagesArray.push(messageInfo)
        
        await fs.promises.writeFile(`Messages/appMensajes.txt`,JSON.stringify(messagesArray))
        const author = new schema.Entity('author',{},{idAtrribute:'id'})
        const mensaje = new schema.Entity('mensaje',{author: author},{idAtrribute:"id"})
        const schemamensajes = new schema.Entity('mensajes',{
            mensajes:[mensaje]
        },{idAtrribute:"id"})

        const nomalizePost = normalize({id:'mensajes',mensajes:messagesArray},schemamensajes)
        io.emit('server:mensajes', nomalizePost)
    })
})