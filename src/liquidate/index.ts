import { bufferCV, contractPrincipalCV, noneCV, principalCV, someCV, uintCV } from "@stacks/transactions";
import { formatUnits, parseUnits, pythFetchgGetPriceFeed } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { getContractList } from "../db-helper";
import { hexToUint8Array } from "../helper";
import { createLogger } from "../logger";
import type { PriceFeed } from "../types";
import { epoch } from "../util";

const logger = createLogger("liquidate");

const worker = async (dbClient: PoolClient) => {
    const borrowers = await dbClient.query("SELECT address, network, max_repay_amount FROM borrower_status WHERE max_repay_amount>0 ORDER BY max_repay_amount DESC").then(r => r.rows);
    for (const borrower of borrowers) {

        const contract = (await getContractList(dbClient, {
            filters: {
                network: borrower.network,
            },
            orderBy: 'market_asset_balance DESC'
        }))[0]


        if (!contract) {
            logger.info(`No contract to liquidate ${borrower.address}`);
            continue;
        }

        if (!contract.marketAsset) {
            logger.info(`Market asset not configured of contract ${contract.address} on ${contract.network}`);
            continue;
        }

        if (!contract.marketAsset.balance) {
            logger.info(`Market asset balance is 0 of contract ${contract.address} on ${contract.network}`);
            continue;
        }

        if (!contract.collateralAsset) {
            logger.info(`Collateral asset not configured of contract ${contract.address} on ${contract.network}`);
            continue;
        }

        const { marketAsset, collateralAsset } = contract;


        const repayAmount = Number(borrower.max_repay_amount);
        // Adjust down max repay amount %0,05 to prevent transaction failure in case high volatility
        const repayAmountAdjusted = repayAmount * 0.95;
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAsset.decimals);
        const repayAmountFinalBn = Math.min(contract.marketAsset.balance, repayAmountAdjustedBn);
        const repayAmountFinal = formatUnits(repayAmountFinalBn, marketAsset.decimals);


        const priceFeedKey = Object.keys(PRICE_FEED_IDS).find(key => collateralAsset.symbol.toLowerCase().indexOf(key.toLowerCase()) !== -1);
        if (!priceFeedKey) {
            logger.error(`Price feed key not exists for ${marketAsset.symbol}`);
            continue;
        }

        const priceFeed = await pythFetchgGetPriceFeed(PRICE_FEED_IDS[priceFeedKey as keyof PriceFeed]);
        const collateralPriceBn = priceFeed.price;
        const collateralPrice = formatUnits(collateralPriceBn, -1 * priceFeed.expo);
        const minCollateralExpected = Number((repayAmountFinal / collateralPrice).toFixed(collateralAsset.decimals));
        const minCollateralExpectedBn = parseUnits(minCollateralExpected, collateralAsset.decimals);
        const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);

        console.log("repayAmount", repayAmount);
        console.log("repayAmountAdjusted", repayAmountAdjusted);
        console.log("repayAmountAdjustedBn", repayAmountAdjustedBn);
        console.log("repayAmountFinalBn", repayAmountFinalBn);
        console.log("repayAmountFinal", repayAmountFinal);
        console.log("collateralPriceBn", collateralPriceBn);
        console.log("collateralPrice", collateralPrice);
        console.log("minCollateralExpected", minCollateralExpected)
        console.log("minCollateralExpectedBn", minCollateralExpectedBn)

        const functionArgs = [
            someCV(bufferCV(priceAttestationBuff)),
            principalCV(borrower.address),
            contractPrincipalCV(marketAsset.address.split(".")[0], marketAsset.address.split(".")[1]),
            contractPrincipalCV(collateralAsset.address.split(".")[0], collateralAsset.address.split(".")[1]),
            uintCV(repayAmountFinalBn),
            uintCV(minCollateralExpectedBn),
            uintCV(epoch() + (60 * 4)),
            noneCV()
        ];

        const priv = await dbClient.query("SELECT operator_priv FROM contract WHERE id = $1", [contract.id]).then(r => r.rows[0].operator_priv);

        process.exit(1)
      
    }
}

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient)
    dbClient.release();
}

main()