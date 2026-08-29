import { httpServer } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
async function startServer() {
    await connectDatabase();
    httpServer.listen(env.port, () => {
        console.log(`ResQNet server listening on http://localhost:${env.port}`);
    });
}
startServer().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
});
