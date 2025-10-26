/**
 * Main App Component
 * Sets up routing and global layout
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import Home from './pages/Home';
import TableLobby from './pages/TableLobby';
import { Demo } from './pages/Demo';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Home Page - Create or Join Table */}
          <Route path="/" element={<Home />} />

          {/* Table Lobby - Pre-game waiting room */}
          <Route path="/table/:tableId" element={<TableLobby />} />

          {/* Demo Page - Component showcase (development only) */}
          <Route path="/demo" element={<Demo />} />

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
