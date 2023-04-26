import copy from 'copy-to-clipboard';
import { useCallback } from 'react';
import { message } from 'antd';

const useCopy = (props: { accountAddress: string }) => {
  const { accountAddress } = props || {};

  const onCopy = useCallback(() => {
    copy(accountAddress);
    message.success('Copied!');
  }, [accountAddress]);

  return { onCopy };
};

export default useCopy;
