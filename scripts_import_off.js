/**
 * import_off.js
 * - Lê CSV (sku,barcode,name,brand,category,unit,quantity,price,image_url)
 * - Para cada linha: consulta Open Food Facts e atualiza produtos_base no Firestore
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat serviceAccount.json)" node import_off.js produtos.csv
 *
 * Requisitos:
 *   npm i axios csv-parse firebase-admin p-limit
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import pLimit from 'p-limit';
import admin from 'firebase-admin';

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Use: node import_off.js produtos.csv');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
if (!serviceAccount.project_id) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON not set or invalid.');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const csvText = fs.readFileSync(INPUT, 'utf8');
const rows = parse(csvText, { columns: true, skip_empty_lines: true });

const limit = pLimit(3);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchOFF(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
    const res = await axios.get(url, { timeout: 15000 });
    if (res.data && res.data.status === 1) return res.data.product;
    return null;
  } catch (err) {
    console.error('OFF fetch error', barcode, err.message);
    return null;
  }
}

async function processRow(row, index) {
  const {
    sku, barcode, name: csvName, brand: csvBrand, category: csvCategory,
    unit: csvUnit, quantity: csvQty, price: csvPrice, image_url: csvImage
  } = row;

  const docId = barcode && barcode.trim() ? barcode.trim() : (sku || `sku_${index}`);
  let productData = {
    sku: sku || null,
    barcode: barcode || null,
    name: csvName || null,
    brand: csvBrand || null,
    category: csvCategory || null,
    unit: csvUnit || null,
    quantity: csvQty ? Number(csvQty) : null,
    image_url: csvImage || null,
    source: 'csv',
    to_review: false,
    last_synced: admin.firestore.FieldValue.serverTimestamp()
  };

  if (barcode && barcode.trim()) {
    const off = await fetchOFF(barcode.trim());
    if (off) {
      const offName = off.product_name || off.generic_name || null;
      const offBrand = off.brands || (off.brands_tags && off.brands_tags[0]) || null;
      const offImage = (off.images && off.images.small && Object.values(off.images.small)[0]) || off.image_url || null;
      const offCategory = off.categories || (off.categories_tags && off.categories_tags[0]) || null;

      productData = {
        ...productData,
        name: productData.name || offName,
        brand: productData.brand || offBrand,
        category: productData.category || offCategory,
        image_url: productData.image_url || offImage,
        source: 'openfoodfacts'
      };
    } else {
      productData.to_review = true;
    }
    await sleep(400);
  } else {
    productData.to_review = true;
  }

  const ref = db.collection('produtos_base').doc(docId.toString());
  await ref.set(productData, { merge: true });
  return { docId, status: productData.to_review ? 'to_review' : 'ok' };
}

(async () => {
  const results = [];
  await Promise.all(rows.map((r, i) => limit(() => processRow(r, i).then(res => results.push(res)))));
  console.log('Processamento finalizado', results.length);
  fs.writeFileSync('import_log.json', JSON.stringify(results, null,2));
  process.exit(0);
})();
