import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import CharleyArea from './components/CharleyArea';
import ManageModelsModal from './components/ManageModelsModal';
import Playground from './components/Playground';
import { loadWordBank } from './lib/wordbank';

import './styles/variables.css';
import './styles/base.css';
import './styles/header.css';
import './styles/sidebar.css';
import './styles/modal.css';
import './styles/chat.css';
import './styles/playground.css';
import './styles/wordmix.css';

function AppInner() {
  const { theme, mode } = useApp();
  const [playgroundActive, setPlaygroundActive] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const isChat = mode === 'chat';

  // Load word bank on startup
  useEffect(() => {
    loadWordBank().catch(() => {});
  }, []);

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
        {isChat && <Sidebar />}
        <Playground visible={playgroundActive} />

        <div id="main" style={{ display: playgroundActive ? 'none' : 'flex' }}>
          {mode === 'charley' ? <CharleyArea /> : <ChatArea />}
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
