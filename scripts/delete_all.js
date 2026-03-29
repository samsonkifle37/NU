require('dotenv').config();
const { Client } = require('pg');

async function main() {
    console.log("Connecting securely to " + process.env.DATABASE_URL);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    console.log("Deleting Places...");
    await client.query('DELETE FROM "Review";').catch(() => console.log('no reviews'));
    await client.query('DELETE FROM "PlaceImage";').catch(() => console.log('no images'));
    await client.query('DELETE FROM "Favorite";').catch(() => console.log('no favorites'));
    await client.query('DELETE FROM "Place";');

    console.log("Deleting IngestionListing...");
    await client.query('DELETE FROM "IngestionListing";');

    console.log("Successfully wiped data.");
    await client.end();
}

main().catch(console.error);
