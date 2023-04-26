import React from 'react';
import { InputNumber, Popover, Modal } from 'antd';
import { SignIn, did, Unlock } from '@portkey/did-ui-react';

import useAccount from '../hooks/useAccount';
import useCopy from '../hooks/useCopy';
import useInputs from '../hooks/useInputs';
import useModal from '../hooks/useModal';
import Loading from '../page-components/Loading';
import { decorateBalanceText } from '../utils/common';
import { Button, ButtonType } from '../page-components/Button';
import { QRCode } from 'react-qrcode-logo';
import useBingo, { StepStatus, KEY_NAME, BetType } from '../hooks/useBingo';
import { CHAIN_ID, isTestNet, currentNetworkType } from '../constants/network';
import { INITIAL_INPUT_VALUE, MAX_BET_VALUE, DEFAULT_COUNTRY_CODE_CONFIG } from '../constants/global';

import styles from '../styles/pc.module.css';

const PCBingoGame = () => {
  const {
    loading,
    time,
    step,
    random,
    balanceValue,
    isWin,
    difference,
    result,
    hasFinishBet,
    accountAddress,
    loadingExtraDataMode,
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    setBalanceInputValue,
    getBalance,
    initContract,
    getQrInfo,
  } = useBingo();

  const { onCopy } = useCopy({ accountAddress });
  const { isModalOpen, showModal, handleOk, handleCancel } = useModal();
  const { showUnlock, setShowUnlock, setSigninRef, setShowLogin } = useAccount();
  const { inputValue, setInputValue, passwordValue, setPasswordValue, isWrongPassword, setIsWrongPassword } =
    useInputs();

  const renderLoginAndUnlock = () => {
    return (
      <div>
        <div className={styles.defaultWrapper}>
          <div className={styles.title__img__wrapper}>
            {isTestNet && (
              <div className={styles.test__tag__wrapper}>
                <div className={styles.test__tag__wrapper__content}>TEST</div>
              </div>
            )}
            <img className={styles.logo} src={require('../../public/bingo.png').default.src} />
          </div>
          {step === StepStatus.LOGIN && (
            <Button
              className={styles.defaultBtn__origin}
              type={ButtonType.ORIANGE}
              onClick={() => {
                setShowLogin(true);
              }}>
              <p className={styles.artWord}>PLAY NOW</p>
            </Button>
          )}
          {step === StepStatus.LOCK && (
            <Button
              className={styles.defaultBtn__blue}
              type={ButtonType.BLUE}
              onClick={() => {
                setShowUnlock(true);
              }}>
              <p className={styles.artWord}>UNLOCK</p>
            </Button>
          )}

          {isTestNet && (
            <div className={styles.initTip}>
              <img src={require('../../public/warn.svg').default.src} />
              <span>This is a demo on the Testnet.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlay = () => {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <div className={styles.content__bg}>
            <div className={styles.content__wrapper}>
              {step === StepStatus.CUTDOWN && (
                <div className={styles.content__cutDown}>
                  <div className={styles.content__cutDown_time}>{time}</div>
                  <img style={styles.content__cutDown_img} src={require('../../public/sand_clock.png').default.src} />
                </div>
              )}

              {step === StepStatus.RAMDOM && (
                <div className={styles.random}>
                  <div className={styles.initBingoLogo}>
                    <div style={{ fontSize: '18rem' }} className={[styles.artWord, styles.randomNum].join(' ')}>
                      {random}
                    </div>
                  </div>
                </div>
              )}

              {step === StepStatus.PLAY && (
                <>
                  <img src={require('../../public/question.png').default.src} />
                  <div className={styles.content__right}>
                    <div className={styles.content__inputWrapper}>
                      <InputNumber
                        value={inputValue}
                        bordered={false}
                        precision={2}
                        className={styles.content__input}
                        onChange={(val) => {
                          setBalanceInputValue(val);
                          setInputValue(val);
                        }}
                        controls={false}></InputNumber>
                      <span>BET ELF</span>
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
                        <span style={styles.playContent__btn_text}>{`(${MAX_BET_VALUE})`}</span>
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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasFinishBet ? (
          <div className={styles.bingoContentWrapper}>
            <div className={styles.bingoLogo}>
              <div style={{ fontSize: '18rem' }} className={[styles.artWord].join(' ')}>
                {result === Infinity ? '?' : result}
              </div>
            </div>
            <div className={styles.bingoContent__bg}>
              <div className={styles.bingoContent__wrapper}>
                <>
                  <div className={styles.bingoTips}>
                    {isWin ? (
                      <img
                        style={{ width: '51.6rem' }}
                        src={require('../../public/congratulations_pc.png').default.src}
                      />
                    ) : (
                      <img style={{ width: '51.6rem' }} src={require('../../public/lose_pc.png').default.src} />
                    )}
                    <div className={styles.bingoText}>
                      <span>{text}</span>
                      <span style={style}>{Math.abs(difference).toFixed(2)} ELF</span>
                    </div>
                  </div>
                  <Button
                    className={styles.bingoContent__betBtn}
                    type={ButtonType.ORIANGE}
                    onClick={() => {
                      onBet();
                      setBalanceInputValue(INITIAL_INPUT_VALUE);
                      setInputValue(INITIAL_INPUT_VALUE);
                    }}>
                    <span className={styles.playContent__betBtn_p}>
                      <p style={{ fontSize: '4.8rem', fontWeight: 900 }} className={styles.artWord}>
                        BET
                      </p>
                    </span>
                  </Button>
                </>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.contentWrapper}>
            <div className={styles.content__bg}>
              <div className={styles.contentBingoInit__wrapper}>
                <div className={styles.initBingoLogo}>
                  <div style={{ fontSize: '18rem' }} className={[styles.artWord].join(' ')}>
                    {result === Infinity ? '?' : result}
                  </div>
                </div>
                <Button className={styles.bingoBtn} type={ButtonType.ORIANGE} onClick={onBingo}>
                  <p className={styles.artWord}>BINGO</p>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSence = () => {
    switch (step) {
      case StepStatus.INIT:
      case StepStatus.LOCK:
      case StepStatus.LOGIN:
        return renderLoginAndUnlock();
      case StepStatus.CUTDOWN:
      case StepStatus.RAMDOM:
      case StepStatus.PLAY:
        return renderPlay();
      case StepStatus.BINGO:
        return renderBingo();
      default:
        break;
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.bodyWrapper}>
        <Loading loading={loading} extraDataMode={loadingExtraDataMode} />
        {![StepStatus.INIT, StepStatus.LOCK, StepStatus.LOGIN, StepStatus.END].includes(step) && (
          <div className={styles.settingHeader}>
            <img
              className={[styles.setting__menu, styles.btn].join(' ')}
              src={require('../../public/menu_pc.png').default.src}
              onClick={showModal}
            />
            <div className={styles.setting__balance}>
              <div className={styles.setting__balance__content}>
                <div style={{ width: '100%', fontSize: '2.4rem' }}>{decorateBalanceText(balanceValue)} ELF</div>
                <button
                  className={styles.btn}
                  onClick={() => {
                    getBalance();
                  }}
                />
              </div>
            </div>
            <div className={styles.setting__account}>
              <div className={styles.setting__account__content}>
                <div>Account</div>
                <div style={{ width: '40rem', overflow: 'hidden' }}>
                  {accountAddress.length > 18
                    ? `${accountAddress.slice(0, 10)}...${accountAddress.slice(
                        accountAddress.length - 10,
                        accountAddress.length,
                      )}`
                    : accountAddress}
                </div>
                <button className={styles.setting__account__content__copy} onClick={onCopy} />

                <Popover
                  content={() => (
                    <QRCode
                      value={JSON.stringify(getQrInfo())}
                      size={200}
                      quietZone={0}
                      qrStyle={'squares'}
                      eyeRadius={{ outer: 7, inner: 4 }}
                      ecLevel={'L'}
                    />
                  )}>
                  <div className={styles.setting__account__content__qrcode} />
                </Popover>
              </div>
            </div>
            <button className={styles.setting__logout} onClick={logOut}>
              Logout
            </button>
            <img
              className={[styles.setting__lock, styles.btn].join(' ')}
              src={require('../../public/lock.png').default.src}
              onClick={() => {
                lock();
              }}
            />
          </div>
        )}
        {renderSence()}
        <Modal
          className={styles.menuPop}
          centered
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          width={1000}
          closeIcon={<img style={{ width: '6.4rem' }} src={require('../../public/close.png').default.src} />}
          footer={null}>
          <div className={styles.menuPop__wrapper}>
            <div className={styles.menuPop__wrapper_content}>
              <div className={[styles.setting__account, styles.menuPop__wrapper_account].join(' ')}>
                <div className={styles.setting__account__content}>
                  <div>Account</div>
                  <div style={{ width: '42rem', overflow: 'hidden' }}>
                    {accountAddress.length > 18
                      ? `${accountAddress.slice(0, 10)}...${accountAddress.slice(
                          accountAddress.length - 10,
                          accountAddress.length,
                        )}`
                      : accountAddress}
                  </div>
                  <button className={styles.setting__account__content__copy} onClick={onCopy} />

                  <Popover
                    content={() => (
                      <QRCode
                        value={JSON.stringify(getQrInfo())}
                        size={200}
                        quietZone={0}
                        qrStyle={'squares'}
                        eyeRadius={{ outer: 7, inner: 4 }}
                        ecLevel={'L'}
                      />
                    )}>
                    <div className={styles.setting__account__content__qrcode} />
                  </Popover>
                </div>
              </div>
              <div className={styles.menuPop__wrapper_content_textContent}>
                <img src={require('../../public/bitcoin.svg').default.src} />
                <div className={styles.menuPop__textContent_flex}>
                  <div className={styles.menuPop__textContent_flex_top}>
                    <span>ELF</span>
                    <span>{decorateBalanceText(balanceValue)}</span>
                  </div>
                  <span style={{ color: '#707070', fontSize: '1.2rem' }}>{currentNetworkType}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <SignIn
          ref={setSigninRef}
          sandboxId="portkey-ui-sandbox"
          defaultChainId={CHAIN_ID}
          phoneCountry={DEFAULT_COUNTRY_CODE_CONFIG}
          uiType="Modal"
          isShowScan
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
    </div>
  );
};
export default PCBingoGame;
