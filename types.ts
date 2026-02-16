
export interface AdventureIdea {
  title: string;
  setting: string;
  hook: string;
  antagonist: string;
}

export interface NPC {
  name: string;
  race: string;
  occupation: string;
  personality: string;
  secret: string;
}

export interface UpcomingSession {
  id: string;
  title: string;
  system: string;
  date: string;
  gm: string;
  description: string;
  banner: string;
  discordLink: string;
  isFull: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  link: string;
}

export interface SiteBranding {
  logo: string;
  heroBg: string;
  aboutOverlay: string;
}

export type UserRole = 'guest' | 'member' | 'mj' | 'admin';

export interface UserState {
  isLoggedIn: boolean;
  role: UserRole;
  name: string;
}

export interface Account {
  username: string;
  passwordHash: string; // En local, on stockera en clair ou base64 pour l'exercice
  role: UserRole;
}

export enum NavSection {
  Home = 'home',
  About = 'about',
  Gallery = 'gallery',
  Discord = 'discord',
  Membership = 'membership',
  Shop = 'shop',
  Sessions = 'sessions',
  MJ = 'mj',
  Admin = 'admin'
}

export enum MJSonSection {
  Generator = 'generator',
  Notes = 'notes',
  Maps = 'maps',
  Eye = 'eye',
  Assistant = 'assistant',
  Planning = 'planning'
}

export enum AdminSubSection {
  Results = 'results',
  HelloAsso = 'helloasso',
  Discord = 'discord',
  Settings = 'settings',
  ShopManager = 'shop_manager',
  ProjectManager = 'project_manager',
  PartnerManager = 'partner_manager',
  GalleryManager = 'gallery_manager'
}

export enum SessionSubSection {
  Signup = 'signup',
  Feedback = 'feedback'
}
