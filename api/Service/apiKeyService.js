const apiKeySchema = require("../../Schema/apiKey");
const dbConnect = require("../../utils/connectionSetup");

const createApiKeyService = async (data, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const apiKeyDetails = await conn.model(
      "ApiKeys",
      apiKeySchema,
      "ApiKeys",
    );
    const apiKeyDetailsCreate = await apiKeyDetails.create(data);
    return apiKeyDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getApiKeyService = async (condition, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const apiKeyDetails = await conn.model(
      "ApiKeys",
      apiKeySchema,
      "ApiKeys",
    );
    const apiKeyDetailsCreate = await apiKeyDetails.findOne(condition);
    return apiKeyDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const updateApiKeyService = async (condition,data, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const apiKeyDetails = await conn.model(
      "ApiKeys",
      apiKeySchema,
      "ApiKeys",
    );
    const apiKeyDetailsCreate = await apiKeyDetails
      .updateOne(condition, data)
    return apiKeyDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
    createApiKeyService,
    getApiKeyService,
    updateApiKeyService
}