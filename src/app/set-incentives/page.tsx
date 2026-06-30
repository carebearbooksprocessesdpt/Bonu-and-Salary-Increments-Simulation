import { SetIncentivesClient } from "@/components/SetIncentivesClient";
import { incentiveRules } from "@/lib/incentive-rules";

export default function SetIncentivesPage() {
  return <SetIncentivesClient initialRules={incentiveRules} />;
}
