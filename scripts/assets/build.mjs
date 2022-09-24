import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

const METADATA_URL = "https://raw.githubusercontent.com/DevAndromeda/canvacord/assets/datasrc.json";
const ASSETS_DIR = "CANVACORD_ASSETS" in process.env ? process.env.CANVACORD_ASSETS : `${dirname(fileURLToPath(import.meta.url))}/../../assets`;

export async function build(force = false) {
    if (!fs.existsSync(ASSETS_DIR)) await fs.promises.mkdir(ASSETS_DIR, { recursive: true });
    if (!fs.existsSync(`${ASSETS_DIR}/fonts`)) await fs.promises.mkdir(`${ASSETS_DIR}/fonts`, { recursive: true });
    if (!fs.existsSync(`${ASSETS_DIR}/images`)) await fs.promises.mkdir(`${ASSETS_DIR}/images`, { recursive: true });

    if (force) console.log(`${chalk.yellowBright("[Canvacord]")} ${chalk.whiteBright("Rebuilding forcefully as --force was supplied!")}`);

    if (fs.existsSync(`${ASSETS_DIR}/meta.json`) && !force) {
        console.log(`${chalk.greenBright("[Canvacord]")} ${chalk.whiteBright(`Assets installation skipped since metadata is already available!`)}`);
        process.exit();
    }

    console.log(`${chalk.yellowBright("[Canvacord]")} ${chalk.whiteBright("Downloading assets...")}`);

    const dataJson = await fetch(METADATA_URL, { method: "GET" }).then((res) => res.json()).then(data => { return data; });
    if (!dataJson) {
        console.log(`${chalk.redBright("[Canvacord]")} ${chalk.whiteBright(`Failed assets installation!`)}`);
    } else {
        await fs.promises.writeFile(`${ASSETS_DIR}/meta.json`, JSON.stringify(dataJson));
        console.log(`${chalk.greenBright("[Canvacord]")} ${chalk.whiteBright(`Successfully downloaded metadata!`)}`);
        let parsedData = JSON.parse(JSON.stringify(dataJson));
        console.log(`${chalk.yellowBright("[Canvacord]")} ${chalk.whiteBright("Downloading images...")}`);
        for (const image of parsedData.data.images) {
            await Promise.resolve(
                downloadAsset(image.url, image.name, true)
            );
        }
        console.log(`${chalk.yellowBright("[Canvacord]")} ${chalk.whiteBright("Downloading fonts...")}`);
        for (const font of parsedData.data.fonts) {
            await Promise.resolve(
                downloadAsset(font.url, font.name, false)
            );
        }

        async function downloadAsset(url, name, image) {
            const stream = await fetch(url).then(res => {
                if (!res.ok || !res.body) throw new Error(`[HTTP${res.status}] Could not download ${url}!`);
                return res.body;
            });

            const writer = stream.pipe(fs.createWriteStream(`${ASSETS_DIR}/${image ? "images" : "fonts"}/${name}`));

            writer.on("finish", () => {
                console.log(`${chalk.greenBright("[Canvacord]")} ${chalk.whiteBright(`Successfully downloaded ${chalk.cyanBright(name)}`)}`);
            });
        }
    }
}