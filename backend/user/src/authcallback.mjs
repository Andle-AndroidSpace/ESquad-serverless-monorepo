import fetch from "node-fetch";
import { createResponse } from "../util/responseHelper.mjs";

export const handler = async (event) => {
  try {
    const queryStringParameters = event.queryStringParameters;

    // 인증 코드 가져오기
    const code = queryStringParameters?.code;
    if (!code) {
      return createResponse(400, { message: "Authorization code is missing." });
    }

    // 환경 변수에서 Cognito 설정 가져오기
    const cognitoConfig = {
      clientId: process.env.COGNITO_CLIENT_ID,
      domain: process.env.VITE_COGNITO_DOMAIN,
      redirectUri: process.env.CALLBACK_URLS,
    };

    // 토큰 요청 URL 및 데이터 설정
    const tokenUrl = `https://${cognitoConfig.domain}/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoConfig.clientId,
      redirect_uri: cognitoConfig.redirectUri,
      code,
    });

    // Cognito로 토큰 요청
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to exchange code for token:", error);
      return createResponse(500, { message: "Token exchange failed.", error });
    }

    const data = await response.json();

    // 반환된 ID 토큰
    const { id_token } = data;

    if (!id_token) {
      return createResponse(500, { message: "ID token not received." });
    }

    // 성공적으로 ID 토큰 반환
    return createResponse(200, { message: "Authentication successful", idToken: id_token });
  } catch (error) {
    console.error("Error during authentication:", error);
    return createResponse(500, { message: "Internal server error", error: error.message });
  }
};
