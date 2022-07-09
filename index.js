const https = require('https')
const fs = require('fs/promises')

const coinMarketApiKey = '31b33a04-ddc4-48ae-b764-98e6f4881dcb'
const fixerApiKey = 'nUw77L7amLKzlAKN3UdSNS3TzkoDoFoD'

if (process.argv.length !== 3) return console.error("Usage: node <filename> <R$-value>")

const isNumeric = parseFloat(process.argv.at(-1))

if (!isNumeric) return console.error("Error: value is not numeric")

https.get(
    `https://api.apilayer.com/fixer/convert?to=USD&from=BRL&amount=${isNumeric}`,
    {
        headers: {
            apikey: fixerApiKey
        }
    }, (res) => {
        res.on('data', (data) => {
            https.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1`, {
                headers: {
                    "X-CMC_PRO_API_KEY": coinMarketApiKey
                }
            }, (res) => {
                const cBufferedData = []
                res.on('data', (buffer) => cBufferedData.push(buffer))

                res.on('end', async () => {
                    const {data: {'1': {quote: {USD: {price}}}}} = JSON.parse(cBufferedData.join(""))
                    const {result} = JSON.parse(data)
                    const shares = (result / price).toFixed(11)
                    const dateTime = new Date()
                    const operation = 'buy'

                    try {
                        const fileHandle = await fs.open(`${__dirname}/history.csv`, 'a')
                        await fileHandle.write(Buffer.from(`${operation},${isNumeric},${shares},${dateTime}\n`))
                        await fileHandle.close()
                    } catch (error) {
                        console.error(error)
                    }
                })
            })
        })
    }
).on('error', (err) => console.error(err))