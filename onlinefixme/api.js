"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadGames = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
async function LoadGames() {
    const genres = [
        { genre: "arcade", pages: 5 },
        { genre: "survival", pages: 3 },
        { genre: "fighting", pages: 3 },
        { genre: "sandbox", pages: 2 },
        { genre: "rpg", pages: 4 },
        { genre: "horror", pages: 3 },
        { genre: "shooter", pages: 7 }
    ];
    let games = [];
    for (let i of genres) {
        for (let page = 1; page <= i.pages; page++) {
            const url = `https://online-fix.me/${i.genre}/page/${page}/`;
            const response = await axios_1.default.get(url);
            const $ = cheerio.load(response.data);
            $(".news").each((index, el) => {
                const imageUrl = $(el).find(".img img").attr("data-src");
                const name = $(el).find(".article-content a h2").text().replaceAll("�", "").trim();
                const link = $(el).find(".big-link").attr("href");
                const game = {
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
exports.LoadGames = LoadGames;
