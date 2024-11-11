const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.METADATA_TABLE;

module.exports.handler = async (event) => {
  console.log(`event is ${JSON.stringify(event, null, 2 )}`);
  const { userId } = event.query || {};

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Please provide userId' }),
    };
  }

  const params = {
    TableName: TABLE_NAME,
    IndexName: 'UserUsageIndex', // 인덱스 생성 후 사용
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const data = await dynamoDb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch metadata: ${error.message}` }),
    };
  }
};