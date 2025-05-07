'use client';

import React from 'react';
import {
  Drawer,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Material-UI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightIcon from '@mui/icons-material/Flight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
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
  { href: `${dashboardBase}/settings`, label: 'Settings', icon: <SettingsIcon /> },
  { href: `${dashboardBase}/payment`, label: 'Payment', icon: <PaymentIcon /> },
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
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#2c3e50',
          color: 'white',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar />
      <Box sx={{
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '0px',  // 웹킷 기반 브라우저에서 스크롤바 너비를 0으로 설정
        },
        scrollbarWidth: 'none',  // Firefox에서 스크롤바 숨기기
        msOverflowStyle: 'none',  // IE와 Edge에서 스크롤바 숨기기
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 0'
        }}>
          <Image
            src="/intelligentlon.png"
            alt="Company Logo"
            width={180}
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        {navItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              sx={{
                padding: '10px 16px',
                margin: '4px 10px',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                },
                ...(pathname === item.href && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  color: pathname === item.href ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  minWidth: '40px',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '14px',
                  fontWeight: pathname === item.href ? 'medium' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </Box>
    </Drawer>
  );
};

export default Navbar;