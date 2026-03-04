export interface GeneratorDefinition {
  id: string;
  name: string;
  flavor: string;
  baseCost: number;
  basePps: number;
  unlockThreshold: number;
}

export const generators: GeneratorDefinition[] = [
  {
    id: 'stick-boy',
    name: 'Stick Boy',
    flavor: 'Tapes sticks and passes pucks at the rink. Every dynasty starts here.',
    baseCost: 15,
    basePps: 0.1,
    unlockThreshold: 0,
  },
  {
    id: 'pee-wee-player',
    name: 'Pee-Wee Player',
    flavor: 'Young talent on the ice, earning pucks one shift at a time.',
    baseCost: 100,
    basePps: 0.5,
    unlockThreshold: 10,
  },
  {
    id: 'junior-league-team',
    name: 'Junior League Team',
    flavor: 'A whole squad grinding pucks together. Teamwork makes the dream work.',
    baseCost: 500,
    basePps: 4,
    unlockThreshold: 75,
  },
  {
    id: 'scout',
    name: 'Scout',
    flavor: 'Travels to every cold rink in the country finding hidden talent.',
    baseCost: 2000,
    basePps: 20,
    unlockThreshold: 400,
  },
  {
    id: 'skills-coach',
    name: 'Skills Coach',
    flavor: 'Turns raw rookies into puck-producing machines.',
    baseCost: 10000,
    basePps: 100,
    unlockThreshold: 2000,
  },
  {
    id: 'ahl-affiliate',
    name: 'AHL Affiliate',
    flavor: 'Your farm team keeps the pipeline flowing with professional talent.',
    baseCost: 50000,
    basePps: 400,
    unlockThreshold: 10000,
  },
  {
    id: 'nhl-roster',
    name: 'NHL Roster',
    flavor: 'The big show. A full NHL roster grinding pucks at the highest level.',
    baseCost: 250000,
    basePps: 1600,
    unlockThreshold: 50000,
  },
  {
    id: 'arena',
    name: 'Arena',
    flavor: 'Fans pack the seats every night, generating pucks by the thousands.',
    baseCost: 1250000,
    basePps: 6000,
    unlockThreshold: 250000,
  },
  {
    id: 'media-empire',
    name: 'Media Empire',
    flavor: 'TV deals, streaming rights, merchandise. Hockey is everywhere.',
    baseCost: 7500000,
    basePps: 20000,
    unlockThreshold: 1000000,
  },
  {
    id: 'hockey-dynasty',
    name: 'Hockey Dynasty',
    flavor: 'Multiple franchises, global reach, and a legacy etched in ice.',
    baseCost: 50000000,
    basePps: 65000,
    unlockThreshold: 5000000,
  },
];

export const generatorsById = new Map(generators.map((g) => [g.id, g]));
