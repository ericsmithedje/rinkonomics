export interface MilestoneDefinition {
  id: string;
  title: string;
  threshold: number;
  unlockGenerators: string[];
  unlockUpgrades: string[];
  notification: string;
}

export const milestones: MilestoneDefinition[] = [
  {
    id: 'backyard-rink-kid',
    title: 'Backyard Rink Kid',
    threshold: 0,
    unlockGenerators: ['stick-boy'],
    unlockUpgrades: [],
    notification: 'Welcome to Rinkonomics! Click the puck to get started.',
  },
  {
    id: 'junior-league',
    title: 'Junior League',
    threshold: 100,
    unlockGenerators: ['pee-wee-player'],
    unlockUpgrades: ['composite-stick'],
    notification: '🏒 Junior League! You\'ve earned your first team jersey.',
  },
  {
    id: 'minor-leagues',
    title: 'Minor Leagues',
    threshold: 1000,
    unlockGenerators: ['junior-league-team'],
    unlockUpgrades: ['better-tape-job'],
    notification: '🏒 Minor Leagues! You\'re climbing the hockey ladder.',
  },
  {
    id: 'ahl-callup',
    title: 'AHL Call-up',
    threshold: 10000,
    unlockGenerators: ['scout', 'skills-coach'],
    unlockUpgrades: ['carbon-blade'],
    notification: '🏒 AHL Call-up! The pros are watching.',
  },
  {
    id: 'nhl-roster-spot',
    title: 'NHL Roster Spot',
    threshold: 100000,
    unlockGenerators: ['ahl-affiliate', 'nhl-roster'],
    unlockUpgrades: ['pro-stick-flex'],
    notification: '🏒 NHL Roster Spot! You\'ve made it to the big leagues!',
  },
  {
    id: 'all-star',
    title: 'All-Star',
    threshold: 1000000,
    unlockGenerators: ['arena'],
    unlockUpgrades: [],
    notification: '⭐ All-Star! Fans pack the arena for you.',
  },
  {
    id: 'stanley-cup-champion',
    title: 'Stanley Cup Champion',
    threshold: 10000000,
    unlockGenerators: ['media-empire'],
    unlockUpgrades: [],
    notification: '🏆 Stanley Cup Champion! Your name is on the Cup.',
  },
  {
    id: 'hockey-legend',
    title: 'Hockey Legend',
    threshold: 100000000,
    unlockGenerators: ['hockey-dynasty'],
    unlockUpgrades: [],
    notification: '🌟 Hockey Legend! Start a New Season to build an even greater dynasty.',
  },
];
