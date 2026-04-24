import { ChevronRight } from "lucide-react";
import styles from "./list-group.module.scss";
import classNames from "classnames";

interface ListGroupProps {
  label?: string;
  children: React.ReactNode | React.ReactNode[];
}

export const ListGroup = ({ children, label }: ListGroupProps) => {
  return (
    <section className={styles.listGroup}>
      {label ? <p className={styles.listGroupLabel}>{label}</p> : null}
      {children}
    </section>
  );
};

interface ListGroupItemProps {
  label?: string;
  children?: React.ReactNode;
  detail?: React.ReactNode;
  onClick?: () => void;
  icon?: string;
}

const ListGroupItem = ({
  icon,
  label,
  detail,
  onClick,
  children,
}: ListGroupItemProps) => {
  return (
    <div
      className={classNames(styles.listGroupItem, {
        [styles.listGroupItemClickable]: !!onClick,
        [styles.listGroupItemIcon]: !!icon,
      })}
      onClick={onClick}
    >
      {typeof icon !== "undefined" ? (
        <div className={styles.listGroupItemIcon}></div>
      ) : null}
      {label ? <p className={styles.listGroupItemLabel}>{label}</p> : null}
      {children}
      {(detail ?? onClick) ? (
        <div className={styles.listGroupItemDetail}>
          {detail}
          {onClick ? (
            <span className={styles.listGroupItemDetailChevron}>
              <ChevronRight />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

ListGroup.Item = ListGroupItem;
