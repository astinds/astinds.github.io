// COGNITIVE INSIGHT ENGINE - Enhanced Knowledge Base
// Version 3.0 - Comprehensive Psychological Lexicon

const KNOWLEDGE_BASE = {
  // ========== TIERED LEXICON ==========
  lexicon: {
    // === ABSOLUTIST THINKING ===
    "always": {
      category: "absolutist",
      subcategory: "temporal_absolutism",
      weight: 2.5,
      intensity: "high",
      modifiers: ["temporal", "universal"],
      contradicts: ["sometimes", "occasionally", "rarely"],
      reinforces: ["never", "every", "everyone"],
      emotional_valence: -0.3,
      clinical_note: "Rigid temporal generalization"
    },
    
    "never": {
      category: "absolutist",
      subcategory: "temporal_absolutism",
      weight: 2.5,
      intensity: "high",
      modifiers: ["temporal", "universal"],
      contradicts: ["sometimes", "often", "usually"],
      reinforces: ["always", "nobody", "nothing"],
      emotional_valence: -0.4,
      clinical_note: "Pessimistic universal negation"
    },
    
    "everything": {
      category: "absolutist",
      subcategory: "binary_thinking",
      weight: 2.2,
      intensity: "high",
      modifiers: ["quantitative", "universal"],
      contradicts: ["some", "few", "partial"],
      reinforces: ["nothing", "all", "completely"],
      emotional_valence: -0.2,
      clinical_note: "Overgeneralization tendency"
    },
    
    "nothing": {
      category: "absolutist",
      subcategory: "binary_thinking",
      weight: 2.4,
      intensity: "high",
      modifiers: ["quantitative", "negation"],
      contradicts: ["something", "anything"],
      reinforces: ["everything", "all"],
      emotional_valence: -0.5,
      clinical_note: "Hopelessness indicator"
    },
    
    // === IMPERATIVE/CONTROL ===
    "should": {
      category: "imperative",
      weight: 3.0,
      intensity: "moderate",
      context_required: true,
      valid_contexts: {
        "i_should": { weight: 4.0, subcategory: "self_directed" },
        "you_should": { weight: 2.5, subcategory: "other_directed" },
        "should_have": { weight: 5.0, subcategory: "regret_focus" },
        "should_not": { weight: 3.5, subcategory: "prohibitive" }
      },
      emotional_valence: -0.6,
      clinical_note: "Internalized expectations"
    },
    
    "must": {
      category: "imperative",
      weight: 3.5,
      intensity: "high",
      context_required: false,
      emotional_valence: -0.7,
      clinical_note: "High pressure self-talk"
    },
    
    "have_to": {
      category: "imperative",
      weight: 2.8,
      intensity: "moderate",
      context_required: true,
      emotional_valence: -0.5,
      clinical_note: "Perceived obligations"
    },
    
    // === CATASTROPHIZING ===
    "disaster": {
      category: "catastrophizing",
      weight: 4.0,
      intensity: "high",
      modifiers: ["extreme", "negative"],
      reinforces: ["terrible", "worst", "horrible"],
      emotional_valence: -0.9,
      clinical_note: "Extreme negative forecasting"
    },
    
    "terrible": {
      category: "catastrophizing",
      weight: 3.2,
      intensity: "high",
      modifiers: ["emotional", "extreme"],
      reinforces: ["awful", "horrible", "disaster"],
      emotional_valence: -0.8,
      clinical_note: "Magnified negative appraisal"
    },
    
    "worst": {
      category: "catastrophizing",
      weight: 3.5,
      intensity: "high",
      modifiers: ["comparative", "extreme"],
      contradicts: ["best", "good", "okay"],
      emotional_valence: -0.7,
      clinical_note: "Comparative extreme thinking"
    },
    
    // === SELF-CRITICISM ===
    "failure": {
      category: "self_critic",
      weight: 3.8,
      intensity: "high",
      modifiers: ["self_evaluative", "global"],
      reinforces: ["useless", "incompetent", "worthless"],
      emotional_valence: -0.8,
      temporal_sensitivity: true,
      clinical_note: "Global negative self-assessment"
    },
    
    "stupid": {
      category: "self_critic",
      weight: 3.0,
      intensity: "moderate",
      modifiers: ["self_evaluative", "cognitive"],
      reinforces: ["dumb", "idiot", "foolish"],
      emotional_valence: -0.7,
      clinical_note: "Cognitive self-criticism"
    },
    
    "useless": {
      category: "self_critic",
      weight: 3.5,
      intensity: "high",
      modifiers: ["self_evaluative", "worth"],
      reinforces: ["worthless", "hopeless", "pointless"],
      emotional_valence: -0.8,
      clinical_note: "Worth-based self-criticism"
    },
    
    // === PERSONALIZATION ===
    "my_fault": {
      category: "personalization",
      weight: 4.0,
      intensity: "high",
      requires_agency: true,
      modifiers: ["self_blame", "causality"],
      emotional_valence: -0.7,
      clinical_note: "Excessive self-blame attribution"
    },
    
    "because_of_me": {
      category: "personalization",
      weight: 3.5,
      intensity: "moderate",
      requires_agency: true,
      modifiers: ["causal_attribution"],
      emotional_valence: -0.6,
      clinical_note: "Causal self-attribution"
    },
    
    // === MIND READING ===
    "they_think": {
      category: "mind_reading",
      weight: 2.5,
      intensity: "moderate",
      requires_agency: false,
      modifiers: ["assumptive", "social"],
      emotional_valence: -0.4,
      clinical_note: "Assuming others' thoughts"
    },
    
    "probably_thinks": {
      category: "mind_reading",
      weight: 2.2,
      intensity: "moderate",
      requires_agency: false,
      modifiers: ["assumptive", "speculative"],
      emotional_valence: -0.3,
      clinical_note: "Speculative mind reading"
    },
    
    // === EMOTIONAL REASONING ===
    "feel_like": {
      category: "emotional_reasoning",
      weight: 2.0,
      intensity: "low",
      requires_agency: true,
      modifiers: ["emotion_based", "subjective"],
      emotional_valence: -0.2,
      clinical_note: "Emotion-as-evidence thinking"
    }
  },

  // ========== COGNITIVE PATTERN TAXONOMY ==========
  patterns: {
    "absolutist": {
      name: "All-or-Nothing Thinking",
      driver: "control",
      severity_threshold: 3,
      weight_multiplier: 1.2,
      sub_patterns: {
        "temporal_absolutism": ["always", "never", "forever", "constantly"],
        "binary_thinking": ["everything", "nothing", "all", "none"],
        "certainty_inflation": ["definitely", "absolutely", "certainly", "surely"]
      },
      clinical_correlation: "Dichotomous reasoning (Beck, 1976) - Black/white thinking",
      mitigation_strategy: "Practice gradient thinking: 'Sometimes X happens when Y'",
      escalation_path: "absolutist → rigid_perfectionism → anxiety_spiral"
    },
    
    "imperative": {
      name: "Imperative Thinking",
      driver: "validation",
      severity_threshold: 2,
      weight_multiplier: 1.3,
      sub_patterns: {
        "self_imperative": ["should", "must", "ought", "have_to"],
        "other_imperative": ["you_should", "they_must", "people_ought"],
        "regret_focus": ["should_have", "could_have", "would_have"]
      },
      clinical_correlation: "Internalized 'shoulds' from societal expectations (Ellis, 1957)",
      mitigation_strategy: "Replace 'should' with 'could' or 'prefer'",
      escalation_path: "imperative → guilt → self_criticism"
    },
    
    "catastrophizing": {
      name: "Catastrophic Thinking",
      driver: "safety",
      severity_threshold: 2,
      weight_multiplier: 1.5,
      markers: ["disaster", "terrible", "worst", "ruined", "horrible", "awful"],
      intensity_multiplier: 1.5,
      co_occurrence: ["anxiety", "doom", "fear"],
      typical_contexts: ["future_projection", "outcome_prediction", "risk_assessment"],
      clinical_correlation: "Probability overestimation of negative outcomes",
      mitigation_strategy: "Reality testing: 'What's the actual probability?'",
      escalation_path: "catastrophizing → anxiety → avoidance"
    },
    
    "self_critic": {
      name: "Self-Critical Thinking",
      driver: "validation",
      severity_threshold: 2,
      weight_multiplier: 1.4,
      markers: ["failure", "stupid", "useless", "incompetent", "worthless"],
      requires_agency: true,
      contradicts: "self_compassion",
      co_occurrence: ["shame", "guilt", "inadequacy"],
      clinical_correlation: "Negative self-schema reinforcement",
      mitigation_strategy: "Self-compassion practice: 'What would I say to a friend?'",
      escalation_path: "self_critic → shame → depression"
    },
    
    "personalization": {
      name: "Personalization",
      driver: "responsibility",
      severity_threshold: 1,
      weight_multiplier: 1.3,
      markers: ["my_fault", "because_of_me", "i_caused", "blame_myself"],
      requires_agency: true,
      contradicts: "externalization",
      clinical_correlation: "Excessive self-attribution for external events",
      mitigation_strategy: "External attribution consideration: 'What other factors contributed?'",
      escalation_path: "personalization → guilt → anxiety"
    },
    
    "mind_reading": {
      name: "Mind Reading",
      driver: "validation",
      severity_threshold: 2,
      weight_multiplier: 1.1,
      markers: ["they_think", "probably_thinks", "everyone_thinks", "must_think"],
      requires_agency: false,
      clinical_correlation: "Assumption of negative evaluation by others",
      mitigation_strategy: "Behavioral experiment: 'Test if your assumption is true'",
      escalation_path: "mind_reading → social_anxiety → isolation"
    },
    
    "emotional_reasoning": {
      name: "Emotional Reasoning",
      driver: "certainty",
      severity_threshold: 2,
      weight_multiplier: 1.1,
      markers: ["feel_like", "feels_as_if", "emotion_tells"],
      requires_agency: true,
      clinical_correlation: "Mistaking feelings for facts (Beck, 1979)",
      mitigation_strategy: "Separate feeling from fact: 'I feel X, but the evidence shows Y'",
      escalation_path: "emotional_reasoning → distorted_beliefs → mood_congruent_memory"
    }
  },

  // ========== CORE PSYCHOLOGICAL DRIVERS ==========
  drivers: {
    "control": {
      name: "Control & Certainty",
      root: "Security/Predictability",
      insight: "Absolute language often reflects attempts to impose order on uncertain situations.",
      manifestations: ["perfectionism", "rigidity", "planning_obsession", "certainty_seeking"],
      healthy_expression: "Structured goal-setting, preparation",
      unhealthy_expression: "Paralysis from over-planning, intolerance of ambiguity",
      therapeutic_direction: "Acceptance of uncertainty, flexible thinking",
      conflicts_with: ["acceptance", "flexibility"],
      related_needs: ["safety", "predictability", "order"]
    },
    
    "validation": {
      name: "Validation & Worth",
      root: "Social Worth/Acceptance",
      insight: "Imperative and self-critical language may indicate internalized external standards.",
      manifestations: ["people_pleasing", "approval_seeking", "comparison", "self_criticism"],
      healthy_expression: "Self-validation, healthy feedback seeking",
      unhealthy_expression: "Codependency, imposter syndrome, chronic self-doubt",
      therapeutic_direction: "Intrinsic self-worth, boundary setting",
      conflicts_with: ["autonomy", "self_compassion"],
      related_needs: ["belonging", "acceptance", "recognition"]
    },
    
    "safety": {
      name: "Safety & Protection",
      root: "Threat Avoidance/Security",
      insight: "Catastrophic thinking often reflects underlying safety concerns and threat detection.",
      manifestations: ["catastrophizing", "anxiety", "avoidance", "hypervigilance"],
      healthy_expression: "Appropriate caution, risk assessment",
      unhealthy_expression: "Chronic worry, avoidance behaviors, threat magnification",
      therapeutic_direction: "Risk recalibration, exposure, safety behaviors examination",
      conflicts_with: ["exploration", "growth"],
      related_needs: ["protection", "stability", "predictability"]
    },
    
    "responsibility": {
      name: "Responsibility & Agency",
      root: "Moral Accountability/Causality",
      insight: "Personalization suggests an exaggerated sense of personal responsibility.",
      manifestations: ["over-responsibility", "guilt", "self-blame", "burden_carrying"],
      healthy_expression: "Appropriate accountability, ethical action",
      unhealthy_expression: "Excessive guilt, martyr complex, burnout",
      therapeutic_direction: "Realistic responsibility boundaries, shared accountability",
      conflicts_with: ["self_compassion", "delegation"],
      related_needs: ["efficacy", "contribution", "ethics"]
    },
    
    "autonomy": {
      name: "Autonomy & Self-Determination",
      root: "Self-Governance/Independence",
      insight: "Language emphasizing independence suggests need for self-governance.",
      manifestations: ["boundary_setting", "refusal_language", "self_assertion", "independence"],
      healthy_expression: "Healthy boundaries, self-direction",
      unhealthy_expression: "Rebellion without cause, isolation, difficulty with interdependence",
      therapeutic_direction: "Balanced autonomy with connection",
      conflicts_with: ["connection", "compliance"],
      related_needs: ["freedom", "choice", "self_expression"]
    }
  },

  // ========== PATTERN RELATIONSHIP GRAPH ==========
  pattern_relationships: {
    "absolutist": {
      reinforces: ["catastrophizing", "imperative", "self_critic"],
      conflicts_with: ["uncertainty_tolerance", "flexible_thinking"],
      escalation_path: "absolutist → rigid_perfectionism → anxiety_spiral",
      mitigation_pair: ["gradient_thinking", "flexibility"],
      clinical_note: "Often comorbid with anxiety disorders"
    },
    
    "self_critic": {
      reinforces: ["personalization", "imperative"],
      driven_by: ["validation", "perfectionism"],
      protective_function: "Pre-emptive self-punishment to avoid external criticism",
      escalation_path: "self_critic → shame → depression",
      mitigation_pair: ["self_compassion", "self_forgiveness"],
      clinical_note: "Strong correlation with depression"
    },
    
    "catastrophizing": {
      reinforces: ["anxiety", "avoidance"],
      driven_by: ["safety", "uncertainty_intolerance"],
      escalation_path: "catastrophizing → anxiety → avoidance → isolation",
      mitigation_pair: ["reality_testing", "probability_assessment"],
      clinical_note: "Core feature of Generalized Anxiety Disorder"
    },
    
    "imperative": {
      reinforces: ["self_critic", "guilt"],
      driven_by: ["validation", "perfectionism"],
      escalation_path: "imperative → pressure → burnout → resentment",
      mitigation_pair: ["preference_language", "self_compassion"],
      clinical_note: "Linked to external locus of control"
    }
  },

  // ========== TEMPORAL & INTENSITY MARKERS ==========
  temporal_markers: {
    past_focus: {
      words: ["was", "had", "used_to", "before", "previously", "earlier", "past"],
      psychological_implication: "Rumination, regret focus",
      therapeutic_approach: "Present-moment focus"
    },
    present_focus: {
      words: ["is", "am", "now", "currently", "today", "present"],
      psychological_implication: "Mindfulness capacity",
      therapeutic_approach: "Leverage for grounding"
    },
    future_focus: {
      words: ["will", "going_to", "might", "could", "future", "tomorrow", "later"],
      psychological_implication: "Anxiety/worry or hope/planning",
      therapeutic_approach: "Distinguish between productive planning vs worry"
    }
  },

  amplifiers: {
    extreme: ["very", "extremely", "completely", "totally", "utterly", "absolutely"],
    moderate: ["really", "quite", "particularly", "especially"],
    emotional: ["horribly", "terribly", "awfully", "dreadfully"]
  },

  diminishers: {
    uncertainty: ["somewhat", "kind_of", "a_bit", "slightly", "maybe", "perhaps"],
    qualification: ["almost", "nearly", "practically", "virtually"],
    minimization: ["just", "only", "merely", "simply"]
  },

  // ========== NEGATION PATTERNS ==========
  negation_patterns: {
    hard_negation: ["not", "never", "no", "don't", "won't", "can't", "isn't", "wasn't"],
    soft_negation: ["barely", "hardly", "scarcely", "rarely", "seldom"],
    conditional_negation: ["unless", "except", "but", "however", "although"]
  },

  // ========== CONTEXT WINDOW CONFIG ==========
  context_config: {
    window_size: 5,
    semantic_expansion: true,
    parse_modifiers: true,
    detect_negation: true
  }
};

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KNOWLEDGE_BASE;
}
