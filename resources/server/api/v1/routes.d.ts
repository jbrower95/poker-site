import { IBaseEvent } from '../shared/schema';
import expressWs from 'express-ws';
import WebSocket from 'ws';
export declare const routes: expressWs.Router;
export declare function sendEvent(ws: WebSocket, event: IBaseEvent, userId: string | null): void;
export declare function broadcast(table: string, event: IBaseEvent): void;
