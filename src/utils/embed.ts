export function CreateEmbed (title: string, color: number, message: string) {
    return {
        "title": title,
        "description": message,
        "color": color
    }
}

export function CreateErrorEmbed(message: string, title: string = "Error") {
    return CreateEmbed(title, 0xFF0000, message);
}

export function CreateInfoEmbed(message: string, title: string = "Info") {
    return CreateEmbed(title, 0x00FFFF, message);
}