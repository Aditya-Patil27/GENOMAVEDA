import rules from "../data/drug-gene-rules.json";

type Phenotype = "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
type Severity = "none" | "low" | "moderate" | "high" | "critical";

export interface RiskResult {
  risk_label: RiskLabel;
  severity: Severity;
  confidence_score: number;
  primary_gene: string;
  recommendation: string;
  dose_adjustment: string;
  alternative_drugs: string[];
  monitoring_required: boolean;
  cpic_strength: "strong" | "moderate" | "optional";
}

const drugRules = rules as Record<
  string,
  {
    gene: string;
    rules: Record<
      string,
      {
        risk_label: string;
        severity: string;
        confidence: number;
        recommendation: string;
        dose_adjustment: string;
        alternatives: string[];
        monitoring: boolean;
        cpic_strength: string;
      }
    >;
  }
>;

export function assessRisk(drug: string, phenotype: Phenotype): RiskResult {
  const drugUpper = drug.toUpperCase().trim();
  const drugData = drugRules[drugUpper];

  if (!drugData) {
    return {
      risk_label: "Unknown",
      severity: "none",
      confidence_score: 0.5,
      primary_gene: "Unknown",
      recommendation: "Drug not in current database. Consult clinical pharmacist.",
      dose_adjustment: "Unknown",
      alternative_drugs: [],
      monitoring_required: true,
      cpic_strength: "optional",
    };
  }

  const ruleSet = drugData.rules[phenotype] || drugData.rules["NM"];

  return {
    risk_label: ruleSet.risk_label as RiskLabel,
    severity: ruleSet.severity as Severity,
    confidence_score: ruleSet.confidence,
    primary_gene: drugData.gene,
    recommendation: ruleSet.recommendation,
    dose_adjustment: ruleSet.dose_adjustment,
    alternative_drugs: ruleSet.alternatives,
    monitoring_required: ruleSet.monitoring,
    cpic_strength: ruleSet.cpic_strength as "strong" | "moderate" | "optional",
  };
}
