import { HomeScreen } from '@/components/Home/HomeScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NeonPay — Home',
  description: 'Send, receive, and convert digital dollars on Celo.',
};

export default function HomeApp() {
  return <HomeScreen />;
}
