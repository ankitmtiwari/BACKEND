
const express = require("express");
// const mongoose = require("mongoose");
const app = express();
const { makeMongoDbConnection } = require("./connection");

const {
  createUser,
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
// app.post("/login", login);

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

app.listen(PORT, () => {
  console.log(`Server Running at port ${PORT}`);
});
