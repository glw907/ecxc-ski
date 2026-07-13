/**
 * The ECXC waiver as structured, code-owned data.
 *
 * The legal text lives here rather than in editable content so that every change is a
 * deliberate commit and so {@link WAIVER_HASH} pins exactly what a family signed. The
 * registration pipeline records the hash with each signature; editing any section without
 * updating the hash fails the waiver test, which is the tripwire this module exists for.
 *
 * Each section carries two layers: `summary` is the non-operative plain-terms layer the
 * form labels as a readability aid, and `html` is the operative text. Attorney review of
 * the operative text is tracked on the pre-publish checklist in docs/STATUS.md.
 */

/** One section of the waiver: a friendly summary plus the operative legal text. */
export type WaiverSection = {
  /** Stable identifier; the registration schema derives one agreement checkbox per id. */
  id: string;
  title: string;
  /** Plain-terms summary, labeled non-operative in the UI. */
  summary: string;
  /** Operative legal text as HTML. */
  html: string;
};

export const WAIVER_SECTIONS: WaiverSection[] = [
  {
    id: 'about',
    title: 'About the Program',
    summary:
      'We are an informal, free, volunteer-run training group. We are not part of the ' +
      'school district or any club, and the adults are unpaid volunteers, not paid ' +
      'professionals.',
    html:
      '<p>East Community Cross Country ("ECXC" or the "Program", at ecxc.ski) is an ' +
      'informal, free, community-run training group for high school athletes. The Program ' +
      'is <strong>not</strong> affiliated with, sponsored by, endorsed by, or connected to ' +
      'the Anchorage School District, East High School, any other school, any club, or any ' +
      'business or commercial entity. Coaches and adult chaperones are unpaid volunteers ' +
      'and are not acting as paid professionals, certified instructors, licensed guides, or ' +
      'commercial trip leaders.</p>' +
      '<p>No fee is charged for participation. Voluntary donations may be accepted to ' +
      'offset shared expenses such as gas, campground fees, and group equipment, but no ' +
      'participant is required to donate. Many participants are under 18 and will not ' +
      'always be in the immediate presence of their parents during training sessions, ' +
      'travel, or the multi-day camp. Volunteer adults are responsible for supervision ' +
      'during scheduled activities and need parental authorization to obtain medical care ' +
      'for a minor if necessary.</p>',
  },
  {
    id: 'activities',
    title: 'Program Activities, Dates & Locations',
    summary:
      'This waiver covers everything the Program does in summer 2026: running, mountain ' +
      'biking, strength work, roller-skiing, and the July camp near Talkeetna, plus travel ' +
      'between activities in private vehicles driven by volunteers.',
    html:
      '<p>This Waiver and Release covers the Participant\'s participation in the following ' +
      'Program activities from <strong>June 1 through August 19, 2026</strong>:</p>' +
      '<ol>' +
      '<li><strong>Running.</strong> Road running, trail running, and track workouts on ' +
      'paved and unpaved surfaces in the Anchorage area, including Kincaid Park, the Tony ' +
      'Knowles Coastal Trail, the Hillside trail system, and city sidewalks and ' +
      'roadways.</li>' +
      '<li><strong>Mountain biking.</strong> Off-road cycling on singletrack, gravel, and ' +
      'dirt trails, and on-road cycling on paved roads, bike paths, and parking lots. May ' +
      'include technical terrain, descents, jumps, and rocky or rooted trails.</li>' +
      '<li><strong>Strength training.</strong> Bodyweight exercises, plyometrics, free ' +
      'weights, and related conditioning at designated facilities and outdoor ' +
      'locations.</li>' +
      '<li><strong>Roller-skiing.</strong> Roller-skiing on paved roads, bike paths, and ' +
      'parking lots in the Anchorage area, which may include roadways shared with motor ' +
      'vehicle traffic.</li>' +
      '<li><strong>Multi-day camp.</strong> A training camp <strong>July 21 through 24, ' +
      '2026</strong>, at a lakeside site near <strong>Talkeetna, Alaska</strong> (exact ' +
      'site and address provided to registered families). Includes overnight lodging in ' +
      'rustic cabins, group meals, and concentrated training, and may include hiking, ' +
      'swimming, boating, sauna use, and other outdoor recreation.</li>' +
      '</ol>' +
      '<p><strong>Transportation.</strong> Travel to and from Program activities and the ' +
      'camp is by private vehicles driven by volunteer coaches, parents, or other adult ' +
      'volunteers. By signing this document I specifically authorize such ' +
      'transportation.</p>',
  },
  {
    id: 'risks',
    title: 'Acknowledgment & Assumption of Inherent Risks',
    summary:
      'These sports carry real risks that no amount of care removes: falls, collisions, ' +
      'weather, wildlife, and in rare cases serious injury or death. Alaska law says a ' +
      'participant takes on those built-in risks, and you are agreeing your athlete does.',
    html:
      '<p>I understand and acknowledge that the activities listed above carry ' +
      '<strong>inherent risks that cannot be eliminated</strong> regardless of the care ' +
      'taken by volunteer coaches or other adults. Under <strong>Alaska Statute ' +
      '09.65.290</strong>, a person who participates in a sports or recreational activity ' +
      'assumes the inherent risks of that activity. Inherent risks include, without ' +
      'limitation:</p>' +
      '<ul>' +
      '<li><strong>Running:</strong> falls; sprains, strains, and overuse injuries; ' +
      'collisions with vehicles, cyclists, pedestrians, or wildlife; heat illness; ' +
      'hypothermia; getting lost on trails; moose, bear, and other wildlife ' +
      'encounters.</li>' +
      '<li><strong>Mountain biking:</strong> crashes and falls at speed; collisions with ' +
      'vehicles, other riders, pedestrians, trees, rocks, and obstacles; mechanical ' +
      'failure; head, neck, spine, and orthopedic injuries; wildlife encounters.</li>' +
      '<li><strong>Strength training:</strong> muscle and connective-tissue injuries; ' +
      'dropped or improperly loaded weights; equipment failure; injuries from improper ' +
      'form or fatigue.</li>' +
      '<li><strong>Roller-skiing:</strong> falls on pavement at speed; collisions with ' +
      'motor vehicles, pedestrians, cyclists, or other roller-skiers; road hazards ' +
      'including potholes, gravel, and debris; loss of control on hills.</li>' +
      '<li><strong>Multi-day camp:</strong> all of the above, plus camping accidents; ' +
      'cooking and fire-related injuries; exposure to weather extremes; bear and moose ' +
      'encounters; water-related risks including drowning; sauna-related risks; ' +
      'food-related illness; distance from immediate medical care; vehicle accidents ' +
      'during travel.</li>' +
      '<li><strong>All activities:</strong> the risk of serious injury, catastrophic ' +
      'injury, permanent disability, and death exists in all of the above activities and ' +
      'during travel between them.</li>' +
      '</ul>' +
      '<p>On behalf of myself and the Participant, I <strong>knowingly and voluntarily ' +
      'assume all inherent risks</strong> of the Participant\'s participation in the ' +
      'Program.</p>',
  },
  {
    id: 'release',
    title: 'Waiver and Release of Liability',
    summary:
      'You are agreeing not to sue the volunteers or the landowners who host us for ' +
      'ordinary negligence if your athlete is hurt, and to cover any claim brought on the ' +
      'athlete\'s behalf. This does not excuse reckless or intentional misconduct, and it ' +
      'cannot waive anything Alaska law says a parent cannot waive.',
    html:
      '<p>In exchange for the opportunity for the Participant to participate in the ' +
      'Program described above, and pursuant to <strong>Alaska Statute 09.65.292</strong> ' +
      'where the Participant is a minor, I hereby <strong>release, waive, and ' +
      'discharge</strong> the volunteer coaches and adult chaperones (including but not ' +
      'limited to Geoffrey Wright and any other adult volunteers acting on behalf of the ' +
      'Program), any host venues or property owners on whose land Program activities ' +
      'occur, and all of their agents, representatives, successors, heirs, and assigns ' +
      '(collectively, the "Released Parties") from any and all <strong>claims for ' +
      'negligence</strong>, including any claim, demand, action, cause of action, ' +
      'judgment, loss, liability, cost, or expense (including attorney\'s fees and court ' +
      'costs) arising out of or connected with the Participant\'s participation in the ' +
      'Program, including travel to and from any Program activity or location, and ' +
      'including any injury, illness, or property damage the Participant may incur or ' +
      'sustain.</p>' +
      '<p>I further agree to <strong>indemnify and hold harmless</strong> the Released ' +
      'Parties from any claim brought by the Participant, by me, or by any other person on ' +
      'behalf of the Participant, on account of damages resulting from the Participant\'s ' +
      'participation in the Program, to the maximum extent permitted by Alaska law.</p>' +
      '<p><strong>Limitation required by AS 09.65.292(b):</strong> this Waiver and Release ' +
      'does <strong>not</strong> release the Released Parties from claims based on ' +
      'reckless or intentional misconduct. Nothing in this document waives any claim that ' +
      'Alaska law does not permit a parent to waive on behalf of a minor. I acknowledge ' +
      'that nothing in this document guarantees that the Program or any activity will ' +
      'occur as planned.</p>',
  },
  {
    id: 'medical',
    title: 'Medical Authorization',
    summary:
      'If your athlete is hurt or sick and you cannot be reached in time, you are ' +
      'authorizing the volunteers to get them medical care, including emergency treatment ' +
      'and transport. Medical bills are the family\'s responsibility, not the volunteers\'.',
    html:
      '<p>In the event of illness or injury to the Participant during the Program, I ' +
      'authorize the volunteer coaches and adult chaperones to:</p>' +
      '<ol>' +
      '<li>administer first aid and CPR as appropriate to their training;</li>' +
      '<li>contact emergency medical services (911) and seek emergency medical ' +
      'treatment;</li>' +
      '<li>authorize, on my behalf, examination, anesthesia, medical or surgical diagnosis, ' +
      'and treatment by licensed medical professionals, including hospital care, if the ' +
      'Participant\'s condition requires it and I cannot be reached in time; and</li>' +
      '<li>transport the Participant to the nearest appropriate medical facility.</li>' +
      '</ol>' +
      '<p><strong>I am financially responsible for all medical bills, transport costs, and ' +
      'related expenses</strong> incurred on behalf of the Participant during the Program. ' +
      'The Released Parties are not financially responsible for any such costs. I release ' +
      'the Released Parties from any liability arising out of the good-faith exercise of ' +
      'this medical authorization.</p>',
  },
  {
    id: 'medications',
    title: 'Medications & Self-Administration',
    summary:
      'Your athlete brings and takes their own prescription medications. Volunteers can ' +
      'remind but never administer or supply them. Tell us about anything that could need ' +
      'an emergency response, like an epinephrine auto-injector.',
    html:
      '<p>I confirm that the Participant will bring any prescription medications they ' +
      'currently take and will self-administer them at prescribed doses. I understand that ' +
      '<strong>the volunteer coaches and adult chaperones will not administer or supply ' +
      'prescription medications</strong>, though they may remind the Participant to take ' +
      'them. I will provide the volunteers with information about any condition that may ' +
      'require an emergency response (for example, an epinephrine auto-injector for severe ' +
      'allergies), and I have disclosed the Participant\'s medications, allergies, and ' +
      'relevant medical conditions in this registration.</p>',
  },
  {
    id: 'conduct',
    title: 'Code of Conduct',
    summary:
      'The ground rules: no substances, helmets on wheels, seat belts in cars, follow ' +
      'safety instructions, treat people well, stay with the group. Breaking them can mean ' +
      'being sent home at the family\'s expense.',
    html:
      '<p>The Participant and I agree that the Participant will follow these rules during ' +
      'all Program activities, including travel and the multi-day camp:</p>' +
      '<ul>' +
      '<li>no use, possession, or distribution of alcohol, tobacco, vaping products, ' +
      'marijuana, or other controlled substances;</li>' +
      '<li>respect for other participants, volunteers, members of the public, and ' +
      'property;</li>' +
      '<li>compliance with safety-related instructions from volunteer coaches and ' +
      'chaperones;</li>' +
      '<li>no unsupervised departure from group activities or the camp location;</li>' +
      '<li>helmets at all times when mountain biking or roller-skiing;</li>' +
      '<li>seat belts at all times during transportation; and</li>' +
      '<li>no harassment, hazing, bullying, or discrimination of any kind.</li>' +
      '</ul>' +
      '<p>Violation of these rules may result in the Participant being <strong>dismissed ' +
      'from the Program, including being sent home early from camp at my expense</strong>, ' +
      'with no refund of any donation made.</p>',
  },
  {
    id: 'legal',
    title: 'Electronic Signature, Adult Participants & General Terms',
    summary:
      'Typing your name in this form counts as a real, binding signature. An athlete who ' +
      'is 18 or older signs for themselves. Alaska law governs this agreement, and if one ' +
      'part of it is found invalid the rest still stands.',
    html:
      '<p><strong>Electronic signature.</strong> I agree that typing my name into the ' +
      'signature field of this form and submitting it constitutes my electronic signature ' +
      'under the federal Electronic Signatures in Global and National Commerce Act and the ' +
      'Alaska Uniform Electronic Transactions Act (AS 09.80), with the same legal force as ' +
      'a handwritten signature. I consent to conducting this transaction electronically ' +
      'and acknowledge that I will receive a copy of the signed record by email.</p>' +
      '<p><strong>Adult participants.</strong> If the Participant is 18 years of age or ' +
      'older at the time of signing, the Participant signs this document on their own ' +
      'behalf: every reference to the Participant\'s parent or guardian assuming risk, ' +
      'releasing claims, or granting authorization applies to the adult Participant ' +
      'directly, and no parent or guardian signature is required.</p>' +
      '<p><strong>Governing law and severability.</strong> This document is governed by ' +
      'the laws of the State of Alaska, and any dispute arising under it shall be brought ' +
      'in the courts of Anchorage, Alaska. If any provision of this document is held ' +
      'invalid or unenforceable, the remaining provisions continue in full force and ' +
      'effect.</p>' +
      '<p><strong>Acknowledgment.</strong> I have read this Waiver and Release of ' +
      'Liability, Assumption of Risk, and Medical Authorization in its entirety and I ' +
      'understand its contents. I am aware that it <strong>releases the Released Parties ' +
      'from liability for negligence</strong> and contains my <strong>voluntary and ' +
      'knowing assumption of the risk</strong> of injury or illness to the Participant. I ' +
      'sign it voluntarily and of my own free will. Where the Participant is a minor, the ' +
      'Participant has read this document and discussed its contents with me, and the ' +
      'Participant acknowledges and assumes the risks of participation.</p>',
  },
];

/**
 * SHA-256 hex of every section's operative HTML, concatenated in order.
 *
 * Recorded with each signature so the record proves which text was signed. Recompute with
 * {@link computeWaiverHash} and update this constant in the same commit as any text change;
 * the waiver test fails on any mismatch.
 */
export const WAIVER_HASH = '35d207990d8ceb9f1a85437324fc772fd0a27a37eb6016d1b0b412b3fc5f9874';

/** Recomputes the waiver hash from {@link WAIVER_SECTIONS} via WebCrypto. */
export async function computeWaiverHash(): Promise<string> {
  const text = WAIVER_SECTIONS.map((s) => s.html).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
