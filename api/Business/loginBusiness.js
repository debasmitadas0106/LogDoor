const jwt = require("jsonwebtoken");
const { findAllUserBusiness } = require("./userBusiness");
const bcrypt = require("bcrypt");
const { get } = require("../../Schema/users");
const { findUserService } = require("../Service/userService");

const loginBusiness = async (payload) => {
  try {
    const { email, password } = payload;
    const getUserDetails = await findUserService({ email: email });
    if (!getUserDetails) {
      return "User Not found";
    }
    // console.log(getUserDetails,"user-------->");
    if(!getUserDetails?.verified){
      return "Please verify your email id"
    }
    const isMatch = await bcrypt.compare(password, getUserDetails.password);
    if (!isMatch) {
      return "Wrong password";
    }
    // generate token for the user
    const token = jwt.sign(
      {
        userId: getUserDetails?._id,
        email: getUserDetails?.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      },
    );

    return {
      token: token,
      userId: getUserDetails?._id,
    };
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loginBusiness,
};
