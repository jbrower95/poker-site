import React from 'react';
import './App.css';
import {Main} from './components/main';
import {NetworkApi} from './api/NetworkApi';

function App() {
  document.title = 'The Nuts (beta)'
  return (
    <div className="App">
      <Main api={new NetworkApi()}/>
    </div>
  );
}

export default App;
