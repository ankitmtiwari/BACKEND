const express = require("express");
const app = express();
//jwt
const jwt = require("jsonwebtoken");
//passport
const passport = require("passport");
//pasport local
const LocalStrategy = require("passport-local").Strategy;
//passport jwt
const JwtStrategy = require("passport-jwt").Strategy;
//to get tokn from header
const ExtractJwt = require("passport-jwt").ExtractJwt;
//toencrypt the password
const bcrypt = require("bcrypt");

//userModel
const { User } = require("./models/user");
//get the connected db
const { makeMongoDbConnection } = require("./connection");
//get user controllers
const {
  createUser,
  login,
  getHisabOf,
  getAllHisab,
  getAllTransactions,
  getTransactionof,
} = require("./controllers/user");
//get transaction controllers
const {
  createPayTransaction,
  createReceiveTransaction,
  approveTransactionRequest,
} = require("./controllers/transaction");

//port to run
const PORT = 8000;
//secret key of jwt
const key = "my name is lakhan 1 2 ka 4 aur 4 2 ka 1";
//do the DB Connection
makeMongoDbConnection("mongodb://127.0.0.:27017/apna_hisab");

// mongoose
//   .connect("mongodb://127.0.0.1:27017/apna_hisab")
//   .then(() => console.log("Connected to mongo DB"))
//   .catch((err) => console.log(`Error in db connection ${err}`));

//setting up common required middlewares
app.use(passport.initialize());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// JWT strategy for protecting routes
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: key,
};

// local strategy for email/phone and password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: "username", // 'identifier' field can be either email or phone
      passwordField: "password",
    },
    async (identifier, password, done) => {
      try {
        // Check if the user exists with the provided email or phone
        const user = await User.findOne({
          $or: [{ email: identifier }, { phone: identifier }],
        });

        if (!user) {
          return done(null, false, { message: "User not found." });
        }

        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        // Return the user if authentication is successful
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
// passport jwt auth strategy
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, payload);
    } else {
      return done(null, false);
    }
  })
);
//manual jwt auth middleware
function validLogin(req, res, next) {
  const ctoken = req.header("Authorization");
  if (!ctoken) {
    return res.status(401).send("Access denied");
  }
  jwt.verify(ctoken, key, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    req.user = user;
    next();
  });
}

//middlewares
const passport_local = passport.authenticate("local", { session: false });
const passport_token = passport.authenticate("jwt", { session: false });
// const passport_token = validLogin;

//new user registration
app.post("/signup", createUser);
//user login
app.post("/login", passport_local, login);
// app.post("/login", validLogin, login);

//new transaction with pending true
app.post("/newTransaction/pay", passport_token, createPayTransaction);
app.post("/newTransaction/receive", passport_token, createReceiveTransaction);
//approve the created transation
app.patch("/approveTReq", passport_token, approveTransactionRequest);

//get hisab of all buddies
app.get("/getAllHisab", passport_token, getAllHisab);
//get hisab(net Amount) of a buddy
app.get("/getHisabOf", passport_token, getHisabOf);

//get all transactions
app.get("/getAllTransactions", passport_token, getAllTransactions);
//get transaction detail of a particular transaction
app.get("/getTransactionOf", passport_token, getTransactionof);

//protected route that needs user to be loggedin
app.get("/protect", passport_token, (req, res) => {
  res.status(200).send(req.user);
});

app.listen(PORT, () => {
  console.log(`Server Running at port ${PORT}`);
});
