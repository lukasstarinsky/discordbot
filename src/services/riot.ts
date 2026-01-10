import axios from "axios";
import "dotenv/config";

import { Summoner, LeagueEntryDTO, MatchDto, ParticipantDto, CurrentGameInfoDTO } from "~/types/riot";
import { AccountDto } from "~/types/riot/account.type";
import { QueueID } from "~/types/riot/match.type";

const GetRegion = (region: string) => {
    if (region === "na1")
        return { full: "americas", shortcut: "na1" };
    else if (region === "eun1")
        return { full: "europe", shortcut: "eun1" };
    else
        return { full: "europe", shortcut: "euw1" };
}

export async function GetAccount(gameName: string, tagLine: string, regionStr: string): Promise<AccountDto> {
    const region = GetRegion(regionStr);
    const requestUrl = `https://${region.full}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const account = await axios.get<AccountDto>(requestUrl);

    return account.data;
}

export async function GetAccountByPUUID(puuid: string, regionStr: string): Promise<AccountDto> {
    const region = GetRegion(regionStr);
    const requestUrl = `https://${region.full}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
    const account = await axios.get<AccountDto>(requestUrl);

    return account.data;
}

export async function GetLoseStreak(account: AccountDto, regionStr: string): Promise<number> {
    const matchIds = await GetMatchHistory(account, regionStr);

    let loseStreak = 0;
    for (let matchId of matchIds) {
        const match = await GetMatch(matchId, regionStr);

        for (let participant of match.info.participants) {
            if (participant.riotIdGameName === account.gameName) {
                if (participant.win)
                    return loseStreak;
                
                loseStreak++;
            }
        }
    }

    return loseStreak;
}

export async function GetLast5MatchHistory(account: AccountDto, regionStr: string): Promise<MatchDto[]> {
    const matchIds = await GetMatchHistory(account, regionStr);

    let matches: MatchDto[] = [];

    for (let matchId of matchIds) {
        const match = await GetMatch(matchId, regionStr);
        matches.push(match);

        if (matches.length === 5)
            break;
    }

    return matches;
}

export async function GetSummonerByPUUID(puuid: string, regionStr: string): Promise<Summoner> {
    const region = GetRegion(regionStr);
    const summonerUrl = `https://${region.shortcut}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summoner = await axios.get<Summoner>(summonerUrl);

    return summoner.data;
}

export async function GetLeagueEntries(account: AccountDto, regionStr: string): Promise<LeagueEntryDTO[]> {
    const region = GetRegion(regionStr);
    const leagueEntriesUrl = `https://${region.shortcut}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`;
    const leagueEntries = await axios.get<LeagueEntryDTO[]>(leagueEntriesUrl);

    return leagueEntries.data;
}

export async function GetCurrentActiveMatch(account: AccountDto, regionStr: string): Promise<CurrentGameInfoDTO> {
    const region = GetRegion(regionStr);
    const activeMatchUrl = `https://${region.shortcut}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${account.puuid}`;
    const activeMatch = await axios.get<CurrentGameInfoDTO>(activeMatchUrl);

    return activeMatch.data;
}

export async function GetSoloLeagueEntry(account: AccountDto, regionStr: string): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(account, regionStr);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_SOLO_5x5";
    })[0];
}

export async function GetFlexLeagueEntry(account: AccountDto, regionStr: string): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(account, regionStr);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_TEAM_5x5";
    })[0];
}

export async function GetMatch(matchId: string, regionStr: string): Promise<MatchDto> {
    const region = GetRegion(regionStr);
    const matchUrl = `https://${region.full}.api.riotgames.com/lol/match/v5/matches/${matchId}`
    const matchData = await axios.get<MatchDto>(matchUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    return matchData.data;
}

export async function GetMatchHistory(account: AccountDto, regionStr: string, queueType: QueueID = QueueID.SoloQ): Promise<string[]> {
    const region = GetRegion(regionStr);
    const matchIdsUrl = `https://${region.full}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?count=30`;
    const matchIds = await axios.get<string[]>(matchIdsUrl);

    return matchIds.data;
}

export async function GetLastMatch(account: AccountDto, regionStr: string): Promise<MatchDto> {
    const region = GetRegion(regionStr);
    const lastMatchId = await GetMatchHistory(account, region.shortcut);
    const lastMatchUrl = `https://${region.full}.api.riotgames.com/lol/match/v5/matches/${lastMatchId[0]}`
    const lastMatchData = await axios.get<MatchDto>(lastMatchUrl);

    return lastMatchData.data;
}

export function GetSummonerStatsFromMatch(match: MatchDto, account: AccountDto): ParticipantDto {
    return match.info.participants.filter((participant) => {
        return participant.riotIdGameName === account.gameName;
    })[0];
}