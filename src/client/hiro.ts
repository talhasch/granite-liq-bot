import { networkFromName } from "@stacks/network";
import { type TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";
import { cvToHex, hexToCV, type ClarityValue } from "@stacks/transactions";
import { sleep } from "bun";
import { createLogger } from "../logger";
import type { NetworkName } from "../types";

const logger = createLogger("hiro-api");

const MAX_RETRIES = 5;
const INITIAL_DELAY = 5000;

export const fetchWrapper = async (path: string, network: NetworkName, json?: any) => {
    const networkObj = networkFromName(network);
    const url = `${networkObj.client.baseUrl}${path}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            let r;
            if (json) {
                r = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(json),
                });
            } else {
                r = await fetch(url);
            }

            if (r.status === 200) {
                return r;
            }

            lastError = new Error(`HTTP ${r.status}: ${await r.text()}`);

            // Only retry if we haven't reached max attempts
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                logger.warn(`Hiro api request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delay);
            }
        } catch (error) {
            lastError = error as Error;

            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                logger.warn(`Hiro api request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delay);
            }
        }
    }

    throw lastError || new Error('Request failed after max retries');
}

export const getContractInfo = async (contractId: string, network: NetworkName) => {
    return fetchWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: NetworkName): Promise<TransactionEventsResponse> => {
    return fetchWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}

export const callReadOnly = async ({ contractName, contractAddress, functionName, functionArgs, senderAddress, network, }: {
    contractName: string;
    contractAddress: string;
    functionName: string;
    functionArgs: ClarityValue[];
    senderAddress: string;
    network: NetworkName;
}) => {
    const json = {
        sender: senderAddress,
        arguments: functionArgs.map(arg => cvToHex(arg)),
    };

    return fetchWrapper(`/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`, network, json).then(r => r.json()).then((r) => {
        if(r.okay){
            return hexToCV(r.result)
        }

        throw new Error('Contract call failed')
    })
}
