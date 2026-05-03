// Helper para usar iconos lucide-react vía nombre en string (útil cuando vienen de data files).
import {
  Info, User, FileText, Ban, Lock, PackageOpen, Car, Banknote, Clock, Calendar,
  Users, UserCog, Shield, Ticket, Crosshair, Zap, Utensils, FlaskConical, Box,
  ShoppingBag, Gem, Vault, Anchor, Landmark, AlertTriangle, MinusCircle, CircleDot,
  ShieldCheck, Settings, ShieldOff, Target, Mail, Clipboard
} from 'lucide-react';

const ICON_MAP = {
  info: Info,
  user: User,
  'file-text': FileText,
  ban: Ban,
  lock: Lock,
  'package-open': PackageOpen,
  car: Car,
  banknote: Banknote,
  clock: Clock,
  calendar: Calendar,
  users: Users,
  'user-cog': UserCog,
  shield: Shield,
  ticket: Ticket,
  crosshair: Crosshair,
  zap: Zap,
  utensils: Utensils,
  'flask-conical': FlaskConical,
  box: Box,
  'shopping-bag': ShoppingBag,
  gem: Gem,
  vault: Vault,
  anchor: Anchor,
  landmark: Landmark,
  'alert-triangle': AlertTriangle,
  'minus-circle': MinusCircle,
  'circle-dot': CircleDot,
  'shield-check': ShieldCheck,
  settings: Settings,
  'shield-off': ShieldOff,
  target: Target,
  mail: Mail,
  clipboard: Clipboard
};

export default function Lucide({ name, size = 13, ...rest }) {
  const Comp = ICON_MAP[name] || Info;
  return <Comp size={size} {...rest} />;
}
