import styles from '../pages/PlanSelectionPage.module.css';

/**
 * Mirrors the layout of PlanSelectionPage / AdminPlanSelectionPage (hero card,
 * current-selection banner, plan grid, terms block, and the overview sidebar)
 * so the loading state occupies the same regions the real content will.
 */
export function PlanSelectionSkeleton() {
  return (
    <>
      <div className={styles.heroCard}>
        <div className={styles.skeletonBar} style={{ width: '55%', height: 20 }} />
        <div className={styles.skeletonBar} style={{ width: '85%', height: 12, marginTop: 10 }} />
      </div>

      <div className={styles.twoCol}>
        <section className={styles.colContent}>
          {/* Current selection */}
          <div className={styles.sectionCard}>
            <div className={styles.skeletonBar} style={{ width: '30%', height: 12 }} />
            <div className={styles.selectedPlanHero} style={{ borderColor: 'var(--color-border)' }}>
              <div style={{ flex: 1 }}>
                <div className={styles.skeletonBar} style={{ width: '25%', height: 9 }} />
                <div
                  className={styles.skeletonBar}
                  style={{ width: '50%', height: 16, marginTop: 8 }}
                />
                <div
                  className={styles.skeletonBar}
                  style={{ width: '35%', height: 10, marginTop: 8 }}
                />
              </div>
              <div
                className={styles.skeletonBar}
                style={{ width: 70, height: 24, borderRadius: 999 }}
              />
            </div>
          </div>

          {/* Plan list */}
          <div className={styles.sectionCard}>
            <div className={styles.skeletonBar} style={{ width: '40%', height: 12 }} />
            <div className={styles.planGrid}>
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={styles.planCard}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className={styles.skeletonBar} style={{ width: '70%', height: 12 }} />
                  <div
                    className={styles.skeletonBar}
                    style={{ width: '45%', height: 18, marginTop: 6 }}
                  />
                </div>
              ))}
            </div>
            <div
              className={styles.skeletonBar}
              style={{ width: '100%', height: 40, borderRadius: 8 }}
            />
            <div
              className={styles.skeletonBar}
              style={{ width: '100%', height: 56, borderRadius: 12 }}
            />
          </div>

          {/* Terms */}
          <div className={styles.sectionCard}>
            <div className={styles.skeletonBar} style={{ width: '35%', height: 12 }} />
            <div className={styles.skeletonBar} style={{ width: '100%', height: 10 }} />
            <div className={styles.skeletonBar} style={{ width: '95%', height: 10 }} />
            <div className={styles.skeletonBar} style={{ width: '80%', height: 10 }} />
          </div>
        </section>

        <aside className={styles.colOverview}>
          <div className={styles.overviewCard} style={{ borderColor: 'var(--color-border)' }}>
            <div className={styles.overviewHero} style={{ background: 'var(--color-bg-alt)' }}>
              <div
                className={styles.skeletonBar}
                style={{ width: 64, height: 64, borderRadius: '50%' }}
              />
              <div style={{ flex: 1 }}>
                <div className={styles.skeletonBar} style={{ width: '65%', height: 16 }} />
                <div
                  className={styles.skeletonBar}
                  style={{ width: '35%', height: 10, marginTop: 10 }}
                />
              </div>
            </div>
            <div className={styles.enrollDetails}>
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={styles.enrollRow}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className={styles.skeletonBar} style={{ width: '30%', height: 10 }} />
                  <div className={styles.skeletonBar} style={{ width: '35%', height: 10 }} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default PlanSelectionSkeleton;
