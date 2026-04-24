import styles from "../page-placeholder.module.scss";

export function Library() {
  return (
    <section className={styles.placeholder}>
      <p className={styles.placeholder__kicker}>Library</p>
      <h1 className={styles.placeholder__title}>Your library</h1>
      <p className={styles.placeholder__dek}>
        Everything you&rsquo;ve saved, in one quiet place.
      </p>
    </section>
  );
}
