export type LiveSource = {
  url: string;
  quality: string | null;
  label: string | null;
};

export type LiveChannel = {
  id: string;
  name: string;
  altNames: string[];
  country: string | null;
  languages: string[];
  categories: string[];
  logo: string | null;
  website: string | null;
  isNsfw: boolean;
  sources: LiveSource[];
  sourceCount: number;
};

export type ChannelFilters = {
  country?: string;
  category?: string;
  query?: string;
  includeNsfw?: boolean;
  blockedIds?: Set<string>;
};

export type EpgProgramme = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
};
