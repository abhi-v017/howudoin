export interface PresetAvatar {
  id: string;
  name: string;
  category: 'Cyber Bot' | 'Identicon' | 'Persona' | 'Abstract';
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Cyber Bots
  {
    id: 'bot-1',
    name: 'Cyber Blue',
    category: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBlue&backgroundColor=050505',
  },
  {
    id: 'bot-2',
    name: 'Matrix Mint',
    category: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MatrixMint&backgroundColor=050505',
  },
  {
    id: 'bot-3',
    name: 'Neon Core',
    category: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonCore&backgroundColor=050505',
  },
  {
    id: 'bot-4',
    name: 'Volt Echo',
    category: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=VoltEcho&backgroundColor=050505',
  },

  // Personas
  {
    id: 'persona-1',
    name: 'Aero',
    category: 'Persona',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Aero&backgroundColor=050505',
  },
  {
    id: 'persona-2',
    name: 'Nova',
    category: 'Persona',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Nova&backgroundColor=050505',
  },
  {
    id: 'persona-3',
    name: 'Vesper',
    category: 'Persona',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Vesper&backgroundColor=050505',
  },
  {
    id: 'persona-4',
    name: 'Atlas',
    category: 'Persona',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Atlas&backgroundColor=050505',
  },

  // Identicons
  {
    id: 'ident-1',
    name: 'Prism Key',
    category: 'Identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=PrismKey&backgroundColor=050505',
  },
  {
    id: 'ident-2',
    name: 'Vortex Hash',
    category: 'Identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=VortexHash&backgroundColor=050505',
  },
  {
    id: 'ident-3',
    name: 'Zenith Vector',
    category: 'Identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=ZenithVector&backgroundColor=050505',
  },
  {
    id: 'ident-4',
    name: 'Nebula Cipher',
    category: 'Identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=NebulaCipher&backgroundColor=050505',
  },

  // Abstract Shapes
  {
    id: 'shape-1',
    name: 'Cosmic Node',
    category: 'Abstract',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=CosmicNode&backgroundColor=050505',
  },
  {
    id: 'shape-2',
    name: 'Quantum Ring',
    category: 'Abstract',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=QuantumRing&backgroundColor=050505',
  },
  {
    id: 'shape-3',
    name: 'Solar Flare',
    category: 'Abstract',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=SolarFlare&backgroundColor=050505',
  },
  {
    id: 'shape-4',
    name: 'Dark Matter',
    category: 'Abstract',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=DarkMatter&backgroundColor=050505',
  },
];
