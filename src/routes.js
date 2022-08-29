import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getRoot(req, res) {}
import yargs  from "yargs";
import {fork} from 'child_process'
const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto"
}).default({
    puerto: "8080"
}).argv;

function getLogin(req, res) {
  var user = {username: "Se omite login"};
    console.log("user logueado");
    res.render("login-ok", {
      usuario: user.username
    });
}

function getRandoms(req, res) {
  let { cant } = req.query
  if (!cant) {
    cant = 100000000
  }
  console.log(cant)
  const forked = fork('src/childRandom.js')
  forked.send(cant);
  forked.on("message", (msg) => {
    res.render("randoms", {
      datosRandom: msg
    });
  });
  

    
}

//--------------------Agregado ruta info-------------->

function getInfo(req, res) {
    res.render("Info", {
      argumentos: JSON.stringify(args).split(','),
      plataforma: process.platform,
      versionnode: process.version,
      memory: JSON.stringify(process.memoryUsage()).split(','),
      procesoid: process.pid,
      Carpeta: process.cwd(),
      CarpetaPath: process.execPath
    });
}

function getSignup(req, res) {
  res.sendFile(path.join(__dirname,"../views/signup.html"));
}

function postLogin(req, res) {
  var user = req.user;

  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function postSignup(req, res) {
  var user = req.user;

  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function getFaillogin(req, res) {
  console.log("error en login");
  res.render("login-error", {});
}

function getFailsignup(req, res) {
  console.log("error en signup");
  res.render("signup-error", {});
}

function getLogout(req, res) {
  req.logout();
  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function failRoute(req, res) {
  res.status(404).render("routing-error", {});
}

export default {
  getRoot,
  getLogin,
  postLogin,
  getFaillogin,
  getLogout,
  failRoute,
  getSignup,
  postSignup,
  getFailsignup,
  getInfo,
  getRandoms
};
