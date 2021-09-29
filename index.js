const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
const fs = require("fs");
const csvjson = require('csvjson');


const PORT = 8000;
const app = express();
const TargetURL = "https://store.steampowered.com/specials#p=0&tab=TopSellers";

app.listen(PORT, () => console.log("Server running on PORT : " + PORT));

function currentDateOfCheck() {
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let FullDate = date + "/" + month + "/" + year;
    return FullDate;
}

function currentTimeOfCheck() {
    let ts = Date.now();
    let date_ob = new Date(ts);
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let FullTime = `${hours}:${minutes}:${seconds}`;
    return FullTime;
}

function convertJSONToCSV() {
    const readFile = fs.readFile;
    const writeFile = fs.writeFile;
    // Reading json file(filename -data.json)
    readFile('./result.json', 'utf-8', (err, fileContent) => {
        if (err) {
            console.log(err);
            throw new Error(err);
        }
        // Convert json to csv function
        const csvData = csvjson.toCSV(fileContent, {
            headers: 'key'
        });
        // Write data into csv file 
        writeFile('./result.csv', csvData, (err) => {
            if (err) {
                console.log(err);
                throw new Error(err);
            }
            console.log('Data stored into csv file successfully');
        });
    });
}
async function ScrapeData() {
    try {
        const response = await axios.get(TargetURL);
        const htmlOfThePage = response.data;
        //console.log(htmlOfThePage);
        const $ = cheerio.load(htmlOfThePage);
        const ArrayOfResult = []
            // $(this) ne marche pas avec une arrow function donc c'est mieux de faire la déclaration normale d'une fonction
        $('.tab_item', htmlOfThePage).each(function() {
            let ShortTheUrl;
            const itemExtracted = {
                name: '',
                originalPrice: '',
                discount: '',
                finalPrice: '',
                linkForBuying: '',
                date: '',
                time: ''
            }
            itemExtracted.name = $(this).find('.tab_item_name').text();
            itemExtracted.originalPrice = $(this).find('.discount_original_price').text();
            itemExtracted.discount = $(this).find('.discount_pct').text();
            itemExtracted.finalPrice = $(this).find('.discount_final_price').text();
            ShortTheUrl = $(this).attr('href').split('?')[0];
            itemExtracted.linkForBuying = ShortTheUrl;
            itemExtracted.date = currentDateOfCheck();
            itemExtracted.time = currentTimeOfCheck();

            ArrayOfResult.push(itemExtracted);

        });
        console.dir(ArrayOfResult, { maxArrayLength: null });
        // exporter le resultat sous format fichier json
        fs.writeFile("result.json", JSON.stringify(ArrayOfResult, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Successfully written data to file");
        });
        convertJSONToCSV();
    } catch (error) {
        console.log(error);
    }
}
setInterval(() => ScrapeData(), 2000); // rexecute the script every 2 s