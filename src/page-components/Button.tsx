import React, { MouseEventHandler } from 'react';

import styles from './style.module.css';

export enum ButtonType {
  BLUE,
  ORIANGE,
}

export const Button = (props: {
  children: any;
  enable?: boolean;
  type: ButtonType;
  className?: string;
  isMobile?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { children, type, className, onClick, enable = true, isMobile } = props;
  let styleClass = type === ButtonType.BLUE ? 'blueBtn' : 'oriangeBtn';
  if (!isMobile) {
    styleClass = `${styleClass}__pc`;
  }
  return (
    <button disabled={!enable} onClick={onClick} className={[styles[styleClass], styles.btn, className].join(' ')}>
      {children}
    </button>
  );
};
