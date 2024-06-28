import crypto from 'crypto';
import fs from 'fs/promises';

const keyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  }
});

await write('id_rsa_pub.pem', keyPair.publicKey);
await write('id_rsa_priv.pem', keyPair.privateKey);

async function write(fileName, fileContent) {
  // const out_path = new URL(`./examples/${fileName}`, import.meta.url);
  const out_path = new URL(`./${fileName}`, import.meta.url)
  await fs.writeFile(out_path, fileContent);
}

async function read(fileName) {
  // const in_path = new URL(`./examples/${fileName}`, import.meta.url);
  const in_path = new URL(`./${fileName}`, import.meta.url);
  const inRead = await fs.readFile(in_path);
  // const out = JSON.parse(inRead);
  return inRead;
}



