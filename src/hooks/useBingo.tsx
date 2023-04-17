import { useEffect, useRef, useState } from 'react';
import { DIDWalletInfo, did } from '@portkey/did-ui-react';
import { ChainInfo } from '@portkey/services';
import { getContractBasic, ContractBasic } from '@portkey/contracts';

import AElf from 'aelf-sdk';
import { isMobile } from '../utils/common';

import { useDelay } from './useDelay';

import { bingoAddress, CHAIN_ID } from '../constants/network';

import useIntervalAsync from './useInterValAsync';
import { INITIAL_INPUT_VALUE, MAX_BET_VALUE, MIN_BET_VALUE } from '../constants/global';

export enum StepStatus {
  INIT,
  LOCK,
  LOGIN,
  PLAY,
  CUTDOWN,
  BINGO,
  END,
}

export enum SettingPage {
  NULL,
  ACCOUNT,
  BALANCE,
  LOGOUT,
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
const { sha256 } = AElf.utils;
const COUNT = 3;

const useBingo = (Toast: any) => {
  const [step, setStep] = useState(StepStatus.INIT);
  const [settingPage, setSettingPage] = useState(SettingPage.NULL);
  const [isLogin, setIsLogin] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [enablePlay, setEnablePlay] = useState(false);

  const [balanceValue, setBalanceValue] = useState('0');
  const [difference, setDifference] = useState(0);
  const [result, setResult] = useState(Infinity);
  const [hasFinishBet, setHasFinishBet] = useState(false);

  const [loading, setLoading] = useState(false);
  const [caAddress, setCaAddress] = useState('');
  const [time, setTime] = useState(30);

  const walletRef = useRef<
    DIDWalletInfo & {
      registered?: boolean;
      approved?: boolean;
    }
  >();

  const chainInfoRef = useRef<ChainInfo>();
  const caContractRef = useRef<ContractBasic>();
  const multiTokenContractRef = useRef<ContractBasic>();
  const aelfRef = useRef<any>();
  const txIdRef = useRef('');
  const tokenContractAddressRef = useRef('');
  const balanceInputValueRef = useRef<string>(INITIAL_INPUT_VALUE);
  const requestTimeRef = useRef(0);
  const ToastRef = useRef(null);

  const accountAddress = `ELF_${caAddress}_${chainInfoRef.current?.chainId}`;

  /**
   *  logic function
   */
  const delay = useDelay();

  const init = async () => {
    const chainsInfo = await did.services.getChainsInfo();
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
    setLoading(true);
    setWallet(wallet);
    did.save(wallet.pin, KEY_NAME);
    return true;
  };

  const getBalance = async () => {
    const multiTokenContract = multiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return 0;

    await delay();
    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });

    requestTimeRef.current = Date.now();
    const balance = result.data.balance / 10 ** 8;
    const differenceValue = balance - Number(balanceValue);
    setBalanceValue(balance.toString());
    return differenceValue;
  };

  const approve = async () => {
    const wallet = walletRef.current;
    const caContract = caContractRef.current;
    const multiTokenContract = multiTokenContractRef.current;
    if (!caContract || !wallet || !multiTokenContract) return;
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
    getBalance();
  };

  const register = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!wallet || !caContract) return;
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
    await delay();
    getBalance();
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
    const balance = result.data.balance / 10 ** 8;
    setBalanceValue(balance.toString());
  }, 5000);

  const unLock = async (localWallet) => {
    let caInfo = localWallet.didWallet.caInfo[CHAIN_ID];
    if (!caInfo) {
      const key = Object.keys(localWallet.didWallet.caInfo)[0];
      const caHash = localWallet.didWallet.caInfo[key].caHash;

      caInfo = await did.didWallet.getHolderInfoByContract({
        caHash: caHash,
        chainId: CHAIN_ID,
      });
    }

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
    const chainInfo = chainInfoRef.current;
    const aelf = aelfRef.current;
    const wallet = walletRef.current;
    if (!aelfRef.current || !chainInfo || !wallet) return;
    setLoading(true);
    try {
      caContractRef.current = await getContractBasic({
        contractAddress: chainInfo?.caContractAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      const chainStatus = await aelf.chain.getChainStatus();
      const zeroC = await getContractBasic({
        contractAddress: chainStatus.GenesisContractAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      const tokenContractAddress = await zeroC.callViewMethod(
        'GetContractAddressByName',
        sha256('AElf.ContractNames.Token'),
      );
      tokenContractAddressRef.current = tokenContractAddress.data;
      const multiTokenContract = await getContractBasic({
        contractAddress: tokenContractAddress.data,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });

      multiTokenContractRef.current = multiTokenContract;

      await delay();
      await register();
      await approve();
      setStep(StepStatus.PLAY);
    } catch (error) {
      console.error('initContract: error', error);
    }

    setLoading(false);
    setCaAddress(wallet.caInfo.caAddress);
  };

  const setBalanceInputValue = (value: string) => {
    balanceInputValueRef.current = value;
  };

  const setWallet = (wallet) => {
    walletRef.current = wallet;
  };

  const showError = (message: string) => {
    if (isMobile(navigator.userAgent)) {
      ToastRef.current?.show(message);
    } else {
      ToastRef.current?.error(message);
    }
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
      if (!wallet.registered) {
        const registered = await register();
        if (!registered) return showError('Synchronizing on-chain account information...');
      }
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
      setStep(StepStatus.CUTDOWN);
      await cutDown();
      setStep(StepStatus.BINGO);
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
        const { randomNumber, award } = rewardResult.data;
        const isWin = Number(award) > 0;
        setIsWin(isWin);
        setResult(randomNumber);
        setDifference(Number(award) / 10 ** 8);
        getBalance();
        setHasFinishBet(true);
      } catch (error) {
        console.error(error);
        showError(error.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
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
    await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
      caHash: wallet.caInfo.caHash,
      contractAddress: bingoAddress,
      methodName: 'Quit',
      args: {},
    });
    setLoading(true);
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
    setSettingPage(SettingPage.NULL);
  };

  const lock = async () => {
    setStep(StepStatus.LOCK);
    setSettingPage(SettingPage.NULL);
    did.reset();
  };

  useEffect(() => {
    setLoading(true);
    init();
    if (typeof window !== undefined && window.localStorage.getItem(KEY_NAME)) {
      setEnablePlay(true);
      setStep(StepStatus.LOCK);
    } else {
      setEnablePlay(true);
      setStep(StepStatus.LOGIN);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ToastRef.current) {
      ToastRef.current = Toast;
    }
  }, [Toast]);

  return {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    setSettingPage,
    setBalanceInputValue,
    setCaAddress,
    caAddress,
    balanceValue,
    setBalanceValue,
    setWallet,
    balanceInputValue: balanceInputValueRef.current,
    step,
    getBalance,
    initContract,
    setLoading,
    loading,
    settingPage,
    isLogin,
    setIsLogin,
    showQrCode,
    isWin,
    enablePlay,
    setShowQrCode,
    difference,
    result,
    hasFinishBet,
    time,
    accountAddress,
    chainId: chainInfoRef.current?.chainId,
    tokenContractAddress: tokenContractAddressRef.current,
  };
};
export default useBingo;
