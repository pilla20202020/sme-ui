import { useState } from 'react';
import type { Enrollment } from '@/domains/enrollments/types';

export function useDrawer() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCase, setDrawerCase] = useState<Enrollment | null>(null);
  const [drawerTab, setDrawerTab] = useState('overview');

  function openDrawer(enrollment: Enrollment) {
    setDrawerCase(enrollment);
    setDrawerTab('overview');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return { drawerOpen, drawerCase, setDrawerCase, drawerTab, setDrawerTab, openDrawer, closeDrawer };
}




