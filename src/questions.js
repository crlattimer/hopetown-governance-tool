// 25-question survey schema for the AI Governance Policy Builder.
// Each section becomes one step in the multi-step form.

export const sections = [
  {
    title: 'Organization Profile',
    questions: [
      {
        id: 'org_name',
        number: 1,
        label: 'Organization name',
        type: 'text',
        required: true,
      },
      {
        id: 'org_type',
        number: 2,
        label: 'Organization type',
        type: 'single',
        required: true,
        options: [
          'Recovery/Behavioral Health Nonprofit',
          'Healthcare Organization',
          'Social Services Nonprofit',
          'Education',
          'Government Agency',
          'Faith-Based Organization',
          'Other Nonprofit',
          'For-Profit Business',
        ],
      },
      {
        id: 'staff_size',
        number: 3,
        label: 'Approximate number of staff',
        type: 'single',
        required: true,
        options: ['1-10', '11-50', '51-200', '200+'],
      },
      {
        id: 'serves_vulnerable',
        number: 4,
        label:
          'Do you serve vulnerable populations such as people in recovery, individuals experiencing housing instability, children, or people with disabilities?',
        type: 'single',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        id: 'protected_data',
        number: 5,
        label: 'Do you handle any protected data?',
        type: 'multi',
        required: true,
        options: [
          'HIPAA (health records)',
          '42 CFR Part 2 (substance use records)',
          'FERPA (education records)',
          'PII but no specific federal framework',
          "We don't handle protected data",
        ],
      },
    ],
  },
  {
    title: 'Current AI Use',
    questions: [
      {
        id: 'ai_deployed',
        number: 6,
        label: 'Have you already deployed any AI tools in your organization?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', "We're just getting started"],
      },
      {
        id: 'current_ai_uses',
        number: 7,
        label: 'If yes, what are you currently using AI for?',
        type: 'multi',
        required: false,
        options: [
          'Internal communications and drafting',
          'Program reporting and grant writing',
          'Client or resident intake and screening',
          'Case management or service coordination',
          'HR and hiring',
          'Training and staff development',
          'Public communications and social media',
          "We haven't deployed anything yet",
        ],
      },
      {
        id: 'personal_accounts',
        number: 8,
        label:
          'Do staff currently use personal AI accounts (like personal ChatGPT or Claude accounts) for work tasks?',
        type: 'single',
        required: true,
        options: ['Yes, commonly', 'Sometimes', 'No', "We don't know"],
      },
      {
        id: 'tech_decision_maker',
        number: 9,
        label: 'Who currently makes decisions about technology in your organization?',
        type: 'single',
        required: true,
        options: [
          'Executive Director or CEO',
          'IT staff or department',
          'A committee',
          'One designated staff member',
          'No one has this role yet',
        ],
      },
      {
        id: 'board_approval',
        number: 10,
        label:
          'Does your board of directors need to approve major technology or policy decisions?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', "We don't have a formal board"],
      },
    ],
  },
  {
    title: 'Intended AI Use',
    questions: [
      {
        id: 'intended_uses',
        number: 11,
        label: 'What do you want to use AI for?',
        type: 'multi',
        required: true,
        options: [
          'Writing and communications',
          'Program data and reporting',
          'Client or resident-facing interactions',
          'Intake screening or eligibility decisions',
          'Internal knowledge management',
          'HR and hiring processes',
          'Financial or operational tasks',
          "We're not sure yet",
        ],
      },
      {
        id: 'affects_clients',
        number: 12,
        label:
          'Do you anticipate using AI in any decisions that directly affect clients, residents, or program participants?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Possibly'],
      },
      {
        id: 'client_facing',
        number: 13,
        label:
          'Will any AI tools be used in interactions directly with the people you serve?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Possibly'],
      },
      {
        id: 'cloud_ai',
        number: 14,
        label: 'Do you plan to use cloud-based AI tools (like Claude, ChatGPT, or similar)?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Both cloud and on-premise'],
      },
      {
        id: 'on_premise',
        number: 15,
        label:
          'Do you have or plan to get on-premise AI infrastructure (local servers running AI models)?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        id: 'tech_capacity',
        number: 16,
        label: "What is your organization's technical capacity?",
        type: 'single',
        required: true,
        options: [
          'We have dedicated IT staff',
          'We have one technically skilled staff member',
          'We rely on volunteers or occasional contractors',
          'We have no technical capacity in-house',
        ],
      },
      {
        id: 'vendors',
        number: 17,
        label:
          'Do you work with external vendors or contractors who might use AI when working with your data?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
  },
  {
    title: 'Risk and Compliance Context',
    questions: [
      {
        id: 'consent_asymmetry',
        number: 18,
        label:
          'Are the people you serve ever in situations where their consent might be influenced by their relationship with your organization — for example, consent tied to housing, services, or program participation?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 'certified_staff',
        number: 19,
        label:
          'Do any of your staff hold professional certifications with their own ethics codes, such as peer recovery supporters, social workers, or licensed counselors?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        id: 'state_regulations',
        number: 20,
        label: 'Are you subject to any state-specific regulations beyond federal requirements?',
        type: 'textarea',
        required: false,
        placeholder:
          'If yes, briefly describe (e.g. Ohio recovery housing certification, state licensing requirements). Leave blank if not applicable.',
      },
      {
        id: 'existing_policies',
        number: 21,
        label:
          'Do you currently have any written policies that would relate to AI — for example, data privacy, acceptable use, or technology policies?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Partial'],
      },
      {
        id: 'past_incidents',
        number: 22,
        label:
          'Have you experienced any data incidents or privacy concerns in the past three years?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Prefer not to say'],
      },
    ],
  },
  {
    title: 'Policy Intent',
    questions: [
      {
        id: 'policy_owner',
        number: 23,
        label: "Who will own and maintain your AI governance policy once it's created?",
        type: 'single',
        required: true,
        options: [
          'Executive Director or CEO',
          'A designated staff member',
          'An IT or compliance team',
          'A committee',
          "We haven't decided yet",
        ],
      },
      {
        id: 'public_policy',
        number: 24,
        label:
          'Do you intend to make your AI governance policy public or share it with funders and peer organizations?',
        type: 'single',
        required: true,
        options: ['Yes', 'No', 'Maybe'],
      },
      {
        id: 'primary_goal',
        number: 25,
        label: 'What is your primary goal for this governance policy?',
        type: 'single',
        required: true,
        options: [
          'Protect the people we serve',
          'Meet funder or regulatory requirements',
          'Guide staff on appropriate AI use',
          'Establish accountability and oversight',
          'All of the above',
          "We're not sure yet",
        ],
      },
    ],
  },
];

export const allQuestions = sections.flatMap((s) => s.questions);

export function emptyAnswers() {
  const a = {};
  for (const q of allQuestions) {
    a[q.id] = q.type === 'multi' ? [] : '';
  }
  return a;
}

export function validateStep(stepIndex, answers) {
  const step = sections[stepIndex];
  const missing = [];
  for (const q of step.questions) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (q.type === 'multi') {
      if (!Array.isArray(v) || v.length === 0) missing.push(q.label);
    } else if (!v || String(v).trim() === '') {
      missing.push(q.label);
    }
  }
  return missing;
}
