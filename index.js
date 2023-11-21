const express = require("express");
// const mongoose = require("mongoose");
const app = express();

const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const bcrypt = require("bcrypt");

const { User } = require("./models/user");

const { makeMongoDbConnection } = require("./connection");
const {
  createUser,
  login,
  getHisabOf,
  getAllHisab,
  getAllTransactions,
} = require("./controllers/user");

const {
  createTransaction,
  approveTransactionRequest,
  getTransaction,
} = require("./controllers/transaction");

const PORT = 8000;
const key = "my name is lakhan 1 2 ka 4 aur 4 2 ka 1";
//DB Connection
makeMongoDbConnection("mongodb://127.0.0.:27017/apna_hisab");

// mongoose
//   .connect("mongodb://127.0.0.1:27017/apna_hisab")
//   .then(() => console.log("Connected to mongo DB"))
//   .catch((err) => console.log(`Error in db connection ${err}`));

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

// passport jwt strategy for jwt token authentication
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    console.log(`payloads are ${payload.email}`);
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  })
);

//middlewares
const passport_local = passport.authenticate("local", { session: false });
const passport_token = passport.authenticate("jwt", { session: false });

//new user registration
app.post("/signup", createUser);
//user login
// app.post("/login", login);

//user login passport-local
app.post("/login", passport_local, (req, res) => {
  const token = jwt.sign({ email: req.user.email, id: req.user._id }, key, {
    expiresIn: "2h", //1s(seconds), 1m(minutes), 1h(hours), 1d(days), 1w(weeks) Other options
  });
  res.send(token);
});

//new transaction with pending true
app.post("/newTransaction", createTransaction);
//approve the created transation
app.patch("/approveTReq", approveTransactionRequest);

//get hisab of all buddies
app.get("/getAllHisab", getAllHisab);
//get hisab(net Amount) of a buddy
app.get("/getHisabOf", getHisabOf);

//get all transactions
app.get("/getallTransactions", getAllTransactions);
//get transaction detail of a particular transaction
app.get("/gettransaction", getTransaction);

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

// app.get("/protect", passport_token, (req, res) => {
//   res.send(req.user);
// });

app.get("/protect", validLogin, (req, res) => {
  res.send(req.user);
});

app.listen(PORT, () => {
  console.log(`Server Running at port ${PORT}`);
});
