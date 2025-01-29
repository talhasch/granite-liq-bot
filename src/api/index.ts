import { generateWallet } from "@stacks/wallet-sdk";
import type { PoolClient } from "pg";
import { cvToJSON, fetchCallReadOnlyFunction, getAddressFromPrivateKey } from "@stacks/transactions";
import { getNetworkNameFromAddress } from "../helper";
import { getContractInfo } from "../hiro-api";
import { networkFromName } from "@stacks/network";
import { pool } from "../db";


const getContractList = async (dbClient: PoolClient) => {
    return dbClient.query('SELECT id, address, name, network, owner_address FROM contracts ORDER BY created_at DESC').then(r => r.rows);
}

const getContracts = async (req: Request) => {
    const dbClient = await pool.connect();
    const contracts = await getContractList(dbClient);
    dbClient.release();
    return Response.json(contracts);
}

export const errorResponse = (error: any) => {
    if (typeof error === 'string') {
        return Response.json({ error: error }, { status: 400 });
    };

    const message = error instanceof Error ? error.message : 'Server error';
    return Response.json({ error: message }, { status: 400 });
}

const addContract = async (req: Request) => {
    const body = await req.json();
    const address = body.address?.trim();
    const mnemonic = body.mnemonic?.trim();

    if (address === '') {
        return errorResponse('Enter an address');
    }

    if (mnemonic === '') {
        return errorResponse('Enter a mnemonic');
    }

    let dbClient = await pool.connect();
    if (await dbClient.query('SELECT * FROM contracts WHERE address = $1', [address]).then(r => r.rows.length > 0)) {
        dbClient.release();
        return errorResponse('Contract already exists');
    }
    dbClient.release();

    let networkName;

    try {
        networkName = getNetworkNameFromAddress(address);
    } catch (error) {
        return errorResponse(error);
    }

    const network = networkFromName(networkName);

    let wallet;
    try {
        wallet = await generateWallet({ secretKey: mnemonic, password: "", });
    } catch (error) {
        return errorResponse(error);
    }

    const [owner] = wallet.accounts;
    const ownerAddress = getAddressFromPrivateKey(owner.stxPrivateKey, network);

    let contractInfo;
    try {
        contractInfo = await getContractInfo(address, network);
    } catch (error) {
        return errorResponse('Could not fetch contract info');
    }

    if (contractInfo.error && contractInfo.message) {
        return errorResponse(contractInfo.message);
    }

    let onChainOwnerAddress;
    const [contractAddress, contractName] = address.trim().split('.');
    try {
        onChainOwnerAddress = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-owner',
            functionArgs: [],
            senderAddress: ownerAddress,
            network,
        }).then(r => cvToJSON(r).value);
    } catch (error) {
        return errorResponse('Could not fetch contract owner');
    }

    if (onChainOwnerAddress !== ownerAddress) {
        return errorResponse('Contract owner does not match');
    }

    dbClient = await pool.connect();
    await dbClient.query('INSERT INTO contracts (id, address, name, network, owner_address, owner_priv) VALUES ($1, $2, $3, $4, $5, $6)',
        [address, contractAddress, contractName, networkName, ownerAddress, owner.stxPrivateKey]);
    const contracts =  await getContractList(dbClient);
    dbClient.release();
    return Response.json(contracts);
}


export const main = async () => {
    const server = Bun.serve({
        port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8081,
        async fetch(req) {
            const url = new URL(req.url);
            let res: Response;

            if (req.method === "GET" && url.pathname === "/contracts") {
                res = await getContracts(req);
            } else if (req.method === "POST" && url.pathname === "/add-contract") {
                res = await addContract(req);
            } else {
                res = new Response("Not found", { status: 404 });
            }

            res.headers.set('Access-Control-Allow-Origin', '*');
            res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

            return res;
        },
    });

    console.log(`Server running on http://${server.hostname}:${server.port}`);

}