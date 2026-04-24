import styles from "./title.module.scss";

interface TitleProps {
  label: string;
}

export const Title = ({ label }: TitleProps) => {
  return <p className={styles.title}>{label}</p>;
};
