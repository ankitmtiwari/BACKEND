const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const key = "my name is lakhan 1 2 ka 4 aur 4 2 ka 1";

//create New Userr
async function createUser(req, res) {
  const userData = req.body;
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  try {
    await User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
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

//user login
async function login(req, res) {
  const token = jwt.sign(
    {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
    },
    key,
    {
      expiresIn: "2h", //1s(seconds), 1m(minutes), 1h(hours), 1d(days), 1w(weeks) Other options
    }
  );
  res.status(200).send(token);
}
/*
async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ email: username });

    if (!user) {
      console.log(`No User Found with ${username}`);
      return res.status(401).send("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`pswd is wrong ${password}`);
      return res.status(401).send("Invalid username or password");
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      "my name is lakhan 1 2 ka 4 aur 4 2 ka 1",
      {
        expiresIn: "2h", //1s(seconds), 1m(minutes), 1h(hours), 1d(days), 1w(weeks) Other options
      }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send(`Error during login ${error}`);
  }
}
*/

//add net Amount for the detailsa
async function handleNetAmountUsers(from, to, amount) {
  try {
    let sic = false; //sender insert count
    //update net amount in from user (sender)
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
    let ric = false; //receiver insert count
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
  // const users = req.body;
  const cuserData = req.user;
  try {
    const loggedInUser = await User.findOne({ _id: cuserData.id });
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
      throw new Error("User not found.");
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to get hisab", message: error });
    // console.error("Error fetching netAmount:", error);
    // throw error;
  }
}

//get Hisab for all users
async function getAllHisab(req, res) {
  // const users = req.body;
  const cuserData = req.user;
  console.log(cuserData);
  try {
    const loggedInUser = await User.findOne({ _id: cuserData.id });
    if (loggedInUser) {
      const netAmounts = loggedInUser.netAmount;
      return res
        .status(200)
        .json({ message: "Success", all_hisab: netAmounts });
    } else {
      // Logged-in user not found
      throw new Error("User not found.");
    }
  } catch (error) {
    // console.error  ("Error fetching netAmount:", error);
    // throw error;
    res
      .status(400)
      .json({ error: "Failed to get All Hisabs", message: error.message });
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

//
module.exports = {
  createUser,
  login,
  handleNetAmountUsers,
  getHisabOf,
  getAllHisab,
  getAllTransactions,
};
