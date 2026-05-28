import type { PropsWithChildren } from 'react';
import styles from './PageShell.module.css';

function PageShell({ children }: PropsWithChildren) {
  return (
    <main className={styles.pageShell}>
      <section className={styles.phoneCanvas}>{children}</section>
    </main>
  );
}

export default PageShell;
