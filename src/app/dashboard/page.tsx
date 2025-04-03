'use client';

import { Button, Typography, Container } from '@mui/material';

export default function Home() {
  return (
    <Container style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Material-UI Test
      </Typography>
      <Button variant="contained" color="primary">
        Primary Button
      </Button>
      <Button variant="outlined" color="secondary" style={{ marginLeft: '10px' }}>
        Secondary Button
      </Button>
    </Container>
  );
}