import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

export class Metadata {
  private constructor() {}

  static async getPDA(mint: PublicKey): Promise<PublicKey> {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      PROGRAM_ID
    );
    return pda;
  }

  static async fromAccountAddress(
    connection: Connection,
    metadataPDA: PublicKey
  ) {
    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo) return null;

    // Skip the first byte (it's a version number)
    let offset = 1;

    // Read update authority (32 bytes)
    offset += 32;

    // Read mint (32 bytes)
    offset += 32;

    // Read name
    const nameLength = accountInfo.data[offset];
    offset += 1;
    const name = accountInfo.data.slice(offset, offset + nameLength).toString();
    offset += nameLength;

    // Read symbol
    const symbolLength = accountInfo.data[offset];
    offset += 1;
    const symbol = accountInfo.data.slice(offset, offset + symbolLength).toString();
    offset += symbolLength;

    // Read uri
    const uriLength = accountInfo.data[offset];
    offset += 1;
    const uri = accountInfo.data.slice(offset, offset + uriLength).toString();

    return {
      data: {
        name,
        symbol,
        uri,
      }
    };
  }
} 