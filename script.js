(() => {
  "use strict";

  const STORAGE_KEY = "venturescope.reports.v1";
  const THEME_KEY = "venturescope.theme.v1";
  const MAX_REPORTS = 30;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const chartInstances = new Map();
  let currentReport = null;
  let loadingTimer = null;

  const CATEGORY_DATA = {
    "AI & Machine Learning": {
      competitors: ["OpenAI", "Anthropic", "Hugging Face"],
      angle: "A defensible workflow, proprietary data advantage, or measurable accuracy gain in one narrow use case.",
      risks: "Model costs, data rights, reliability, and fast-moving platform changes.",
      buyer: "Teams with repeatable knowledge work and a measurable time or quality bottleneck.",
      revenue: "Usage-based pricing or a SaaS subscription can align the price with customer value."
    },
    "Education": {
      competitors: ["Coursera", "Khan Academy", "Udemy"],
      angle: "A clear learning outcome, trusted instruction, and evidence of learner progress or completion.",
      risks: "Long adoption cycles, learner retention, affordability, and proving learning outcomes.",
      buyer: "Learners, families, educators, or institutions depending on the purchasing model.",
      revenue: "Course fees, institutional licenses, or a freemium learning membership."
    },
    "EdTech": {
      competitors: ["Google Classroom", "Canvas by Instructure", "Duolingo"],
      angle: "Reduce educator workload or improve a specific student outcome with low-friction adoption.",
      risks: "School procurement, privacy compliance, uneven device access, and evidence of efficacy.",
      buyer: "Schools, teachers, families, or lifelong learners; identify the user and budget owner separately.",
      revenue: "Per-seat plans, school licenses, or paid learning tools for individuals."
    },
    "Healthcare": {
      competitors: ["Teladoc Health", "Epic Systems", "Zocdoc"],
      angle: "Demonstrate a safe, clinically meaningful outcome and fit into existing care workflows.",
      risks: "Regulation, clinical validation, privacy, reimbursement, and patient safety.",
      buyer: "Patients, providers, health systems, or payers; each has a different decision path.",
      revenue: "Provider subscriptions, contracted services, or reimbursable care where applicable."
    },
    "HealthTech": {
      competitors: ["Omada Health", "Hinge Health", "Fitbit"],
      angle: "Show measurable health outcomes and a responsible, privacy-first path to clinical adoption.",
      risks: "Regulatory classification, evidence standards, integration burden, and patient trust.",
      buyer: "Care providers, health plans, employers, or patients depending on the validated use case.",
      revenue: "B2B provider plans, employer contracts, or compliant care-service fees."
    },
    "Finance": {
      competitors: ["NerdWallet", "Rocket Money", "YNAB"],
      angle: "Build trust around a specific financial job with transparent fees and strong safeguards.",
      risks: "Licensing, fraud, consumer protection, capital requirements, and macroeconomic exposure.",
      buyer: "Consumers or businesses with an underserved financial need and willingness to switch.",
      revenue: "Subscription, disclosed service fees, or carefully designed partner revenue."
    },
    "FinTech": {
      competitors: ["Stripe", "Wise", "Revolut"],
      angle: "A focused user segment, compliant distribution, and a demonstrably better financial workflow.",
      risks: "Regulation, fraud losses, partner dependency, and customer acquisition costs.",
      buyer: "Consumers or businesses whose current financial workflow is costly or inconvenient.",
      revenue: "Transaction fees, business subscriptions, or compliant interchange/partner revenue."
    },
    "E-Commerce": {
      competitors: ["Amazon", "Shopify", "Etsy"],
      angle: "A distinctive product, trusted brand, or better discovery and fulfillment for a narrow segment.",
      risks: "Inventory, returns, paid acquisition, margin pressure, and platform dependency.",
      buyer: "A narrowly defined shopper with a frequent, high-intent purchase need.",
      revenue: "Product margin, bundles, replenishment subscriptions, or marketplace commission."
    },
    "Agriculture": {
      competitors: ["John Deere", "Trimble", "Climate FieldView"],
      angle: "Prove yield, cost, or resilience improvement on the farm with practical field trials.",
      risks: "Seasonality, weather exposure, fragmented buyers, and hardware or distribution needs.",
      buyer: "Farm operators, cooperatives, agribusinesses, or agricultural service providers.",
      revenue: "Per-acre software, equipment sales, input partnerships, or enterprise contracts."
    },
    "Travel": {
      competitors: ["Booking.com", "Expedia", "Airbnb"],
      angle: "Solve a specific planning or in-trip problem better than broad booking platforms.",
      risks: "Seasonality, supplier dependency, thin commissions, and disruptions outside your control.",
      buyer: "A specific traveler segment or a travel supplier with a costly service gap.",
      revenue: "Booking commission, planning fees, memberships, or supplier partnerships."
    },
    "Gaming": {
      competitors: ["Roblox", "Epic Games", "Riot Games"],
      angle: "Distinctive mechanics, repeat play, creator/community participation, or a memorable niche.",
      risks: "Hit-driven economics, discoverability, live operations, and platform policy changes.",
      buyer: "Players defined by genre, platform, play style, and community—not simply all gamers.",
      revenue: "Premium purchase, ethical in-game purchases, expansion content, or subscriptions."
    },
    "Entertainment": {
      competitors: ["Netflix", "Spotify", "Patreon"],
      angle: "Own a distinct audience relationship, format, or repeatable content-discovery advantage.",
      risks: "High content costs, uncertain audience retention, rights clearance, and platform dependency.",
      buyer: "A well-defined fan community, advertiser, or distribution partner.",
      revenue: "Membership, licensing, sponsorship, or carefully targeted advertising."
    },
    "Fashion": {
      competitors: ["Zara", "ASOS", "Depop"],
      angle: "Distinctive design, responsible sourcing, fit inclusivity, or a strong underserved community.",
      risks: "Inventory and sizing returns, trend shifts, sourcing transparency, and discount pressure.",
      buyer: "A style-conscious customer segment with a specific fit, identity, or values-based need.",
      revenue: "Product sales, limited drops, resale, or membership benefits."
    },
    "Real Estate": {
      competitors: ["Zillow", "Redfin", "Realtor.com"],
      angle: "Reduce a costly transaction or operating friction for a defined property stakeholder.",
      risks: "Local market fragmentation, regulation, trust, and long transaction cycles.",
      buyer: "Buyers, renters, landlords, brokers, or commercial property operators.",
      revenue: "Listing fees, subscriptions, transaction commissions, or property services."
    },
    "SaaS": {
      competitors: ["Salesforce", "HubSpot", "monday.com"],
      angle: "Own a specific workflow and prove faster time-to-value than the current workaround.",
      risks: "Crowded categories, churn, integration burden, and rising acquisition costs.",
      buyer: "A team with a repeated operational task, clear budget owner, and measurable cost of delay.",
      revenue: "Tiered subscriptions, usage-based plans, onboarding, or enterprise contracts."
    },
    "Cyber Security": {
      competitors: ["CrowdStrike", "Palo Alto Networks", "Cloudflare"],
      angle: "Make risk reduction measurable while fitting the team's existing security workflow.",
      risks: "High trust threshold, demanding proof, long sales cycles, and rapidly changing threats.",
      buyer: "Security and IT teams with a defined exposure, compliance need, or staffing gap.",
      revenue: "Annual SaaS contracts, managed services, or enterprise licensing."
    },
    "Logistics": {
      competitors: ["Flexport", "ShipBob", "project44"],
      angle: "Improve a measurable service-level or cost outcome on one route, segment, or workflow.",
      risks: "Operational complexity, thin margins, integrations, and physical network dependencies.",
      buyer: "Shippers, carriers, retailers, or operators with recurring coordination costs.",
      revenue: "Per-shipment fees, SaaS subscriptions, managed services, or enterprise contracts."
    },
    "Environment": {
      competitors: ["Watershed", "Persefoni", "Climeworks"],
      angle: "Tie environmental impact to a verifiable metric and an economically compelling buyer case.",
      risks: "Long deployment cycles, measurement credibility, policy shifts, and capital intensity.",
      buyer: "Organizations with a funded decarbonization or resource-efficiency mandate.",
      revenue: "Project contracts, monitoring subscriptions, licensing, or verified service fees."
    },
    "Food & Restaurant": {
      competitors: ["DoorDash", "Uber Eats", "Toast"],
      angle: "Improve repeat purchase, unit economics, or operator efficiency in a specific food niche.",
      risks: "Food safety, perishability, labor, delivery economics, and low operating margins.",
      buyer: "A local diner, food producer, restaurant operator, or institutional food buyer.",
      revenue: "Product margin, delivery commission, operator software, or recurring meal plans."
    },
    "Blockchain": {
      competitors: ["Ethereum", "Coinbase", "Polygon"],
      angle: "Explain why a decentralized trust model is necessary and materially better for users.",
      risks: "Regulatory uncertainty, security, adoption friction, volatility, and unclear utility.",
      buyer: "Users or organizations with a specific coordination or verifiability problem.",
      revenue: "Software subscriptions, infrastructure fees, or enterprise services; avoid relying on token speculation.",
    },
    "IoT": {
      competitors: ["Samsara", "AWS IoT", "Particle"],
      angle: "Connect a reliable device signal to an action that saves money or prevents downtime.",
      risks: "Hardware costs, installation, connectivity, security, and ongoing device support.",
      buyer: "Operators with costly blind spots in a physical process or asset fleet.",
      revenue: "Hardware plus subscription, device management plans, or data services."
    },
    "Automobile": {
      competitors: ["Tesla", "Uber", "Waymo"],
      angle: "Fit into a clear vehicle-owner or fleet workflow and prove safety, reliability, and savings.",
      risks: "Safety requirements, long OEM cycles, capital intensity, and regulatory exposure.",
      buyer: "Drivers, fleet operators, dealers, or automotive manufacturers.",
      revenue: "Fleet subscriptions, service fees, licensing, or vehicle / accessory sales."
    },
    "Social Media": {
      competitors: ["TikTok", "Reddit", "Discord"],
      angle: "Serve a specific community with better trust, healthier interaction, or a valuable shared purpose.",
      risks: "Network effects, moderation, safety, retention, and monetization without harming trust.",
      buyer: "A specific community with an unmet connection, identity, or collaboration need.",
      revenue: "Premium membership, creator tools, sponsorships, or privacy-conscious advertising."
    },
    "Fitness": {
      competitors: ["Strava", "Peloton", "Trainerize"],
      angle: "Deliver measurable adherence or outcomes for a specific goal, ability, or life stage.",
      risks: "Retention, safety, crowded acquisition channels, and seasonal engagement.",
      buyer: "A defined fitness community with a concrete goal and preferred training context.",
      revenue: "Membership, coaching, studio partnerships, or premium training programs."
    },
    "Business Services": {
      competitors: ["Upwork", "Fiverr", "Accenture"],
      angle: "Standardize a high-value service or automate a painful workflow without losing trust.",
      risks: "Service delivery capacity, scope creep, labor margins, and referral dependence.",
      buyer: "A business owner or team with a frequent, expensive operational bottleneck.",
      revenue: "Retainers, fixed-scope packages, subscriptions, or implementation fees."
    },
    "Other": {
      competitors: ["Direct product alternatives", "Manual or spreadsheet workarounds", "Adjacent category platforms"],
      angle: "Focus on the underserved user and prove a measurable advantage over their current workaround.",
      risks: "Unclear category positioning, uncertain willingness to pay, and discovery costs.",
      buyer: "The narrowest group who experiences this problem frequently and has authority to act.",
      revenue: "Start with the simplest paid offer that captures a clear part of the value created."
    }
  };

  const REVENUE_MODELS = [
    { name: "Subscription model", detail: "Recurring monthly or annual plans for ongoing access, workflow value, or support.", key: "subscription" },
    { name: "Freemium model", detail: "A useful free tier builds adoption; charge for advanced capabilities or team usage.", key: "freemium" },
    { name: "Advertising", detail: "Sponsored placements may fit an engaged audience, if they do not erode user trust.", key: "advertising" },
    { name: "Partnerships", detail: "Share revenue with trusted distributors or complementary products that reach your buyer.", key: "partnerships" },
    { name: "Commission", detail: "Take a transparent fee when the product enables a successful transaction.", key: "commission" },
    { name: "Enterprise plans", detail: "Offer procurement-ready security, support, controls, and volume pricing to larger teams.", key: "enterprise" },
    { name: "API services", detail: "Charge developers or organizations for reliable access to a differentiated capability.", key: "api" }
  ];

  const SUGGESTION_LIBRARY = [
    ["Customer discovery sprint", "Interview 10 narrowly matched prospects. Ask about recent behavior, current workarounds, and what they already spend—not whether they like the idea."],
    ["Problem validation landing page", "Describe the user, pain, and outcome on one page. Measure qualified sign-ups or interview requests rather than vanity traffic."],
    ["Concierge MVP", "Deliver the core outcome manually for a few customers before investing in broad automation or a polished platform."],
    ["Pricing and willingness-to-pay test", "Compare two or three concrete offers in interviews or a small pilot. Record objections and actual purchase intent."],
    ["Defensible differentiation", "Map direct alternatives and manual workarounds. Choose one meaningful advantage customers can verify in a short trial."],
    ["AI personalization, where useful", "Only add personalization if it measurably improves the customer's outcome; establish a non-AI baseline and privacy guardrails first."],
    ["Mobile-first experience", "Test whether the target user needs the service in the field or on the move before committing to native apps for every platform."],
    ["Referral loop", "Design a two-sided referral experiment that rewards a genuine customer outcome, not low-quality sign-ups."],
    ["Analytics dashboard", "Instrument activation, time-to-value, repeat use, conversion, and retention. Use a small set of decision-driving metrics."],
    ["Multi-language readiness", "Interview a target-market language group and test localized onboarding, support, and payment expectations before translating at scale."],
    ["Loyalty and retention design", "Identify the natural repeat-use moment; reward meaningful continued value without training customers to wait for discounts."],
    ["Business intelligence reports", "Turn product activity into a useful report for a budget owner. Validate whether it influences a real operating decision."],
    ["API and integration strategy", "Prioritize one integration already present in customer workflows. Test data permissions, maintenance burden, and adoption impact."],
    ["B2B expansion path", "Map the end user, champion, buyer, and procurement gatekeeper. Pilot with one team before building enterprise features."],
    ["Automation and operational plan", "Document the highest-frequency manual tasks and automate only the steps with proven volume, quality, and cost benefit."]
  ];

  const PHASE_TITLES = ["Launch", "Growth", "Expansion", "Scaling", "Global expansion"];
  const PHASE_DETAILS = [
    "Validate the problem with target users. Define one narrow MVP, success metric, and a low-cost pilot. Do not scale before confirming repeated value.",
    "Improve activation and retention from real usage. Test a repeatable acquisition channel and refine pricing based on observed willingness to pay.",
    "Add adjacent use cases or a second customer segment only when the initial segment has reliable outcomes and positive unit economics.",
    "Strengthen team capacity, automation, security, support, and operational controls. Scale channels that remain effective as spend and volume rise.",
    "Research one new geography at a time: local regulations, language, payments, distribution, and support. Expand after a focused market-entry test."
  ];

  const PROS = [
    "A focused initial audience makes it possible to test the core problem with a small, reachable group.",
    "A clearly explained user pain can make the value proposition easier to understand and communicate.",
    "A small first version can expose weak assumptions before substantial capital is committed.",
    "A repeatable solution may create a stronger customer experience than inconsistent manual workarounds.",
    "Early customer conversations can uncover adjacent needs and improve product positioning.",
    "A well-defined workflow creates opportunities to measure time saved, cost avoided, or outcomes improved.",
    "The concept may support multiple channels or customer segments after one beachhead is proven.",
    "A credible pilot can build evidence for later partnerships, hiring, or fundraising discussions."
  ];
  const CONS = [
    "The description alone cannot establish that enough customers experience this problem or will pay to solve it.",
    "Incumbents and informal workarounds may be harder to displace than a feature comparison suggests.",
    "Customer acquisition costs, sales cycles, or onboarding work may exceed early assumptions.",
    "A narrow target group can mean slower growth unless adjacent segments share the same underlying need.",
    "The team may need domain, operational, regulatory, or technical expertise not yet reflected in the concept.",
    "Competitors can copy visible features; a durable advantage needs more than an early product lead.",
    "Integrations, support, data quality, or fulfillment can add hidden costs as usage grows.",
    "Initial enthusiasm is not evidence of retention, repeat purchasing, or sustainable unit economics."
  ];

  const CATEGORY_ADJUSTMENTS = {
    "AI & Machine Learning": { complexity: 8, investment: 3, innovation: 10 },
    "Healthcare": { complexity: 15, investment: -4, innovation: 3 },
    "HealthTech": { complexity: 14, investment: -2, innovation: 4 },
    "Finance": { complexity: 12, investment: -3, innovation: 4 },
    "FinTech": { complexity: 12, investment: -2, innovation: 5 },
    "Cyber Security": { complexity: 9, investment: 2, innovation: 5 },
    "IoT": { complexity: 12, investment: -1, innovation: 4 },
    "Automobile": { complexity: 15, investment: -5, innovation: 4 },
    "Agriculture": { complexity: 8, investment: -2, innovation: 4 },
    "Blockchain": { complexity: 10, investment: -2, innovation: 7 },
    "SaaS": { complexity: -3, investment: 5, innovation: 1 },
    "Business Services": { complexity: -5, investment: 3, innovation: 0 }
  };

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function readReports() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error("Saved reports have an unexpected format.");
      return parsed.filter((report) => report && typeof report.id === "string" && report.input && report.scores);
    } catch (error) {
      console.error("Unable to read VentureScope report history.", error);
      showToast("Saved report history could not be read. You can still create a new report.", true);
      return [];
    }
  }

  function writeReports(reports) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, MAX_REPORTS)));
      return true;
    } catch (error) {
      console.error("Unable to save VentureScope report history.", error);
      showToast("This report could not be saved in browser storage. Export it to keep a copy.", true);
      return false;
    }
  }

  function showToast(message, isError = false) {
    const region = $("#toastRegion");
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = isError ? "!" : "✓";
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(icon, text);
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3900);
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = String(value ?? "");
  }

  function appendList(selector, items) {
    const list = $(selector);
    list.replaceChildren();
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
  }

  function setProgress(selector, value) {
    const node = $(selector);
    if (node) node.style.width = `${clamp(value)}%`;
  }

  function getFormInput() {
    const form = $("#ideaForm");
    if (!form.reportValidity()) return null;
    const description = $("#ideaDescription").value.trim();
    const category = $("#category").value;
    const audience = $("#targetAudience").value.trim();
    const market = $("#targetMarket").value.trim();
    const error = $("#formError");
    error.textContent = "";
    if (description.length < 25) {
      error.textContent = "Add at least 25 characters so the assessment has enough context.";
      $("#ideaDescription").focus();
      return null;
    }
    if (!category || !audience || !market) {
      error.textContent = "Choose a category and describe your audience and initial target market.";
      return null;
    }
    const budget = $("#estimatedBudget").value.trim();
    return {
      name: $("#startupName").value.trim() || "Untitled startup",
      founder: $("#founderName").value.trim() || "Not specified",
      description,
      category,
      audience,
      budget: budget ? Number(budget) : null,
      technology: $("#technology").value.trim() || "Not specified",
      market,
      createdAt: new Date().toISOString()
    };
  }

  function buildReport(input) {
    const category = CATEGORY_DATA[input.category] || CATEGORY_DATA.Other;
    const text = `${input.description} ${input.audience} ${input.market} ${input.technology}`.toLowerCase();
    const tokens = input.description.trim().split(/\s+/).filter(Boolean);
    const isSpecific = /\b(small business|freelanc|student|parent|clinic|teacher|creator|retailer|farm|team|operator|developer|patient|coach|restaurant|founder|remote|local|independent)\b/i.test(text);
    const hasProblem = /\b(problem|pain|challenge|difficult|struggle|waste|slow|expensive|manual|access|lack|reduce|improv|help|enable|automate|simplif|connect|track|manage|support|solve)\w*/i.test(input.description);
    const hasSolution = /\b(platform|app|software|service|marketplace|tool|product|system|network|device|solution|subscription|dashboard|using|build|provide|offer|deliver|connect|automate|AI|machine learning|API)\b/i.test(input.description);
    const hasDifferentiator = /\b(unique|different|faster|cheaper|personal|specializ|proprietary|exclusive|better|underserved|focused|niche|custom|innovative|patent|workflow|community)\w*/i.test(input.description);
    const hasValidation = /\b(interview|pilot|prototype|customer|user test|waitlist|survey|preorder|paid|revenue|traction|launched|tested|feedback|validated)\w*/i.test(text);
    const hasRevenue = /\b(revenue|subscription|pricing|paid|fee|commission|sell|charge|license|monetiz|transaction|customer|business model)\w*/i.test(text);
    const hasTechDetail = input.technology !== "Not specified";
    const completeness = clamp(35 + Math.min(tokens.length, 110) * .28 + (input.founder !== "Not specified" ? 5 : 0) + (hasTechDetail ? 8 : 0) + (input.budget !== null ? 7 : 0) + (hasValidation ? 10 : 0), 35, 92);
    const specificity = clamp(42 + (isSpecific ? 15 : 0) + (hasProblem ? 9 : 0) + (hasSolution ? 8 : 0) + (hasDifferentiator ? 10 : 0) + Math.min(tokens.length, 100) * .12);
    const budgetSignal = input.budget === null ? 48 : input.budget < 5000 ? 46 : input.budget < 50000 ? 59 : input.budget < 250000 ? 68 : 61;
    const adjustment = CATEGORY_ADJUSTMENTS[input.category] || { complexity: 0, investment: 0, innovation: 0 };
    const demand = clamp(45 + (hasProblem ? 17 : 0) + (isSpecific ? 8 : 0) + (hasValidation ? 11 : 0) + Math.min(tokens.length, 100) * .07);
    const scalability = clamp(49 + (hasTechDetail ? 8 : 0) + (hasSolution ? 6 : 0) + (/\b(platform|software|digital|online|SaaS|API|automate|cloud)\b/i.test(text) ? 10 : 0) + adjustment.complexity * -0.5);
    const revenuePotential = clamp(43 + (hasRevenue ? 14 : 0) + (isSpecific ? 8 : 0) + (input.budget !== null ? 3 : 0) + (/B2B|enterprise|business/i.test(text) ? 7 : 0));
    const competition = clamp(55 + (hasDifferentiator ? -9 : 0) + (input.category === "SaaS" || input.category === "AI & Machine Learning" ? 8 : 0));
    const risk = clamp(61 + adjustment.complexity - (hasValidation ? 11 : 0) - (hasDifferentiator ? 4 : 0) - (input.budget !== null ? 3 : 0));
    const growth = clamp(47 + (isSpecific ? 8 : 0) + (hasTechDetail ? 7 : 0) + (hasDifferentiator ? 8 : 0) + (input.category === "AI & Machine Learning" || input.category === "SaaS" ? 8 : 0));
    const innovation = clamp(41 + (hasDifferentiator ? 17 : 0) + (hasTechDetail ? 8 : 0) + (hasSolution ? 6 : 0) + adjustment.innovation);
    const scores = {
      demand,
      scalability,
      revenue: revenuePotential,
      competition,
      risk,
      growth,
      innovation,
      specificity,
      completeness,
      budget: budgetSignal
    };
    const overall = clamp(demand * .20 + scalability * .13 + revenuePotential * .15 + (100 - competition) * .12 + (100 - risk) * .13 + growth * .13 + innovation * .09 + specificity * .05);
    const successProbability = clamp(overall * .75 + (hasValidation ? 10 : 0) + (hasRevenue ? 4 : 0) - (risk > 70 ? 7 : 0));
    const investmentReadiness = clamp(completeness * .24 + demand * .17 + revenuePotential * .15 + (hasValidation ? 14 : 0) + (hasRevenue ? 7 : 0) + budgetSignal * .11 + (hasTechDetail ? 7 : 0) + adjustment.investment);
    const confidence = clamp(completeness * .7 + specificity * .3, 35, 90);
    const signalSeed = hashText(`${input.description}|${input.category}|${input.audience}`);

    return {
      id: `${Date.now()}-${signalSeed.toString(36)}`,
      input,
      scores: { ...scores, overall, successProbability, investmentReadiness, confidence },
      analysis: createAnalysis(input, scores, { overall, successProbability, investmentReadiness, confidence }, category, {
        hasProblem, hasSolution, hasDifferentiator, hasValidation, hasRevenue, isSpecific, tokens: tokens.length
      }, signalSeed),
      createdAt: input.createdAt
    };
  }

  function createAnalysis(input, scores, summary, category, signals, seed) {
    const categoryName = input.category;
    const audience = input.audience;
    const shortProblem = signals.hasProblem
      ? "The description points to a recognizable pain or job to be done."
      : "The description needs a more explicit, observable customer problem.";
    const differentiation = signals.hasDifferentiator
      ? "A differentiation claim is present; test whether customers recognize it as valuable and hard to replace."
      : "A distinct reason to switch is not yet clear from the description.";

    const strengths = [
      `The concept is framed for ${audience}, which creates a starting point for focused discovery rather than a broad, undefined launch.`,
      `${shortProblem} Interview people in the target group to confirm how often it occurs and what it currently costs them.`,
      `The ${categoryName} framing can help identify relevant communities, specialist channels, and domain experts for early testing.`,
      `${signals.hasSolution ? "A proposed product or delivery approach is outlined." : "The solution direction can still be shaped around customer evidence."} Keeping the first test narrow can reduce wasted build effort.`,
      `${differentiation} A verified advantage could support stronger word of mouth and customer retention.`
    ];
    const weaknesses = [
      `${signals.hasValidation ? "The description mentions validation, but the scale and quality of evidence are unknown." : "No customer validation evidence is described yet."} Distinguish interview interest from actual behavior or payment.`,
      `${signals.hasRevenue ? "A monetization signal is mentioned, but pricing and unit economics are unproven." : "The revenue mechanism and buyer's budget are not yet explicit."} Identify who pays, how much, and why now.`,
      `${input.technology === "Not specified" ? "The technical approach and delivery constraints are unspecified." : `The stated technology (${input.technology}) needs a feasibility and maintenance assessment.`} Avoid selecting technology before validating the user outcome.`,
      `The initial target market (${input.market}) may contain different customer needs, buying authority, and regulations; narrow the first beachhead.`,
      `${input.budget === null ? "Starting capital and runway have not been estimated." : `A budget of ${formatCurrency(input.budget)} is an input, not a validated runway estimate.`} Map the cost of reaching a repeatable first outcome.`
    ];
    const opportunities = [
      `Run structured discovery with ${audience} and document current alternatives, purchase triggers, and switching barriers.`,
      `Use the ${categoryName} ecosystem to find a focused pilot partner, distribution channel, or domain mentor.`,
      `Test a manual or low-code MVP before building the full feature set; measure repeat use and time-to-value.`,
      `Explore ${category.revenue} against a concrete customer outcome and a transparent pricing experiment.`,
      `If early usage shows repeated value, test an adjacent segment or partnership without weakening the initial positioning.`
    ];
    const threats = [
      `${category.risks} may create delays, costs, or trust barriers; map the relevant requirements before committing to a launch plan.`,
      `Established providers and free workarounds may already satisfy part of the need. Benchmark switching friction, not just feature lists.`,
      `If customer acquisition is paid or sales-led, the cost and time to win a customer could outweigh early revenue.`,
      `A rapid change in technology, platform rules, customer budgets, or market conditions could weaken current assumptions.`,
      `Without retention and willingness-to-pay evidence, positive early feedback may not translate into durable demand.`
    ];

    const pros = [
      `${audience} offers a concrete starting segment for interviews, recruitment, and early message testing.`,
      `A clear customer problem can make positioning more compelling than a solution-first pitch.`,
      `A small pilot can test the riskiest assumptions before a large upfront build.`,
      `A differentiated solution could create measurable savings, convenience, access, or quality improvements.`,
      `Early conversations may reveal adjacent jobs that strengthen the product roadmap.`,
      `A focused first market can help concentrate limited founder time and budget.`,
      `The concept may support recurring value if the underlying need appears frequently.`,
      `Evidence from paid pilots or repeated use could improve credibility with partners and investors.`
    ];
    const cons = [
      `The available description cannot demonstrate market size, buying intent, or a reliable path to customer acquisition.`,
      `The current alternatives may be good enough, familiar, or bundled into tools customers already pay for.`,
      `The product may require more support, integrations, or operational work than the initial concept suggests.`,
      `The person experiencing the problem may not control the budget or purchasing decision.`,
      `Revenue and contribution margin are unknown until pricing, delivery costs, and customer behavior are tested.`,
      `Regulatory, privacy, safety, or procurement requirements may slow adoption in this category.`,
      `A larger competitor could reproduce visible features or use existing distribution to respond quickly.`,
      `A broad market ambition can dilute early execution unless one first customer segment is prioritized.`
    ];

    const competitors = category.competitors.map((name) => ({
      name,
      detail: "Illustrative company or substitute in or near this category. Verify its current offering, target market, and local presence before treating it as a direct competitor."
    }));
    const marketGap = `Potential gap to investigate: whether ${audience} is poorly served by existing solutions in the specific context of ${input.market}. Validate this with interviews and a side-by-side alternative map; the gap is not established by this heuristic.`;
    const differentiationOpportunities = [
      "Specialize around one high-value user workflow and demonstrate a measurable result.",
      "Reduce time-to-value with a simple onboarding path and useful integrations.",
      "Make trust, privacy, accessibility, or transparent pricing a concrete part of the product experience."
    ];

    const primaryAudience = `${audience} in ${input.market} who experience the problem frequently and can influence or approve a purchase.`;
    const secondaryAudience = `Adjacent users, channel partners, or organizations that serve ${audience}; confirm their needs before expanding the product scope.`;
    const demographics = `Define by role, situation, location, budget authority, and current behavior rather than age or broad labels alone. Initial context supplied: ${input.market}.`;
    const painPoints = [
      "Time or money spent on a repeated workaround.",
      "Frustration with fragmented, slow, or difficult-to-use existing options.",
      "Difficulty comparing quality, trust, or outcomes across providers.",
      "Risk of switching from a familiar process without clear evidence of improvement."
    ];

    const reasons = [
      `A clear ${audience} focus could support an efficient customer-discovery and go-to-market test.`,
      `A credible ${categoryName} problem with verified willingness to pay may create an investable opportunity.`,
      `${signals.hasValidation ? "The stated validation activity is a useful starting signal, subject to evidence review." : "A low-cost pilot could quickly clarify whether the problem and solution deserve further investment."}`,
      `A repeatable, differentiated outcome could create durable retention or distribution advantages if demonstrated.`
    ];
    const concerns = [
      `${signals.hasValidation ? "Investors will ask for the detail behind validation: sample quality, conversion, retention, and payment." : "There is no quantified traction or customer evidence in the information provided."}`,
      `${signals.hasRevenue ? "The pricing and margin assumptions need support from actual customer behavior." : "The path to revenue, gross margin, and an efficient acquisition channel is unclear."}`,
      `The ${input.category} risk profile may require specialist talent, evidence, or compliance work before scaling.`,
      `Founding-team experience, ownership, runway, and execution capacity are not captured in this idea description.`
    ];

    const riskDimensions = {
      "Market fit": clamp(70 - scores.demand * .35 + (signals.hasValidation ? -9 : 0)),
      Competition: clamp(scores.competition),
      Execution: clamp(54 + (input.technology === "Not specified" ? 10 : 0) + Math.max(0, 60 - scores.scalability) * .25),
      "Financial model": clamp(65 - scores.revenue * .3 + (signals.hasRevenue ? -8 : 0)),
      "Regulatory / trust": clamp(42 + (CATEGORY_ADJUSTMENTS[input.category]?.complexity || 0) * 2)
    };
    const swotDistribution = [
      Math.max(1, scores.specificity + scores.innovation),
      Math.max(1, 200 - scores.completeness - scores.specificity),
      Math.max(1, scores.demand + scores.growth),
      Math.max(1, scores.risk + scores.competition)
    ];
    const revenueFit = calculateRevenueFit(input, signals, categoryName, seed);
    const marketPotential = {
      labels: ["Demand", "Growth", "Reachability", "Revenue fit", "Readiness"],
      values: [scores.demand, scores.growth, clamp(scores.specificity + 8), scores.revenue, summary.investmentReadiness]
    };

    return {
      summary: scoreSummary(summary.overall, scores),
      verdict: getVerdict(summary.overall),
      marketDemand: {
        score: scores.demand,
        title: demandLabel(scores.demand),
        description: `${shortProblem} ${category.buyer} Assess demand through observed behavior, credible alternatives, and willingness to pay—not stated enthusiasm alone.`,
        signals: [
          `Problem clarity: ${signals.hasProblem ? "a problem-oriented signal appears in the description" : "the problem needs to be stated more concretely"}.`,
          `Audience focus: ${signals.isSpecific ? "a potentially specific user group is named" : "the initial customer profile could be narrower"}.`,
          `Evidence: ${signals.hasValidation ? "validation activity is mentioned; verify what was tested and learned" : "no validation activity is mentioned; prioritize discovery before a large build"}.`
        ],
        validationQuestion: `What did ${audience} do the last time this problem occurred, and what did it cost them?`
      },
      scalability: {
        score: scores.scalability,
        growth: scores.growth,
        description: `The scalability signal is ${scoreBand(scores.scalability).toLowerCase()}. ${category.angle} ${input.technology === "Not specified" ? "The delivery and technology model is not yet specified, so scaling constraints are uncertain." : `Assess whether ${input.technology} can support reliable delivery, security, and customer support at higher volume.`}`,
        constraints: [
          "Map which parts of delivery require founder time, human support, inventory, or bespoke implementation.",
          "Test whether the value and onboarding remain consistent across multiple customers.",
          "Model distribution and support costs before treating a digital product as automatically scalable."
        ]
      },
      swot: { strengths, weaknesses, opportunities, threats, distribution: swotDistribution },
      pros,
      cons,
      competitors: { examples: competitors, level: competitionLabel(scores.competition), differentiationOpportunities, marketGap },
      audience: { primary: primaryAudience, secondary: secondaryAudience, demographics, painPoints },
      revenue: { models: REVENUE_MODELS, fit: revenueFit },
      suggestions: SUGGESTION_LIBRARY.map(([title, detail], index) => ({
        title,
        detail: customizeSuggestion(title, detail, input),
        priority: index < 3 ? "Start here" : "Consider"
      })),
      investors: {
        reasons,
        concerns,
        stage: fundingStage(summary.investmentReadiness, signals.hasValidation),
        stageDetail: fundingStageDetail(summary.investmentReadiness, signals.hasValidation)
      },
      roadmap: PHASE_TITLES.map((title, index) => ({
        title,
        detail: index === 0
          ? `Launch a narrow test for ${audience}. ${PHASE_DETAILS[index]}`
          : PHASE_DETAILS[index]
      })),
      riskDimensions,
      marketPotential
    };
  }

  function calculateRevenueFit(input, signals, category, seed) {
    const text = `${input.description} ${input.audience}`.toLowerCase();
    return REVENUE_MODELS.map((model, index) => {
      let fit = 42 + (signals.hasRevenue ? 5 : 0) + (signals.isSpecific ? 4 : 0);
      if (model.key === "subscription" && /\b(repeat|ongoing|monthly|regular|platform|software|service|manage|track)\b/i.test(text)) fit += 21;
      if (model.key === "freemium" && /\b(app|platform|software|online|community|digital)\b/i.test(text)) fit += 18;
      if (model.key === "advertising" && /\b(audience|community|content|creator|social|media)\b/i.test(text)) fit += 16;
      if (model.key === "partnerships" && /\b(partner|network|supplier|ecosystem|integrat)\b/i.test(text)) fit += 14;
      if (model.key === "commission" && /\b(marketplace|booking|transaction|match|connect|sale)\b/i.test(text)) fit += 20;
      if (model.key === "enterprise" && /\b(B2B|business|company|enterprise|team|organization|clinic|school)\b/i.test(text)) fit += 20;
      if (model.key === "api" && /\b(API|developer|integrat|data|platform|software)\b/i.test(text)) fit += 16;
      if ((category === "Healthcare" || category === "HealthTech") && model.key === "advertising") fit -= 12;
      if ((category === "Finance" || category === "FinTech") && model.key === "advertising") fit -= 8;
      fit += ((seed >>> (index * 3)) & 3) - 1;
      return { ...model, fit: clamp(fit) };
    }).sort((a, b) => b.fit - a.fit);
  }

  function customizeSuggestion(title, detail, input) {
    if (title === "Customer discovery sprint") return `Interview 10 people matching ${input.audience}. Ask about recent behavior, current workarounds, and what they already spend—not whether they like the idea.`;
    if (title === "Defensible differentiation") return `Map direct alternatives and manual workarounds serving ${input.audience}. Choose one meaningful advantage customers can verify in a short trial.`;
    if (title === "B2B expansion path") return `For ${input.category}, map the end user, champion, buyer, and procurement gatekeeper. Pilot with one team before building enterprise features.`;
    return detail;
  }

  function scoreSummary(score, scores) {
    if (score >= 75) return "Several promising signals are present. Validate demand and delivery economics before increasing investment.";
    if (score >= 60) return `There are useful signals to explore. Focus next on ${scores.demand < scores.revenue ? "customer demand" : "a differentiated customer outcome"} and evidence from real users.`;
    if (score >= 45) return "The concept has testable elements, but important assumptions remain. A narrow discovery sprint is the best next investment.";
    return "The current description leaves key assumptions open. Clarify the customer problem and test willingness to pay before building.";
  }

  function getVerdict(score) {
    if (score >= 75) return "Promising signals";
    if (score >= 60) return "Worth exploring";
    if (score >= 45) return "Early-stage hypothesis";
    return "Needs sharper validation";
  }

  function scoreBand(score) {
    if (score >= 70) return "Strong";
    if (score >= 55) return "Moderate";
    return "Early";
  }

  function demandLabel(score) {
    if (score >= 70) return "Encouraging signals";
    if (score >= 55) return "Needs customer evidence";
    return "Problem clarity needed";
  }

  function competitionLabel(score) {
    if (score >= 72) return "High — map specific alternatives";
    if (score >= 55) return "Moderate — differentiation matters";
    return "Less obvious — confirm substitutes";
  }

  function fundingStage(score, hasValidation) {
    if (score >= 72 && hasValidation) return "Pre-seed / seed conversations";
    if (score >= 60 && hasValidation) return "Pre-seed exploration";
    if (score >= 60) return "Customer discovery / pre-seed";
    return "Idea validation";
  }

  function fundingStageDetail(score, hasValidation) {
    if (score >= 72 && hasValidation) return "Consider investor conversations when customer evidence, a credible team, and use of funds are ready to share.";
    if (hasValidation) return "Strengthen pilot evidence, retention, and a repeatable acquisition hypothesis before treating fundraising as the next milestone.";
    if (score >= 60) return "Validate the problem and test a small pilot before fundraising discussions become the primary focus.";
    return "Prioritize interviews, a low-cost prototype, and willingness-to-pay evidence before pursuing external capital.";
  }

  function formatCurrency(amount) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `$${amount.toLocaleString()}`;
    }
  }

  function renderReport(report, shouldScroll = true) {
    currentReport = report;
    const { input, scores, analysis } = report;
    setText("#reportTitle", input.name);
    setText("#reportSubtitle", `${input.category} · Prepared ${formatDate(report.createdAt)}${input.founder !== "Not specified" ? ` · Founder: ${input.founder}` : ""}`);
    setText("#overallScore", scores.overall);
    setText("#scoreVerdict", analysis.verdict);
    setText("#scoreSummary", analysis.summary);
    $("#scoreRing").style.background = `conic-gradient(var(--violet) ${scores.overall}%, var(--surface-raised) ${scores.overall}%)`;
    setText("#confidenceValue", `${scores.confidence}%`);
    setProgress("#confidenceBar", scores.confidence);
    setText("#successProbability", `${scores.successProbability}%`);
    setProgress("#successBar", scores.successProbability);
    setText("#investmentScore", scores.investmentReadiness);
    setProgress("#investmentBar", scores.investmentReadiness);
    setText("#fundingStage", analysis.investors.stage);
    setText("#investorReadiness", `${scores.investmentReadiness}/100`);
    setProgress("#investorBar", scores.investmentReadiness);
    setText("#investorStageText", analysis.investors.stageDetail);

    renderMarketMetrics(scores);
    renderInsights(analysis);
    renderLists(analysis);
    renderRevenue(analysis.revenue);
    renderSuggestions(analysis.suggestions);
    renderRoadmap(analysis.roadmap);
    renderCharts(report);
    $("#resultsSection").classList.remove("hidden");
    updateDashboard();
    if (shouldScroll) $("#resultsSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderMarketMetrics(scores) {
    const entries = [
      ["Market demand", scores.demand],
      ["Scalability", scores.scalability],
      ["Revenue potential", scores.revenue],
      ["Growth potential", scores.growth],
      ["Innovation signal", scores.innovation]
    ];
    const container = $("#marketMetrics");
    container.replaceChildren();
    entries.forEach(([name, value]) => {
      const row = document.createElement("div");
      row.className = "market-metric";
      const label = document.createElement("span");
      label.className = "market-metric-name";
      label.textContent = name;
      const score = document.createElement("span");
      score.className = "market-metric-score";
      score.textContent = `${value}`;
      const track = document.createElement("div");
      track.className = "market-metric-track";
      const fill = document.createElement("i");
      fill.style.width = `${value}%`;
      track.append(fill);
      row.append(label, score, track);
      container.append(row);
    });
  }

  function renderInsights(analysis) {
    const demand = $("#demandAnalysis");
    demand.replaceChildren();
    appendParagraph(demand, analysis.marketDemand.description);
    appendBullets(demand, analysis.marketDemand.signals);
    appendCallout(demand, `Ask next: ${analysis.marketDemand.validationQuestion}`);

    const scale = $("#scalabilityAnalysis");
    scale.replaceChildren();
    appendParagraph(scale, analysis.scalability.description);
    appendBullets(scale, analysis.scalability.constraints);
    appendCallout(scale, `Growth potential: ${scoreBand(analysis.scalability.growth)} (${analysis.scalability.growth}/100).`);

    const competitors = $("#competitorAnalysis");
    competitors.replaceChildren();
    appendParagraph(competitors, `Competition level: ${analysis.competitors.level}. The names below are research starting points, not confirmed direct competitors or a live market search.`);
    const competitorList = document.createElement("ul");
    competitorList.className = "insight-bullet-list";
    analysis.competitors.examples.forEach((competitor) => {
      const item = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = competitor.name;
      item.append(strong, document.createTextNode(` — ${competitor.detail}`));
      competitorList.append(item);
    });
    competitors.append(competitorList);
    appendParagraph(competitors, analysis.competitors.marketGap);
    const differentiation = document.createElement("div");
    differentiation.className = "insight-callout";
    const title = document.createElement("strong");
    title.textContent = "Differentiation opportunities";
    const ul = document.createElement("ul");
    ul.className = "insight-bullet-list";
    ul.style.marginTop = "5px";
    analysis.competitors.differentiationOpportunities.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      ul.append(li);
    });
    differentiation.append(title, ul);
    competitors.append(differentiation);

    const audience = $("#audienceAnalysis");
    audience.replaceChildren();
    appendAudienceBlock(audience, "Primary audience", analysis.audience.primary);
    appendAudienceBlock(audience, "Secondary audience", analysis.audience.secondary);
    appendAudienceBlock(audience, "Demographics & context", analysis.audience.demographics);
    const pains = document.createElement("div");
    pains.className = "audience-block";
    const painsLabel = document.createElement("span");
    painsLabel.textContent = "Likely pain points to validate";
    const painList = document.createElement("ul");
    painList.className = "plain-list";
    analysis.audience.painPoints.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      painList.append(li);
    });
    pains.append(painsLabel, painList);
    audience.append(pains);
  }

  function appendParagraph(parent, text) {
    const p = document.createElement("p");
    p.textContent = text;
    parent.append(p);
  }

  function appendBullets(parent, items) {
    const ul = document.createElement("ul");
    ul.className = "insight-bullet-list";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.append(li);
    });
    parent.append(ul);
  }

  function appendCallout(parent, text) {
    const callout = document.createElement("div");
    callout.className = "insight-callout";
    callout.textContent = text;
    parent.append(callout);
  }

  function appendAudienceBlock(parent, label, content) {
    const block = document.createElement("div");
    block.className = "audience-block";
    const name = document.createElement("span");
    name.textContent = label;
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    block.append(name, paragraph);
    parent.append(block);
  }

  function renderLists(analysis) {
    appendList("#strengthsList", analysis.swot.strengths);
    appendList("#weaknessesList", analysis.swot.weaknesses);
    appendList("#opportunitiesList", analysis.swot.opportunities);
    appendList("#threatsList", analysis.swot.threats);
    appendList("#prosList", analysis.pros);
    appendList("#consList", analysis.cons);
    appendList("#investorReasons", analysis.investors.reasons);
    appendList("#investorConcerns", analysis.investors.concerns);
  }

  function renderRevenue(revenue) {
    const list = $("#revenueModels");
    list.replaceChildren();
    revenue.models.forEach((model, index) => {
      const row = document.createElement("div");
      row.className = "revenue-model";
      const number = document.createElement("span");
      number.className = "revenue-model-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("strong");
      name.textContent = model.name;
      const detail = document.createElement("p");
      detail.textContent = model.detail;
      row.append(number, name, detail);
      list.append(row);
    });

    const fit = $("#revenueFit");
    fit.replaceChildren();
    revenue.fit.forEach((model) => {
      const card = document.createElement("div");
      card.className = "revenue-fit-item";
      const name = document.createElement("strong");
      name.textContent = model.name;
      const note = document.createElement("span");
      note.textContent = `Relative fit · ${model.fit}/100`;
      const track = document.createElement("div");
      track.className = "revenue-fit-track";
      const bar = document.createElement("i");
      bar.style.width = `${model.fit}%`;
      track.append(bar);
      card.append(name, note, track);
      fit.append(card);
    });
  }

  function renderSuggestions(suggestions) {
    const container = $("#suggestionsList");
    container.replaceChildren();
    suggestions.forEach((suggestion, index) => {
      const card = document.createElement("article");
      card.className = "suggestion-card";
      card.style.animationDelay = `${Math.min(index, 10) * 25}ms`;
      const number = document.createElement("span");
      number.className = "suggestion-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const text = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = suggestion.title;
      const detail = document.createElement("p");
      detail.textContent = suggestion.detail;
      text.append(title, detail);
      card.append(number, text);
      container.append(card);
    });
  }

  function renderRoadmap(phases) {
    const container = $("#roadmap");
    container.replaceChildren();
    phases.forEach((phase, index) => {
      const card = document.createElement("div");
      card.className = "roadmap-phase";
      const number = document.createElement("span");
      number.className = "phase-number";
      number.textContent = `0${index + 1}`;
      const title = document.createElement("strong");
      title.textContent = phase.title;
      const detail = document.createElement("p");
      detail.textContent = phase.detail;
      card.append(number, title, detail);
      container.append(card);
    });
  }

  function renderCharts(report) {
    if (!window.Chart) {
      showToast("Charts could not load. Check your connection and reload to view visualizations.", true);
      return;
    }
    const { scores, analysis } = report;
    const colors = chartColors();
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650 },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: colors.tooltip, titleColor: colors.text, bodyColor: colors.muted, borderColor: colors.border, borderWidth: 1, padding: 9, titleFont: { family: "DM Sans", size: 10 }, bodyFont: { family: "DM Sans", size: 9 } }
      }
    };
    createChart("scoreChart", {
      type: "bar",
      data: {
        labels: ["Demand", "Scale", "Revenue", "Growth", "Innovation"],
        datasets: [{ data: [scores.demand, scores.scalability, scores.revenue, scores.growth, scores.innovation], backgroundColor: ["#8b72e4", "#6e9ce8", "#60b9ad", "#8c83e7", "#d0a6ed"], borderRadius: 5, maxBarThickness: 26 }]
      },
      options: { ...commonOptions, scales: chartScales(colors, true), plugins: { ...commonOptions.plugins, tooltip: commonOptions.plugins.tooltip } }
    });
    createChart("swotChart", {
      type: "doughnut",
      data: { labels: ["Strengths", "Weaknesses", "Opportunities", "Threats"], datasets: [{ data: analysis.swot.distribution, backgroundColor: ["#64d5ad", "#ffbd70", "#8d83f6", "#fa7f97"], borderColor: colors.surface, borderWidth: 3, hoverOffset: 5 }] },
      options: { ...commonOptions, cutout: "67%", plugins: { ...commonOptions.plugins, legend: { display: false } } }
    });
    createChart("marketChart", {
      type: "radar",
      data: { labels: analysis.marketPotential.labels, datasets: [{ data: analysis.marketPotential.values, fill: true, backgroundColor: "rgba(141, 119, 230, .17)", borderColor: "#a38afa", borderWidth: 2, pointBackgroundColor: "#c5b2ff", pointRadius: 3 }] },
      options: {
        ...commonOptions,
        scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: colors.grid }, angleLines: { color: colors.grid }, pointLabels: { color: colors.muted, font: { family: "DM Sans", size: 8 } } } }
      }
    });
    createChart("revenueChart", {
      type: "bar",
      data: { labels: analysis.revenue.fit.slice(0, 5).map((model) => shortenLabel(model.name)), datasets: [{ data: analysis.revenue.fit.slice(0, 5).map((model) => model.fit), backgroundColor: ["#8c72e5", "#7d8ee5", "#6f9fdc", "#65b9c9", "#63c3a9"], borderRadius: 5, maxBarThickness: 25 }] },
      options: { ...commonOptions, indexAxis: "y", scales: chartScales(colors, false), plugins: { ...commonOptions.plugins, tooltip: commonOptions.plugins.tooltip } }
    });
    createChart("riskChart", {
      type: "bar",
      data: { labels: Object.keys(analysis.riskDimensions), datasets: [{ data: Object.values(analysis.riskDimensions), backgroundColor: ["#d9aa67", "#e48787", "#a687d5", "#dd8d73", "#c47fa0"], borderRadius: 4, maxBarThickness: 22 }] },
      options: {
        ...commonOptions,
        indexAxis: "y",
        scales: { x: { ...chartScales(colors, true).x, max: 100 }, y: chartScales(colors, true).y },
        plugins: { ...commonOptions.plugins, tooltip: commonOptions.plugins.tooltip }
      }
    });
  }

  function createChart(id, config) {
    if (chartInstances.has(id)) chartInstances.get(id).destroy();
    const canvas = $(`#${id}`);
    if (!canvas) return;
    chartInstances.set(id, new window.Chart(canvas, config));
  }

  function chartColors() {
    const style = getComputedStyle(document.body);
    return {
      text: style.getPropertyValue("--text").trim(),
      muted: style.getPropertyValue("--muted").trim(),
      grid: style.getPropertyValue("--line").trim(),
      border: style.getPropertyValue("--line-strong").trim(),
      surface: style.getPropertyValue("--surface-solid").trim(),
      tooltip: style.getPropertyValue("--surface-solid").trim()
    };
  }

  function chartScales(colors, vertical) {
    return {
      x: {
        beginAtZero: true,
        max: vertical ? undefined : 100,
        grid: { color: colors.grid, drawBorder: false },
        border: { display: false },
        ticks: { color: colors.muted, font: { family: "DM Sans", size: 8 }, maxRotation: 0, stepSize: vertical ? undefined : 25 }
      },
      y: {
        beginAtZero: true,
        max: vertical ? 100 : undefined,
        grid: { color: vertical ? colors.grid : "transparent", drawBorder: false },
        border: { display: false },
        ticks: { color: colors.muted, font: { family: "DM Sans", size: 8 }, padding: 4, stepSize: vertical ? 25 : undefined }
      }
    };
  }

  function shortenLabel(label) {
    const replacements = { "Subscription model": "Subscription", "Freemium model": "Freemium", "Enterprise plans": "Enterprise", "API services": "API" };
    return replacements[label] || label;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function saveReport(report) {
    const reports = readReports().filter((saved) => saved.id !== report.id);
    reports.unshift(report);
    if (writeReports(reports)) showToast("Assessment generated and saved to this browser.");
    renderHistory();
  }

  function renderHistory() {
    const reports = readReports();
    const container = $("#historyList");
    container.replaceChildren();
    if (!reports.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const icon = document.createElement("div");
      icon.className = "empty-icon";
      icon.textContent = "◷";
      const title = document.createElement("strong");
      title.textContent = "No reports yet";
      const message = document.createElement("span");
      message.textContent = "Run an assessment to see it here.";
      empty.append(icon, title, message);
      container.append(empty);
      updateDashboard();
      return;
    }
    reports.slice(0, 6).forEach((report) => {
      const row = document.createElement("div");
      row.className = "history-row";
      const icon = document.createElement("span");
      icon.className = "history-symbol";
      icon.textContent = "✦";
      const info = document.createElement("div");
      info.className = "history-info";
      const name = document.createElement("strong");
      name.textContent = report.input.name || "Untitled startup";
      const meta = document.createElement("span");
      meta.textContent = `${report.input.category} · ${formatDate(report.createdAt)}`;
      info.append(name, meta);
      const score = document.createElement("span");
      score.className = "history-score";
      score.textContent = report.scores.overall;
      const open = document.createElement("button");
      open.type = "button";
      open.className = "history-open";
      open.setAttribute("aria-label", `Open ${report.input.name} report`);
      open.textContent = "→";
      open.addEventListener("click", () => {
        renderReport(report);
        window.scrollTo({ top: $("#resultsSection").offsetTop - 75, behavior: "smooth" });
      });
      row.append(icon, info, score, open);
      container.append(row);
    });
    updateDashboard();
  }

  function updateDashboard() {
    const reports = readReports();
    setText("#totalAnalyses", reports.length);
    if (!reports.length) {
      setText("#averageScore", "—");
      setText("#averageScoreSuffix", "");
      setText("#topCategory", "Explore");
      setText("#topCategoryFoot", "Run your first analysis");
      return;
    }
    const average = Math.round(reports.reduce((sum, report) => sum + report.scores.overall, 0) / reports.length);
    setText("#averageScore", average);
    setText("#averageScoreSuffix", "/100");
    const best = reports.reduce((top, report) => report.scores.overall > top.scores.overall ? report : top, reports[0]);
    setText("#topCategory", best.input.category);
    setText("#topCategoryFoot", `Top score · ${best.scores.overall}/100`);
  }

  function setLoading(isLoading) {
    const button = $("#analyzeButton");
    const overlay = $("#loadingOverlay");
    if (isLoading) {
      button.classList.add("is-loading");
      button.disabled = true;
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      const messages = ["Mapping the opportunity landscape…", "Checking the assumptions…", "Building your validation brief…"];
      let index = 0;
      $("#loadingMessage").textContent = messages[index];
      loadingTimer = window.setInterval(() => {
        index = (index + 1) % messages.length;
        $("#loadingMessage").textContent = messages[index];
      }, 750);
      return;
    }
    button.classList.remove("is-loading");
    button.disabled = false;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    if (loadingTimer) window.clearInterval(loadingTimer);
    loadingTimer = null;
  }

  function downloadBlob(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(name) {
    return (name || "startup-report").normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "startup-report";
  }

  function exportJson() {
    if (!currentReport) {
      showToast("Generate or open a report before exporting.", true);
      return;
    }
    downloadBlob(JSON.stringify(currentReport, null, 2), `${safeFilename(currentReport.input.name)}-venturescope.json`, "application/json");
    showToast("Report data exported as JSON.");
  }

  function reportText(report) {
    const { input, scores, analysis } = report;
    const lines = [
      "VENTURESCOPE — STARTUP IDEA ASSESSMENT",
      `Startup: ${input.name}`,
      `Founder: ${input.founder}`,
      `Category: ${input.category}`,
      `Prepared: ${formatDate(report.createdAt)}`,
      "",
      "IMPORTANT: Directional, rule-based decision-support assessment. Not a forecast, verified market research, financial advice, or a substitute for customer validation.",
      "",
      `OVERALL SCORE: ${scores.overall}/100 — ${analysis.verdict}`,
      `Success signal: ${scores.successProbability}% (heuristic indicator, not a probability forecast)`,
      `Investment readiness: ${scores.investmentReadiness}/100`,
      `Assessment confidence: ${scores.confidence}/100`,
      "",
      "CORE SIGNALS",
      `Market demand: ${scores.demand}/100`,
      `Scalability: ${scores.scalability}/100`,
      `Revenue potential: ${scores.revenue}/100`,
      `Competition intensity: ${scores.competition}/100`,
      `Risk: ${scores.risk}/100`,
      `Growth potential: ${scores.growth}/100`,
      `Innovation signal: ${scores.innovation}/100`,
      "",
      "IDEA",
      input.description,
      `Target audience: ${input.audience}`,
      `Target market: ${input.market}`,
      `Technology: ${input.technology}`,
      `Estimated budget: ${input.budget === null ? "Not specified" : formatCurrency(input.budget)}`,
      "",
      "MARKET DEMAND",
      analysis.marketDemand.description,
      ...analysis.marketDemand.signals.map((item) => `• ${item}`),
      `Validation question: ${analysis.marketDemand.validationQuestion}`,
      "",
      "SCALABILITY",
      analysis.scalability.description,
      ...analysis.scalability.constraints.map((item) => `• ${item}`),
      "",
      "SWOT — STRENGTHS",
      ...analysis.swot.strengths.map((item) => `• ${item}`),
      "",
      "SWOT — WEAKNESSES",
      ...analysis.swot.weaknesses.map((item) => `• ${item}`),
      "",
      "SWOT — OPPORTUNITIES",
      ...analysis.swot.opportunities.map((item) => `• ${item}`),
      "",
      "SWOT — THREATS",
      ...analysis.swot.threats.map((item) => `• ${item}`),
      "",
      "POTENTIAL ADVANTAGES",
      ...analysis.pros.map((item) => `• ${item}`),
      "",
      "REAL CHALLENGES",
      ...analysis.cons.map((item) => `• ${item}`),
      "",
      "COMPETITOR LANDSCAPE",
      `Competition level: ${analysis.competitors.level}`,
      ...analysis.competitors.examples.map((item) => `• ${item.name}: ${item.detail}`),
      analysis.competitors.marketGap,
      "",
      "REVENUE MODEL OPTIONS",
      ...analysis.revenue.models.map((item) => `• ${item.name}: ${item.detail}`),
      "",
      "IMPROVEMENT SUGGESTIONS",
      ...analysis.suggestions.map((item, index) => `${index + 1}. ${item.title}: ${item.detail}`),
      "",
      "INVESTOR PERSPECTIVE",
      `Suggested stage: ${analysis.investors.stage}`,
      ...analysis.investors.reasons.map((item) => `Potential positive: ${item}`),
      ...analysis.investors.concerns.map((item) => `Potential concern: ${item}`),
      "",
      "ROADMAP",
      ...analysis.roadmap.map((item, index) => `Phase ${index + 1} — ${item.title}: ${item.detail}`),
      "",
      "Competitor categories and scores in this report are heuristic research prompts. Verify claims with primary sources and customer evidence."
    ];
    return lines.join("\n");
  }

  function downloadPdf() {
    if (!currentReport) {
      showToast("Generate or open a report before downloading a PDF.", true);
      return;
    }
    const JsPdf = window.jspdf?.jsPDF;
    if (!JsPdf) {
      showToast("PDF library could not load. Check your connection and try again.", true);
      return;
    }
    try {
      const doc = new JsPdf({ unit: "mm", format: "a4" });
      const margin = 17;
      const width = doc.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = margin;
      const lines = doc.splitTextToSize(reportText(currentReport), width);
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        if (line === line.toUpperCase() && line.length < 45 && line.length > 3) {
          y += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(72, 59, 126);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(56, 63, 77);
        }
        doc.text(line, margin, y);
        y += line === "" ? 2 : 4.2;
      });
      doc.save(`${safeFilename(currentReport.input.name)}-venturescope.pdf`);
      showToast("Your PDF report is ready.");
    } catch (error) {
      console.error("Unable to create the VentureScope PDF.", error);
      showToast("PDF creation failed. Try Print and choose Save as PDF.", true);
    }
  }

  function printReport() {
    if (!currentReport) {
      showToast("Generate or open a report before printing.", true);
      return;
    }
    window.print();
  }

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    const button = $("#themeToggle");
    const next = theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${next} mode`);
    button.title = `Switch to ${next} mode`;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Unable to save VentureScope theme preference.", error);
      showToast("Theme changed, but this browser could not save the preference.", true);
    }
    if (currentReport) renderCharts(currentReport);
  }

  function initializeTheme() {
    let savedTheme = "dark";
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") savedTheme = saved;
    } catch (error) {
      console.error("Unable to read VentureScope theme preference.", error);
    }
    document.body.dataset.theme = savedTheme;
    const next = savedTheme === "dark" ? "light" : "dark";
    $("#themeToggle").setAttribute("aria-label", `Switch to ${next} mode`);
    $("#themeToggle").title = `Switch to ${next} mode`;
  }

  function clearHistory() {
    const reports = readReports();
    if (!reports.length) {
      showToast("There are no saved reports to clear.");
      return;
    }
    if (!window.confirm(`Delete all ${reports.length} saved report${reports.length === 1 ? "" : "s"} from this browser? This cannot be undone.`)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
      if (currentReport && !readReports().some((report) => report.id === currentReport.id)) currentReport = null;
      showToast("Local report history cleared.");
    } catch (error) {
      console.error("Unable to clear VentureScope report history.", error);
      showToast("Report history could not be cleared.", true);
    }
  }

  function bindNavigation() {
    const sidebar = $("#sidebar");
    const menuButton = $("#mobileMenuButton");
    menuButton.addEventListener("click", () => {
      const open = sidebar.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    $$(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        $$(".nav-link").forEach((item) => item.classList.remove("active"));
        link.classList.add("active");
        sidebar.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", (event) => {
      if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
        sidebar.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  function bindEvents() {
    $("#ideaForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = getFormInput();
      if (!input) return;
      setLoading(true);
      await new Promise((resolve) => window.setTimeout(resolve, 1250));
      try {
        const report = buildReport(input);
        saveReport(report);
        renderReport(report);
        $("#formError").textContent = "";
      } catch (error) {
        console.error("Unable to analyze startup idea.", error);
        showToast("The assessment could not be completed. Review the inputs and try again.", true);
      } finally {
        setLoading(false);
      }
    });
    $("#ideaDescription").addEventListener("input", (event) => {
      setText("#descriptionCount", event.target.value.length);
      $("#formError").textContent = "";
    });
    $("#themeToggle").addEventListener("click", () => setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"));
    $("#newAnalysisTop").addEventListener("click", () => {
      $("#analyzer").scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => $("#startupName").focus({ preventScroll: true }), 400);
    });
    $("#clearHistory").addEventListener("click", clearHistory);
    $("#downloadPdf").addEventListener("click", downloadPdf);
    $("#printReport").addEventListener("click", printReport);
    $("#exportJson").addEventListener("click", exportJson);
    bindNavigation();
  }

  function initialize() {
    initializeTheme();
    bindEvents();
    renderHistory();
    if (!window.Chart) {
      window.addEventListener("load", () => {
        if (!window.Chart) console.error("Chart.js did not load. Check the network connection to view charts.");
      }, { once: true });
    }
  }

  initialize();
})();
