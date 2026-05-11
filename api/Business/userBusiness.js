const {
  createUserService,
  findUserService,
  findAllUserService,
} = require("../Service/userService");

const createUserBusiness = async (payload) => {
  try {
    const { firstName, lastName, email, phone, interests } = payload;
    const findUserDetails = await findUserService({ email: email });
    if (findUserDetails) {
      return "user already exists";
    }
    const userDetails = await createUserService(payload);
    return userDetails;
  } catch (error) {
    console.log(error);
  }
};

const findUserBusiness = async (payload) => {
  try {
    const { email, phone } = payload;
    const findUserDetails = await findUserService({ email: email });
    return findUserDetails;
  } catch (error) {
    console.log(error);
  }
};

const findAllUserBusiness = async (payload) => {
  try {
    const findUserDetails = await findAllUserService();
    return findUserDetails;
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  createUserBusiness,
  findAllUserBusiness,
  findUserBusiness,
};
