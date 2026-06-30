import { SimulationClient } from "@/components/SimulationClient";
import { incentiveRules } from "@/lib/incentive-rules";

export default function IncentiveSimulationPage() {
  return <SimulationClient rules={incentiveRules} />;
}
