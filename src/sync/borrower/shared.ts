import type { PoolClient } from "pg";
import type { Borrower, UserCollateral, UserPosition } from "../../types";

type PartialBorrower = Pick<Borrower, 'address' | 'network'>;

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<PartialBorrower[]> => {
    return dbClient.query("SELECT address, network FROM borrowers WHERE sync_flag = 1").then(r => r.rows);
}

export const updateBorrower = async (dbClient: PoolClient, borrower: PartialBorrower, lpShares: number): Promise<any> => {
    return dbClient.query("UPDATE borrowers SET lp_shares = $1, sync_flag = 0 WHERE address = $2", [lpShares, borrower.address]);
}

export const syncBorrowerPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_positions WHERE address = $1 ", [userPosition.address]);
    return dbClient.query("INSERT INTO borrower_positions (address, borrowed_amount, borrowed_block, debt_shares, collaterals) VALUES ($1, $2, $3, $4, $5)",
        [userPosition.address, userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals]);
}

type PartialUserCollateral = Pick<UserCollateral, 'collateral' | 'amount'>;

export const syncBorrowerCollaterals = async (dbClient: PoolClient, address: string, userCollaterals: PartialUserCollateral[]): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_collaterals WHERE address = $1", [address]);

    for (const userCollateral of userCollaterals) {
        await dbClient.query("INSERT INTO borrower_collaterals (address, collateral, amount) VALUES ($1, $2, $3)", [address, userCollateral.collateral, userCollateral.amount]);
    }
}