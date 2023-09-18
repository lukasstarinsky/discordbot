import axios from "axios";
import { Game } from "./game.type";
import * as cheerio from "cheerio";

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
export async function LoadGames(): Promise<Game[]> {
    const genres: { genre: string, pages: number }[] = [
        { genre: "arcade", pages: 5 },
        { genre: "survival", pages: 3 },
        { genre: "fighting", pages: 3 },
        { genre: "sandbox", pages: 2 },
        { genre: "rpg", pages: 4 },
        { genre: "horror", pages: 3 },
        { genre: "shooter", pages: 7 }
    ];

    let games : Game[] = [];

    for (let i of genres) {
        for (let page = 1; page <= i.pages; page++) {
            const url = `https://online-fix.me/${i.genre}/page/${page}/`;

            const response = await axios.get(url);
            const $ = cheerio.load(response.data)
            $(".news").each((index, el) => {
                const imageUrl = $(el).find(".img img").attr("data-src") as string;
                const name = $(el).find(".article-content a h2").text().replaceAll("�", "").trim();
                const link = $(el).find(".big-link").attr("href") as string;
        
                const game: Game = {
                  name,
                  link,
                  imageUrl
                };
        
                games.push(game);
            });
            await sleep(100 * page);
        }
    }

    return games;
}