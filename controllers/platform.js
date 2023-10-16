import  { getDiscordOauthURL, verifyDiscord } from "./discord.js"
import { getGithubOauthURL, verifyGithub } from "./github.js"
import { getGoogleOauthURL, verifyGoogle } from "./google.js"

export const getPlatformOauthURL = (platform) => {
    switch(platform) {
        case 'github':
            return getGithubOauthURL()
        case 'google':
            return getGoogleOauthURL()
        case 'discord': 
            return getDiscordOauthURL()
    }
}

const getPlatformData = async (platform, code) => {
    switch(platform) {
        case 'github':
            return await verifyGithub(code)
        case 'google':
            return await verifyGoogle(code)
        case 'discord': 
            return await verifyDiscord(code)
    }
}

// const signData = () => {}

export const getVerifiedData = async (platform, code) => {
    const data = await getPlatformData(platform, code);
    return data;
}