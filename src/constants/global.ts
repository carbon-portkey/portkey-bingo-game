import { IPhoneCountry } from '@portkey/did-ui-react';
import data from './countryCodeList.json';
// you can determine the max and min bet value here
export const MIN_BET_VALUE = 1;
export const MAX_BET_VALUE = 100;
export const INITIAL_INPUT_VALUE = `${MIN_BET_VALUE}`;

export const defaultCountryCodeConfig = Object.assign({}, data, { country: 'Singapore' }) as IPhoneCountry;
