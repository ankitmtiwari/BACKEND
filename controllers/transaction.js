const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { handleNetAmountUsers } = require("./user");

//add the created transaction to users data
async function addtoTransactions(tid, from, to) {
  try {
    await User.updateMany(
      { _id: { $in: [from, to] } },
      { $push: { transactions: tid } },
      { new: true }
    )
      .then(() => {
        console.log("Added to transactions");
      })
      .catch((err) => {
        if (err) {
          console.log(`Error while adding transaction to users ${err}`);
        }
      });
  } catch (error) {
    console.log(error);
  }
}
//create transaction
async function createTransaction(res, transactionData) {
  try {
    await Transaction.create({
      fromUserId: transactionData.fromUserId,
      toUserId: transactionData.toUserId,
      amount: transactionData.amount,
      description: transactionData.description,
      createdBy: transactionData.createdBy,
    }).then(async (t) => {
      await addtoTransactions(
        t._id,
        transactionData.fromUserId,
        transactionData.toUserId
      ).then(() => {
        return res.status(201).send(t);
      });
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create transaction", message: error });
  }
}

//create a pay transaction
async function createPayTransaction(req, res) {
  try {
    const traData = req.body;
    const cuserData = req.user;
    traData.fromUserId = cuserData.id;
    traData.toUserId = traData.buddyUserId;
    traData.createdBy = cuserData.id;
    traData.firstName = cuserData.firstName;
    traData.lastName = cuserData.lastName;
    if (traData.fromUserId != traData.toUserId) {
      createTransaction(res, traData);
    } else {
      res.send(400).json({ error: "Receiver and Sender cannot be same" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create transaction", message: error });
  }
}

//create a receive transaction
async function createReceiveTransaction(req, res) {
  try {
    const traData = req.body;
    const cuserData = req.user;
    traData.fromUserId = traData.buddyUserId;
    traData.toUserId = cuserData.id;
    traData.createdBy = cuserData.id;
    traData.firstName = cuserData.firstName;
    traData.lastName = cuserData.lastName;
    if (traData.fromUserId != traData.toUserId) {
      createTransaction(res, traData);
    } else {
      res.send(400).json({ error: "Receiver and Sender cannot be same" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create transaction", message: error });
  }
}

//approve the requested transaction set pending to false
async function approveTransactionRequest(req, res) {
  const data = req.body;
  const cuserData = req.user;
  Transaction.findByIdAndUpdate(data.tid, { $set: { pending: false } })
    .then(async (t) => {
      if (cuserData.id === t.fromUserId || cuserData.id === t.toUserId) {
        if (await handleNetAmountUsers(t.fromUserId, t.toUserId, t.amount)) {
          return res.status(200).json({ message: "Approved Successfully" });
        } else {
          return res.status(400).json({
            error: "Failed to calculate netAmout",
            message: "Transaction Approved But Failed to calculate netAmou",
          });
        }
      } else {
        return res.status(400).json({
          error: "Invalid User for transaction",
          message: "You are not a part of the transaction",
        });
      }
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ error: err, message: "Failed to approve transaction" });
    });
}

//get details of a particular transaction
async function getTransaction(req, res) {
  const { cUser, tId } = req.body;
  const tdetails = await Transaction.findOne({
    _id: tId,
    $or: [{ fromUserId: cUser }, { toUserId: cUser }],
  }).populate("fromUserId toUserId", "firstName lastName");
  console.log(tdetails);
}

//
module.exports = {
  createPayTransaction,
  createReceiveTransaction,
  approveTransactionRequest,
  getTransaction,
};
