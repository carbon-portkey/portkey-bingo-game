import { ChainId } from '@portkey/types';

const bingoAddress = 'fU9csLqXtnSbcyRJs3fPYLFTz2S9EZowUqkYe4zrJgp1avXK2';
const CHAIN_ID = 'tDVV';
// let bingoAddress = '2CrjkQeeWYTnH9zFHmpuMtxv8ZTBDmHi31zzdo9SUNjmpxJ82T';
// let CHAIN_ID = 'tDVW' as ChainId;
// if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
//   bingoAddress = 'JvDB3rguLJtpFsovre8udJeXJLhsV1EPScGz2u1FFneahjBQm';
//   CHAIN_ID = 'tDVV';
// }

const currentNetworkType = `SideChain ${CHAIN_ID} Testnet`;
const anotherNetworkType = `MainChain AELF`;

export { bingoAddress, CHAIN_ID, currentNetworkType, anotherNetworkType };
