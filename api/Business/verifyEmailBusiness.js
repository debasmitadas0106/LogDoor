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
    const userDetails = await updateUserService(dbPayload);
    const dbName = `LogDoor_${findUserDetails._id}`;
    const userDbpayload = {
      ...findUserDetails,
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
