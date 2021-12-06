/**
 *
 * @param {Number} historyTime - Each client task keeps the following information for the last N minutes of its history. In case of "Out of quota" means time to wait for server recovery.
 * @param {Number} timesAsLargeAsAccepts - Clients can continue to issue requests to the backend until requests is K times as large as accepts.  Google services and they suggest K = 2
 * @param {Number} upperLimiteToChanceOfRejectingNewRequest - if the server goes down for more than 2 minutes, the P0 value will stand in 1, rejecting locally every new request to the server, so the client app won't be able to set up a new conection. As the result of it, the client app will never have another request reaching the server. 0.9 allowing the client to recover even in that worst scenario, when the service is down more than 2 minutes.
 * @returns
 */
export declare const createAdaptiveThrottling: (historyTime?: number, timesAsLargeAsAccepts?: number, upperLimiteToChanceOfRejectingNewRequest?: number) => {
    getCutoffIsReached(): boolean;
    execute(func: any): Promise<any>;
};
