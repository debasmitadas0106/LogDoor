const {
  createApiKeyService,
  getApiKeyService,
  updateApiKeyService,
} = require("../Service/apiKeyService");
const { findUserService } = require("../Service/userService");
const crypto = require("crypto");

const createApiKeyBusiness = async (payload, headers, user = {}) => {
  try {
    const { authorization } = headers;
    const getAdminApiKeyDetails = await getApiKeyService({ apiKey: authorization });
    if (!getAdminApiKeyDetails || getAdminApiKeyDetails?.role != "super_admin") {
      return "User is not authenticated to issue API key";
    }
    const { email } = payload;
    const checkUserDetails = await findUserService({ email: email });
    if (!checkUserDetails || checkUserDetails?.verified === false) {
      return "No user found or user not verified";
    }

    const apiKey = crypto.randomBytes(32).toString("hex");
    const expiryTime = Date.now() + 90 * 24 * 60 * 60 * 1000;
    const apiKeyPayload = {
      dbName: checkUserDetails?.dbName,
      email: email,
      userId: checkUserDetails?._id,
      apiKey: apiKey,
      role: "user",
      expiresIn: expiryTime,
      lastUsed: new Date(),
    };
    const getApiKeyDetails = await getApiKeyService({ email: email });
    if (getApiKeyDetails) {
      console.log("herer");
      const { role, ...updatePayload } = apiKeyPayload;
      const updatedApiKeyDetails = await updateApiKeyService(
        { email: email },
        updatePayload,
      );
      await updateApiKeyService(
        { email: email },
        updatePayload,
        checkUserDetails?.dbName,
      );
      return updatedApiKeyDetails;
    }
    const createApiKeyDetails = await createApiKeyService(apiKeyPayload);

    const createApiKeyDetailsInUser = await createApiKeyService(
      apiKeyPayload,
      checkUserDetails?.dbName,
    );
    return createApiKeyDetails;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createApiKeyBusiness,
};
