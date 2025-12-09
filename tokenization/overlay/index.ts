import OverlayExpress from '@bsv/overlay-express'
import TokenDemoTopicManager from './token-demo/TokenDemoTopicManager'
import TokenDemoLookupService from './token-demo/TokenDemoLookupServiceFactory'

import { config } from 'dotenv'
import packageJson from './package.json'
config()

// Hi there! Let's configure Overlay Express!
const main = async () => {

    // We'll make a new server for our overlay node.
    const server = new OverlayExpress(

        // Name your overlay node with a one-word lowercase string
        process.env.NODE_NAME!,

        // Provide the private key that gives your node its identity
        process.env.SERVER_PRIVATE_KEY!,

        // Provide the HTTPS URL where your node is available on the internet
        process.env.HOSTING_URL!,
        
        // Provide an adminToken to enable the admin API
        process.env.ADMIN_TOKEN!
    )

    // Don't advertize right now.

    // const wa = new WalletAdvertiser(
    //     process.env.NETWORK! as 'main' | 'test',
    //     process.env.SERVER_PRIVATE_KEY!,
    //     process.env.WALLET_STORAGE_URL!,
    //     process.env.HOSTING_URL!
    // )

    // await wa.init()

    // server.configureEngineParams({
    //     advertiser: wa
    // })

    // Set the ARC API key
    server.configureArcApiKey(process.env.ARC_API_KEY!)

    // Decide what port you want the server to listen on.
    server.configurePort(Number(process.env.PORT))

    // Connect to your SQL database with Knex
    await server.configureKnex(process.env.KNEX_URL!)

    // Also, be sure to connect to MongoDB
    await server.configureMongo(process.env.MONGO_URL!)

    // Here, you will configure the overlay topic managers and lookup services you want.
    // - Topic managers decide what outputs can go in your overlay
    // - Lookup services help people find things in your overlay
    
    server.configureTopicManager('tm_tokendemo', new TokenDemoTopicManager())
    server.configureLookupServiceWithMongo('ls_tokendemo', TokenDemoLookupService)

    // For simple local deployments, sync can be disabled.
    server.configureEnableGASPSync(process.env?.GASP_ENABLED === 'true')

    // Lastly, configure the engine and start the server!
    await server.configureEngine()

    // Configure verbose request logging
    server.configureVerboseRequestLogging(true)

    server.app.get('/version', (req, res) => {
        res.json(packageJson)
    })

    // Start the server
    await server.start()
}

// Happy hacking :)
main()