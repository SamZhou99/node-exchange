const ccxt = require('ccxt');

// (async () => {
//     let kraken = new ccxt.kraken ({ verbose: true }) // log HTTP requests
//     await kraken.load_markets () // request markets
//     console.log (kraken.id, kraken.markets)    // output a full list of all loaded markets
//     console.log (Object.keys (kraken.markets)) // output a short list of market symbols
//     console.log (kraken.markets['BTC/USD'])    // output single market details
//     await kraken.load_markets () // return a locally cached version, no reload
//     let reloadedMarkets = await kraken.load_markets (true) // force HTTP reload = true
//     console.log (reloadedMarkets['ETH/BTC'])
// }) ()

(async () => {
    let exchange = new ccxt.binance()
    let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    console.log(exchange.has.fetchOHLCV)
    if (exchange.has.fetchOHLCV) {
        console.log(exchange.markets)
        for (symbol in exchange.markets) {
            await sleep(exchange.rateLimit) // milliseconds
            console.log(await exchange.fetchOHLCV(symbol, '1m')) // one minute
        }
    }
})()
