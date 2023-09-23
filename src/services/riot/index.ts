import axios from "axios";
import "dotenv/config";

import { 
    Summoner,
    LeagueEntryDTO,
    MatchDto,
    ParticipantDto,
    CurrentGameInfoDTO } from "~/types/riot";

export async function GetSummoner(summonerName: string): Promise<Summoner> {
    const summonerUrl = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;
    const summoner = await axios.get<Summoner>(summonerUrl, { headers: {
        "X-Riot-Token": process.env.RIOT_API
    }});

    return summoner.data;
}

export async function GetLeagueEntries(summoner: Summoner): Promise<LeagueEntryDTO[]> {
    const leagueEntriesUrl = `https://eun1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
    const leagueEntries = await axios.get<LeagueEntryDTO[]>(leagueEntriesUrl, { headers: {
        "X-Riot-Token": process.env.RIOT_API
    }});

    return leagueEntries.data;
}

export async function GetCurrentActiveMatch(summoner: Summoner): Promise<CurrentGameInfoDTO> {
    const activeMatchUrl = `https://eun1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summoner.id}`;
    const activeMatch = await axios.get<CurrentGameInfoDTO>(activeMatchUrl, { headers: {
        "X-Riot-Token": process.env.RIOT_API
    }});

    return activeMatch.data;
}

export async function GetSoloLeagueEntry(summoner: Summoner): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(summoner);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_SOLO_5x5";
    })[0];
}

export async function GetFlexLeagueEntry(summoner: Summoner): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(summoner);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_TEAM_5x5";
    })[0];
}

export async function GetMatch(matchId: string): Promise<MatchDto> {
    const matchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`
    const matchData = await axios.get<MatchDto>(matchUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    return matchData.data;
}

export async function GetMatchHistory(summoner: Summoner): Promise<string[]> {
    const matchIdsUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?count=30`;
    const matchIds = await axios.get<string[]>(matchIdsUrl, { headers: {
        "X-Riot-Token": process.env.RIOT_API
    }});

    return matchIds.data;
}

export async function GetLastMatch(summoner: Summoner): Promise<MatchDto> {
    const matchIdsUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?count=1`;
    const matchIds = await axios.get<string[]>(matchIdsUrl, { headers: {
        "X-Riot-Token": process.env.RIOT_API
    }});
    const lastMatchId = matchIds.data[0];

    const lastMatchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${lastMatchId}`
    const lastMatchData = await axios.get<MatchDto>(lastMatchUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    return lastMatchData.data;
}

export function GetSummonerStatsFromMatch(match: MatchDto, summoner: Summoner): ParticipantDto {
    return match.info.participants.filter((participant) => {
        return participant.summonerName === summoner.name;
    })[0];
}