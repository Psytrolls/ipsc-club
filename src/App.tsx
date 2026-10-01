import {useClubTools} from "./hooks/useClubTools";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useApp } from "./context/AppContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { ToastContainer } from "./components/common/ToastContainer";
import { Hero } from "./components/public/Hero";
import { AboutSection } from "./components/public/AboutSection";
import { NewsSection } from "./components/public/NewsSection";
import { SportSection } from "./components/public/SportSection";
import { FAQSection } from "./components/public/FAQSection";
import { CourseModal } from "./components/modals/CourseModal";
import { JoinModal } from "./components/modals/JoinModal";
import { ActivationLinkModal } from "./components/modals/ActivationLinkModal";
import { LoginModal } from "./components/modals/LoginModal";
import { ForcePasswordChangeModal } from "./components/modals/ForcePasswordChangeModal";
const ShooterDashboard = lazy(() =>
  import("./components/shooter/ShooterDashboard").then((m) => ({
    default: m.ShooterDashboard,
  })),
);
const InstructorDashboard = lazy(() =>
  import("./components/instructor/InstructorDashboard").then((m) => ({
    default: m.InstructorDashboard,
  })),
);
const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);

export const AppContent: React.FC = () => {
  useClubTools();
  const { activeRole, currentUser } = useApp();
  const [publicView, setPublicView] = useState(true);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  useEffect(() => {
    setPublicView(!currentUser);
  }, [currentUser?.id]);
  useEffect(() => {
    if (publicView && pendingSection) {
      document
        .getElementById(pendingSection)
        ?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
      setPendingSection(null);
    }
  }, [publicView, pendingSection]);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(() => window.location.hash.startsWith("#activate="));
  useEffect(() => {
    const activate = () => { if (window.location.hash.startsWith("#activate=")) setLoginModalOpen(true); };
    window.addEventListener('hashchange', activate);
    return () => window.removeEventListener('hashchange', activate);
  }, []);
  const [currentSection, setCurrentSection] = useState("hero");

  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId);
    setPublicView(true);
    setPendingSection(sectionId);
  };

  return (
    <div className="falcon-app min-h-screen font-rubik flex flex-col">
      <a href="#main-content" className="skip-link">
        דילוג לתוכן
      </a>
      {/* 2. Global Header */}
      <Header
        onOpenCourseModal={() => setCourseModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        currentPublicSection={currentSection}
        onNavigateSection={scrollToSection}
        publicView={publicView}
        onShowPublic={() => setPublicView(true)}
        onShowDashboard={() => setPublicView(false)}
      />

      {/* 3. Main Body based on Role */}
      <main
        id="main-content"
        className={`flex-1 ${publicView ? "public-view" : "workspace-view"}`}
      >
        <Suspense
          fallback={
            <div className="falcon-container empty-state">
              טוען את האזור האישי…
            </div>
          }
        >
          {publicView && (
            <div>
              <Hero
                onOpenCourseModal={() => setCourseModalOpen(true)}
                onOpenJoinModal={() => setJoinModalOpen(true)}
              />
              <AboutSection />
              <SportSection />
              <NewsSection />
              <FAQSection />
            </div>
          )}

          {!publicView && activeRole === "shooter" && <ShooterDashboard />}

          {!publicView && activeRole === "instructor" && (
            <InstructorDashboard />
          )}

          {!publicView && activeRole === "admin" && <AdminDashboard />}
        </Suspense>
      </main>

      {/* 4. Footer (shown on public pages and accessible) */}
      {publicView && (
        <Footer
          onOpenCourseModal={() => setCourseModalOpen(true)}
          onOpenJoinModal={() => setJoinModalOpen(true)}
        />
      )}

      {/* 5. Lead & Auth Modals */}
      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
      />

      <JoinModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <div className="demo-ribbon">
        Desert Falcon · התשלום מתבצע במקום בלבד
      </div>
      {/* 6. Notifications Toast Container */}
      <ToastContainer />
      <ActivationLinkModal />
      <ForcePasswordChangeModal />
    </div>
  );
};

export function App() {
  return <AppContent />;
}

export default App;
