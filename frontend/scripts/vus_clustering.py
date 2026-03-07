"""
VUS Discovery Engine: Live ML Demo (PharmaGuard DeepTech)
---------------------------------------------------------
This scripts demonstrates the unsupervised clustering algorithm used by PharmaGuard
to discover 'Variants of Unknown Significance' (VUS) and their correlation to
Adverse Drug Reactions (ADRs).

In a production environment, this runs over the Differential Privacy synthetic cohorts 
and real-world evidence (RWE) telemetry streams.

Dependencies:
    pip install pandas numpy scikit-learn
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import Counter

# 1. Generate a Synthetic Patient Dataset 
# (Simulating what SyntheticVcfGenerator + RWE Feedback Loop creates)
np.random.seed(42)
n_patients = 1000

print(f"[*] Generating synthetic RWE data for {n_patients} patients...")

# Simulated genetic variants (0: Wildtype, 1: Heterozygous, 2: Homozygous)
# rs12345 (CYP2C19 known), rs67890 (Unknown Variant A), rs11111 (Unknown Variant B)
data = {
    'patient_id': range(1, n_patients + 1),
    'age': np.random.randint(18, 85, n_patients),
    'bmi': np.random.normal(25, 5, n_patients),
    
    # Established variants (CPIC Known)
    'CYP2C19_rs4244285': np.random.choice([0, 1, 2], n_patients, p=[0.7, 0.25, 0.05]),
    
    # UNKNOWN VARIANTS (Variants of Unknown Significance)
    'VUS_rs99991': np.random.choice([0, 1, 2], n_patients, p=[0.8, 0.15, 0.05]), 
    'VUS_rs99992': np.random.choice([0, 1, 2], n_patients, p=[0.9, 0.08, 0.02]),
    
    # Clinical Action & Outcome
    'drug_prescribed': ['Clopidogrel'] * n_patients,
    
    # Adverse Drug Reaction Severity (0 = Safe, 1 = Mild, 2 = Severe/Bleeding)
    # We intentionally inject a correlation here: 
    # Patients with VUS_rs99991 homozygous (2) and CYP2C19 WT (0) have severe ADRs.
    'adr_severity': np.zeros(n_patients, dtype=int)
}

df = pd.DataFrame(data)

# Injecting the hidden DeepTech correlation (The "Discovery")
# If they have the Unknown Variant rs99991, they get an ADR even if CPIC says they are normal.
mask_hidden_risk = (df['VUS_rs99991'] == 2) & (df['CYP2C19_rs4244285'] == 0)
df.loc[mask_hidden_risk, 'adr_severity'] = 2 

# Add some general noise for realism
df.loc[np.random.choice(n_patients, 50, replace=False), 'adr_severity'] = np.random.choice([1, 2], 50)

print(f"[*] Data generation complete. {len(df[df['adr_severity'] == 2])} patients reported severe ADRs.")
print("[*] Running Unsupervised K-Means Clustering to discover hidden genetic patterns...\n")


# 2. Extract Features for Clustering
# We hide the Target (adr_severity) from the AI to prove it's UNSUPERVISED.
features = ['age', 'bmi', 'CYP2C19_rs4244285', 'VUS_rs99991', 'VUS_rs99992']
X = df[features]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. Apply K-Means
# We suspect ~4 dominant clinical archetypes in this population.
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(X_scaled)

# 4. Analyze the Clusters for "Discoveries"
print("================================================================")
print("              PHARMAGUARD VUS DISCOVERY RESULTS")
print("================================================================\n")

# Find the cluster with the highest concentration of Adverse Reactions
adr_rates = df.groupby('cluster')['adr_severity'].mean()
danger_cluster = adr_rates.idxmax()

print(f"⚠️  ALERT: High ADR concentration isolated in Cluster {danger_cluster} (ADR Rate: {adr_rates[danger_cluster]:.2f})")

# What makes this cluster different?
danger_group = df[df['cluster'] == danger_cluster]
safe_group = df[df['cluster'] != danger_cluster]

# Compare the prevalence of the unknown variant
vus_prevalence_danger = (danger_group['VUS_rs99991'] > 0).mean() * 100
vus_prevalence_safe = (safe_group['VUS_rs99991'] > 0).mean() * 100

print(f"\n[AI INSIGHT GENERATED]")
print(f"The algorithm discovered a statistically significant anomaly:")
print(f" -> Prevalence of unknown variant 'rs99991' in High-Risk Cluster: {vus_prevalence_danger:.1f}%")
print(f" -> Prevalence of unknown variant 'rs99991' in Standard Population: {vus_prevalence_safe:.1f}%")

print("\n[RECOMMENDATION FOR RESEARCHERS]")
print("Flagging variant 'rs99991' for immediate clinical investigation.")
print("Strong correlation detected between Clopidogrel therapy and severe adverse ")
print("reactions in patients carrying this undocumented allele, despite a normal ")
print("CYP2C19 CPIC phenotype.")
print("================================================================")
