import { useState } from 'react';
import { INITIAL_INPUT_VALUE } from '../constants/global';

const useInputs = () => {
  const [inputValue, setInputValue] = useState<string>(INITIAL_INPUT_VALUE);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [isWrongPassword, setIsWrongPassword] = useState<boolean>(false);
  return { inputValue, setInputValue, passwordValue, setPasswordValue, isWrongPassword, setIsWrongPassword };
};

export default useInputs;
