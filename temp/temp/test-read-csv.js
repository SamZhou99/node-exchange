const { create } = require('domain')
const fs = require('fs')
const utils99 = require('node-utils99')
const db_config = require('../config/db.js')
const csv_path = './Bitpie_USDT-TRC20_addresses_202111142214.csv'

const db = new utils99.mysqlSync(db_config.mysql)

function isNumber(anything) {
    let n = parseInt(anything)
    return !isNaN(n)
}

async function init() {
    let res = fs.readFileSync(csv_path)
    let csv_str = res.toString()
    let a = csv_str.split('\n')
    for (let i = 0; i < a.length; i++) {
        let item = a[i].split(',')
        if (!isNumber(item[0])) {
            continue
        }

        let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=? LIMIT 1', [item[1]])
        if (res.length > 0) {
            continue
        }

        let upload_user_id = 1
        let wallet_address = item[1]
        let create_datetime = utils99.Time()
        console.log(wallet_address)
        await db.Query(`INSERT INTO system_wallet (upload_user_id,wallet_address,create_datetime) VALUES (?,?,?)`, [
            upload_user_id,
            wallet_address,
            create_datetime
        ])
    }
    console.log('over')
}

init()