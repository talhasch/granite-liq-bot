
import { main as apiMain } from './api';
import { createLogger } from './logger';
import { waitForDb } from './db';
import { migrateDb } from './db/migrate';

const logger = createLogger('main');

const main = async () => {
    const cmd = process.argv[process.argv.length - 1];

    let prms: () => Promise<void>;

    if (cmd === "api") {
        prms = apiMain;
    } else {
        throw new Error("Invalid command");
    }

    await waitForDb(60, 2000).catch((e) => {
        logger.error(`Couldn't connect to database`);
        throw e;
    });

    await migrateDb().catch(e => {
        logger.error(`Couldn't migrate database due to: ${e}`);
        throw e;
    });

    await prms();
}


main().catch((e) => {
    logger.error(e.toString());
    process.exit(1);
});
