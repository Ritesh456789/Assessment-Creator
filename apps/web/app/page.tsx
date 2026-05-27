"use client";

import {
  ArrowLeft,
  Bell,
  BookMarked,
  ChartPie,
  ChevronDown,
  ClipboardList,
  Grid2X2,
  LayoutGrid,
  Menu,
  Plus,
  Settings,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { SchoolAvatar } from '../src/components/avatar/school-avatar';
import { AssessmentWorkspace } from '../src/components/assessment/assessment-workspace';
import { ToastContainer } from '../src/components/toast-container';
import { useAssessmentStore } from '../src/store/assessment-store';
import { useEffect } from 'react';
import { createWorkflowSocket } from '../src/lib/websocket';
import { fetchAssessments } from '../src/lib/api';

const sidebarItems = [
  { icon: Grid2X2, label: 'Home' },
  { icon: UsersRound, label: 'My Groups' },
  { icon: ClipboardList, label: 'Assessments', assessmentList: true },
  { icon: BookMarked, label: "AI Teacher's Toolkit" },
  { icon: ChartPie, label: 'My Library' },
];

const bottomNavItems = [
  { icon: Grid2X2, label: 'Home' },
  { icon: ClipboardList, label: 'Assessments', assessmentList: true },
  { icon: BookMarked, label: 'Library' },
  { icon: Sparkles, label: 'AI Toolkit' },
];

export default function HomePage() {
  const openBuilder = useAssessmentStore((state) => state.openBuilder);
  const openEmpty = useAssessmentStore((state) => state.openEmpty);
  const step = useAssessmentStore((state) => state.step);
  const assessmentCount = useAssessmentStore((state) => state.assessmentCount);
  const setAssessmentCount = useAssessmentStore((state) => state.setAssessmentCount);
  const assessmentListOpen = step === 'empty';

  useEffect(() => {
    const socket = createWorkflowSocket((event) => {
      // React to queue/processing/completion/failure events by refreshing assessments
      if (event.type === 'assessment:queued' || event.type === 'assessment:completed' || event.type === 'assessment:failed') {
        // Update assessment count in the sidebar (use total assessments)
        void (async () => {
          try {
            const records = await fetchAssessments();
            setAssessmentCount(records.filter((a) => a.status === 'completed').length);
          } catch (e) {
            // ignore
          }
        })();

        // Notify other components (like AssessmentWorkspace) to refresh their list
        try {
          window.dispatchEvent(new CustomEvent('assessment:updated', { detail: { type: event.type, data: event.data } }));
        } catch {
          // ignore (SSR or non-browser)
        }
      }
    });

    return () => socket.close();
  }, [setAssessmentCount]);

  return (
    <main className="page-shell">
      <aside className="sidebar desktop-only">
        <div className="brand-row">
          <img className="brand-image brand-image-desktop" src="/brand-desktop.png" alt="AssessAI" />
          <div className="brand-wordmark">AssessAI</div>
        </div>

        <button className="primary-action" style={{ marginBottom: 26 }} aria-label="Create assessment" onClick={openBuilder}>
          <Sparkles size={16} />
          <span>Create Assessment</span>
        </button>

        <nav className="nav-list" aria-label="Primary">
          {sidebarItems.map(({ icon: Icon, label, assessmentList }) => (
            <button
              className={`nav-item ${assessmentList && assessmentListOpen ? 'nav-item-active' : ''}`}
              key={label}
              type="button"
              onClick={assessmentList ? openEmpty : undefined}
            >
              <span className="nav-icon">
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="nav-label">{label}</span>
              {assessmentList && assessmentCount > 0 ? <span className="nav-badge">{assessmentCount}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item settings-item" type="button">
            <span className="nav-icon">
              <Settings size={16} strokeWidth={2} />
            </span>
            <span className="nav-label">Settings</span>
          </button>

          <div className="school-card">
            <div className="school-avatar">
              <SchoolAvatar label="Delhi Public School avatar" size={96} />
            </div>
            <div>
              <div className="school-name">Delhi Public School</div>
              <div className="school-city">Bokaro Steel City</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="content-shell desktop-content">
        <header className="topbar desktop-topbar">
          <button className="topbar-left topbar-back-button" type="button" onClick={openEmpty} aria-label="Back to assessments">
            <ArrowLeft size={22} strokeWidth={2} />
            <div className="topbar-crumb">
              <span className="crumb-icon">
                <LayoutGrid size={15} strokeWidth={2} />
              </span>
              <span>Assessment</span>
            </div>
          </button>

          <div className="topbar-right">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={20} strokeWidth={2} />
              <span className="notification-dot" />
            </button>
            <button className="profile-pill" aria-label="User menu">
              <span className="profile-avatar">
                <SchoolAvatar label="Delhi Public School avatar" size={40} />
              </span>
              <span className="profile-name">School Admin</span>
              <ChevronDown className="profile-caret" size={22} strokeWidth={2} />
            </button>
          </div>
        </header>

        <AssessmentWorkspace variant="desktop" />
      </section>

      <section className="content-shell mobile-content">
        <header className="mobile-topbar">
          <div className="mobile-brand-row">
            <img className="brand-image brand-image-mobile" src="/brand-mobile.png" alt="AssessAI" />
            <div className="brand-wordmark mobile-brand-wordmark">AssessAI</div>
          </div>
          <div className="mobile-topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} strokeWidth={2} />
              <span className="notification-dot" />
            </button>
            <div className="profile-avatar profile-avatar-small">
              <SchoolAvatar label="Delhi Public School avatar" size={32} />
            </div>
            <button className="icon-button" aria-label="Open menu">
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </header>

        <AssessmentWorkspace variant="mobile" />

        {step === 'empty' ? (
          <button className="floating-create-button mobile-fab" aria-label="Create assessment" onClick={openBuilder}>
            <Plus size={20} strokeWidth={1.6} />
          </button>
        ) : null}

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {bottomNavItems.map(({ icon: Icon, label, assessmentList }) => (
            <button
              className={`bottom-nav-item ${assessmentList && assessmentListOpen ? 'bottom-nav-item-active' : ''}`}
              key={label}
              type="button"
              onClick={assessmentList ? openEmpty : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
      <ToastContainer />
    </main>
  );
}
