import React, { MouseEventHandler, useRef, useState, useEffect } from 'react';
import { SignIn, did, PortkeyLoading, Unlock } from '@portkey/did-ui-react';
import { CenterPopup, Toast, Input } from 'antd-mobile';
import { QRCode } from 'react-qrcode-logo';

import { shrinkSendQrData } from '../utils/common';
import useBingo, { SettingPage, StepStatus, KEY_NAME, BetType } from '../hooks/useBingo';

import { CHAIN_ID } from '../constants/network';

import Clipboard from 'clipboard';

import styles from '../styles/mobile.module.css';
import { INITIAL_INPUT_VALUE, MAX_BET_VALUE, MIN_BET_VALUE } from '../constants/global';

enum ButtonType {
  BLUE,
  ORIANGE,
}

const Button = (props: {
  children: any;
  enable?: boolean;
  type: ButtonType;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { children, type, className, onClick, enable = true } = props;
  return (
    <button
      disabled={!enable}
      onClick={onClick}
      className={[className, styles.btn, type === ButtonType.BLUE ? styles.blueBtn : styles.oriangeBtn].join(' ')}>
      {children}
    </button>
  );
};

const MBingoGame = () => {
  const [inputValue, setInputValue] = useState<string>(INITIAL_INPUT_VALUE);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [showUnlock, setShowUnlock] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [isWrongPassWord, setIsWrongPassWord] = useState<boolean>(false);
  const copyBtnRef = useRef<Element>(null);
  const copyBoard = useRef<Clipboard>(null);

  const {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    chainId,
    step,
    settingPage,
    balanceValue,
    getBalance,
    setBalanceInputValue,
    showQrCode,
    isWin,
    setShowQrCode,
    difference,
    result,
    hasFinishBet,
    setSettingPage,
    setLoading,
    initContract,
    loading,
    time,
    tokenContractAddress,
    accountAddress,
  } = useBingo(Toast);

  useEffect(() => {
    if (copyBtnRef.current && !copyBoard.current) {
      const clipboard = new Clipboard(copyBtnRef.current, {
        text: () => {
          return accountAddress;
        },
      });
      clipboard.on('success', () => {
        Toast.show({
          content: 'Copied!',
        });
      });
      clipboard.on('error', () => {
        Toast.show({
          content: 'Copy failed!',
        });
      });
      copyBoard.current = clipboard;
    }
  });

  /**
   *  render function
   */
  const renderDefault = () => {
    return (
      <div className={styles.defaultWrapper}>
        <img className={styles.logo} src={require('../../public/bingo.png').default.src} />
        {step === StepStatus.LOCK && (
          <>
            <Button
              className={styles.defaultBtn}
              type={ButtonType.BLUE}
              onClick={() => {
                setShowUnlock(true);
              }}>
              <p className={styles.artWord}>UNLOCK</p>
            </Button>
          </>
        )}

        {step === StepStatus.LOGIN && (
          <>
            <Button
              className={styles.defaultBtn}
              type={ButtonType.ORIANGE}
              onClick={() => {
                setShowLogin(true);
              }}>
              <p className={styles.artWord}>PLAY NOW</p>
            </Button>
          </>
        )}
        <div className={styles.initTip}>
          <img src={require('../../public/warn.svg').default.src} />
          <span>This is a demo on the Testnet.</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (settingPage === SettingPage.ACCOUNT) {
      copyBtnRef.current = null;
      copyBoard.current = null;
    }
  }, [settingPage]);

  const PlayWrapper = (props: { children: any; show?: boolean }) => {
    const { children, show = true } = props;
    return (
      <CenterPopup visible={show} className={styles.centerPopup}>
        <div className={styles.playWrapper}>
          <div className={styles.playContent}>{children}</div>
        </div>
        <div className={styles.settingBtnGroups}>
          <button
            onClick={() => {
              setSettingPage(SettingPage.ACCOUNT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              getBalance();
              setSettingPage(SettingPage.BALANCE);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              setSettingPage(SettingPage.LOGOUT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
        </div>
      </CenterPopup>
    );
  };

  const renderPlay = () => {
    return (
      <CenterPopup visible className={styles.centerPopup}>
        <div className={styles.playWrapper}>
          <div className={styles.playContent}>
            <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
              ?
            </div>
            <div className={styles.playContent__input}>
              <Input
                key="amount-input"
                placeholder="0"
                type="number"
                value={inputValue}
                onBlur={() => {
                  const fixedString = Number(inputValue).toFixed(2);
                  setInputValue(fixedString);
                  setBalanceInputValue(fixedString);
                }}
                onChange={(val) => {
                  setBalanceInputValue(val);
                  setInputValue(val);
                }}
              />
              <span style={{ paddingRight: '8px' }}>BET</span>
              <span>ELF</span>
            </div>
            <div className={styles.playContent__btnGroups}>
              <button
                onClick={() => {
                  setBalanceInputValue(INITIAL_INPUT_VALUE);
                  setInputValue(INITIAL_INPUT_VALUE);
                }}
                className={[styles.playContent__btn, styles.button].join(' ')}>
                MIN
              </button>
              <button
                onClick={() => {
                  try {
                    const balance = Math.min(Number(balanceValue), MAX_BET_VALUE);
                    setBalanceInputValue(`${Math.floor(balance)}`);
                    setInputValue(`${Math.floor(balance)}`);
                  } catch (error) {
                    console.error('error', error);
                  }
                }}
                className={[styles.playContent__btn, styles.button].join(' ')}>
                MAX
                <span style={{ fontSize: '10px', paddingLeft: '4px' }}>{`(${MAX_BET_VALUE})`}</span>
              </button>
            </div>
            <div className={styles.playContent__betBtnGroups}>
              <Button
                className={styles.playContent__betBtn}
                type={ButtonType.ORIANGE}
                onClick={async () => {
                  onPlay(BetType.BIG);
                }}>
                <span className={styles.playContent__betBtn_p}>
                  <p className={styles.artWord}>BIG</p>
                  <p>(128 - 255)</p>
                </span>
              </Button>
              <Button
                className={styles.playContent__betBtn}
                type={ButtonType.BLUE}
                onClick={() => {
                  onPlay(BetType.SMALL);
                }}>
                <span className={styles.playContent__betBtn_p}>
                  <p className={styles.artWord}>SMALL</p>
                  <p>(0 - 127)</p>
                </span>
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.settingBtnGroups}>
          <button
            onClick={() => {
              setSettingPage(SettingPage.ACCOUNT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              getBalance();
              setSettingPage(SettingPage.BALANCE);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              setSettingPage(SettingPage.LOGOUT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
        </div>
      </CenterPopup>
    );
  };

  const renderCutDown = () => {
    return (
      <div className={styles.cutDownWrapper}>
        <div className={styles.cutDown__bg} />
        <div className={styles.cutDown}>
          <p>{time}</p>
        </div>
        <span className={styles.cutDown__tip}>Getting on-chain data to generate random numbers...</span>
      </div>
    );
  };

  const renderBingo = () => {
    const text = isWin ? 'You Win' : 'You Lose';
    const style = isWin
      ? {
          color: '#2E6BC7',
          background: '#C5DFFF',
        }
      : {
          color: '#D63333',
          background: '#FFCB9B',
        };
    return (
      <PlayWrapper>
        <div className={styles.bingoContent}>
          <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
            {result === Infinity ? '?' : result}
          </div>
          {hasFinishBet ? (
            <>
              <div className={styles.bingoTips}>
                {isWin ? (
                  <img src={require('../../public/congratulation.png').default.src} />
                ) : (
                  <img src={require('../../public/lose.png').default.src} />
                )}
                <div className={styles.bingoText}>
                  <span>{text}</span>
                  <span style={style}>{Math.abs(difference).toFixed(2)} ELF</span>
                </div>
              </div>
              <Button
                className={styles.playContent__betBtn}
                type={ButtonType.ORIANGE}
                onClick={() => {
                  onBet();
                  setBalanceInputValue(INITIAL_INPUT_VALUE);
                  setInputValue(INITIAL_INPUT_VALUE);
                }}>
                <span className={styles.playContent__betBtn_p}>
                  <p style={{ fontSize: '24px' }} className={styles.artWord}>
                    BET
                  </p>
                </span>
              </Button>
            </>
          ) : (
            <Button className={styles.playContent__betBtn} type={ButtonType.ORIANGE} onClick={onBingo}>
              <span className={styles.playContent__betBtn_p}>
                <p style={{ fontSize: '24px' }} className={styles.artWord}>
                  BINGO
                </p>
              </span>
            </Button>
          )}
        </div>
      </PlayWrapper>
    );
  };

  const renderSettingPage = () => {
    const info = shrinkSendQrData({
      type: 'send',
      netWorkType: 'TESTNET',
      chainType: 'aelf',
      toInfo: {
        address: accountAddress,
        name: '',
      },
      assetInfo: {
        symbol: 'ELF',
        chainId: chainId,
        tokenContractAddress: tokenContractAddress,
        decimals: '8',
      },
      address: accountAddress,
    });

    return (
      <PlayWrapper>
        <div className={styles.settingContent}>
          {settingPage === SettingPage.ACCOUNT && (
            <div className={styles.settingContent__account}>
              <h1>Account</h1>
              {!showQrCode ? (
                <p className={styles.settingContent__account__text}>{accountAddress}</p>
              ) : (
                <QRCode
                  value={JSON.stringify(info)}
                  size={200}
                  quietZone={0}
                  qrStyle={'squares'}
                  eyeRadius={{ outer: 7, inner: 4 }}
                  ecLevel={'L'}
                />
              )}
              <div>
                <button
                  ref={(ref) => {
                    copyBtnRef.current = ref;
                  }}
                  className={[styles.settingBtn__copy, styles.button].join(' ')}></button>
                <button
                  onClick={() => {
                    setShowQrCode(true);
                  }}
                  className={[styles.settingBtn__qrcode, styles.button].join(' ')}></button>
              </div>
            </div>
          )}
          {settingPage === SettingPage.BALANCE && (
            <div className={styles.settingContent__balance}>
              <h1>Balance</h1>
              <div className={styles.settingContent__balance__text}>{Number(balanceValue).toFixed(4)} ELF</div>
              <button
                className={styles.settingContent__balance__reload}
                onClick={async () => {
                  setLoading(true);
                  await getBalance();
                  setLoading(false);
                }}></button>
            </div>
          )}
          {settingPage === SettingPage.LOGOUT && (
            <div className={styles.settingContent__logout}>
              <div>
                <Button className={styles.settingContent__logout__btn} type={ButtonType.BLUE} onClick={logOut}>
                  <p className={styles.artWord}>Logout</p>
                </Button>

                <Button className={styles.settingContent__logout__btn} type={ButtonType.BLUE} onClick={lock}>
                  <img src={require('../../public/lock_small.png').default.src} />
                </Button>
              </div>
            </div>
          )}

          <Button
            className={styles.playContent__betBtn}
            type={ButtonType.ORIANGE}
            onClick={() => {
              setSettingPage(SettingPage.NULL);
              setShowQrCode(false);
            }}>
            <span className={styles.playContent__betBtn_p}>
              <p style={{ fontSize: '24px' }} className={styles.artWord}>
                CLOSE
              </p>
            </span>
          </Button>
        </div>
      </PlayWrapper>
    );
  };

  const renderSence = () => {
    if (settingPage !== SettingPage.NULL) {
      return renderSettingPage();
    }

    switch (step) {
      case StepStatus.INIT:
      case StepStatus.LOCK:
      case StepStatus.LOGIN:
        return renderDefault();
      case StepStatus.PLAY:
        return renderPlay();
      case StepStatus.CUTDOWN:
        return renderCutDown();
      case StepStatus.BINGO:
        return renderBingo();
      default:
        break;
    }
  };

  return (
    <div className={styles.background}>
      <PortkeyLoading loading={loading} />
      {renderSence()}
      <SignIn
        open={showLogin}
        sandboxId="portkey-ui-sandbox"
        defaultChainId={CHAIN_ID}
        isShowScan
        onFinish={async (wallet) => {
          await login(wallet);
          setShowLogin(false);
          initContract();
        }}
        onError={(err) => {
          console.error(err, 'onError==');
        }}
        onCancel={() => {
          setShowLogin(false);
        }}
      />

      <Unlock
        open={showUnlock}
        value={passwordValue}
        isWrongPassWord={isWrongPassWord}
        onChange={(passwordVal) => {
          setPasswordValue(passwordVal);
        }}
        onCancel={() => {
          setShowUnlock(false);
        }}
        onUnlock={async () => {
          const localWallet = await did.load(passwordValue, KEY_NAME);
          if (!localWallet.didWallet.accountInfo.loginAccount) {
            setIsWrongPassWord(true);
            return;
          }

          await unLock(localWallet);
          setIsWrongPassWord(false);
          setPasswordValue('');
          setShowUnlock(false);
        }}
      />
    </div>
  );
};
export default MBingoGame;
