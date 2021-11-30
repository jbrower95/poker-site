export class WebsocketUtils {
    public static websocketUrlByPath(path: string): string {
        return this.websocketProtocolByLocation() +
            window.location.hostname +
            this.websocketPortWithColonByLocation() +
            window.location.pathname +
            path;
    }

    private static websocketProtocolByLocation(): string {
        return window.location.protocol === "https:" ? "wss://" : "ws://";
    }

    private static websocketPortWithColonByLocation(): string {
        const defaultPort = window.location.protocol === "https:" ? "443" : "80";
        if (window.location.port !== defaultPort) {
            return ":" + window.location.port;
        } else {
            return "";
        }
    }
}
