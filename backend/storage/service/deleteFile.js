const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.METADATA_TABLE;

module.exports.handler = async (event) => {
  console.log(`event is ${JSON.stringify(event, null, 2 )}`);

  let {storedFileName} = event.path;

  try {
    // 인코딩 여부에 따라 디코딩 시도
    storedFileName = decodeURIComponent(storedFileName);
  } catch (error) {
    // 이미 디코딩된 상태로 들어온 경우 아무 작업 안 함
    console.log("File name did not require decoding:", storedFileName);
  }

  try {
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: { id: "files/"+storedFileName },
    };

    await dynamoDb.delete(deleteParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Metadata for ${storedFileName} deleted successfully` }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to delete metadata: ${error.message}` }),
    };
  }
};