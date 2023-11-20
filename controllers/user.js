const { User } = require("../models/user");

//create New Userr
async function createUser(req, res) {
  const userData = req.body;
  try {
    await User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phoneNo: userData.phoneNo,
    })
      .then((usr) => {
        return res.status(201).send(usr);
      })
      .catch((err) => {
        if (err) {
          return res.status(400).send(err);
        }
      });
  } catch (error) {
    res.status(400).send(error);
    console.log(`Error while creating new User ${error}`);
  }
}

//add net Amount for the detailsa
async function handleNetAmountUsers(from, to, amount) {
  try {
    let sic = false;
    //update net amount in from user
    const result = await User.updateOne(
      { _id: from, "netAmount.userId": to },
      { $inc: { "netAmount.$.amount": amount } }
    ).catch((err) => {
      console.log(`Error while updating net Amount`);
    });
    //if not available then make a insert
    if (result.modifiedCount == 0) {
      await User.findByIdAndUpdate(from, {
        $push: { netAmount: { userId: to, amount: amount } },
      })
        .then(() => {
          sic = true;
          console.log(`inserted the netAmount in from ${sic}`);
        })
        .catch((err) => {
          console.log(`Failed to insert netAmount ${err}`);
        });
    } else {
      console.log("Update First");
    }
    //update net amount in to user
    let ric = false;
    const r = await User.updateOne(
      { _id: to, "netAmount.userId": from },
      { $inc: { "netAmount.$.amount": -amount } }
    ).catch((err) => {
      console.log(`Error while updating net Amount`);
    });
    //if not available then make a insert
    if (r.modifiedCount == 0) {
      await User.findByIdAndUpdate(to, {
        $push: { netAmount: { userId: from, amount: -amount } },
      })
        .then(() => {
          ric = true;
          console.log(`inserted the netAmount in to ${ric}`);
        })
        .catch((err) => {
          console.log(`Failed to insert netAmount ${err}`);
        });
    } else {
      console.log("Updated Second");
    }
    if (
      (result.modifiedCount == 1 && r.modifiedCount == 1) ||
      (sic == true && ric == true)
    ) {
      console.log("Update Success");
      return true;
    } else {
      console.log("Update Failed");
      return false;
    }
  } catch (error) {
    // res.status(400).send(error);
    console.error("Error performing transaction:", error);
  }
}

//get Hisab for a user
async function getHisabOf(req, res) {
  const users = req.body;
  try {
    const loggedInUser = await User.findOne({ _id: users.currentUser });
    if (loggedInUser) {
      // Find the netAmount for the logged-in user
      const netAmountObject = loggedInUser.netAmount.find((item) =>
        item.userId.equals(users.buddy)
      );

      // Extract the netAmount value
      const netAmount = netAmountObject ? netAmountObject.amount : 0;

      return res.status(200).json({ message: "Success", hisab: netAmount });
    } else {
      // Logged-in user not found
      throw new Error("Logged-in user not found.");
    }
  } catch (error) {
    console.error("Error fetching netAmount:", error);
    throw error;
  }
}

//get Hisab for all users
async function getAllHisab(req, res) {
  const users = req.body;
  try {
    const loggedInUser = await User.findOne({ _id: users.currentUser });
    if (loggedInUser) {
      const netAmounts = loggedInUser.netAmount;
      return res
        .status(200)
        .json({ message: "Success", all_hisab: netAmounts });
    } else {
      // Logged-in user not found
      throw new Error("Logged-in user not found.");
    }
  } catch (error) {
    // console.error  ("Error fetching netAmount:", error);
    // throw error;
    res
      .status(400)
      .json({ error: "Failed to get All Hisab", message: error.message });
  }
}

//get all the transactions of a user
async function getAllTransactions(req, res) {
  const { cUser } = req.body;
  try {
    const user = await User.findOne({ _id: cUser });
    if (user) {
      // Populate the 'transactions' field to get the actual transaction documents
      await user.populate("transactions");

      // Access the populated 'transactions' field
      const transactions = user.transactions;
      return res.status(200).send(transactions);
    } else {
      // User not found
      throw new Error("User not found.");
    }
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    throw error;
  }
}

module.exports = {
  createUser,
  handleNetAmountUsers,
  getHisabOf,
  getAllHisab,
  getAllTransactions,
};
