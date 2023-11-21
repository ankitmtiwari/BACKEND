const express = require("express");
// const mongoose = require("mongoose");
const app = express();
const jwt = require("jsonwebtoken");
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
const { JsonWebTokenError } = require("jsonwebtoken");

const PORT = 8000;

//DB Connection
makeMongoDbConnection("mongodb://127.0.0.:27017/apna_hisab");

// mongoose
//   .connect("mongodb://127.0.0.1:27017/apna_hisab")
//   .then(() => console.log("Connected to mongo DB"))
//   .catch((err) => console.log(`Error in db connection ${err}`));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//new user registration
app.post("/signup", createUser);
//user login
app.post("/login", login);

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

//

function validLogin(req, res, next) {
  const ctoken = req.header("Authorization");
  if (!ctoken) {
    return res.status(401).send("Access denied");
  }
  console.log(` here is token received ${ctoken}`);
  jwt.verify(ctoken, "my name is lakhan", (err, user) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    res.user = user;
  });

  next();
}

app.get("/protect", validLogin, (req, res) => {
  res.send(res.user);
});
app.listen(PORT, () => {
  console.log(`Server Running at port ${PORT}`);
});
