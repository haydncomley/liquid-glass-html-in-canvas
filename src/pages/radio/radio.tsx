import styles from "../page-placeholder.module.scss";

export function Radio() {
  return (
    <section className={styles.placeholder}>
      <p className={styles.placeholder__kicker}>Radio</p>
      <h1 className={styles.placeholder__title}>Stations &amp; shows</h1>
      <p className={styles.placeholder__dek}>
        Live programming and curated mixes, always on.
      </p>
    </section>
  );
}
