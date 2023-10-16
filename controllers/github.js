import axios from "axios";
import { constructURLSearchParams } from "../utils/index.js";
import dotenv from 'dotenv'
dotenv.config()

const {
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI,
    GITHUB_SECRET,
    } = process.env;

export const getGithubOauthURL = () => {
    const paramObj = {
        redirect_uri: GITHUB_REDIRECT_URI,
        client_id: GITHUB_CLIENT_ID
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = 'https://github.com/login/oauth/authorize';
    return `${baseUrl}?${params}`
}

const getGithubAccessToken = async (code) => {
    const paramObj = {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_SECRET,
        code: code
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = 'https://github.com/login/oauth/access_token'
    const { data } = await axios.post(`${baseUrl}?${params}`);
    const accessToken = data.split('&')[0].split('=')[1];
    return accessToken;
}

const verify = async (accessToken) => {
    const { data } = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });
      const { id } = data;
      const verified = {
        platform: 1,
        record: {
            id,
        },
        valid: !!id,
    }
    return verified
}

export const verifyGithub = async (code) => {
    const accessToken = await getGithubAccessToken(code)
    return await verify(accessToken);
}