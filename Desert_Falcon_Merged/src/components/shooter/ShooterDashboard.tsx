import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ShooterOverview } from "./ShooterOverview";
import { ShooterTrainings, TrainingDetailsModal } from "./ShooterTrainings";
import { ShooterProgress } from "./ShooterProgress";
import { ShooterFeedback } from "./ShooterFeedback";
import { ShooterProfile } from "./ShooterProfile";
import { BottomNav, ShooterTab } from "../common/BottomNav";

export const ShooterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ShooterTab>("overview");
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(
    null,
  );
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );

  const handleOpenTrainingDetails = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
  };

  const handleOpenFeedbackDetails = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setActiveTab("results"); // Or custom feedback view
  };

  const { currentUser } = useApp();
  if (!currentUser || currentUser.membershipStatus !== "active")
    return (
      <div className="membership-empty falcon-container">
        <div className="eyebrow">האזור האישי</div>
        <h1>החברות במועדון אינה פעילה</h1>
        <p>
          לוח האימונים וההרשמה זמינים לחברי מועדון פעילים בלבד. יש לפנות למנהל
          המועדון.
        </p>
      </div>
    );
  return (
    <div className="member-shell falcon-container">
      {activeTab === "overview" && (
        <ShooterOverview
          onSelectTab={setActiveTab}
          onOpenTrainingDetails={handleOpenTrainingDetails}
          onOpenFeedbackDetails={handleOpenFeedbackDetails}
        />
      )}

      {activeTab === "trainings" && (
        <ShooterTrainings onOpenTrainingDetails={handleOpenTrainingDetails} />
      )}

      {activeTab === "results" && (
        <div className="member-results space-y-6">
          <ShooterProgress />
          <ShooterFeedback selectedFeedbackId={selectedFeedbackId} />
        </div>
      )}

      {activeTab === "profile" && <ShooterProfile />}

      {/* Training details modal */}
      <TrainingDetailsModal
        trainingId={selectedTrainingId}
        onClose={() => setSelectedTrainingId(null)}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
};
