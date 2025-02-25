# VKINHAMEME-Contract
"Contrato ERC-20 VKINHAMEME com funcionalidades de compra, staking e administração."
# Documentação do Contrato `VKINHAMEME` ("VKINHA")



## Visão Geral

O contrato `VKINHAMEME` é um token ERC-20 implantado na BNB Chain Mainnet, projetado para oferecer funcionalidades de compra, transferência, staking e administração, com mecanismos anti-bot e taxas para incentivar o uso legítimo e desmotivar abusos. O token, simbolizado como `VKINHA`, tem um suprimento total máximo de 15 milhões e integra-se a exchanges descentralizadas (DEXs) como PancakeSwap, Biswap, ApeSwap e SushiSwap, com suporte a compras em BNB, BUSD e USDT.



### Características Principais

- **Nome**: VKINHAMEME

- **Símbolo**: VKINHA

- **Decimais**: 18

- **Suprimento Total**: 15.000.000 `VKINHA`

- **Funcionalidades**:

  - Compra de tokens com BNB, BUSD ou USDT via oráculos Chainlink.

  - Taxas progressivas para compras repetitivas e taxas fixas em transferências/vendas.

  - Staking com recompensas baseadas em taxas acumuladas.

  - Administração com controle de pausa, retirada de fundos e configuração de DEX.

- **Proteções Anti-Bot**: Limite de uma compra por bloco e taxa progressiva para compras frequentes.



---



## Estrutura do Contrato



### Heranças

- **`ERC20`**: Implementação padrão de token ERC-20 com funções como `transfer`, `approve` e `transferFrom`.

- **`Ownable`**: Controle de propriedade com dois administradores (`admin1` e `admin2`).

- **`ReentrancyGuard`**: Proteção contra ataques de reentrância em funções como `buyTokens` e `unstakeTokens`.



### Constantes

| Nome                          | Valor                | Descrição                                                                 |

|-------------------------------|----------------------|--------------------------------------------------------------------------|

| `MAX_SUPPLY`                 | 15_000_000 * 10^18  | Suprimento máximo de `VKINHA` (15M).                                     |

| `LOCKED_SUPPLY`              | 2_000_000 * 10^18   | Quantidade inicial bloqueada, desbloqueável após 365 dias.               |

| `ADMIN_SUPPLY`               | 1_500_000 * 10^18   | Quantidade inicial mintada para `admin1`.                                |

| `INITIAL_TOKEN_WALLET_SUPPLY`| 13_500_000 * 10^18  | Quantidade inicial mintada para `tokenWallet`, menos `LOCKED_SUPPLY`.    |

| `MIN_TRANSACTION_AMOUNT`     | 1e15 (0.001 VKINHA) | Valor mínimo para compras e transferências.                              |

| `BASE_BUY_FEE_PERCENTAGE`    | 25 (0.25%)          | Taxa base para compras em `buyTokens`.                                   |

| `EXTRA_FEE_INCREMENT`        | 100 (1%)            | Incremento de taxa por compra extra em 30 minutos.                       |

| `MAX_EXTRA_FEE_PERCENTAGE`   | 2000 (20%)          | Taxa máxima adicional para compras repetitivas.                          |

| `TRANSFER_FEE_PERCENTAGE`    | 300 (3%)            | Taxa fixa para transferências normais.                                   |

| `SELL_FEE_PERCENTAGE`        | 50 (0.5%)           | Taxa adicional para vendas na DEX.                                       |

| `COOLDOWN_WINDOW`            | 30 minutes          | Janela para aplicação da taxa progressiva em compras.                    |

| `RESET_WINDOW`               | 1 hour              | Período para reset da taxa extra após inatividade.                       |



### Endereços Configuráveis

| Nome                | Endereço Mainnet                              | Descrição                                      |

|---------------------|-----------------------------------------------|------------------------------------------------|

| `admin1`            | `0x5B419e1A55e24e91D7016D4313BC5b284382Faf6` | Administrador principal.                      |

| `admin2`            | `0xe93bc1259C7F53aBf2073b0528e6007275D0E507` | Administrador secundário.                     |

| `tokenWallet`       | `0xB9A2eF80914Cb1bDBE93F04C86CBC9a54Eb0d7D2` | Carteira de armazenamento de tokens disponíveis. |

| `dexRouter`         | `0x10ED43C718714eb63d5aA57B78B54704E256024E` | PancakeSwap V2 Router (padrão, configurável). |

| `WBNB`              | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | Wrapped BNB na Mainnet.                       |

| `BUSD`              | `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56` | BUSD na Mainnet.                              |

| `USDT`              | `0x55d398326f99059fF775485246999027B3197955` | USDT na Mainnet.                              |



### Oráculos Chainlink (Mainnet)

| Nome             | Endereço Mainnet                              | Descrição               |

|------------------|-----------------------------------------------|-------------------------|

| `bnbPriceFeed`   | `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE` | Preço BNB/USD.         |

| `busdPriceFeed`  | `0xcBb98864Ef56E9042e7d2efef76141f15731B82f` | Preço BUSD/USD.        |

| `usdtPriceFeed`  | `0xB97Ad0E74fa7d920791E90258A6E2085088b4320` | Preço USDT/USD.        |



---



## Lógica de Taxas



### Taxas na Compra (`buyTokens`)

- **Taxa Base**: 0.25% (`BASE_BUY_FEE_PERCENTAGE`).

- **Taxa Progressiva**:

  - **Condição**: Aplicada a compras adicionais dentro de uma janela de 30 minutos (`COOLDOWN_WINDOW`).

  - **Incremento**: +1% por compra extra (`EXTRA_FEE_INCREMENT`), até um máximo de 20% (`MAX_EXTRA_FEE_PERCENTAGE`).

  - **Reset**: Após 1 hora sem compras (`RESET_WINDOW`), a taxa extra é zerada, voltando a 0.25%.

- **Cálculo**:

  ```solidity

  uint256 extraFee = purchaseCountInWindow[msg.sender] > 1 ? (purchaseCountInWindow[msg.sender] - 1) * EXTRA_FEE_INCREMENT : 0;

  uint256 totalFeePercentage = BASE_BUY_FEE_PERCENTAGE + (extraFee > MAX_EXTRA_FEE_PERCENTAGE ? MAX_EXTRA_FEE_PERCENTAGE : extraFee);

  uint256 buyFee = (amount * totalFeePercentage) / 10000;

  uint256 amountAfterFee = amount - buyFee;

  ```

- **Destino**: `buyFee` é transferido para a `tokenWallet` e somado ao `accumulatedFeePool`.



#### Diagrama de Fluxo: Taxa na Compra

```

Início

  ↓

Verifica block.number > lastPurchaseBlock[msg.sender] (Anti-bot por bloco)

  ↓

Atualiza lastPurchaseBlock[msg.sender] = block.number

  ↓

Verifica block.timestamp >= lastPurchaseTime + RESET_WINDOW? → Sim → purchaseCountInWindow = 0

  ↓                                              Não

Verifica block.timestamp < lastPurchaseTime + COOLDOWN_WINDOW? → Sim → purchaseCountInWindow += 1

  ↓                                              Não → purchaseCountInWindow = 1

Atualiza lastPurchaseTime[msg.sender] = block.timestamp

  ↓

Calcula extraFee = (purchaseCountInWindow > 1) ? (purchaseCountInWindow - 1) * 1% : 0

  ↓

totalFeePercentage = 0.25% + min(extraFee, 20%)

  ↓

buyFee = amount * totalFeePercentage / 10000

  ↓

amountAfterFee = amount - buyFee

  ↓

Transferência: tokenWallet → msg.sender (amountAfterFee)

  ↓

Fee: tokenWallet → tokenWallet (buyFee)

  ↓

Fim

```



### Taxas na Transferência (`transfer`)

- **Taxa de Transferência**: 3% (`TRANSFER_FEE_PERCENTAGE`) em todas as transferências.

- **Taxa de Venda**: 0.5% (`SELL_FEE_PERCENTAGE`) adicional apenas quando o destinatário é o `dexRouter` (venda na DEX).

- **Cálculo**:

  ```solidity

  uint256 transferFee = (amount * TRANSFER_FEE_PERCENTAGE) / 10000;

  uint256 sellFee = (to == dexRouter) ? (amount * SELL_FEE_PERCENTAGE) / 10000 : 0;

  uint256 totalFee = transferFee + sellFee;

  uint256 amountAfterFee = amount - totalFee;

  ```

- **Destino**: `totalFee` é transferido para a `tokenWallet` e somado ao `accumulatedFeePool`.



#### Diagrama de Fluxo: Taxa na Transferência

```

Início

  ↓

Verifica amount >= MIN_TRANSACTION_AMOUNT (0.001 VKINHA)

  ↓

Calcula transferFee = amount * 3% / 10000

  ↓

Verifica to == dexRouter? → Sim → sellFee = amount * 0.5% / 10000

  ↓                       Não → sellFee = 0

totalFee = transferFee + sellFee

  ↓

amountAfterFee = amount - totalFee

  ↓

Transferência: owner → to (amountAfterFee)

  ↓

Fee: owner → tokenWallet (totalFee)

  ↓

Fim

```



---



## Lógica de Recompensas



### Staking (`stakeTokens`)

- **Funcionamento**: Usuários fazem stake de `VKINHA` por um período (`durationInDays`), com metade do valor usado para adicionar liquidez na DEX escolhida.

- **Recompensas**: Calculadas em `calculateRewards` com base em:

  - **Taxa Base**: 0.002% por dia (`BASE_REWARD_RATE`) sobre o valor em stake.

  - **Taxa Extra**: 0.001% por dia por cada 1000 `VKINHA` acima de 0.01 (`EXTRA_REWARD_RATE`), até 0.1% máximo (`MAX_REWARD_RATE`).

  - **Fee Pool**: 0.002% por dia (`FEE_POOL_REWARD_RATE`) do `accumulatedFeePool`, proporcional ao stake do usuário.

- **Cálculo**:

  ```solidity

  uint256 baseReward = (staker.amount * BASE_REWARD_RATE * timeElapsed) / (10000 * 1 days);

  uint256 extraReward = (extraTokens / (1000 * 1e18)) * EXTRA_REWARD_RATE * timeElapsed / (10000 * 1 days);

  uint256 fixedReward = baseReward + extraReward > maxReward ? maxReward : baseReward + extraReward;

  uint256 feePoolReward = (feePoolDelta * FEE_POOL_REWARD_RATE * timeElapsed) / (10000 * 1 days);

  uint256 proportionalReward = totalStaked > 0 ? (staker.amount * feePoolReward) / totalStaked : 0;

  return staker.accumulatedRewards + fixedReward + proportionalReward;

  ```

- **Pagamento**: Recompensas são transferidas da `tokenWallet` ao chamar `claimRewards`.



#### Diagrama de Fluxo: Recompensas de Staking

```

Início

  ↓

Verifica staker.amount > 0 e staker.owner == stakerAddress

  ↓

Calcula timeElapsed = block.timestamp - lastRewardTime

  ↓

baseReward = amount * 0.002% * timeElapsed / (10000 * 1 days)

  ↓

extraTokens = amount > 0.01 ? amount - 0.01 : 0

  ↓

extraReward = (extraTokens / 1000) * 0.001% * timeElapsed / (10000 * 1 days)

  ↓

fixedReward = min(baseReward + extraReward, amount * 0.1% * timeElapsed / (10000 * 1 days))

  ↓

feePoolDelta = accumulatedFeePool - lastFeePoolSnapshot

  ↓

feePoolReward = feePoolDelta * 0.002% * timeElapsed / (10000 * 1 days)

  ↓

proportionalReward = totalStaked > 0 ? (amount * feePoolReward) / totalStaked : 0

  ↓

Retorna accumulatedRewards + fixedReward + proportionalReward

  ↓

Fim

```



---



## Funcionalidades Administrativas



### Administradores

- **`admin1`**: Proprietário inicial, com permissão para todas as funções administrativas.

- **`admin2`**: Administrador secundário, com permissão para funções específicas (ex.: `replaceAdmin1`, `confirmUpgrade`).



### Funções Principais

1. **`replaceAdmin1(address newAdmin1)`**:

   - **Permissão**: Apenas `admin2`.

   - **Descrição**: Substitui `admin1` por um novo endereço.

2. **`replaceTokenWallet(address newTokenWallet)`**:

   - **Permissão**: Apenas `admin2`.

   - **Descrição**: Substitui a `tokenWallet`, exigindo que a atual esteja vazia ou a nova seja vazia.

3. **`withdrawFunds(uint256 amount)`**:

   - **Permissão**: `admin1` ou `admin2`.

   - **Descrição**: Retira `amount` de `VKINHA` da `tokenWallet`.

4. **`setDexRouter(address newRouter)`**:

   - **Permissão**: `admin1` ou `admin2`.

   - **Descrição**: Configura o roteador DEX (ex.: PancakeSwap, Biswap).

5. **`pause()` e `unpause()`**:

   - **Permissão**: `admin1` ou `admin2`.

   - **Descrição**: Pausa ou retoma operações do contrato.

6. **`unlockTokens()`**:

   - **Permissão**: `admin1` ou `admin2`.

   - **Descrição**: Desbloqueia `LOCKED_SUPPLY` após 365 dias.



---



## Exemplos de Interação



### Usando Remix

1. **Comprar `VKINHA` com BNB**:

   - **Função**: `buyTokens(uint256 amount, address paymentToken)`

   - **Parâmetros**:

     - `amount`: `1000000000000000` (0.001 `VKINHA`).

     - `paymentToken`: `"0x0000000000000000000000000000000000000000"`.

     - "Value": `1000000000000000` (0.001 BNB).

   - **Passos**:

     - Conecte ao Remix com MetaMask (Mainnet).

     - Implante o contrato e chame `buyTokens`.

     - Confirme a transação.



2. **Transferir `VKINHA`**:

   - **Função**: `transfer(address to, uint256 amount)`

   - **Parâmetros**:

     - `to`: `"0xOutroEndereço"`.

     - `amount`: `1000000000000000` (0.001 `VKINHA`).

   - **Passos**:

     - Chame `transfer` no Remix e confirme.



### Usando Web3.js

```javascript

const Web3 = require('web3');

const web3 = new Web3('https://bsc-dataseed.binance.org/');

const contractABI = [/* ABI do contrato */];

const contractAddress = '0xContrato';

const contract = new web3.eth.Contract(contractABI, contractAddress);



async function buyTokens(account, amount) {

    const tx = await contract.methods.buyTokens(amount, "0x0000000000000000000000000000000000000000")

        .send({ from: account, value: web3.utils.toWei('0.001', 'ether') });

    console.log('Compra concluída:', tx.transactionHash);

}



buyTokens('0xSeuEndereço', '1000000000000000');

```



---



## Considerações de Segurança



### Vetores de Ataque e Mitigações

1. **Reentrância**:

   - **Risco**: Um contrato malicioso pode chamar `buyTokens` ou `unstakeTokens` repetidamente.

   - **Mitigação**: Uso do modificador `nonReentrant` em funções críticas.

2. **Frontrunning**:

   - **Risco**: Bots compram antes de usuários legítimos no mesmo bloco.

   - **Mitigação**: Limite de uma compra por bloco (`lastPurchaseBlock`).

3. **Spam de Transações**:

   - **Risco**: Bots inundam o contrato com compras pequenas.

   - **Mitigação**: Taxa progressiva (até 20.25%) para compras frequentes.

4. **Manipulação de Oráculo**:

   - **Risco**: Preços manipulados nos oráculos Chainlink.

   - **Mitigação**: Uso de oráculos confiáveis e fallback para preço fixo (0.01 USD) se falhar.

5. **Acesso Administrativo**:

   - **Risco**: `admin1` ou `admin2` abusam de poderes (ex.: `withdrawFunds`).

   - **Mitigação**: Dois administradores com permissões separadas; auditoria recomendada.



### Recomendações

- Audite o contrato com ferramentas como MythX ou Slither antes da implantação.

- Teste exaustivamente na Testnet para validar anti-bot e taxas.



---



## Testes



### Estratégia de Teste

- **Funcionalidades**: Testar `buyTokens`, `transfer`, `stakeTokens`, `unstakeTokens`, `claimRewards`.

- **Anti-Bot**: Simular compras repetitivas para validar taxa progressiva e limite por bloco.

- **Recompensas**: Verificar cálculo em diferentes cenários de staking.

- **Administração**: Testar `withdrawFunds`, `pause`, `setDexRouter`.



### Ferramentas Recomendadas

1. **Hardhat**:

   - **Configuração**:

     ```javascript

     const { ethers } = require("hardhat");



     async function main() {

         const VKINHAMEME = await ethers.getContractFactory("VKINHAMEME");

         const vkinha = await VKINHAMEME.deploy();

         await vkinha.deployed();

         console.log("Contract deployed to:", vkinha.address);

     }

     ```

   - **Testes**:

     ```javascript

     it("should apply progressive buy fee", async function () {

         const [owner] = await ethers.getSigners();

         await vkinha.buyTokens(ethers.utils.parseEther("0.001"), "0x0", { value: ethers.utils.parseEther("0.001") });

         await vkinha.buyTokens(ethers.utils.parseEther("0.001"), "0x0", { value: ethers.utils.parseEther("0.001") });

         // Verificar taxa > 0.25%

     });

     ```

2. **Foundry**:

   - **Setup**: Use `forge init` e adicione o contrato.

   - **Teste**: Escreva em Solidity para simular interações.



### Passos

- Implante na Testnet (Chain ID: 97).

- Use Remix ou scripts para executar cenários de teste.



---



## Otimização de Gás



### Otimizações Atuais

- Uso de `unchecked` em operações seguras (ex.: subtrações em `_transferWithoutFee`).

- Armazenamento eficiente de variáveis como `lastPurchaseBlock`.



### Possíveis Melhorias

1. **Reduzir Operações de Storage**:

   - **Problema**: Mapeamentos como `lastPurchaseTime` e `purchaseCountInWindow` custam gás em cada escrita.

   - **Solução**: Combinar em uma estrutura (`struct PurchaseInfo`) para reduzir acessos:

     ```solidity

     struct PurchaseInfo {

         uint256 lastBlock;

         uint256 lastTime;

         uint256 countInWindow;

     }

     mapping(address => PurchaseInfo) public purchaseData;

     ```

2. **Cache de Variáveis**:

   - **Problema**: Leituras repetidas de `tokenWallet` ou `dexRouter`.

   - **Solução**: Armazenar em variáveis locais em `buyTokens` e `transfer`.

3. **Remover Verificações Redundantes**:

   - **Problema**: `require` em `_transfer` já verifica saldo, duplicado em `transfer`.

   - **Solução**: Remover redundâncias onde possível.



### Impacto

- Redução estimada: 5-10% no custo de gás por transação.



---
