import "dotenv/config"
import { createWalletClient, http } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const account = mnemonicToAccount('test test test test test test test test test test test junk') 

const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  })

  
