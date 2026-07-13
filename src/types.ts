export interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: string;
  location?: string;
  isLocked?: boolean;
}

export type ColorOption = {
  name: string;
  className: string;
};
