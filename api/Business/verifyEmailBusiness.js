const {
  updateUserService,
  createUserService,
  findUserService,
} = require("../Service/userService");

const verifyEmailBusiness = async (payload) => {
  try {
    const { token } = payload;
    const findUserDetails = await findUserService({ token });
    if (!findUserDetails) {
      return "user doesnt exist";
    }
    const dbPayload = {
      token: "",
      verified: true,
    };
    const dbName = `LogDoor_${findUserDetails._id}`;
    dbPayload.dbName = dbName;
    const userDetails = await updateUserService({ token: token }, dbPayload);
    const userDbpayload = {
      email: findUserDetails?.email,
      userId: findUserDetails?._id,
      role: "admin",
      verified: true,
    };
    await createUserService(userDbpayload, dbName);
    return "email is verified";
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  verifyEmailBusiness,
};
