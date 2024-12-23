import axios from "axios";
import "dotenv/config";

import { 
    Summoner,
    LeagueEntryDTO,
    MatchDto,
    ParticipantDto,
    CurrentGameInfoDTO
} from "~/types/riot";
import { AccountDto } from "~/types/riot/account.type";
import { QueueID } from "~/types/riot/match.type";

export async function GetAccount(gameName: string, tagLine: string, region: string = "europe"): Promise<AccountDto> {
    const requestUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const account = await axios.get<AccountDto>(requestUrl, { headers: { "X-Riot-Token": process.env.RIOT_API } });

    return account.data;
}

export async function GetAccountByPUUID(puuid: string, region: string = "europe"): Promise<AccountDto> {
    const requestUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
    const account = await axios.get<AccountDto>(requestUrl, { headers: { "X-Riot-Token": process.env.RIOT_API } });

    return account.data;
}

export async function GetLoseStreak(account: AccountDto): Promise<number> {
    const matchIds = await GetMatchHistory(account);

    let loseStreak = 0;
    for (let matchId of matchIds) {
        const match = await GetMatch(matchId);

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

export async function GetSummonerByPUUID(puuid: string, region: string = "eun1"): Promise<Summoner> {
    const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summoner = await axios.get<Summoner>(summonerUrl, { headers: { "X-Riot-Token": process.env.RIOT_API }});

    return summoner.data;
}

export async function GetLeagueEntries(account: AccountDto, region: string = "eun1"): Promise<LeagueEntryDTO[]> {
    const summoner = await GetSummonerByPUUID(account.puuid, region);

    const leagueEntriesUrl = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
    const leagueEntries = await axios.get<LeagueEntryDTO[]>(leagueEntriesUrl, { headers: { "X-Riot-Token": process.env.RIOT_API }});

    return leagueEntries.data;
}

export async function GetCurrentActiveMatch(account: AccountDto, region: string = "eun1"): Promise<CurrentGameInfoDTO> {
    const activeMatchUrl = `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${account.puuid}`;
    const activeMatch = await axios.get<CurrentGameInfoDTO>(activeMatchUrl, { headers: { "X-Riot-Token": process.env.RIOT_API }});

    return activeMatch.data;
}

export async function GetSoloLeagueEntry(account: AccountDto, region: string = "eun1"): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(account, region);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_SOLO_5x5";
    })[0];
}

export async function GetFlexLeagueEntry(account: AccountDto, region: string = "eun1"): Promise<LeagueEntryDTO> {
    const leagueEntries = await GetLeagueEntries(account, region);

    return leagueEntries.filter((entry) => {
        return entry.queueType === "RANKED_TEAM_5x5";
    })[0];
}

export async function GetMatch(matchId: string, region: string = "europe"): Promise<MatchDto> {
    const matchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`
    const matchData = await axios.get<MatchDto>(matchUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    return matchData.data;
}

export async function GetMatchHistory(account: AccountDto, queueType: QueueID = QueueID.SoloQ, region: string = "europe"): Promise<string[]> {
    const matchIdsUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?count=30&queue=${queueType}`;
    const matchIds = await axios.get<string[]>(matchIdsUrl, { headers: { "X-Riot-Token": process.env.RIOT_API }});

    return matchIds.data;
}

export async function GetLastMatch(account: AccountDto, region: string = "europe"): Promise<MatchDto> {
    const lastMatchId = await GetMatchHistory(account);
    const lastMatchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${lastMatchId[0]}`
    const lastMatchData = await axios.get<MatchDto>(lastMatchUrl, { headers: { "X-Riot-Token": process.env.RIOT_API }});

    return lastMatchData.data;
}

export function GetSummonerStatsFromMatch(match: MatchDto, account: AccountDto): ParticipantDto {
    return match.info.participants.filter((participant) => {
        return participant.riotIdGameName === account.gameName;
    })[0];
}