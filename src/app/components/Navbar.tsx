'use client';

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Box,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Material-UI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightIcon from '@mui/icons-material/Flight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

// 환경 변수에서 dashboard base 경로를 가져옵니다.
const dashboardBase = process.env.NEXT_PUBLIC_DASHBOARD_PATH || '/dashboard';

// 네비게이션 항목: 모든 경로는 dashboardBase를 기준으로 구성됩니다.
const navItems = [
  { href: dashboardBase, label: 'Dashboard', icon: <DashboardIcon /> },
  { href: `${dashboardBase}/competitive_hotel_price`, label: 'Hotel Prices', icon: <PriceChangeIcon /> },
  { href: `${dashboardBase}/event_calendar`, label: 'Event Calendar', icon: <CalendarTodayIcon /> },
  { href: `${dashboardBase}/flight_price`, label: 'Flight Prices', icon: <FlightIcon /> },
  { href: `${dashboardBase}/weather_status`, label: 'Weather Status', icon: <WbSunnyIcon /> },
  { href: `${dashboardBase}/trend_of_famous_hotels`, label: 'Hotel Trends', icon: <TrendingUpIcon /> },
  { href: `${dashboardBase}/ai_price_prediction_solution`, label: 'AI Pricing Solution', icon: <SmartToyIcon /> },
  { href: `${dashboardBase}/settings`, label: 'Settings', icon: <SettingsIcon /> },
  { href: `${dashboardBase}/payment`, label: 'Payment', icon: <PaymentIcon /> },
  { href: `${dashboardBase}/language`, label: 'Language', icon: <LanguageIcon /> },
  { href: `${dashboardBase}/logout`, label: 'Logout', icon: <LogoutIcon /> },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListSubheader>Navigation</ListSubheader>
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: '10px',
                  margin: '5px 10px',
                  color: 'gray',
                  '&:hover': { backgroundColor: 'rgba(135, 206, 250, 0.3)' },
                  ...(pathname === item.href && {
                    backgroundColor: 'rgba(135, 206, 250, 0.5)',
                    color: 'black',
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: pathname === item.href ? 'black' : 'gray',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Navbar;