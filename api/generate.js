// POST /api/generate { answers } -> .docx download.
// Calls Anthropic to produce a tailored governance policy JSON, then builds a Word doc.

import Anthropic from '@anthropic-ai/sdk';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageOrientation,
  Footer,
  Header,
  LevelFormat,
  convertInchesToTwip,
} from 'docx';

const MODEL = 'claude-sonnet-4-20250514';
const FONT = 'Arial';

const SYSTEM_PROMPT = `You are an AI governance policy writer helping organizations create their first AI governance policy. You are writing on behalf of Hope Town, a recovery-focused nonprofit in Ohio that has developed expertise in responsible AI use in mission-driven organizations.

Your job is to take an organization's survey answers and produce a tailored AI governance policy document. The policy should feel specific to their organization — not generic. Use their organization name, reference their org type, reflect their data sensitivity, and calibrate the complexity of the policy to their technical capacity and staff size.

TONE AND LANGUAGE:
- Write in plain language that nonprofit leadership can understand without a legal or technical background
- Be direct and practical — this is a working document, not an academic paper
- Do not use jargon unless you define it
- Do not make legal compliance claims or assert that following this policy satisfies any specific regulation
- Be encouraging — most organizations are starting from a good place even if they haven't formalized anything yet
- Mirror the language of recovery-oriented, person-centered, mission-driven work where appropriate to the org type

WHAT YOU ARE PRODUCING:
A JSON object with the following fields. Return ONLY the JSON — no markdown, no code blocks, no preamble, no explanation. The JSON must be valid and parseable.

FIELDS:

org_name: Their organization name exactly as they entered it.

tagline: A single sentence that captures this organization's AI philosophy. Model it on "AI serves recovery. Recovery does not serve AI." but make it specific to their mission and org type. Keep the parallel structure.

executive_summary: 2-3 paragraphs. Introduce what this document is, why the organization is creating it, and what values anchor it. The final sentence must always be: "This policy was generated as a starting point. Hope Town recommends reviewing it with legal counsel and adapting it to your organization's specific needs before formal adoption."

what_is_working: An array of 3-5 strings. If they already have AI deployed or existing policies, acknowledge what they have right. If starting from scratch, name the foundational principles they are starting with.

risk_tier_framework: A string describing a Low/Medium/High risk framework tailored to their org type and data sensitivity. Define what falls into each tier based on their specific answers. Include who approves each tier.

accountability_structure: A string describing who owns AI governance at this organization based on their answers. Use role titles only, not specific names.

resident_or_client_rights: A string describing the rights of the people they serve with respect to AI. Always include: the right to know when AI is being used, the right to refuse without losing services, and the right to ask questions and receive plain-language answers.

consent_considerations: A string. If they serve vulnerable populations or indicated power asymmetry (question 18 = Yes or Sometimes), include substantive discussion of informed consent covering primary and secondary AI exposure. If no power asymmetry, keep this shorter and general.

trauma_informed_considerations: A string, or omit this field entirely if question 4 = No. If included, name SAMHSA's six trauma-informed care principles and apply each one to AI tool use at their organization with one concrete implication per principle.

peer_ethics_note: A string, or omit this field entirely if question 19 = No or Not sure. If included, note that certified staff have existing ethics codes governing confidentiality and that AI governance extends those obligations into the AI domain.

training_recommendations: A string describing a training approach calibrated to their technical capacity and staff size. Always include onboarding for new staff and an annual refresh element.

technical_scaffolding: A string covering approved tools list, personal account ban, vendor due diligence questions, and incident response basics. Calibrate complexity to their technical capacity.

language_harm_note: A string, or omit this field entirely if question 4 = No AND question 5 does not include HIPAA or 42 CFR Part 2. If included, reference the 2025 Journal of Addiction Medicine finding that 35.4% of default LLM responses about substance use contained stigmatizing language and that NIDA Words Matter prompt engineering reduced this by 88%.

regulatory_context: A string naming the specific regulatory frameworks that apply based on their answers. Always include the caveat that this is not legal advice. If they selected 42 CFR Part 2, note that counsel consultation is particularly important.

incident_response: A string describing a three-tier incident response framework with timelines appropriate to their org size. Small orgs (1-50 staff): Low = 5 business days, Medium = 48 hours, High = immediate.

next_steps: An array of 3-5 strings. Prioritized action items based on their answers. Always include at least one training step and one accountability step. Make these specific and actionable.

WHAT TO AVOID:
- Do not invent specific staff names — use role titles only
- Do not assert legal compliance
- Do not produce generic boilerplate — every section should reflect their specific answers
- Do not include fields with null values — omit those fields entirely from the JSON`;

// Ordered list of fields to render, with display titles. Optional fields are skipped if absent.
const FIELD_ORDER = [
  { key: 'tagline', title: 'Our Philosophy', kind: 'tagline' },
  { key: 'executive_summary', title: 'Executive Summary', kind: 'paragraphs' },
  { key: 'what_is_working', title: 'What Is Working', kind: 'bullets' },
  { key: 'risk_tier_framework', title: 'Risk Tier Framework', kind: 'paragraphs' },
  { key: 'accountability_structure', title: 'Accountability Structure', kind: 'paragraphs' },
  { key: 'resident_or_client_rights', title: 'Rights of the People We Serve', kind: 'paragraphs' },
  { key: 'consent_considerations', title: 'Consent Considerations', kind: 'paragraphs' },
  { key: 'trauma_informed_considerations', title: 'Trauma-Informed Considerations', kind: 'paragraphs' },
  { key: 'peer_ethics_note', title: 'Professional Ethics and AI', kind: 'paragraphs' },
  { key: 'training_recommendations', title: 'Training Recommendations', kind: 'paragraphs' },
  { key: 'technical_scaffolding', title: 'Technical Scaffolding', kind: 'paragraphs' },
  { key: 'language_harm_note', title: 'Language and Harm Reduction', kind: 'paragraphs' },
  { key: 'regulatory_context', title: 'Regulatory Context', kind: 'paragraphs' },
  { key: 'incident_response', title: 'Incident Response', kind: 'paragraphs' },
  { key: 'next_steps', title: 'Next Steps', kind: 'bullets' },
];

function safeFilename(name) {
  const cleaned = String(name || 'Organization').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return `${cleaned || 'Organization'}-AI-Governance-Policy.docx`;
}

function extractJson(text) {
  // Claude is instructed to return JSON only, but be defensive against stray text or code fences.
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Empty response from model.');
  // Strip ```json ... ``` or ``` ... ``` wrappers if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  // Find first { ... last }
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response was not valid JSON.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function splitParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+\n/g, '\n').trim())
    .filter(Boolean);
}

function bodyParagraph(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [
      new TextRun({
        text: String(text || ''),
        font: FONT,
        size: 22, // 11pt
      }),
    ],
  });
}

function bulletParagraph(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: String(text || ''),
        font: FONT,
        size: 22,
      }),
    ],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT,
        size: 28, // 14pt
        color: '0A5A62',
      }),
    ],
  });
}

function taglineParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [
      new TextRun({
        text: String(text || ''),
        italics: true,
        font: FONT,
        size: 26, // 13pt
        color: '0A5A62',
      }),
    ],
  });
}

function titlePage(orgName) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    new Paragraph({ children: [new TextRun({ text: '', font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: '', font: FONT })] }),
    new Paragraph({ children: [new TextRun({ text: '', font: FONT })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: String(orgName || 'Organization'),
          bold: true,
          font: FONT,
          size: 48, // 24pt
          color: '0A5A62',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'AI Governance Policy',
          font: FONT,
          size: 36, // 18pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: 'Version 1.0',
          font: FONT,
          size: 28,
          color: '3A5159',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated ${date}`,
          font: FONT,
          size: 22,
          color: '6B7F86',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: 'Prepared with Hope Town · Ohio AI Leadership Summit',
          font: FONT,
          size: 20,
          italics: true,
          color: '6B7F86',
        }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: '', font: FONT })],
      pageBreakBefore: true,
    }),
  ];
}

function buildBodyContent(policy) {
  const children = [];

  // Org banner (top of body) — keep simple, header is the consistent identity.
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: String(policy.org_name || 'Organization'),
          bold: true,
          font: FONT,
          size: 36,
          color: '0A5A62',
        }),
      ],
    }),
  );

  for (const field of FIELD_ORDER) {
    const value = policy[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;

    children.push(sectionHeading(field.title));

    if (field.kind === 'tagline') {
      children.push(taglineParagraph(value));
    } else if (field.kind === 'bullets') {
      const items = Array.isArray(value) ? value : splitParagraphs(value);
      for (const item of items) children.push(bulletParagraph(item));
    } else {
      const paras = splitParagraphs(value);
      if (paras.length === 0) {
        children.push(bodyParagraph(String(value)));
      } else {
        for (const p of paras) children.push(bodyParagraph(p));
      }
    }
  }

  return children;
}

function buildDocument(policy) {
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'Generated at the Ohio AI Leadership Summit · Hope Town · hopetown.org',
            font: FONT,
            size: 18, // 9pt
            color: '6B7F86',
          }),
        ],
      }),
    ],
  });

  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${policy.org_name || 'Organization'} · AI Governance Policy v1.0`,
            font: FONT,
            size: 18,
            color: '6B7F86',
          }),
        ],
      }),
    ],
  });

  return new Document({
    creator: 'Hope Town · AI Governance Policy Builder',
    title: `${policy.org_name || 'Organization'} AI Governance Policy v1.0`,
    description: 'Generated AI governance policy.',
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22 },
        },
        heading1: {
          run: { font: FONT, size: 28, bold: true, color: '0A5A62' },
          paragraph: { spacing: { before: 320, after: 140 } },
        },
        title: {
          run: { font: FONT, size: 48, bold: true, color: '0A5A62' },
          paragraph: { spacing: { after: 200 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      // Title page — no header on this page for a cleaner look.
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
          titlePage: true,
        },
        footers: { default: footer },
        headers: { first: new Header({ children: [new Paragraph({ children: [new TextRun({ text: '', font: FONT })] })] }) },
        children: titlePage(policy.org_name),
      },
      // Body — header + footer on every page.
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: buildBodyContent(policy),
      },
    ],
  });
}

function answersAsUserMessage(answers) {
  // Sending as a clear JSON block keeps the model's job unambiguous.
  return `Here are the organization's survey answers as JSON. Produce the policy JSON as specified.\n\n${JSON.stringify(
    answers,
    null,
    2,
  )}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is not configured. Missing ANTHROPIC_API_KEY.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }
  const answers = body && body.answers;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Missing answers.' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let policy;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: answersAsUserMessage(answers) }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('Model returned no text content.');
    policy = extractJson(textBlock.text);
  } catch (err) {
    console.error('Anthropic generation failed:', err);
    const friendly =
      'We weren\'t able to generate your policy right now. Please try again in a moment.';
    return res.status(502).json({ error: friendly });
  }

  // Ensure org_name carries through even if the model omitted it.
  if (!policy.org_name && answers.org_name) policy.org_name = answers.org_name;

  try {
    const doc = buildDocument(policy);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename(policy.org_name)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Docx build failed:', err);
    return res.status(500).json({ error: 'Unable to build document. Please try again.' });
  }
}
