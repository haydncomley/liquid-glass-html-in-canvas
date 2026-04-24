import React from "react";
import styles from "./page.module.scss";

interface PageProps {
  children: React.ReactNode | React.ReactNode[];
}

export const Page = ({ children }: PageProps) => {
  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>{children}</div>
    </div>
  );
};
