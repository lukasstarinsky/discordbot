type Champion = {
    version: string,
    id: string,
    key: string,
    name: string,
    title: string,
    blurb: string,
    info: {
        attack: number,
        defense: number,
        magic: number,
        difficulty: number
    }
    image: {
        full: string,
        sprite: string,
        group: string,
        x: number,
        y: number,
        w: number,
        h: number
    }
    tags: Array<{ number: string }>
}

export type Champions = {
    type: string,
    format: string,
    version: string,
    data: { [key: string]: Champion }
}