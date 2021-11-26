class BTC {
    constructor() {
        this.name = 'btc'
        this.price = 2
        this.count = 100
        this.marketPrice = 2
        this.marketValue = this.count * this.marketPrice
    }
    加(price, count) {
        this.count += count
        this.update()
        this.marketValue -= price * count
        this.marketPrice = this.marketValue / this.count
    }
    减(price, count) {
        this.count -= count
        this.update()
        this.marketValue += this.price * this.count + price * count
        this.marketPrice = this.marketValue / (this.count + count)
    }
    update() {
        this.marketValue = this.count * this.marketPrice
    }
}

class Man {
    constructor() {
        this.money = { cash: 1000, count: 0 }
        this.tradeLog = []
    }
    buy(target, price, count) {
        if (target.count >= count) {
            this.money.count += count
            this.money.cash -= price * count
            this.tradeLog.push({ type: 'buy', name: target.name, price, count })
            target.减(price, count)
            console.log('购买', this.toString())
            return true
        }
        console.log('购买失败..................')
        return false
    }
    sell(target, price, count) {
        if (this.money.count >= count) {
            this.money.count -= count
            this.money.cash += price * count
            this.tradeLog.push({ type: 'sell', name: target.name, price, count })
            target.加(price, count)
            console.log('卖出', this.toString())
            return true
        }
        console.log('卖出失败..................', price, count)
        return false
    }
    toString() {
        let s = `cash=${this.money.cash}, count=${this.money.count}`
        for (let i = 0; i < this.tradeLog.length; i++) {
            let item = this.tradeLog[i]
            s += `\n${item.type}, ${item.name}, ${item.price}, ${item.count}`
        }
        return s
    }
}



let btc = new BTC()
console.log(btc)

let a = new Man()
a.buy(btc, 3, 50)
// console.log(btc)
a.sell(btc, 2, 50)
console.log(btc)
console.log(a.toString())