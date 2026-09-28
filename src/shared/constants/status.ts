import { lightTokens as T } from '@/shared/theme';

export interface StatusConfig {
  color: string;
  bg: string;
  dot: string;
}

export const STATUS: Record<string, StatusConfig> = {
  'Pending Underwriting': { color: T.amber,  bg: T.amberLight,  dot: T.amber  },
  'Pending Response':     { color: T.sky,    bg: T.skyLight,    dot: T.sky    },
  'Pending Signature':    { color: T.orange, bg: T.orangeLight, dot: T.orange },
  'Ready to Activate':    { color: T.blue,   bg: T.blueLight,   dot: T.blue   },
  'Active':               { color: T.green,  bg: T.greenLight,  dot: T.green  },
  'Declined by UW':       { color: T.red,    bg: T.redLight,    dot: T.red    },
  'Declined by Member':   { color: T.red,    bg: T.redLight,    dot: T.red    },
  'Termed':               { color: T.slate,  bg: '#F8FAFC',     dot: T.slate  },
};



