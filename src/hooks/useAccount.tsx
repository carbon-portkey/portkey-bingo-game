import { SignInInterface } from '@portkey/did-ui-react';
import { useState, useRef } from 'react';

const useAccount = () => {
  const [showUnlock, setShowUnlock] = useState<boolean>(false);
  const signinRef = useRef<SignInInterface | null>(null);
  const setSigninRef = (ref: SignInInterface) => {
    signinRef.current = ref;
  };
  const setShowLogin = (show: boolean) => {
    signinRef.current?.setOpen(show);
  };
  return { showUnlock, setShowUnlock, setSigninRef, setShowLogin };
};

export default useAccount;
