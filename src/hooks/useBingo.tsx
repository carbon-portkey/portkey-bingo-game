import { useEffect, useRef, useState } from 'react';
import { DIDWalletInfo, did } from '@portkey/did-ui-react';
import { ChainInfo } from '@portkey/services';
import { getContractBasic, ContractBasic } from '@portkey/contracts';
import { message } from 'antd';

import AElf from 'aelf-sdk';
import { clearMyInterval, randomNum, setMyInterval, shrinkSendQrData, transaction } from '../utils/common';

import { useDelay } from './useDelay';

import { bingoAddress, CHAIN_ID, isTestNet } from '../constants/network';

import useIntervalAsync from './useIntervalTool';
import { INITIAL_INPUT_VALUE, MAX_BET_VALUE, MIN_BET_VALUE } from '../constants/global';
import { ExtraDataMode } from '../page-components/Loading';

export enum StepStatus {
  INIT,
  LOCK,
  LOGIN,
  PLAY,
  RAMDOM,
  CUTDOWN,
  BINGO,
  END,
}

export enum ButtonType {
  BLUE,
  ORIANGE,
}

export enum BetType {
  SMALL,
  BIG,
}

export const KEY_NAME = 'BINGO_GAME';
const COUNT = 5;
const RAMDOM_COUNT = 1;
const RAMDOM_TIME = 6;

const useBingo = () => {
  const [step, setStep] = useState<StepStatus>(StepStatus.INIT);
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [isWin, setIsWin] = useState<boolean>(false);
  const [enablePlay, setEnablePlay] = useState<boolean>(false);

  const [balanceValue, setBalanceValue] = useState<string>('0');
  const [anotherBalanceValue, setAnoterhBalanceValue] = useState<string>('0');

  const [difference, setDifference] = useState<number>(0);
  const [result, setResult] = useState<number>(Infinity);
  const [hasFinishBet, setHasFinishBet] = useState<boolean>(false);
  const [random, setRandom] = useState<number>(randomNum());

  const [loading, setLoading] = useState<boolean>(false);
  const [caAddress, setCaAddress] = useState<string>('');
  const [time, setTime] = useState(COUNT);
  // const [isTest, setIsTest] = useState<boolean>(true);
  const [loadingExtraDataMode, setLoadingExtraDataMode] = useState<ExtraDataMode>(ExtraDataMode.NONE);
  const isMainChain = useRef<boolean>(false);

  const walletRef = useRef<
    DIDWalletInfo & {
      registered?: boolean;
      approved?: boolean;
    }
  >();

  const chainInfoRef = useRef<ChainInfo>();
  const chainsInfoRef = useRef<ChainInfo[]>([]);

  const caContractRef = useRef<ContractBasic>();
  const multiTokenContractRef = useRef<ContractBasic>();
  const anotherMultiTokenContractRef = useRef<ContractBasic>();

  const aelfRef = useRef<any>();
  const txIdRef = useRef<string>('');
  const tokenContractAddressRef = useRef<string>('');
  const balanceInputValueRef = useRef<string>(INITIAL_INPUT_VALUE);
  const requestTimeRef = useRef<number>(0);
  const ToastRef = useRef<{ error: (mes: string) => void }>(null);

  const accountAddress = `ELF_${caAddress}_${chainInfoRef.current?.chainId}`;

  // useEffect(() => {
  //   setIsTest(document.location.href?.lastIndexOf?.('bingogame.portkey.finance') === -1);
  // }, []);
  const options = {
    timer: null,
    callback: () => {
      setRandom(randomNum());
    },
    timeout: RAMDOM_COUNT * 1000,
  };

  /**
   *  logic function
   */
  const delay = useDelay();

  const init = async () => {
    const chainsInfo = await did.services.getChainsInfo();
    chainsInfoRef.current = chainsInfo;
    const chainInfo = chainsInfo.find((chain) => chain.chainId === CHAIN_ID);
    if (!chainInfo) {
      showError('chain is not running');
      return;
    }
    chainInfoRef.current = chainInfo;
    const aelf = new AElf(new AElf.providers.HttpProvider(chainInfo.endPoint));
    aelfRef.current = aelf;
    if (!aelf.isConnected()) {
      showError('Blockchain Node is not running.');
      return;
    }
  };

  const login = async (wallet) => {
    setLoading(true);
    if (wallet.chainId !== CHAIN_ID) {
      const caInfo = await did.didWallet.getHolderInfoByContract({
        caHash: wallet.caInfo.caHash,
        chainId: CHAIN_ID,
      });
      wallet.caInfo = {
        caAddress: caInfo.caAddress,
        caHash: caInfo.caHash,
      };
    }
    setWallet(wallet);
    did.save(wallet.pin, KEY_NAME);
    isMainChain.current = wallet.chainId !== CHAIN_ID;
    return true;
  };

  const getBalance = async () => {
    getCurrentChainBalance();
    // getAnotherChainBalance();
  };

  const getCurrentChainBalance = async () => {
    const multiTokenContract = multiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return 0;

    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });

    requestTimeRef.current = Date.now();
    const balance = result?.data?.balance / 10 ** 8;
    const differenceValue = balance - Number(balanceValue);
    setBalanceValue(balance.toString());
    return differenceValue;
  };

  const getAnotherChainBalance = async () => {
    const multiTokenContract = anotherMultiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return 0;
    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });
    const balance = result.data.balance / 10 ** 8;
    console.log('another balance', balance);

    setAnoterhBalanceValue(balance.toString());
  };

  const approve = async () => {
    const wallet = walletRef.current;
    const caContract = caContractRef.current;
    const multiTokenContract = multiTokenContractRef.current;
    if (!caContract || !wallet || !multiTokenContract) return;

    try {
      const result = await multiTokenContract.callViewMethod('GetAllowance', {
        symbol: 'ELF',
        owner: wallet.caInfo.caAddress,
        spender: bingoAddress,
      });

      const { allowance } = result?.data || {};
      if (allowance < 100) {
        const approve = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
          caHash: wallet.caInfo.caHash,
          contractAddress: multiTokenContract.address,
          methodName: 'Approve',
          args: {
            symbol: 'ELF',
            spender: bingoAddress,
            amount: '100000000000000000000',
          },
        });
        if (!approve.error) {
          walletRef.current = {
            ...wallet,
            approved: true,
          };
          return true;
        }
        await delay();
        getBalance();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getQrInfo = () => {
    const info = shrinkSendQrData({
      type: 'send',
      netWorkType: isTestNet ? 'TESTNET' : 'MAIN',
      chainType: 'aelf',
      toInfo: {
        address: accountAddress,
        name: '',
      },
      assetInfo: {
        symbol: 'ELF',
        chainId: chainInfoRef.current?.chainId,
        tokenContractAddress: tokenContractAddressRef.current,
        decimals: '8',
      },
      address: accountAddress,
    });
    return info;
  };

  const registerLoop = async () => {
    let registerResult = undefined;
    const begainTime = Date.now();
    do {
      registerResult = await register();
      !registerResult && (await delay());
    } while (!registerResult);
    getBalance();

    try {
      transaction.setMeasurement(
        'Synchronizing on-chain account information ',
        (Date.now() - begainTime) / 1000,
        'second',
      );
    } catch (error) {
      console.log('Synchronizing error:', error);
    }
  };

  const register = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!wallet || !caContract) return false;
    const registerResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
      caHash: wallet.caInfo.caHash,
      contractAddress: bingoAddress,
      methodName: 'Register',
      args: null,
    });

    if (!registerResult.error || registerResult.error.message?.includes('already registered')) {
      walletRef.current = {
        ...wallet,
        registered: true,
      };
      return true;
    }
    return false;
  };

  const cutDown = async () => {
    await new Promise<void>((resolve) => {
      let count = COUNT;
      setTime(count);
      const timer = setInterval(() => {
        setTime(--count);
        if (count <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  };

  useIntervalAsync(async () => {
    const multiTokenContract = multiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return;
    if (Date.now() - requestTimeRef.current < 5000) {
      return;
    }
    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });
    const balance = result?.data?.balance / 10 ** 8;
    setBalanceValue(balance.toString());

    getAnotherChainBalance();
  }, 5000);

  const unLock = async (localWallet) => {
    let caInfo = localWallet.didWallet.caInfo[CHAIN_ID];
    let caHash = caInfo?.caHash;
    if (!caInfo) {
      const key = Object.keys(localWallet.didWallet.caInfo)[0];
      caHash = localWallet.didWallet.caInfo[key].caHash;
      caInfo = await did.didWallet.getHolderInfoByContract({
        caHash: caHash,
        chainId: CHAIN_ID,
      });
    }
    isMainChain.current = !caInfo;
    const wallet = {
      caInfo,
      pin: '',
      chainId: CHAIN_ID,
      walletInfo: localWallet.didWallet.managementAccount,
    };
    setWallet(wallet);
    initContract();
  };

  const initContract = async () => {
    initCurrentChainContract();
    // initAnotherChainContract();
  };

  const initCurrentChainContract = async () => {
    const chainInfo = chainInfoRef.current;
    const wallet = walletRef.current;
    if (!aelfRef.current || !chainInfo || !wallet) return;
    setLoading(true);
    setLoadingExtraDataMode(isMainChain.current ? ExtraDataMode.INIT_MAIN_CHAIN : ExtraDataMode.NONE);
    try {
      caContractRef.current = await getContractBasic({
        contractAddress: chainInfo?.caContractAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      const multiTokenContract = await getContractBasic({
        contractAddress: chainInfo.defaultToken.address,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });

      multiTokenContractRef.current = multiTokenContract;

      await delay();
      await registerLoop();
      await approve();
      setStep(StepStatus.PLAY);
    } catch (error) {
      console.error('initContract: error', error);
    }

    setLoading(false);
    setLoadingExtraDataMode(ExtraDataMode.NONE);
    setCaAddress(wallet.caInfo.caAddress);
  };

  const setBalanceInputValue = (value: string) => {
    balanceInputValueRef.current = value;
  };

  const setWallet = (wallet) => {
    walletRef.current = wallet;
  };

  const showError = (message: string) => {
    ToastRef.current?.error(message);
  };

  const onPlay = async (betResult: BetType) => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!caContract || !wallet) return;

    const value = Number(balanceInputValueRef.current);

    if (value <= 0) {
      showError('Insufficient funds');
      return;
    }

    if (value < MIN_BET_VALUE) {
      showError(`A minimum bet of ${MIN_BET_VALUE} ELF!`);
      return;
    }

    if (value > Number(balanceValue)) {
      showError('Please enter a number less than the number of ELF you own!');
      return;
    }
    if (value > MAX_BET_VALUE) {
      showError(`Please enter a number less than ${MAX_BET_VALUE} ELF!`);
      return;
    }

    setLoading(true);
    try {
      // if (!wallet.registered) {
      //   const registered = await register();
      //   if (!registered) return showError('Synchronizing on-chain account information...');
      // }
      if (!wallet.approved) await approve();
      const playResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Play',
        args: {
          amount: value * 10 ** 8,
          type: betResult,
        },
      });

      if (playResult.error || playResult.data.Error) {
        setLoading(false);
        showError('Insufficient funds');
        return;
      }
      txIdRef.current = playResult.data?.TransactionId || '';
      setLoading(false);
      setStep(StepStatus.RAMDOM);

      // SHOW RANDOM NUMBER
      setMyInterval(options);
      setTimeout(async () => {
        setStep(StepStatus.CUTDOWN);
        await cutDown();
        setStep(StepStatus.BINGO);
        setTime(COUNT);
        clearMyInterval(options.timer);
      }, RAMDOM_TIME * 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onBingo = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    const txId = txIdRef.current;
    if (!caContract || !wallet || !txId) return;
    setLoading(true);

    const begainTime = Date.now();
    try {
      await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Bingo',
        args: txId,
      });
      const bingoContract = await getContractBasic({
        contractAddress: bingoAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfoRef.current?.endPoint,
      });

      try {
        const rewardResult = await bingoContract.callViewMethod('GetBoutInformation', {
          address: caAddress,
          playId: txId,
        });
        const { randomNumber, award, isComplete } = rewardResult.data;

        if (!isComplete) {
          setLoading(false);
          showError('Draw failed, please click bingo again');
          try {
            transaction.setMeasurement('Draw failed time ', (Date.now() - begainTime) / 1000, 'second');
          } catch (error) {
            console.log('transaction error', error);
          }
          return;
        }

        try {
          transaction.setMeasurement('bingo success time ', (Date.now() - begainTime) / 1000, 'second');
        } catch (error) {
          console.log('transaction error', error);
        }

        const isWin = Number(award) > 0;
        // await delay();
        getBalance();
        setHasFinishBet(true);
        setIsWin(isWin);
        setResult(randomNumber);
        setDifference(Number(award) / 10 ** 8);
      } catch (error) {
        console.error(error);
        showError(error.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const onBet = () => {
    setHasFinishBet(false);
    setResult(Infinity);
    setStep(StepStatus.PLAY);
  };

  const logOut = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!caContract || !wallet) return;
    setLoading(true);
    await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
      caHash: wallet.caInfo.caHash,
      contractAddress: bingoAddress,
      methodName: 'Quit',
      args: {},
    });
    await caContractRef.current?.callSendMethod('RemoveManagerInfo', caAddress, {
      caHash: walletRef.current.caInfo.caHash,
      managerInfo: {
        address: caAddress,
        extraData: new Date().getTime(),
      },
    });
    setLoading(false);
    window.localStorage.removeItem(KEY_NAME);
    setStep(StepStatus.LOGIN);
  };

  const lock = async () => {
    setStep(StepStatus.LOCK);
    did.reset();
  };

  useEffect(() => {
    setLoading(true);
    init();
    if (typeof window !== undefined && window.localStorage.getItem(KEY_NAME)) {
      setEnablePlay(true);
      setStep(StepStatus.LOCK);
      // setStep(StepStatus.RAMDOM);
    } else {
      setEnablePlay(true);
      setStep(StepStatus.LOGIN);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ToastRef.current) {
      ToastRef.current = message;
    }
  }, []);

  return {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    setBalanceInputValue,
    setCaAddress,
    caAddress,
    balanceValue,
    setBalanceValue,
    anotherBalanceValue,
    setAnoterhBalanceValue,
    setWallet,
    balanceInputValue: balanceInputValueRef.current,
    step,
    setStep,
    random,
    setRandom,
    getBalance,
    initContract,
    setLoading,
    loading,
    isLogin,
    setIsLogin,
    showQrCode,
    isWin,
    enablePlay,
    setShowQrCode,
    getQrInfo,
    difference,
    result,
    hasFinishBet,
    time,
    accountAddress,
    chainId: chainInfoRef.current?.chainId,
    tokenContractAddress: tokenContractAddressRef.current,
    loadingExtraDataMode,
  };
};
export default useBingo;
