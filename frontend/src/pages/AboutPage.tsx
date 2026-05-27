import PageShell from '../components/PageShell';
import SubPageHeader from '../components/SubPageHeader';
import styles from './AboutPage.module.css';

const infoCards = [
  'Fakulteta za elektrotehniko, računalništvo in informatiko',
  'Univerza v Mariboru',
  'Študijski prostori, laboratoriji in predavalnice',
];

function AboutPage() {
  return (
    <PageShell>
      <SubPageHeader title="O FERI" fallbackTo="/" />

      <section className={styles.content}>
        <div className={styles.heroCard}>
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?w=1000"
            alt="FERI"
            className={styles.heroImage}
          />
        </div>

        <p className={styles.lead}>
          FERI je Fakulteta za elektrotehniko, računalništvo in informatiko Univerze v Mariboru.
          Fakulteta združuje študijske programe, raziskovalno delo, laboratorije, predavalnice in
          druge prostore, ki jih uporabljajo študenti, zaposleni in obiskovalci.
        </p>

        <div className={styles.infoCardsList}>
          {infoCards.map((text) => (
            <div key={text} className={styles.infoCard}>
              <span className={styles.infoCardText}>{text}</span>
            </div>
          ))}
        </div>

        <p className={styles.footerText}>
          Aplikacija FERI Navigator je namenjena lažjemu iskanju učilnic, laboratorijev, pisarn in
          drugih pomembnih točk znotraj objektov fakultete.
        </p>
      </section>
    </PageShell>
  );
}

export default AboutPage;
