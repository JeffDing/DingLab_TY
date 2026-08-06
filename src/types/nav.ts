export interface NavItem {
  id: string;
  name: string;
  type: 'category' | 'link' | 'local-page';
  url?: string;
  target?: '_self' | '_blank' | '_top' | 'main';
  parentId?: string;
  order: number;
  children?: NavItem[];
}
