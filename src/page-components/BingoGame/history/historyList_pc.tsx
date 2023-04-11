import React from 'react';
import { BingoHistory, HistoryItemTheme, HistoryListProps, Themes } from './model';

export const HistoryListPC = (props: HistoryListProps): React.ReactElement => {
  const { historyList } = props;
  return <div className="history-list-wrapper">{historyList.map((history) => renderHistoryItem(history))}</div>;
};

const renderHistoryItem = (history: BingoHistory): React.ReactElement => {
  const theme: HistoryItemTheme = history.isWin ? Themes.win : Themes.loss;
  return (
    <div className="history-item">
      <div className="history-tag" style={{ backgroundColor: theme.tagBgColor, color: theme.textColor }}>
        {history.isWin ? 'WIN' : 'LOSE'}
      </div>
      <div className="history-details">
        {history.detailList.map((item) => (
          <div className="history-details-cell" key={item.title}>
            <div className="history-details-cell-title">{item.title}</div>
            <div className="history-details-cell-content">{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryListPC;
