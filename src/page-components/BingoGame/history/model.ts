export interface HistoryListProps {
  historyList: Array<BingoHistory>;
}

export interface BingoHistory {
  isWin: boolean;
  detailList: Array<{
    title: string;
    content: string;
  }>;
}

export const Themes = {
  win: {
    tagBgColor: '#C5DFFF',
    textColor: '2E6BC7',
  },
  loss: {
    tagBgColor: '#FFCB9B',
    textColor: 'D63333',
  },
};

export interface HistoryItemTheme {
  tagBgColor: string;
  textColor: string;
}
