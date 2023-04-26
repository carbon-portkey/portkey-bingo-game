import React, { useEffect, useState, useRef } from 'react';
import { isMobile } from '../utils/common';
import { isTestNet } from '../constants/network';
import { SideProps } from '../type';

import { ConfigProvider } from '@portkey/did-ui-react';
import { Store } from '../utils/store';
import InitLoading from '../page-components/Loading';
import MBingoGame from './mobile';
import PCBingoGame from './pc';

import ImgSourceMap from '../constants/sourceMap';

ConfigProvider.setGlobalConfig({
  storageMethod: new Store(),
  graphQLUrl: '/AElfIndexer_DApp/PortKeyIndexerCASchema/graphql',
  // reCaptchaConfig: {
  //   siteKey: '6LfR_bElAAAAAJSOBuxle4dCFaciuu9zfxRQfQC0',
  // },
  socialLogin: {
    Apple: {
      clientId: 'did.portkey',
      redirectURI: 'https://did-portkey.portkey.finance/api/app/appleAuth/bingoReceive',
    },
    Google: {
      clientId: '176147744733-a2ks681uuqrmb8ajqrpu17te42gst6lq.apps.googleusercontent.com',
    },
    Portkey: {
      websiteName: 'Bingo Game',
      websiteIcon: '​https://bingogame.portkey.finance/favicon.ico',
    },
  },
  network: {
    defaultNetwork: isTestNet ? 'TESTNET' : 'MAIN',
    networkList: [
      {
        name: 'aelf MAIN',
        walletType: 'aelf',
        networkType: isTestNet ? 'TESTNET' : 'MAIN',
        isActive: true,
        apiUrl: '',
        graphQLUrl: '/AElfIndexer_DApp/PortKeyIndexerCASchema/graphql',
        connectUrl: '',
      },
    ],
  },
});

const BingoGame = (props: SideProps) => {
  const isMobileBrowser = isMobile(props.uaString || navigator.userAgent);
  const [hasLoadedSource, setHasLoadedSource] = useState<boolean>(false);
  const [hasFontSizeLoaded, setHasFontSizeLoaded] = useState<boolean>(false);

  const unLoadSourceRef = useRef<number>(0);

  useEffect(() => {
    function initFontSzie(doc, win) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const docEle = doc.documentElement;
      const event = 'onorientationchange' in window ? 'orientationchange' : 'resize';
      const fn = function () {
        const width = docEle.clientWidth;
        const unitWidth = isMobile ? 375 : 1920;
        width && (docEle.style.fontSize = 10 * (width / unitWidth) + 'px');
      };
      fn();
      setHasFontSizeLoaded(true);
      win.addEventListener(event, fn, false);
      doc.addEventListener('DOMContentLoaded', fn, false);
    }
    if (window && document) {
      initFontSzie(document, window);
    }

    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js';
      document.body.appendChild(script);
      script.onload = () => {
        setTimeout(() => {
          new window.VConsole();
        }, 0);
      };
    }

    const sourceMap: Array<string> = isMobileBrowser ? ImgSourceMap.mobile : ImgSourceMap.pc;

    const timeTask = new Promise(function (resolve) {
      setTimeout(resolve, 60000, false);
    });

    const scheduleTask = new Promise(function (resolve) {
      const start = Date.now();
      const schedule = (src: string) => {
        const img = document.createElement('img');
        img.src = src;
        img.onload = () => {
          unLoadSourceRef.current = unLoadSourceRef.current + 1;
          if (unLoadSourceRef.current >= sourceMap.length) {
            if (Date.now() - start > 3000) {
              resolve(true);
            } else {
              setTimeout(() => {
                resolve(true);
              }, 3000 - (Date.now() - start));
            }
          }
        };
      };
      sourceMap.forEach((src) => {
        schedule(src);
      });
    });

    Promise.race([timeTask, scheduleTask]).then(() => {
      setHasLoadedSource(true);
    });
  }, []);

  if (!hasFontSizeLoaded) {
    return null;
  }

  if (!hasLoadedSource) {
    return <InitLoading isMobileMode={isMobileBrowser} isInit loading />;
  }

  return isMobileBrowser ? <MBingoGame /> : <PCBingoGame />;
};

export function getServerSideProps(context: any): { props: SideProps } {
  return {
    props: {
      uaString: context.req.headers['user-agent'],
    },
  };
}

export default BingoGame;
