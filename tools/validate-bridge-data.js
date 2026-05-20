const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'njstructures.json');
const indexPath = path.join(root, 'data', 'bridges', 'index.json');
const chunkRoot = path.join(root, 'data', 'bridges', 'chunks', 'by-county');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function recordsFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.records)) return payload.records;
  return [];
}

function relFromRoot(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function main() {
  const sourcePayload = readJson(sourcePath);
  const indexPayload = readJson(indexPath);
  const sourceRecords = recordsFrom(sourcePayload);
  const indexRecords = recordsFrom(indexPayload);
  const sourceNums = new Set();
  const indexNums = new Set();
  const duplicateSource = [];
  const duplicateIndex = [];
  const missingLatLng = [];
  const missingCounty = [];
  const missingLength = [];
  const missingInIndex = [];
  const missingChunkPaths = [];
  const missingInChunks = [];
  let totalChunkRecords = 0;

  sourceRecords.forEach((record) => {
    const num = String(record.Structure_Number || '').trim();
    if (!num) return;
    if (sourceNums.has(num)) duplicateSource.push(num);
    sourceNums.add(num);
  });

  const chunkLookup = new Map();
  const chunkFiles = fs.existsSync(chunkRoot)
    ? fs.readdirSync(chunkRoot).filter((name) => name.toLowerCase().endsWith('.json'))
    : [];

  chunkFiles.forEach((name) => {
    const filePath = path.join(chunkRoot, name);
    const records = recordsFrom(readJson(filePath));
    totalChunkRecords += records.length;
    records.forEach((record) => {
      const num = String(record.Structure_Number || '').trim();
      if (num) chunkLookup.set(num, relFromRoot(filePath));
    });
  });

  indexRecords.forEach((record) => {
    const num = String(record.Structure_Number || '').trim();
    if (!num) return;
    if (indexNums.has(num)) duplicateIndex.push(num);
    indexNums.add(num);

    if (isBlank(record.Latitude) || isBlank(record.Longitude)) missingLatLng.push(num);
    if (isBlank(record.County) && isBlank(record.County_Code) && isBlank(record.countyCode)) missingCounty.push(num);
    if (isBlank(record['Structure_Length_(ft)'])) missingLength.push(num);

    if (record.chunkPath) {
      const chunkAbs = path.resolve(root, 'pages', record.chunkPath);
      if (!fs.existsSync(chunkAbs)) missingChunkPaths.push(`${num} -> ${record.chunkPath}`);
    } else {
      missingChunkPaths.push(`${num} -> missing chunkPath`);
    }

    if (!chunkLookup.has(num)) missingInChunks.push(num);
  });

  sourceNums.forEach((num) => {
    if (!indexNums.has(num)) missingInIndex.push(num);
  });

  const errors = [];
  if (sourceRecords.length !== indexRecords.length) errors.push(`source count ${sourceRecords.length} != index count ${indexRecords.length}`);
  if (sourceRecords.length !== totalChunkRecords) errors.push(`source count ${sourceRecords.length} != chunk total ${totalChunkRecords}`);
  if (missingInIndex.length) errors.push(`${missingInIndex.length} source Structure_Number values missing from index`);
  if (missingChunkPaths.length) errors.push(`${missingChunkPaths.length} index chunkPath values missing or invalid`);
  if (missingInChunks.length) errors.push(`${missingInChunks.length} index Structure_Number values missing from county chunks`);
  if (duplicateSource.length) errors.push(`${duplicateSource.length} duplicate raw Structure_Number values in source`);
  if (duplicateIndex.length) errors.push(`${duplicateIndex.length} duplicate raw Structure_Number values in index`);

  console.log('Bridge data validation');
  console.log(`Source records: ${sourceRecords.length}`);
  console.log(`Index records: ${indexRecords.length}`);
  console.log(`County chunks: ${chunkFiles.length}`);
  console.log(`Chunk records total: ${totalChunkRecords}`);
  console.log(`Missing lat/lng: ${missingLatLng.length}`);
  console.log(`Missing county: ${missingCounty.length}`);
  console.log(`Missing structure length: ${missingLength.length}`);
  console.log(`Duplicate source Structure_Number: ${duplicateSource.length}`);
  console.log(`Duplicate index Structure_Number: ${duplicateIndex.length}`);

  if (missingLatLng.length) console.log(`Missing lat/lng examples: ${missingLatLng.slice(0, 10).join(', ')}`);
  if (missingCounty.length) console.log(`Missing county examples: ${missingCounty.slice(0, 10).join(', ')}`);
  if (missingLength.length) console.log(`Missing structure length examples: ${missingLength.slice(0, 10).join(', ')}`);
  if (duplicateSource.length) console.log(`Duplicate source examples: ${duplicateSource.slice(0, 10).join(', ')}`);
  if (duplicateIndex.length) console.log(`Duplicate index examples: ${duplicateIndex.slice(0, 10).join(', ')}`);

  if (errors.length) {
    console.error('Validation failed:');
    errors.forEach((msg) => console.error(`- ${msg}`));
    process.exit(1);
  }

  console.log('Validation passed.');
}

main();
