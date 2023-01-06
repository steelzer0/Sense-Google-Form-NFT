const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const fs = require('fs');
const web3API = require('web3');

const url = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScRluIGIWGsG-YPz5fmrZ4y7Dl-RTl9AhOUf2vyNuqlc46Jww/formResponse';
const selectors = require('./selectors.js');
const colors = require('colors');

async function clicker() {
    for (let i = 0; i < selectors.selectors.length; i++)
        await global.page.click(selectors.selectors[i]);
}

async function walletInput() {
    const web3 = new web3API(new web3API.providers.HttpProvider('https://mainnet.infura.io'));
    let account = await web3.eth.accounts.create(web3.utils.randomHex(32));
    let wallet = await web3.eth.accounts.wallet.add(account);
    let keystore = await wallet.encrypt(web3.utils.randomHex(32));

    let credentials = {
        address: account.address,
        privateKey: account.privateKey
    }

    await global.page.type(selectors.wallet_selector, credentials.address);

    return credentials;
}

async function mailInput(mail) {
    await global.page.type(selectors.mail_selector, mail);
}

async function main() {
    puppeteer.use(StealthPlugin());

    let attempts = Number(process.argv[2]);

    let walletInfo;
    let mailArray = [];

    fs.readFile('./mails.txt', 'utf-8', (err, file) => {
        const lines = file.split('\n');

        for (let line of lines) {
            if (line.indexOf(':') > -1) {
                line = line.split(':');
                mailArray.push(line[0]);
            }
            else
                mailArray.push(line);
        }
    });

    for (let i = 0; i < attempts; i++) {
        global.browser = await puppeteer.launch({ headless: true, executablePath: executablePath() });
        global.page = await global.browser.newPage();

        await global.page.goto(url);
        await clicker();
        walletInfo = await walletInput();
        await mailInput(mailArray[i]);

        await global.page.click('#mG61Hd > div.RH5hzf.RLS9Fe > div > div.ThHDze > div.DE3NNc.CekdCb > div.lRwqcd > div > span > span');
        console.log(`${i + 1} `.green + `${walletInfo.address} : ${walletInfo.privateKey} : ${mailArray[i]}`);
        await global.browser.close();

        await fs.writeFile('./accounts.txt', `${walletInfo.address}:${walletInfo.privateKey}:${mailArray[i]}\n`, { flag: 'a+' }, (err) => {
        });
    }
}

main();