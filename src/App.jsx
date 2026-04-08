import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ManageModelsModal from './components/ManageModelsModal';
import Playground from './components/Playground';

import './styles/variables.css';
import './styles/base.css';
import './styles/header.css';
import './styles/sidebar.css';
import './styles/modal.css';
import './styles/chat.css';
import './styles/playground.css';

function AppInner() {
  const { theme } = useApp();
  const [playgroundActive, setPlaygroundActive] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <>
      <Header
        playgroundActive={playgroundActive}
        onTogglePlayground={() => setPlaygroundActive((v) => !v)}
        onOpenManage={() => setManageOpen(true)}
      />

      <ManageModelsModal
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
      />

      <div id="app-body">
        <Sidebar />
        <Playground visible={playgroundActive} />
        <div id="main" style={{ display: playgroundActive ? 'none' : 'flex' }}>
          <ChatArea />
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
