const express = require('express');
const path = require('path');
const { ethers } = require('ethers');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));

const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
const contractAddress = '0x84e22573C287CBC08827d17936A2543c1697896f';
const abi = require('./abi.json');
const contract = new ethers.Contract(contractAddress, abi, provider);
const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/contract-info', async (req, res) => {
  try {
    console.log('Buscando informações do contrato...');
    const name = await contract.name();
    const totalSupply = await contract.totalSupply();
    const totalStaked = await contract.totalStaked();
    console.log('Dados obtidos:', { name, totalSupply: totalSupply.toString(), totalStaked: totalStaked.toString() });
    res.json({ name, totalSupply: totalSupply.toString(), totalStaked: totalStaked.toString() });
  } catch (error) {
    console.error('Erro na rota /contract-info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/abi', (req, res) => {
  res.json(abi);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});