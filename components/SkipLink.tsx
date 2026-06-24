import styles from "./SkipLink.module.css";

export default function SkipLink() {
  return (
    <a href="#page-content" className={styles.skipLink}>
      Przejdź do treści
    </a>
  );
}
