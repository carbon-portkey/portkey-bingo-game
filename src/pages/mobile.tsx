import React, { MouseEventHandler, useRef, useState } from 'react';
import { INITIAL_INPUT_VALUE, MAX_BET_VALUE, TOKEN_UNIT, DEFAULT_COUNTRY_CODE_CONFIG } from '../constants/global';
import useBingo, { SettingPage, StepStatus, KEY_NAME, BetType } from '../hooks/useBingo';
import { SignIn, did, Unlock, SignInInterface } from '@portkey/did-ui-react';
import { message, InputNumber, Modal, Popover } from 'antd';
import Loading from '../page-components/Loading';
import { QRCode } from 'react-qrcode-logo';
import { CHAIN_ID, currentNetworkType, isTestNet } from '../constants/network';
import styles from '../styles/mobile.module.css';
import copy from 'copy-to-clipboard';
import { decorateBalanceText } from '../utils/common';

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
  const [isWrongPassword, setIsWrongPassword] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const signinRef = useRef<SignInInterface | null>(null);

  const {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    step,
    random,
    balanceValue,
    setBalanceInputValue,
    isWin,
    getQrInfo,
    difference,
    result,
    hasFinishBet,
    setSettingPage,
    initContract,
    loading,
    time,
    accountAddress,
    loadingExtraDataMode,
  } = useBingo(message);

  const setShowLogin = (show: boolean) => {
    signinRef.current?.setOpen(show);
  };

  const onCopy = () => {
    copy(accountAddress);
    message.success('Copied!');
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  /**
   *  render function
   */
  const renderDefault = () => {
    return (
      <div className={styles.defaultWrapper}>
        <div className={styles.title__img__wrapper}>
          {isTestNet && (
            <div className={styles.test__tag__wrapper}>
              <div className={styles.test__tag__wrapper__content}>TEST</div>
            </div>
          )}
          <img className={styles.logo} src={require('../../public/bingo.png').default.src} />
        </div>
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
        {isTestNet && (
          <div className={styles.initTip}>
            <img src={require('../../public/warn.svg').default.src} />
            <span>This is a demo on the Testnet.</span>
          </div>
        )}
      </div>
    );
  };

  const PlayWrapper = (props: { children: any }) => {
    const { children } = props;
    return (
      <div className={styles.container}>
        <div className={styles.settingBtnGroups}>
          <button
            onClick={() => {
              showModal();
              setSettingPage(SettingPage.ACCOUNT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button onClick={onCopy} className={[styles.accountBtn, styles.button].join(' ')}>
            <div className={styles.buttonText}>{dealWithAccountAddressDisplay(accountAddress)}</div>
            <div className={styles.copyIcon} />
          </button>
          <button className={styles.balanceBtn}>
            <div className={styles.tokenIcon} />
            <div className={styles.buttonText}>
              {decorateBalanceText(balanceValue)} {TOKEN_UNIT}
            </div>
          </button>
        </div>
        <div className={styles.centerPopup}>
          <div className={styles.playWrapper}>
            <div className={styles.playContent}>{children}</div>
          </div>
        </div>
      </div>
    );
  };

  const dealWithAccountAddressDisplay = (address: string): string => {
    const maxShow = 18;
    return address.length > maxShow
      ? address.slice(0, maxShow / 2) + '...' + address.slice(address.length - maxShow / 2, address.length)
      : address;
  };

  const renderPlay = () => {
    return (
      <div className={styles.container}>
        <div className={styles.settingBtnGroups}>
          <button
            onClick={() => {
              showModal();
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button onClick={onCopy} className={[styles.accountBtn, styles.button].join(' ')}>
            <div className={styles.buttonText}>{dealWithAccountAddressDisplay(accountAddress)}</div>
            <div className={styles.copyIcon} />
          </button>
          <button className={styles.balanceBtn}>
            <div className={styles.tokenIcon} />
            <div className={styles.buttonText}>
              {decorateBalanceText(balanceValue)} {TOKEN_UNIT}
            </div>
          </button>
        </div>
        <div className={styles.centerPopup}>
          <div className={styles.playWrapper}>
            <div className={styles.playContent}>
              {step === StepStatus.CUTDOWN && (
                <div>
                  <div className={styles.playContent__cutDown}>
                    <div className={styles.playContent__cutDown_time}>{time}</div>
                    <img style={{ width: '15rem' }} src={require('../../public/sand_clock.png').default.src} />
                  </div>
                </div>
              )}

              {step === StepStatus.RAMDOM && (
                <div className={styles.random}>
                  <div className={styles.bingoContent}>
                    <div className={styles.boardWrapper}>
                      <div style={{ fontSize: '9.6rem' }} className={[styles.artWord, styles.randomNum].join(' ')}>
                        {random}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === StepStatus.PLAY && (
                <>
                  <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
                    ?
                  </div>
                  <div className={styles.playContent__input}>
                    <InputNumber
                      value={inputValue}
                      bordered={false}
                      precision={2}
                      className={styles.content__input}
                      onChange={(val) => {
                        setBalanceInputValue(val);
                        setInputValue(val);
                      }}
                      controls={false}
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
                </>
              )}
            </div>
          </div>
        </div>
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

  const renderDefaultSettingPage = () => {
    return (
      <div className={styles.setting__content}>
        <div className={styles.setting__account__module}>
          <div className={styles.setting__account__module__text}>{dealWithAccountAddressDisplay(accountAddress)}</div>
          <div className={styles.setting__account__module__copy} onClick={onCopy} />
          <Popover
            trigger={'click'}
            placement={'bottomLeft'}
            arrowPointAtCenter={false}
            content={() => (
              <div>
                <QRCode
                  value={JSON.stringify(getQrInfo())}
                  size={175}
                  quietZone={0}
                  qrStyle={'squares'}
                  eyeRadius={{ outer: 7, inner: 4 }}
                  ecLevel={'L'}
                />
                <div className={styles.setting__qrcode__address}>{accountAddress}</div>
              </div>
            )}>
            <div className={styles.setting__account__module__qrcode} />
          </Popover>
        </div>
        <div className={styles.setting__balance__module}>
          <div className={styles.setting__balance__row}>
            <div className={styles.setting__balance__token__icon} />
            <div className={styles.setting__balance__content}>
              <div className={styles.setting__balance__content__title}>ELF</div>
              <div className={styles.setting__balance__content__subtitle}>{currentNetworkType}</div>
            </div>
            <div className={styles.setting__balance__current__wrapper}>
              <div className={styles.setting__balance__current__value}>{decorateBalanceText(balanceValue)}</div>
            </div>
          </div>
        </div>
        <div
          className={styles.setting__logout}
          onClick={() => {
            logOut();
            handleCancel();
          }}>
          <div className={styles.setting__logout__text}>Logout</div>
        </div>
        <div
          className={styles.setting__lock}
          onClick={() => {
            lock();
            handleCancel();
          }}
        />
      </div>
    );
  };

  const renderSettingModal = () => {
    return (
      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        className={styles.ant__modal__body}
        closable={false}
        bodyStyle={{
          backgroundColor: 'transparent',
        }}
        footer={null}>
        <div className={styles.settingWrapper}>
          {renderDefaultSettingPage()}
          <img className={styles.settingBg} src={require('../../public/frame_no_icon.png').default.src} />
          <div className={styles.modalClose} onClick={handleCancel}>
            <img className={styles.closeIcon} src={require('../../public/close.png').default.src} />
          </div>
        </div>
      </Modal>
    );
  };

  const renderSence = () => {
    switch (step) {
      case StepStatus.INIT:
      case StepStatus.LOCK:
      case StepStatus.LOGIN:
        return renderDefault();
      case StepStatus.PLAY:
      case StepStatus.RAMDOM:
      case StepStatus.CUTDOWN:
        return renderPlay();
      // return renderCutDown();
      case StepStatus.BINGO:
        return renderBingo();
      default:
        break;
    }
  };

  return (
    <div className={styles.background}>
      <Loading isMobileMode loading={loading} extraDataMode={loadingExtraDataMode} />
      {renderSence()}
      <SignIn
        ref={(ref) => (signinRef.current = ref as SignInInterface)}
        uiType="Modal"
        phoneCountry={DEFAULT_COUNTRY_CODE_CONFIG}
        sandboxId="portkey-ui-sandbox"
        defaultChainId={CHAIN_ID}
        isShowScan={false}
        onFinish={async (wallet) => {
          console.log('SignIn onFinish==', wallet);
          await login(wallet);
          setShowLogin(false);
          initContract();
        }}
        onError={(err) => {
          console.error('onError==', err);
        }}
        onCancel={() => {
          setShowLogin(false);
        }}
      />
      {renderSettingModal()}
      <Unlock
        open={showUnlock}
        value={passwordValue}
        isWrongPassword={isWrongPassword}
        onChange={(passwordVal) => {
          setPasswordValue(passwordVal);
        }}
        onCancel={() => {
          setShowUnlock(false);
        }}
        onUnlock={async () => {
          const localWallet = await did.load(passwordValue, KEY_NAME);
          if (!localWallet.didWallet.accountInfo.loginAccount) {
            setIsWrongPassword(true);
            return;
          }
          console.log('Unlock onFinish==', localWallet);
          await unLock(localWallet);
          setIsWrongPassword(false);
          setPasswordValue('');
          setShowUnlock(false);
        }}
      />
    </div>
  );
};
export default MBingoGame;
