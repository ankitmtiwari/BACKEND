const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { handleNetAmountUsers } = require("./user");

//add the created transaction to users data
async function addtoTransactions(tid, from, to) {
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
}

//create a transaction
async function createTransaction(req, res) {
  const traData = req.body;
  await Transaction.create({
    fromUserId: traData.fromUserId,
    toUserId: traData.toUserId,
    amount: traData.amount,
    description: traData.description,
    createdBy: traData.createdBy,
  }).then(async (t) => {
    await addtoTransactions(t._id, traData.fromUserId, traData.toUserId).then(
      () => {
        res.status(201).send(t);
      }
    );
  });
}

//approve the requested transaction set pending to false
async function approveTransactionRequest(req, res) {
  const data = req.body;
  Transaction.findByIdAndUpdate(data.tid, { $set: { pending: false } })
    .then(async (t) => {
      if (await handleNetAmountUsers(t.fromUserId, t.toUserId, t.amount)) {
        return res.status(200).json({ message: "Approved Successfully" });
      } else {
        return res
          .status(400)
          .json({ error: "Approved But Failed to calculate netAmout" });
      }
    })
    .catch((err) => {
      return res.status(400).send(err);
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

module.exports = {
  createTransaction,
  approveTransactionRequest,
  getTransaction,
};
