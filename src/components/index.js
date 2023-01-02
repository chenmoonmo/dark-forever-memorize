import React, { useMemo, useCallback } from 'react';
import classnames from 'classnames';
import styles from './index.less';

export * from './button';
export * from './input';

export function Text({ className, numberOfLines, style, onPress, ...others }) {
  return (
    <span
      className={classnames(
        styles.text,
        className,
        numberOfLines && styles['numberOfLine' + numberOfLines]
      )}
      onClick={onPress}
      {...others}
    />
  );
}

export function View({ className, ...others }) {
  return <div className={classnames(styles.view, className)} {...others} />;
}

export function TouchableOpacity({
  activeOpacity,
  className,
  onPress,
  onLongPress,
  ...others
}) {
  let state = useMemo(() => ({}));

  const handleMouseDown = useCallback(() => {
    state.timer = setTimeout(() => {
      onLongPress();
    }, 1500);
  }, [onLongPress]);
  const HandleMouseUp = useCallback(() => {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }, [onLongPress]);
  return (
    <div
      className={classnames(styles.touchable, className)}
      onClick={onPress}
      {...others}
      onMouseDown={handleMouseDown}
      onMouseUp={HandleMouseUp}
      role="button"
    />
  );
}

export const ScrollView = React.forwardRef(function ScrollView(
  {
    className,
    children,
    contentContainerClassName,
    horizontal,
    bounces = true,
    ...others
  },
  ref
) {
  return (
    <div
      className={classnames(
        horizontal ? styles.scrollViewH : styles.scrollView,
        bounces && styles.bounces,
        className
      )}
      {...others}
      role="button"
      ref={ref}
    >
      <div
        className={classnames(
          horizontal ? styles.scrollViewContentH : styles.scrollViewContent,
          contentContainerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
});

const StaticRender = React.memo(function StaticRender({ render, data }) {
  return render(data);
});

export function ListView({
  enableEmptySections,
  dataSource,
  renderFooter,
  renderRow,
  ...others
}) {
  return (
    <ScrollView {...others}>
      {dataSource &&
        dataSource.map((v) => (
          <StaticRender render={renderRow} data={v}></StaticRender>
        ))}
      <StaticRender render={renderFooter} />
    </ScrollView>
  );
}

ListView.DataSource = class DataSource {
  constructor() {}

  cloneWithRows(rows) {
    return [...rows];
  }
};

export function Switch({ value, onValueChange }) {
  const handleChange = React.useCallback((ev) => {
    onValueChange(ev.currentTarget.checked);
  });
  return <input type="checkbox" checked={value} onChange={handleChange} />;
}
