const utils99 = require('node-utils99')
const CronJob = require('cron').CronJob
const service = require('./index.js')
const common = require('../../config/common.js')

/**
 秒数：Seconds: 0-59
 分钟：Minutes: 0-59
 小时：Hours: 0-23
 月天：Day of Month: 1-31
 月份：Months: 0-11
 星期几：Day of Week: 0-6
 *    *    *    *    *    *
 ┬    ┬    ┬    ┬    ┬    ┬
 │    │    │    │    │    |
 │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 │    │    │    │    └───── month (1 - 12)
 │    │    │    └────────── day of month (1 - 31)
 │    │    └─────────────── hour (0 - 23)
 │    └──────────────────── minute (0 - 59)
 └───────────────────────── second (0 - 59, OPTIONAL)
 */

// 获取亚洲时间
function getTime() {
    return utils99.Time();
}

// 延迟
async function delay(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            return resolve()
        }, time)
    })
}

// 循环查询用户交易记录
async function loopTradeLog() {
    let res = await service.user.simpleList()
    for (let i = 0; i < res.length; i++) {
        let item = res[i]
        for (let j = 0; j < item.wallet.length; j++) {
            let wallet_item = item.wallet[j]
            if (wallet_item.wallet_type == common.coin.type.USDT_TRC20) {
                console.log('任务调度-------------------->', wallet_item.wallet_address)
                await service.wallet.getInternetTradeLog(wallet_item.wallet_address)
                // 延迟5秒后，查询下个钱包记录。
                await delay(1000 * 5)
            }
        }
    }

    // 上面钱包查询完后，10分钟后，再次查询。
    setTimeout(async function () {
        console.log('轮循结束下一次开始')
        await loopTradeLog()
    }, 1000 * 60 * 10)
}

// 循环查询用户钱包充值记录
setTimeout(() => {
    loopTradeLog()
}, 1000 * 60)

// loopTradeLog()



let job = {
    // 有效 任务
    walletAddress: new CronJob({
        cronTime: '30 * * * * *',
        onTick() {
            // console.log('walletAddress ', getTime());
        }
    }),
}


let __this = {
    list(action) {
        let a = []
        for (let key in job) {
            if ('start' == action) {
                job[key].start()
            }
            else if ('stop' == action) {
                job[key].stop()
            }
            else {
                a.push(key)
            }
        }
        return a
    },
    // 全部开始
    start() {
        console.log('当前任务开始时间', getTime());
        console.log(__this.list());
        __this.list('start');
        return true;
    },
    stop() {
        console.log('当前任务停止时间', getTime());
        __this.list('stop');
        return true;
    },
};

if (require.main === module) {
    console.log(__this.list());
    console.log(__this.start());
}

module.exports = __this;