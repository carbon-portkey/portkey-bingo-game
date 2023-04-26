import { IPhoneCountry } from '@portkey/did-ui-react';
import COUNTRY_CODE_DATA from './countryCodeList.json';

// you can determine the max and min bet value here
const MIN_BET_VALUE = 1;
const MAX_BET_VALUE = 100;
const INITIAL_INPUT_VALUE = `${MIN_BET_VALUE}`;

const TOKEN_UNIT = 'ELF';

// you can determine the default country code here
const DEFAULT_COUNTRY_CODE = { country: 'Singapore' } as Partial<IPhoneCountry>;
const DEFAULT_COUNTRY_CODE_CONFIG = Object.assign({}, COUNTRY_CODE_DATA, DEFAULT_COUNTRY_CODE) as IPhoneCountry;

export { MIN_BET_VALUE, MAX_BET_VALUE, INITIAL_INPUT_VALUE, TOKEN_UNIT, DEFAULT_COUNTRY_CODE_CONFIG };
