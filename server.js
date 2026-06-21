import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const maxBodyBytes = 10 * 1024 * 1024;

const SOURCE_LIBRARY = {
  'oak-wilt-review': {
    id: 'oak-wilt-review',
    label: 'Oak wilt',
    title: 'Oak Wilt in the North Central United States',
    authors: 'Juzwik, Harrington, MacDonald & Appel',
    year: '2011',
    venue: 'Plant Disease',
    url: 'https://doi.org/10.1094/PDIS-12-10-0944',
    supports: 'Host range, wilt symptoms, transmission pathways, and rapid oak decline patterns.'
  },
  'dutch-elm-pathogen': {
    id: 'dutch-elm-pathogen',
    label: 'Dutch elm disease',
    title: 'Ophiostoma novo-ulmi sp. nov., causative agent of current Dutch elm disease pandemics',
    authors: 'Brasier',
    year: '1991',
    venue: 'Mycopathologia',
    url: 'https://link.springer.com/article/10.1007/BF00462219',
    supports: 'Elm vascular wilt disease agent and pandemic context.'
  },
  'sudden-oak-death-review': {
    id: 'sudden-oak-death-review',
    label: 'Sudden oak death',
    title: 'Phytophthora ramorum: Integrative Research and Management of an Emerging Pathogen in California and Oregon Forests',
    authors: 'Rizzo, Garbelotto & Hansen',
    year: '2005',
    venue: 'Annual Review of Phytopathology',
    url: 'https://doi.org/10.1146/annurev.phyto.42.040803.140418',
    supports: 'Host relationships, canker disease, epidemiology, and management of Phytophthora ramorum.'
  },
  'emerald-ash-borer-review': {
    id: 'emerald-ash-borer-review',
    label: 'Emerald ash borer',
    title: 'Emerald Ash Borer Invasion of North America: History, Biology, Ecology, Impacts, and Management',
    authors: 'Herms & McCullough',
    year: '2014',
    venue: 'Annual Review of Entomology',
    url: 'https://doi.org/10.1146/annurev-ento-011613-162051',
    supports: 'Ash host risk, canopy decline, galleries, spread, and management.'
  },
  'bark-beetle-eruptions': {
    id: 'bark-beetle-eruptions',
    label: 'Bark beetles',
    title: 'Cross-scale Drivers of Natural Disturbances Prone to Anthropogenic Amplification: The Dynamics of Bark Beetle Eruptions',
    authors: 'Raffa et al.',
    year: '2008',
    venue: 'BioScience',
    url: 'https://doi.org/10.1641/B580607',
    supports: 'Bark beetle outbreak dynamics and interactions with stressed forest conditions.'
  },
  'swiss-needle-cast': {
    id: 'swiss-needle-cast',
    label: 'Needle cast',
    title: 'Pseudothecia of Swiss Needle Cast Fungus, Phaeocryptopus gaeumannii, Physically Block Stomata of Douglas Fir, Reducing CO2 Assimilation',
    authors: 'Manter, Kelsey & Stone',
    year: '2000',
    venue: 'New Phytologist',
    url: 'https://doi.org/10.1046/j.1469-8137.2000.00779.x',
    supports: 'Needle-cast mechanism, needle discoloration, premature needle loss, and growth effects.'
  },
  'dogwood-anthracnose': {
    id: 'dogwood-anthracnose',
    label: 'Anthracnose',
    title: 'Dogwood Anthracnose: Understanding a Disease New to North America',
    authors: 'Daughtrey et al.',
    year: '1996',
    venue: 'Plant Disease',
    url: 'https://doi.org/10.1094/PD-80-0349',
    supports: 'Anthracnose-style foliar lesions, twig dieback, and hardwood decline context.'
  },
  'armillaria-review': {
    id: 'armillaria-review',
    label: 'Armillaria',
    title: 'Secrets of the Subterranean Pathosystem of Armillaria',
    authors: 'Baumgartner, Coetzee & Hoffmeister',
    year: '2011',
    venue: 'Molecular Plant Pathology',
    url: 'https://doi.org/10.1111/j.1364-3703.2010.00693.x',
    supports: 'Armillaria root disease biology, rhizomorph spread, and root-collar infection context.'
  },
  'abiotic-drought': {
    id: 'abiotic-drought',
    label: 'Drought stress',
    title: 'A Global Overview of Drought and Heat-Induced Tree Mortality Reveals Emerging Climate Change Risks for Forests',
    authors: 'Allen et al.',
    year: '2010',
    venue: 'Forest Ecology and Management',
    url: 'https://doi.org/10.1016/j.foreco.2009.09.001',
    supports: 'Drought and heat stress patterns that can mimic or intensify pest and disease symptoms.'
  }
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/diagnose') {
      const payload = await readJsonBody(request);
      const diagnosis = await diagnose(payload);
      sendJson(response, 200, diagnosis);
      return;
    }

    if (request.method !== 'GET') {
      sendText(response, 405, 'Method not allowed');
      return;
    }

    await serveStatic(request.url || '/', response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'The diagnosis service hit an unexpected problem.' });
  }
}).listen(port, () => {
  console.log(`ForestGuard is running at http://localhost:${port}`);
});

async function serveStatic(url, response) {
  const urlPath = new URL(url, `http://localhost:${port}`).pathname;
  const requested = urlPath === '/' ? '/index.html' : decodeURIComponent(urlPath);
  const fullPath = normalize(join(root, requested));

  if (!fullPath.startsWith(root)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await readFile(fullPath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(fullPath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(file);
  } catch {
    sendText(response, 404, 'Not found');
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

async function diagnose(payload) {
  if (process.env.CEREBRAS_API_KEY) {
    try {
      const modelDiagnosis = await diagnoseWithModel(payload);
      return normalizeDiagnosis(modelDiagnosis, 'Live AI');
    } catch (error) {
      const fallback = createFallbackDiagnosis(payload);
      fallback.modelMode = 'Local fallback';
      fallback.riskFlags.unshift(`Live model was unavailable: ${error.message}`);
      return fallback;
    }
  }

  return createFallbackDiagnosis(payload);
}

async function diagnoseWithModel(payload) {
  const textPayload = JSON.stringify(
    {
      notes: payload.notes,
      location: payload.location,
      species: payload.species,
      forestType: payload.forestType,
      affectedCount: payload.affectedCount,
      totalTrees: payload.totalTrees,
      symptoms: payload.symptoms,
      capturedAt: payload.capturedAt
    },
    null,
    2
  );
  const sourceGuide = JSON.stringify(
    Object.values(SOURCE_LIBRARY).map(({ id, label, title, authors, year, venue, supports }) => ({
      id,
      label,
      title,
      authors,
      year,
      venue,
      supports
    })),
    null,
    2
  );

  const userText = `Assess this forest health case. Return only valid JSON matching the schema below exactly. For each possible cause, include sourceIds using only IDs from the curated source library. Do not invent citations.\n\nSchema:\n${JSON.stringify(diagnosisSchema(), null, 2)}\n\nCase:\n${textPayload}\n\nCurated source library:\n${sourceGuide}`;

  const userContent = payload.imageDataUrl
    ? [{ type: 'text', text: userText }, { type: 'image_url', image_url: { url: payload.imageDataUrl } }]
    : userText;

  const response = await fetchWithRetry('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'You are a cautious forest pathology triage assistant. Provide decision support, not a final lab diagnosis. Prefer uncertainty over overclaiming. Cite only the provided source IDs, and mention when lab confirmation or a local extension specialist is needed. Always respond with valid JSON only, no markdown fences.'
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message.slice(0, 220) || `Model request failed with status ${response.status}`);
  }

  const data = await response.json();
  const outputText = data.choices?.[0]?.message?.content;

  if (!outputText) {
    throw new Error('The model did not return a readable diagnosis.');
  }

  return JSON.parse(outputText);
}

async function fetchWithRetry(url, options, maxAttempts = 3) {
  let lastResponse;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResponse = await fetch(url, options);
    if (lastResponse.status !== 429 || attempt === maxAttempts) {
      return lastResponse;
    }
    const retryAfter = lastResponse.headers.get('Retry-After');
    const delay = retryAfter ? Number(retryAfter) * 1000 : attempt * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }
  return lastResponse;
}

function diagnosisSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'diagnosisTitle',
      'confidence',
      'severity',
      'scope',
      'summary',
      'possibleCauses',
      'evidence',
      'nextActions',
      'riskFlags',
      'followUpQuestions',
      'imageInterpretation',
      'disclaimer'
    ],
    properties: {
      diagnosisTitle: { type: 'string' },
      confidence: { type: 'integer', minimum: 0, maximum: 100 },
      severity: { type: 'string' },
      scope: { type: 'string' },
      summary: { type: 'string' },
      possibleCauses: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'likelihood', 'rationale', 'sourceIds'],
          properties: {
            name: { type: 'string' },
            likelihood: { type: 'string' },
            rationale: { type: 'string' },
            sourceIds: {
              type: 'array',
              minItems: 1,
              maxItems: 3,
              items: {
                type: 'string',
                enum: Object.keys(SOURCE_LIBRARY)
              }
            }
          }
        }
      },
      evidence: { type: 'array', minItems: 1, maxItems: 7, items: { type: 'string' } },
      nextActions: { type: 'array', minItems: 1, maxItems: 7, items: { type: 'string' } },
      riskFlags: { type: 'array', maxItems: 5, items: { type: 'string' } },
      followUpQuestions: { type: 'array', maxItems: 5, items: { type: 'string' } },
      imageInterpretation: { type: 'string' },
      disclaimer: { type: 'string' }
    }
  };
}

function createFallbackDiagnosis(payload) {
  const caseText = buildCaseText(payload);
  const affectedRatio = getAffectedRatio(payload);
  const profiles = buildProfiles();

  const scored = profiles
    .map((profile) => ({
      ...profile,
      score: scoreProfile(profile, caseText, payload, affectedRatio)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const topCauses = scored
    .filter((profile) => profile.score > 0)
    .slice(0, 4)
    .map((profile, index) => ({
      name: profile.name,
      likelihood: likelihoodLabel(profile.score, index),
      rationale: profile.rationale(payload, affectedRatio),
      sourceIds: profile.sourceIds || []
    }));

  if (!topCauses.length) {
    topCauses.push({
      name: 'Undifferentiated forest health decline',
      likelihood: 'Possible',
      rationale: 'The observations are too general to separate disease, insect, drought, soil, or chemical stress.',
      sourceIds: ['abiotic-drought']
    });
  }

  const evidence = buildEvidence(payload, affectedRatio);
  const severity = getSeverity(payload, affectedRatio, best.score);

  return normalizeDiagnosis(
    {
      diagnosisTitle: best.score > 0 ? best.title : 'Additional field details needed',
      confidence: best.score > 0 ? Math.min(82, Math.max(42, 34 + best.score * 8)) : 28,
      severity,
      scope: getScope(payload, affectedRatio),
      summary: buildSummary(best, payload, affectedRatio),
      possibleCauses: topCauses,
      evidence,
      nextActions: buildNextActions(topCauses[0]?.name || '', severity),
      riskFlags: buildRiskFlags(payload, affectedRatio, caseText),
      followUpQuestions: buildQuestions(payload, caseText),
      imageInterpretation: payload.imageDataUrl
        ? 'An image was attached. The local fallback records that photo context is available, but visual interpretation requires the live AI model.'
        : 'No image was attached.',
      disclaimer:
        'Decision support only. Confirm with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment or removal.'
    },
    'Local fallback'
  );
}

function buildProfiles() {
  return [
    {
      name: 'Oak wilt or vascular wilt complex',
      title: 'Likely oak vascular wilt pattern',
      species: ['oak', 'quercus'],
      terms: ['wilting', 'brown leaf margins', 'bronzing', 'rapid', 'crown thinning', 'streaking', 'vascular'],
      forest: ['mixed hardwood', 'oak woodland'],
      sourceIds: ['oak-wilt-review'],
      rationale: (payload, ratio) =>
        `Oak species plus wilting or browning symptoms can indicate a vascular wilt. A ${formatRatio(ratio)} affected estimate makes spread pattern important.`
    },
    {
      name: 'Dutch elm disease',
      title: 'Possible elm vascular disease',
      species: ['elm', 'ulmus'],
      terms: ['wilting', 'yellowing', 'flagging', 'streaking', 'dieback'],
      forest: ['urban forest', 'riparian forest'],
      sourceIds: ['dutch-elm-pathogen'],
      rationale: () =>
        'Elm decline with wilting, flagging, and vascular streaking is consistent with Dutch elm disease and should be confirmed quickly.'
    },
    {
      name: 'Sudden oak death or Phytophthora-related canker',
      title: 'Possible Phytophthora canker issue',
      species: ['oak', 'tanoak', 'bay laurel', 'rhododendron'],
      terms: ['canker', 'bark cankers', 'bleeding', 'leaf spots', 'coastal', 'wet'],
      location: ['california', 'oregon', 'coastal'],
      forest: ['coastal evergreen', 'oak woodland'],
      sourceIds: ['sudden-oak-death-review'],
      rationale: () =>
        'Cankers, leaf spotting, wet conditions, and coastal host context can fit Phytophthora-related disease pressure.'
    },
    {
      name: 'Emerald ash borer or ash borer complex',
      title: 'Likely ash borer investigation',
      species: ['ash', 'fraxinus'],
      terms: ['exit holes', 'd-shaped', 'canopy thinning', 'epicormic', 's-shaped', 'bark splitting'],
      sourceIds: ['emerald-ash-borer-review'],
      rationale: () =>
        'Ash species with exit holes, bark splitting, epicormic shoots, or canopy thinning should be checked for borer activity.'
    },
    {
      name: 'Bark beetle attack with drought stress',
      title: 'Likely bark beetle or drought-stress complex',
      species: ['pine', 'spruce', 'fir', 'conifer', 'cedar'],
      terms: ['pitch tubes', 'boring dust', 'red needles', 'needle discoloration', 'drought', 'canopy thinning'],
      forest: ['conifer plantation', 'boreal or montane conifer'],
      sourceIds: ['bark-beetle-eruptions', 'abiotic-drought'],
      rationale: () =>
        'Conifers showing pitch tubes, boring dust, red needles, or rapid crown fade often need bark beetle and drought-stress checks.'
    },
    {
      name: 'Needle cast or foliar blight',
      title: 'Possible foliar needle disease',
      species: ['spruce', 'pine', 'fir', 'conifer'],
      terms: ['needle discoloration', 'leaf spots', 'defoliation', 'lower crown', 'wet spring'],
      forest: ['conifer plantation', 'boreal or montane conifer'],
      sourceIds: ['dogwood-anthracnose'],
      rationale: () =>
        'Needle discoloration and defoliation, especially after wet weather, can point to needle cast or other foliar pathogens.'
    },
    {
      name: 'Anthracnose or hardwood foliar blight',
      title: 'Possible hardwood foliar blight',
      species: ['sycamore', 'maple', 'oak', 'dogwood', 'hardwood'],
      terms: ['leaf spots', 'blotch', 'twig dieback', 'wet spring', 'cool wet', 'defoliation'],
      forest: ['mixed hardwood', 'riparian forest', 'urban forest'],
      sourceIds: ['swiss-needle-cast'],
      rationale: () =>
        'Hardwoods with leaf blotching, spotting, and twig dieback after cool wet weather often fit anthracnose or foliar blight.'
    },
    {
      name: 'Armillaria or root disease',
      title: 'Possible root disease center',
      species: ['oak', 'conifer', 'pine', 'hardwood', 'fir'],
      terms: ['mushrooms at base', 'root decay', 'white mycelium', 'basal', 'windthrow', 'crown thinning'],
      sourceIds: ['armillaria-review'],
      rationale: () =>
        'Basal mushrooms, root decay, crown thinning, and grouped mortality can indicate root disease and should be inspected at the root collar.'
    },
    {
      name: 'Abiotic stress, drought, soil, or chemical injury',
      title: 'Possible non-infectious stress pattern',
      species: [],
      terms: ['scorch', 'brown leaf margins', 'drought', 'heat', 'road salt', 'herbicide', 'uniform', 'soil compaction'],
      sourceIds: ['abiotic-drought'],
      rationale: () =>
        'Leaf-margin scorch, uniform exposure patterns, recent heat, soil disruption, or chemical exposure can mimic disease symptoms.'
    }
  ];
}

function scoreProfile(profile, caseText, payload, ratio) {
  let score = 0;
  const species = String(payload.species || '').toLowerCase();
  const forestType = String(payload.forestType || '').toLowerCase();
  const location = String(payload.location || '').toLowerCase();

  for (const term of profile.terms || []) {
    if (caseText.includes(term)) score += 1;
  }

  if (profile.species?.length && profile.species.some((term) => species.includes(term) || caseText.includes(term))) {
    score += 2;
  }

  if (profile.forest?.length && profile.forest.some((term) => forestType.includes(term))) {
    score += 1;
  }

  if (profile.location?.length && profile.location.some((term) => location.includes(term) || caseText.includes(term))) {
    score += 1;
  }

  if (ratio >= 0.2 && ['Oak wilt or vascular wilt complex', 'Armillaria or root disease'].includes(profile.name)) {
    score += 1;
  }

  if (ratio > 0.55 && profile.name.includes('Abiotic')) {
    score += 1;
  }

  return score;
}

function buildCaseText(payload) {
  return [
    payload.notes,
    payload.location,
    payload.species,
    payload.forestType,
    ...(payload.symptoms || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getAffectedRatio(payload) {
  const affected = Number(payload.affectedCount);
  const total = Number(payload.totalTrees);
  if (!Number.isFinite(affected) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, affected / total));
}

function formatRatio(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

function likelihoodLabel(score, index) {
  if (index === 0 && score >= 6) return 'High';
  if (index === 0 && score >= 4) return 'Moderate-high';
  if (score >= 3) return 'Moderate';
  return 'Possible';
}

function getSeverity(payload, ratio, score) {
  if (ratio >= 0.45 || score >= 7) return 'High';
  if (ratio >= 0.18 || score >= 4) return 'Moderate';
  return 'Low to moderate';
}

function getScope(payload, ratio) {
  const affected = Number(payload.affectedCount);
  const total = Number(payload.totalTrees);
  if (Number.isFinite(affected) && Number.isFinite(total) && total > 0) {
    return `${affected} of ${total} trees observed (${formatRatio(ratio)})`;
  }
  return 'Unknown stand scope';
}

function buildSummary(best, payload, ratio) {
  if (best.score <= 0) {
    return 'The current observations are not specific enough for a strong triage result. Add species, symptom progression, pattern in the stand, and close-up signs such as cankers, exit holes, mushrooms, or staining.';
  }

  const species = payload.species ? `${payload.species} observations` : 'The observations';
  const symptomText = payload.symptoms?.length ? `with ${payload.symptoms.slice(0, 4).join(', ')}` : 'with the described symptoms';
  return `${species} ${symptomText} most closely fit ${best.name.toLowerCase()} as a first-pass diagnosis. The affected-tree estimate is ${formatRatio(ratio)}, so field pattern and progression should guide urgency.`;
}

function buildEvidence(payload, ratio) {
  const evidence = [];

  if (payload.species) evidence.push(`Reported host species: ${payload.species}.`);
  if (payload.forestType) evidence.push(`Forest type: ${payload.forestType}.`);
  if (payload.location) evidence.push(`Location context: ${payload.location}.`);
  if (payload.symptoms?.length) evidence.push(`Symptoms selected: ${payload.symptoms.join(', ')}.`);
  if (payload.notes) evidence.push('Natural-language notes were used to identify symptom pattern and progression.');
  if (ratio > 0) evidence.push(`Affected stand estimate: ${formatRatio(ratio)}.`);
  if (!evidence.length) evidence.push('Limited field context was provided.');

  return evidence;
}

function buildNextActions(primaryCause, severity) {
  const actions = [
    'Photograph the whole tree, crown, leaves or needles, bark, root collar, and nearby unaffected trees.',
    'Map affected and unaffected trees to see whether the pattern is clustered, linear, edge-related, or scattered.',
    'Avoid pruning, moving firewood, or transporting symptomatic material until a high-risk pest or pathogen is ruled out.'
  ];

  if (/oak wilt|vascular/i.test(primaryCause)) {
    actions.push('Check for vascular streaking under bark and contact a local extension office or plant pathology lab before pruning oaks.');
  }

  if (/ash borer/i.test(primaryCause)) {
    actions.push('Inspect ash bark for D-shaped exit holes, S-shaped galleries, bark splitting, and epicormic shoots.');
  }

  if (/bark beetle/i.test(primaryCause)) {
    actions.push('Look for pitch tubes, reddish boring dust, galleries under bark, and recent drought or storm stress.');
  }

  if (/root disease|armillaria/i.test(primaryCause)) {
    actions.push('Inspect the root collar for honey-colored mushrooms, white fan-shaped mycelium, resin, decay, or loosened roots.');
  }

  if (severity === 'High') {
    actions.push('Escalate to a certified arborist, forester, or state forest health specialist within a few days.');
  } else {
    actions.push('Recheck the stand in 7 to 14 days and compare symptom progression with new photos.');
  }

  return actions.slice(0, 7);
}

function buildRiskFlags(payload, ratio, caseText) {
  const flags = [];
  if (ratio >= 0.35) flags.push('A large affected share suggests urgent follow-up or a stand-level stressor.');
  if (caseText.includes('rapid') || caseText.includes('sudden')) flags.push('Rapid symptom progression increases concern for an aggressive pest, pathogen, or acute stress.');
  if (caseText.includes('exit holes') || caseText.includes('boring dust')) flags.push('Wood-boring insect signs can require containment or reporting depending on local rules.');
  if (payload.imageDataUrl && !process.env.CEREBRAS_API_KEY) flags.push('Photo interpretation is limited in local fallback mode.');
  if (!payload.location) flags.push('Regional disease pressure cannot be weighed well without a location.');
  return flags;
}

function buildQuestions(payload, caseText) {
  const questions = [];
  if (!payload.location) questions.push('What county, state, or GPS coordinate is the stand in?');
  if (!payload.species) questions.push('What species or genus are the affected trees?');
  if (!payload.totalTrees) questions.push('How many similar trees were inspected in total?');
  if (!caseText.includes('pattern')) questions.push('Are affected trees clustered, scattered, along an edge, or following a road or drainage line?');
  if (!caseText.includes('rapid') && !caseText.includes('weeks') && !caseText.includes('months')) {
    questions.push('How quickly did symptoms appear or spread?');
  }
  return questions.slice(0, 5);
}

function normalizeDiagnosis(diagnosis, modelMode) {
  const causes = Array.isArray(diagnosis.possibleCauses)
    ? diagnosis.possibleCauses.slice(0, 4).map(normalizeCause)
    : [];

  return {
    diagnosisTitle: String(diagnosis.diagnosisTitle || 'Forest health assessment'),
    confidence: clampInt(diagnosis.confidence, 0, 100, 40),
    severity: String(diagnosis.severity || 'Unknown'),
    scope: String(diagnosis.scope || 'Unknown'),
    summary: String(diagnosis.summary || 'No summary available.'),
    possibleCauses: causes,
    sources: collectSources(causes),
    evidence: Array.isArray(diagnosis.evidence) ? diagnosis.evidence.slice(0, 7) : [],
    nextActions: Array.isArray(diagnosis.nextActions) ? diagnosis.nextActions.slice(0, 7) : [],
    riskFlags: Array.isArray(diagnosis.riskFlags) ? diagnosis.riskFlags.slice(0, 5) : [],
    followUpQuestions: Array.isArray(diagnosis.followUpQuestions) ? diagnosis.followUpQuestions.slice(0, 5) : [],
    imageInterpretation: String(diagnosis.imageInterpretation || 'No image interpretation was returned.'),
    disclaimer: String(
      diagnosis.disclaimer ||
        'Decision support only. Confirm with a qualified local forester, arborist, extension specialist, or plant diagnostic lab before treatment.'
    ),
    modelMode
  };
}

function normalizeCause(cause) {
  const sourceIds = Array.isArray(cause.sourceIds) && cause.sourceIds.length ? cause.sourceIds : inferSourceIds(cause.name);
  return {
    name: String(cause.name || 'Possible cause'),
    likelihood: String(cause.likelihood || 'Possible'),
    rationale: String(cause.rationale || ''),
    sourceIds: sourceIds.filter((id) => SOURCE_LIBRARY[id]).slice(0, 3)
  };
}

function inferSourceIds(name = '') {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('oak wilt') || normalized.includes('vascular wilt')) return ['oak-wilt-review'];
  if (normalized.includes('elm')) return ['dutch-elm-pathogen'];
  if (normalized.includes('phytophthora') || normalized.includes('sudden oak')) return ['sudden-oak-death-review'];
  if (normalized.includes('ash borer') || normalized.includes('emerald')) return ['emerald-ash-borer-review'];
  if (normalized.includes('bark beetle')) return ['bark-beetle-eruptions', 'abiotic-drought'];
  if (normalized.includes('needle')) return ['swiss-needle-cast'];
  if (normalized.includes('anthracnose') || normalized.includes('foliar')) return ['dogwood-anthracnose'];
  if (normalized.includes('armillaria') || normalized.includes('root disease')) return ['armillaria-review'];
  if (normalized.includes('abiotic') || normalized.includes('drought') || normalized.includes('stress')) return ['abiotic-drought'];
  return ['abiotic-drought'];
}

function collectSources(causes) {
  const ids = new Set();
  causes.forEach((cause) => (cause.sourceIds || []).forEach((id) => ids.add(id)));
  return [...ids].map((id) => SOURCE_LIBRARY[id]).filter(Boolean);
}

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(text);
}
