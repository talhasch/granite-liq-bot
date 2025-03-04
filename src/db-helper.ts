import { type BorrowerStatusEntity, type ContractEntity } from "granite-liq-bot-common";
import type { PoolClient } from "pg";

export const getContractList = async (dbClient: PoolClient, args?: {
    filters?: Record<string, string>,
    orderBy?: 'created_at DESC' | 'market_asset_balance DESC'
}): Promise<ContractEntity[]> => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'created_at DESC';

    let sql = 'SELECT id, address, name, network, operator_address, market_asset, market_asset_balance, collateral_asset, collateral_asset_balance, lock_tx, unlocks_at FROM contract';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy}`;
    return dbClient.query(sql, Object.values(filters))
        .then(r => r.rows).then(rows => rows.map(row => ({
            id: row.id,
            address: row.address,
            name: row.name,
            network: row.network,
            operatorAddress: row.operator_address,
            marketAsset: row.market_asset ? {
                ...row.market_asset,
                balance: Number(row.market_asset_balance)
            } : null,
            collateralAsset: row.collateral_asset ? {
                ...row.collateral_asset,
                balance: Number(row.collateral_asset_balance)
            } : null,
            lockTx: row.lock_tx,
            unlocksAt: row.unlocks_at ? Number(row.unlocks_at) : null
        })));
}

export const getBorrowerStatusList = async (dbClient: PoolClient, args?: {
    filters?: Record<string, string>,
    orderBy?: 'total_repay_amount DESC, risk DESC' | 'total_repay_amount DESC'
}): Promise<BorrowerStatusEntity[]> => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'total_repay_amount DESC, risk DESC';

    let sql = 'SELECT * FROM borrower_status';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy}`;
    return dbClient.query(sql, Object.values(filters))
        .then(r => r.rows).then(rows => rows.map(row => ({
            address: row.address,
            network: row.network,
            ltv: Number(row.ltv),
            health: Number(row.health),
            debt: Number(row.debt),
            collateral: Number(row.collateral),
            risk: Number(row.risk),
            maxRepay: row.max_repay,
            totalRepayAmount: Number(row.total_repay_amount)
        })));
}   
