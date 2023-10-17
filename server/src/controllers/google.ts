import { constructURLSearchParams } from "../utils/index.js";
import dotenv from "dotenv"
dotenv.config()

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI,
    GOOGLE_SECRET
} = process.env

export const getGoogleOauthURL = () => {
    const paramObj = {
        redirect_uri: GOOGLE_REDIRECT_URI,
        prompt: "consent",
        response_type: "code",
        client_id: GOOGLE_CLIENT_ID,
        // Encoding incorrectly
        // scope: "email+profile",
        access_type: "offline",
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth"
    return `${baseUrl}?${params}&scope=email+profile`;
}

const getGoogleAccessToken = async (code) => {
    const params = constructURLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI
    });
    const baseUrl = "https://oauth2.googleapis.com/token"
    const res = await fetch(`${baseUrl}?${params}`);
    if (res.status !== 200) {
        throw new Error("Google access token not received");
    }
    return await res.text();
}

const verify = async (accessToken) => {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status !== 200) {
        throw new Error("Google access token not received");
    }
    const { email, verified_email } = await res.json();
    const verified = {
        platform: 2,
        record: { email },
        valid: verified_email,
    }
    return verified
}

export const verifyGoogle = async (code) => {
    const accessToken = await getGoogleAccessToken(code);
    return await verify(accessToken);
}