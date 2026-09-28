import { StatusBadge } from '@/shared/components/ui';
import styles from './LiveActivityFeed.module.css';

interface ActivityItem {
  member: string;
  action: string;
  time: string;
  status: string;
}

const FEED: ActivityItem[] = [
  { member: 'Maria Johnson', action: 'Enrollment submitted', time: '2 min ago', status: 'Pending Underwriting' },
  { member: 'James Williams', action: 'Questions answered', time: '8 min ago', status: 'Answer Received' },
  { member: 'Robert Chen', action: 'Signature received', time: '15 min ago', status: 'Ready to Activate' },
  { member: 'Linda Patel', action: 'Plan approved', time: '22 min ago', status: 'Pending Signature' },
  { member: 'Michael Kim', action: 'Policy activated', time: '35 min ago', status: 'Active' },
  { member: 'Sarah Anderson', action: 'Declined — pre-existing', time: '1h ago', status: 'Declined by UW' },
];

export function LiveActivityFeed() {
  return (
    <div className={styles.card}>
      <div className={styles.title}>Live Activity</div>
      <div className={styles.list}>
        {FEED.map((item, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.text}>
              <span className={styles.textBold}>{item.member}</span> — {item.action}
            </div>
            <StatusBadge status={item.status} />
            <span className={styles.time}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}




