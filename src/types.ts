import type { CollateralParams as CollateralParams_, Collateral as Collateral_, InterestRateParams as InterestRateParams_ } from "granite-math-sdk";

export type NetworkName = "mainnet" | "testnet";

export type InterestRateParams = InterestRateParams_;

export type LpParams = {
    totalAssets: number;
    totalShares: number;
}

export type DebtParams = {
    openInterest: number;
    totalDebtShares: number;
}

export type AccrueInterestParams = {
    lastAccruedBlockTime: number;
}

export type CollateralParams = CollateralParams_ & { liquidationLTV: number, decimals: number, maxLTV: number };

export type Collateral = Collateral_;


export type PriceFeed = {
    btc: number;
    eth: number;
    usdc: number;
}

export type MarketState = {
    irParams: InterestRateParams;
    lpParams: LpParams;
    accrueInterestParams: AccrueInterestParams;
    debtParams: DebtParams;
    priceFeed: PriceFeed;
    collateralParams: Record<string, CollateralParams>;
}


export type BorrowerEntity = {
    address: string,
    network: NetworkName,
    checkFlag: 0 | 1
}

export type BorrowerPositionEntity = {
    address: string,
    network: NetworkName,
    borrowedAmount: number,
    borrowedBlock: number,
    debtShares: number,
    collaterals: string[]
}

export type BorrowerCollateralEntity = {
    address: string,
    network: NetworkName,
    collateral: string,
    amount: number
}

export type BorrowerStatus = {
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    liquidateAmt: number
}

export type BorrowerStatusEntity = BorrowerStatus & { address: string, network: NetworkName }