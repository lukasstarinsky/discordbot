"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSummonerStatsFromMatch = exports.GetLastMatch = exports.GetFlexLeagueEntry = exports.GetSoloLeagueEntry = exports.GetLeagueEntries = exports.GetSummoner = void 0;
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
async function GetSummoner(summonerName) {
    const summonerUrl = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;
    const summoner = await axios_1.default.get(summonerUrl, { headers: {
            "X-Riot-Token": process.env.RIOT_API
        } });
    return summoner.data;
}
exports.GetSummoner = GetSummoner;
async function GetLeagueEntries(summoner) {
    const leagueEntriesUrl = `https://eun1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
    const leagueEntries = await axios_1.default.get(leagueEntriesUrl, { headers: {
            "X-Riot-Token": process.env.RIOT_API
        } });
    return leagueEntries.data;
}
exports.GetLeagueEntries = GetLeagueEntries;
async function GetSoloLeagueEntry(summoner) {
    const leagueEntries = await GetLeagueEntries(summoner);
    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_SOLO_5x5";
    })[0];
}
exports.GetSoloLeagueEntry = GetSoloLeagueEntry;
async function GetFlexLeagueEntry(summoner) {
    const leagueEntries = await GetLeagueEntries(summoner);
    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_TEAM_5x5";
    })[0];
}
exports.GetFlexLeagueEntry = GetFlexLeagueEntry;
async function GetLastMatch(summoner) {
    const matchIdsUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?count=1`;
    const matchIds = await axios_1.default.get(matchIdsUrl, { headers: {
            "X-Riot-Token": process.env.RIOT_API
        } });
    const lastMatchId = matchIds.data[0];
    const lastMatchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${lastMatchId}`;
    const lastMatchData = await axios_1.default.get(lastMatchUrl, { headers: {
            "X-Riot-Token": process.env.RIOT_API
        } });
    return lastMatchData.data;
}
exports.GetLastMatch = GetLastMatch;
function GetSummonerStatsFromMatch(match, summoner) {
    return match.info.participants.filter((participant) => {
        return participant.summonerName === summoner.name;
    })[0];
}
exports.GetSummonerStatsFromMatch = GetSummonerStatsFromMatch;
